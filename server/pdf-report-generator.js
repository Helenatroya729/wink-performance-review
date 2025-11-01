const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { query } = require('./database');

const COLORS = {
  primary: '#FF6B00',
  secondary: '#333333',
  text: '#000000',
  lightGray: '#CCCCCC',
  background: '#F5F5F5'
};

class ReportGenerator {
  constructor() {
    this.doc = null;
    this.pageNumber = 0;
    this.tableOfContents = [];
  }

  initDocument() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });
    
    // Регистрируем системный шрифт Windows Arial с поддержкой кириллицы
    try {
      const arialPath = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arial.ttf');
      const arialBoldPath = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arialbd.ttf');
      
      if (fs.existsSync(arialPath)) {
        this.doc.registerFont('Regular', arialPath);
      }
      if (fs.existsSync(arialBoldPath)) {
        this.doc.registerFont('Bold', arialBoldPath);
      }
      
      this.doc.font('Regular');
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить Arial, используем стандартный шрифт:', error.message);
    }
    
    this.pageNumber = 0;
  }

  getContentWidth() {
    return this.doc.page.width - this.doc.page.margins.left - this.doc.page.margins.right;
  }

  addCoverPage(title, subtitle, details = {}) {
    const contentWidth = this.getContentWidth();
    const marginLeft = this.doc.page.margins.left;

    this.doc.font('Bold').fontSize(28).fillColor(COLORS.primary)
      .text(title, marginLeft, 150, { align: 'center', width: contentWidth });
    
    this.doc.moveDown(2);
    
    this.doc.font('Regular').fontSize(18).fillColor(COLORS.secondary)
      .text(subtitle, marginLeft, undefined, { align: 'center', width: contentWidth });
    
    this.doc.moveDown(3);
    
    this.doc.font('Regular').fontSize(12).fillColor(COLORS.text);
    Object.entries(details).forEach(([key, value]) => {
      if (value) {
        this.doc.text(`${key}: ${value}`, marginLeft, undefined, { align: 'center', width: contentWidth });
        this.doc.moveDown(0.5);
      }
    });
    
    this.doc.moveDown(2);
    this.doc.font('Regular').fontSize(10).fillColor(COLORS.lightGray)
      .text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, 
        marginLeft, undefined, { align: 'center', width: contentWidth });
    
    // Добавляем номер "Страница 1" на титульник
    this.doc.save();
    this.doc.fontSize(9).fillColor(COLORS.lightGray);
    const text = 'Страница 1';
    const textWidth = this.doc.widthOfString(text);
    const x = marginLeft + (contentWidth - textWidth) / 2;
    this.doc.text(text, x, this.doc.page.height - 30, { lineBreak: false });
    this.doc.restore();
    
    // Используем специальный метод, который НЕ добавляет номер на страницу 2
    // (номер будет добавлен позже, когда вставим оглавление)
    this.doc.addPage();
  }

  addTableOfContents() {
    const marginLeft = this.doc.page.margins.left;
    
    this.doc.font('Bold').fontSize(20).fillColor(COLORS.primary)
      .text('Оглавление', marginLeft, 50, { underline: true });
    
    this.doc.moveDown(1);
    this.doc.font('Regular').fontSize(12).fillColor(COLORS.text);
    
    this.tableOfContents.forEach((item, index) => {
      const dots = '.'.repeat(Math.max(1, 60 - item.title.length - item.page.toString().length));
      this.doc.text(`${item.title} ${dots} ${item.page}`, marginLeft);
      this.doc.moveDown(0.3);
    });
    
    // НЕ добавляем номер здесь - он будет добавлен в финале
  }

  addSection(title, level = 1) {
    // Получаем текущую страницу
    const range = this.doc.bufferedPageRange();
    const currentPage = range.count; // Исправлено: count уже даёт номер текущей страницы
    
    // Добавляем в оглавление только разделы уровня 1
    if (level === 1) {
      this.tableOfContents.push({ title, page: currentPage });
    }
    
    if (level === 1) {
      this.doc.font('Bold').fontSize(18).fillColor(COLORS.primary);
    } else if (level === 2) {
      this.doc.font('Bold').fontSize(14).fillColor(COLORS.secondary);
    } else {
      this.doc.font('Regular').fontSize(12).fillColor(COLORS.text);
    }
    
    this.doc.text(title, { underline: level === 1 });
    this.doc.moveDown(0.8);
    this.doc.font('Regular').fontSize(11).fillColor(COLORS.text);
  }

  addText(text, options = {}) {
    const fontSize = options.fontSize || 11;
    const color = options.color || COLORS.text;
    const indent = options.indent || 0;
    const marginLeft = this.doc.page.margins.left;
    
    this.doc.font('Regular').fontSize(fontSize).fillColor(color)
      .text(text, marginLeft + indent, undefined, {
        width: this.getContentWidth() - indent,
        align: options.align || 'left'
      });
    this.doc.moveDown(options.spacing || 0.5);
  }

  addList(items, ordered = false) {
    const marginLeft = this.doc.page.margins.left;
    items.forEach((item, index) => {
      const bullet = ordered ? `${index + 1}.` : '•';
      this.doc.font('Regular').fontSize(11).fillColor(COLORS.text)
        .text(`${bullet} ${item}`, marginLeft + 20, undefined, {
          width: this.getContentWidth() - 20
        });
      this.doc.moveDown(0.3);
    });
    this.doc.moveDown(0.5);
  }

  addPageBreak() {
    const currentY = this.doc.y; // Сохраняем текущую позицию
    
    // Добавляем номер на ТЕКУЩУЮ страницу перед созданием новой
    const range = this.doc.bufferedPageRange();
    const currentPage = range.count;
    const marginLeft = this.doc.page.margins.left;
    const contentWidth = this.getContentWidth();
    const pageHeight = this.doc.page.height;
    
    // Сохраняем состояние
    const oldY = this.doc.y;
    const oldFontSize = this.doc._fontSize;
    
    // Устанавливаем позицию для футера
    this.doc.y = pageHeight - 30;
    
    // Добавляем текст напрямую, без автоматического переноса
    this.doc.save();
    this.doc.fontSize(9).fillColor(COLORS.lightGray);
    const text = `Страница ${currentPage}`;
    const textWidth = this.doc.widthOfString(text);
    const x = marginLeft + (contentWidth - textWidth) / 2;
    this.doc.text(text, x, pageHeight - 30, { lineBreak: false });
    this.doc.restore();
    
    // Восстанавливаем состояние
    this.doc.y = oldY;
    
    // Теперь создаём новую страницу
    this.doc.addPage();
  }

  addCurrentPageNumber() {
    const range = this.doc.bufferedPageRange();
    const currentPage = range.count; // Текущее количество страниц = номер текущей страницы
    const marginLeft = this.doc.page.margins.left;
    const contentWidth = this.getContentWidth();
    
    // Сохраняем текущую позицию Y
    const currentY = this.doc.y;
    
    // Добавляем номер в футер ТЕКУЩЕЙ страницы
    // lineBreak: false предотвращает автоматическое создание новой страницы
    this.doc.font('Regular').fontSize(9).fillColor(COLORS.lightGray)
      .text(`Страница ${currentPage}`,
        marginLeft,
        this.doc.page.height - 30,
        { align: 'center', width: contentWidth, lineBreak: false });
    
    // Восстанавливаем позицию
    this.doc.y = currentY;
  }

  addPageNumbers() {
    // Больше не нужно - номера добавляются при создании каждой страницы
  }

  finalize() {
    this.addPageNumbers();
    this.doc.end();
  }
}

async function generateEmployeeReport(employeeId, cycleId) {
  const generator = new ReportGenerator();
  generator.initDocument();

  // Получаем данные сотрудника
  const employeeResult = await query(`
    SELECT u.*, m.first_name || ' ' || m.last_name as manager_name
    FROM users u
    LEFT JOIN users m ON u.manager_id = m.id
    WHERE u.id = $1
  `, [employeeId]);

  if (employeeResult.rows.length === 0) {
    throw new Error('Сотрудник не найден');
  }

  const employee = employeeResult.rows[0];

  // Получаем информацию о цикле
  const cycleResult = await query('SELECT * FROM review_cycles WHERE id = $1', [cycleId]);
  const cycle = cycleResult.rows[0] || {};

  const periodLabel = cycle.start_date && cycle.end_date
    ? `${new Date(cycle.start_date).toLocaleDateString('ru-RU')} - ${new Date(cycle.end_date).toLocaleDateString('ru-RU')}`
    : 'Не указан';

  // ТИТУЛЬНЫЙ ЛИСТ
  generator.addCoverPage(
    'Отчет о Performance Review',
    `${employee.first_name} ${employee.last_name}`,
    {
      'Должность': employee.position || 'Не указана',
      'Руководитель': employee.manager_name || 'Не назначен',
      'Отдел': employee.department || 'Не указан',
      'Email': employee.email,
      'Цикл оценки': cycle.name || `Цикл #${cycleId}`,
      'Период': periodLabel
    }
  );

  // addCoverPage уже добавил разрыв, поэтому мы на странице 2
  // Страница 2 будет заполнена оглавлением в конце (включая номер страницы)
  // НЕ добавляем здесь ничего, чтобы не триггерить создание новых страниц
  
  // Переходим на страницу 3 для начала контента
  generator.addPageBreak();

  // 1. ЦЕЛИ СОТРУДНИКА
  generator.addSection('1. Цели сотрудника');

  // Получаем ВСЕ цели сотрудника
  const allGoals = await query(`
    SELECT eg.*, erp.name as period_name, erp.start_date, erp.end_date, erp.status as period_status
    FROM employee_goals eg
    LEFT JOIN employee_review_periods erp ON eg.period_id = erp.id
    WHERE eg.user_id = $1
    ORDER BY erp.end_date DESC NULLS LAST, eg.created_at DESC
  `, [employeeId]);

  if (allGoals.rows.length > 0) {
    allGoals.rows.forEach((goal, index) => {
      const statusLabel = goal.period_status === 'completed' ? ' [Завершена]' : '';
      generator.addText(`${index + 1}. ${goal.title}${statusLabel}`, { fontSize: 12, color: COLORS.secondary });
      if (goal.description) {
        generator.addText(goal.description, { indent: 20, fontSize: 10 });
      }
      if (goal.period_name) {
        const dates = goal.start_date && goal.end_date 
          ? ` (${new Date(goal.start_date).toLocaleDateString('ru-RU')} - ${new Date(goal.end_date).toLocaleDateString('ru-RU')})`
          : '';
        generator.addText(`Период: ${goal.period_name}${dates}`, { 
          fontSize: 9, color: COLORS.lightGray, indent: 20 
        });
      }
      generator.doc.moveDown(0.3);
    });
  } else {
    generator.addText('Цели отсутствуют', { color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 2. САМООЦЕНКИ
  generator.addSection('2. Самооценки сотрудника');

  const selfAssessments = await query(`
    SELECT sa.*, t.name as task_name, q.question_text, erp.name as period_name
    FROM self_assessments sa
    LEFT JOIN tasks t ON sa.task_id = t.id
    LEFT JOIN self_assessment_questions q ON sa.question_id = q.id
    LEFT JOIN employee_review_periods erp ON sa.user_id = erp.user_id AND sa.cycle_id = erp.cycle_id
    WHERE sa.user_id = $1
    ORDER BY sa.created_at DESC
  `, [employeeId]);

  if (selfAssessments.rows.length > 0) {
    const byPeriod = {};
    selfAssessments.rows.forEach(sa => {
      const periodKey = sa.period_name || 'Без периода';
      if (!byPeriod[periodKey]) byPeriod[periodKey] = [];
      byPeriod[periodKey].push(sa);
    });

    Object.entries(byPeriod).forEach(([period, assessments]) => {
      generator.addSection(`Период: ${period}`, 3);
      assessments.forEach((sa, index) => {
        generator.addText(`Вопрос ${index + 1}: ${sa.question_text || 'Без вопроса'}`, { fontSize: 11 });
        generator.addText(`Оценка: ${(sa.answer_score || 0) * 2}/10`, { 
          indent: 20, color: COLORS.primary 
        });
        if (sa.answer_text) {
          generator.addText(`Комментарий: ${sa.answer_text}`, { fontSize: 10, indent: 20 });
        }
        generator.doc.moveDown(0.5);
      });
    });
  } else {
    generator.addText('Самооценки отсутствуют', { color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 3. ОЦЕНКА РУКОВОДИТЕЛЯ
  generator.addSection('3. Оценка руководителя');

  const managerEvals = await query(`
    SELECT me.*, u.first_name || ' ' || u.last_name as manager_name
    FROM manager_evaluations me
    LEFT JOIN users u ON me.manager_id = u.id
    WHERE me.employee_id = $1
    ORDER BY me.created_at DESC
  `, [employeeId]);

  if (managerEvals.rows.length > 0) {
    managerEvals.rows.forEach((evaluation, index) => {
      generator.addSection(`Оценка ${index + 1}`, 3);
      generator.addText(`Оценивающий: ${evaluation.manager_name}`);
      generator.addText(`Общая оценка: ${evaluation.overall_rating || 'N/A'} / 10`, { 
        color: COLORS.primary 
      });

      if (evaluation.result_achievement_rating) {
        generator.addText(`Достижение результатов: ${evaluation.result_achievement_rating} / 10`, { 
          indent: 20, fontSize: 10
        });
      }

      if (evaluation.interaction_quality_rating) {
        generator.addText(`Качество взаимодействия: ${evaluation.interaction_quality_rating} / 10`, { 
          indent: 20, fontSize: 10
        });
      }

      if (evaluation.feedback_summary) {
        generator.addText('Итоговая оценка руководителя:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(evaluation.feedback_summary, { indent: 20, fontSize: 9 });
      }

      if (evaluation.personal_qualities_comment) {
        generator.addText('Личные качества:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(evaluation.personal_qualities_comment, { indent: 20, fontSize: 9 });
      }

      if (evaluation.personal_contribution_comment) {
        generator.addText('Личный вклад в команду:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(evaluation.personal_contribution_comment, { indent: 20, fontSize: 9 });
      }

      if (evaluation.improvement_suggestions) {
        generator.addText('Рекомендации по развитию:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(evaluation.improvement_suggestions, { indent: 20, fontSize: 9 });
      }

      if (evaluation.professional_qualities_score || evaluation.personal_qualities_score) {
        generator.addText('Дополнительные оценки:', { fontSize: 11, color: COLORS.secondary });
        if (evaluation.professional_qualities_score) {
          generator.addText(`  • Профессиональные качества: ${evaluation.professional_qualities_score} / 10`, { indent: 20, fontSize: 9 });
        }
        if (evaluation.personal_qualities_score) {
          generator.addText(`  • Личные качества: ${evaluation.personal_qualities_score} / 10`, { indent: 20, fontSize: 9 });
        }
      }

      generator.doc.moveDown(1);
    });
  } else {
    generator.addText('Оценки руководителя отсутствуют', { color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 4. PEER FEEDBACK
  generator.addSection('4. Оценки коллег (360)');

  const peerFeedback = await query(`
    SELECT pf.*, 
           u.first_name || ' ' || u.last_name as reviewer_name,
           u.position as reviewer_position
    FROM peer_feedbacks pf
    LEFT JOIN users u ON pf.reviewer_id = u.id
    WHERE pf.requester_id = $1
    ORDER BY pf.created_at DESC
  `, [employeeId]);

  if (peerFeedback.rows.length > 0) {
    peerFeedback.rows.forEach((feedback, index) => {
      generator.addSection(`Отзыв ${index + 1}`, 3);
      generator.addText(`От: ${feedback.reviewer_name || 'Анонимно'} (${feedback.reviewer_position || 'Должность не указана'})`);

      if (feedback.result_achievement_rating) {
        generator.addText(`Достижение результатов: ${feedback.result_achievement_rating}/5`, { color: COLORS.primary });
      }

      if (feedback.interaction_quality_rating) {
        generator.addText(`Качество взаимодействия: ${feedback.interaction_quality_rating}/5`, { color: COLORS.primary });
      }

      if (feedback.personal_qualities_comment) {
        generator.addText('Личные качества:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(feedback.personal_qualities_comment, { indent: 20 });
      }

      if (feedback.improvement_suggestions) {
        generator.addText('Рекомендации по улучшению:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(feedback.improvement_suggestions, { indent: 20 });
      }

      generator.doc.moveDown(1);
    });
  } else {
    generator.addText('Оценки коллег отсутствуют', { color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 5. ПЛАН РАЗВИТИЯ
  generator.addSection('5. План развития');

  const recommendations = await query(`
    SELECT er.*, u.first_name || ' ' || u.last_name as hr_name
    FROM employee_recommendations er
    LEFT JOIN users u ON er.hr_id = u.id
    WHERE er.employee_id = $1
    ORDER BY er.created_at DESC
  `, [employeeId]);

  if (recommendations.rows.length > 0) {
    recommendations.rows.forEach((rec, index) => {
      generator.addSection(`План ${index + 1}`, 3);
      generator.addText(`Составлен: ${rec.hr_name || 'HR'}`, { fontSize: 10, color: COLORS.lightGray });
      generator.addText(`Дата: ${new Date(rec.sent_at || rec.created_at).toLocaleDateString('ru-RU')}`, { fontSize: 10, color: COLORS.lightGray });

      if (rec.achievements) {
        generator.addText('Достижения:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(rec.achievements, { indent: 20 });
      }

      if (rec.improvements) {
        generator.addText('Области для улучшения:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(rec.improvements, { indent: 20 });
      }

      if (rec.development_plan) {
        generator.addText('План развития:', { fontSize: 11, color: COLORS.secondary });
        generator.addText(rec.development_plan, { indent: 20 });
      }

      generator.doc.moveDown(1);
    });
  } else {
    generator.addText('Планы развития отсутствуют', { color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 6. РЕКОМЕНДАЦИИ ДЛЯ РУКОВОДИТЕЛЯ
  generator.addSection('6. Рекомендации для руководителя');

  const managerRecommendations = await query(`
    SELECT mr.*, 
           u.first_name || ' ' || u.last_name as manager_name,
           hr.first_name || ' ' || hr.last_name as hr_name
    FROM manager_recommendations mr
    LEFT JOIN users u ON mr.manager_id = u.id
    LEFT JOIN users hr ON mr.hr_id = hr.id
    WHERE mr.employee_id = $1
    ORDER BY mr.created_at DESC
  `, [employeeId]);

  if (managerRecommendations.rows.length > 0) {
    managerRecommendations.rows.forEach((rec, index) => {
      if (index > 0) generator.doc.moveDown(1);
      
      generator.addText(`Для руководителя: ${rec.manager_name || 'Не указан'}`, { fontSize: 11, color: COLORS.secondary });
      generator.addText(`От HR: ${rec.hr_name || 'Не указан'}`, { fontSize: 10, color: COLORS.lightGray });
      generator.addText(`Дата: ${new Date(rec.sent_at || rec.created_at).toLocaleDateString('ru-RU')}`, { fontSize: 10, color: COLORS.lightGray });
      
      if (rec.recommendations) {
        generator.doc.moveDown(0.5);
        generator.addText(rec.recommendations, { fontSize: 10 });
      }
      
      generator.doc.moveDown(0.5);
    });
  } else {
    generator.addText('Рекомендации для руководителя отсутствуют', { color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 7. ОЦЕНКА ПОТЕНЦИАЛА (9-BOX)
  generator.addSection('7. Оценка потенциала');

  const potentialAssessments = await query(`
    SELECT pa.*, u.first_name || ' ' || u.last_name as manager_name, rc.name as cycle_name
    FROM potential_assessments pa
    LEFT JOIN users u ON pa.manager_id = u.id
    LEFT JOIN review_cycles rc ON pa.cycle_id = rc.id
    WHERE pa.employee_id = $1
    ORDER BY pa.created_at DESC
  `, [employeeId]);

  if (potentialAssessments.rows.length > 0) {
    potentialAssessments.rows.forEach((assessment, index) => {
      if (index > 0) generator.doc.moveDown(1);
      
      generator.addText(`Цикл: ${assessment.cycle_name || 'Не указан'}`, { fontSize: 11, color: COLORS.secondary });
      generator.addText(`Оценивающий: ${assessment.manager_name}`, { fontSize: 10, color: COLORS.lightGray });
      generator.addText(`Дата: ${new Date(assessment.created_at).toLocaleDateString('ru-RU')}`, { fontSize: 10, color: COLORS.lightGray });
      
      generator.doc.moveDown(0.5);
      generator.addText(`Performance: ${assessment.performance_final_score || assessment.performance_raw_score || 'N/A'}`, { color: COLORS.primary });
      generator.addText(`Potential: ${assessment.potential_final_score || assessment.potential_raw_score || 'N/A'}`, { color: COLORS.primary });
      
      if (assessment.development_desire) {
        generator.addText(`Желание развиваться: ${assessment.development_desire}`, { fontSize: 10 });
      }
      
      if (assessment.turnover_risk) {
        generator.addText(`Риск ухода: ${assessment.turnover_risk}/10`, { fontSize: 10 });
      }
      
      if (assessment.professional_comment) {
        generator.addText('Профессиональные качества:', { fontSize: 10, color: COLORS.secondary });
        generator.addText(assessment.professional_comment, { indent: 20, fontSize: 9 });
      }
      
      if (assessment.personal_comment) {
        generator.addText('Личные качества:', { fontSize: 10, color: COLORS.secondary });
        generator.addText(assessment.personal_comment, { indent: 20, fontSize: 9 });
      }
      
      if (assessment.ole_priority_1 || assessment.ole_priority_2) {
        generator.addText('Приоритеты развития:', { fontSize: 10, color: COLORS.secondary });
        if (assessment.ole_priority_1) generator.addText(`• ${assessment.ole_priority_1}`, { indent: 20, fontSize: 9 });
        if (assessment.ole_priority_2) generator.addText(`• ${assessment.ole_priority_2}`, { indent: 20, fontSize: 9 });
      }
      
      generator.doc.moveDown(0.5);
    });
  } else {
    generator.addText('Оценки потенциала отсутствуют', { color: COLORS.lightGray });
  }

  // Добавляем номер на ПОСЛЕДНЮЮ страницу (которая не имеет номера, т.к. не было addPageBreak после неё)
  const range = generator.doc.bufferedPageRange();
  const lastPage = range.count;
  const marginLeft = generator.doc.page.margins.left;
  const contentWidth = generator.getContentWidth();
  const pageHeight = generator.doc.page.height;
  
  generator.doc.save();
  generator.doc.fontSize(9).fillColor(COLORS.lightGray);
  const text = `Страница ${lastPage}`;
  const textWidth = generator.doc.widthOfString(text);
  const x = marginLeft + (contentWidth - textWidth) / 2;
  generator.doc.text(text, x, pageHeight - 30, { lineBreak: false });
  generator.doc.restore();
  
  // Вставляем оглавление на страницу 2 (индекс 1)
  generator.doc.switchToPage(1);
  generator.addTableOfContents();
  
  // Добавляем номер "Страница 2" на страницу оглавления
  const tocMarginLeft = generator.doc.page.margins.left;
  const tocContentWidth = generator.getContentWidth();
  const tocPageHeight = generator.doc.page.height;
  
  generator.doc.save();
  generator.doc.fontSize(9).fillColor(COLORS.lightGray);
  const tocText = 'Страница 2';
  const tocTextWidth = generator.doc.widthOfString(tocText);
  const tocX = tocMarginLeft + (tocContentWidth - tocTextWidth) / 2;
  generator.doc.text(tocText, tocX, tocPageHeight - 30, { lineBreak: false });
  generator.doc.restore();

  // Завершаем документ и собираем буфер
  return new Promise((resolve, reject) => {
    const chunks = [];
    generator.doc.on('data', chunk => chunks.push(chunk));
    generator.doc.on('end', () => resolve(Buffer.concat(chunks)));
    generator.doc.on('error', reject);
    generator.doc.end();
  });
}

// Генерация отчета по отделу
async function generateDepartmentReport(department, cycleId) {
  const generator = new ReportGenerator();
  generator.initDocument();

  // Получаем информацию о цикле
  const cycleResult = await query('SELECT * FROM review_cycles WHERE id = $1', [cycleId]);
  const cycle = cycleResult.rows[0];
  
  if (!cycle) {
    throw new Error(`Цикл с ID ${cycleId} не найден`);
  }

  const cycleLabel = `${cycle.name} (${new Date(cycle.start_date).toLocaleDateString('ru-RU')} - ${new Date(cycle.end_date).toLocaleDateString('ru-RU')})`;

  // Титульная страница
  generator.addCoverPage(
    'Отчет по отделу',
    department,
    {
      'Цикл оценки': cycleLabel,
      'Дата создания': new Date().toLocaleDateString('ru-RU')
    }
  );

  // Получаем всех сотрудников отдела
  const employeesResult = await query(`
    SELECT u.id, u.first_name || ' ' || u.last_name as full_name, u.position
    FROM users u
    WHERE u.department = $1 AND u.role != 'admin'
    ORDER BY u.last_name, u.first_name
  `, [department]);

  const employees = employeesResult.rows;

  // Резервируем страницу 2 для оглавления
  generator.addPageBreak();

  // 1. ОБЩАЯ СТАТИСТИКА
  generator.addSection('1. Общая статистика отдела');
  
  generator.addText(`Всего сотрудников: ${employees.length}`, { fontSize: 12, color: COLORS.primary });
  generator.doc.moveDown(0.5);

  // Статистика по оценкам
  const statsResult = await query(`
    SELECT 
      COUNT(DISTINCT me.employee_id) as evaluated_count,
      ROUND(AVG(me.overall_rating), 1) as avg_rating,
      ROUND(AVG(me.result_achievement_rating), 1) as avg_results,
      ROUND(AVG(me.interaction_quality_rating), 1) as avg_interaction
    FROM manager_evaluations me
    JOIN users u ON me.employee_id = u.id
    WHERE u.department = $1 AND me.cycle_id = $2
  `, [department, cycleId]);

  const stats = statsResult.rows[0];
  
  if (stats.evaluated_count > 0) {
    generator.addText(`Оценено сотрудников: ${stats.evaluated_count}`, { indent: 20 });
    generator.addText(`Средняя общая оценка: ${stats.avg_rating || 'N/A'} / 10`, { indent: 20 });
    generator.addText(`Средняя оценка достижений: ${stats.avg_results || 'N/A'} / 10`, { indent: 20 });
    generator.addText(`Средняя оценка взаимодействия: ${stats.avg_interaction || 'N/A'} / 10`, { indent: 20 });
  } else {
    generator.addText('Оценки отсутствуют', { indent: 20, color: COLORS.lightGray });
  }

  generator.doc.moveDown(1);

  // 2. СПИСОК СОТРУДНИКОВ С ОЦЕНКАМИ
  generator.addSection('2. Сотрудники отдела');

  generator.addText(
    '⚠️ Детальная таблица сотрудников в разработке', 
    { 
      fontSize: 11, 
      color: '#FFA500',
      indent: 20,
      align: 'center'
    }
  );
  
  generator.addText(
    'Будет доступна в следующей версии системы', 
    { 
      fontSize: 10, 
      color: COLORS.lightGray,
      indent: 20,
      align: 'center'
    }
  );

  // Добавляем номер на последнюю страницу
  const range = generator.doc.bufferedPageRange();
  const lastPage = range.count;
  const marginLeft = generator.doc.page.margins.left;
  const contentWidth = generator.getContentWidth();
  const pageHeight = generator.doc.page.height;
  
  generator.doc.save();
  generator.doc.fontSize(9).fillColor(COLORS.lightGray);
  const text = `Страница ${lastPage}`;
  const textWidth = generator.doc.widthOfString(text);
  const x = marginLeft + (contentWidth - textWidth) / 2;
  generator.doc.text(text, x, pageHeight - 30, { lineBreak: false });
  generator.doc.restore();
  
  // Вставляем оглавление на страницу 2
  generator.doc.switchToPage(1);
  generator.addTableOfContents();
  
  // Добавляем номер "Страница 2" на страницу оглавления
  const tocMarginLeft = generator.doc.page.margins.left;
  const tocContentWidth = generator.getContentWidth();
  const tocPageHeight = generator.doc.page.height;
  
  generator.doc.save();
  generator.doc.fontSize(9).fillColor(COLORS.lightGray);
  const tocText = 'Страница 2';
  const tocTextWidth = generator.doc.widthOfString(tocText);
  const tocX = tocMarginLeft + (tocContentWidth - tocTextWidth) / 2;
  generator.doc.text(tocText, tocX, tocPageHeight - 30, { lineBreak: false });
  generator.doc.restore();

  // Завершаем документ и собираем буфер
  return new Promise((resolve, reject) => {
    const chunks = [];
    generator.doc.on('data', chunk => chunks.push(chunk));
    generator.doc.on('end', () => resolve(Buffer.concat(chunks)));
    generator.doc.on('error', reject);
    generator.doc.end();
  });
}

// Генерация сводного отчета по компании
async function generateCompanyReport(cycleId) {
  const generator = new ReportGenerator();
  generator.initDocument();

  // Получаем информацию о цикле
  const cycleResult = await query('SELECT * FROM review_cycles WHERE id = $1', [cycleId]);
  const cycle = cycleResult.rows[0];
  
  if (!cycle) {
    throw new Error(`Цикл с ID ${cycleId} не найден`);
  }

  const cycleLabel = `${cycle.name} (${new Date(cycle.start_date).toLocaleDateString('ru-RU')} - ${new Date(cycle.end_date).toLocaleDateString('ru-RU')})`;

  // Титульная страница
  generator.addCoverPage(
    'Сводный отчет по компании',
    'Performance Review',
    {
      'Цикл оценки': cycleLabel,
      'Дата создания': new Date().toLocaleDateString('ru-RU')
    }
  );

  // Резервируем страницу 2 для оглавления
  generator.addPageBreak();

  // 1. ОБЩАЯ СТАТИСТИКА
  generator.addSection('1. Общая статистика компании');

  // Общее количество сотрудников
  const totalEmployeesResult = await query(`
    SELECT COUNT(*) as total FROM users WHERE role != 'admin'
  `);
  const totalEmployees = totalEmployeesResult.rows[0].total;

  generator.addText(`Всего сотрудников в компании: ${totalEmployees}`, { fontSize: 12, color: COLORS.primary });
  generator.doc.moveDown(0.5);

  // Общая статистика по оценкам
  const companyStatsResult = await query(`
    SELECT 
      COUNT(DISTINCT me.employee_id) as evaluated_count,
      ROUND(AVG(me.overall_rating), 1) as avg_rating,
      ROUND(AVG(me.result_achievement_rating), 1) as avg_results,
      ROUND(AVG(me.interaction_quality_rating), 1) as avg_interaction,
      COUNT(*) as total_evaluations
    FROM manager_evaluations me
    WHERE me.cycle_id = $1
  `, [cycleId]);

  const companyStats = companyStatsResult.rows[0];
  
  generator.addText(`Оценено сотрудников: ${companyStats.evaluated_count}`, { indent: 20 });
  generator.addText(`Всего оценок: ${companyStats.total_evaluations}`, { indent: 20 });
  generator.addText(`Средняя общая оценка: ${companyStats.avg_rating || 'N/A'} / 10`, { indent: 20, color: COLORS.primary });
  generator.addText(`Средняя оценка достижений: ${companyStats.avg_results || 'N/A'} / 10`, { indent: 20 });
  generator.addText(`Средняя оценка взаимодействия: ${companyStats.avg_interaction || 'N/A'} / 10`, { indent: 20 });

  generator.doc.moveDown(1);

  // 2. СТАТИСТИКА ПО ОТДЕЛАМ
  generator.addSection('2. Статистика по отделам');

  generator.addText(
    '⚠️ Детальная таблица по отделам в разработке', 
    { 
      fontSize: 11, 
      color: '#FFA500',
      indent: 20,
      align: 'center'
    }
  );
  
  generator.addText(
    'Будет доступна в следующей версии системы', 
    { 
      fontSize: 10, 
      color: COLORS.lightGray,
      indent: 20,
      align: 'center'
    }
  );

  generator.doc.moveDown(1);

  // 3. ТОП СОТРУДНИКОВ
  generator.addSection('3. Топ-10 сотрудников по оценкам');

  generator.addText(
    '⚠️ Рейтинг сотрудников в разработке', 
    { 
      fontSize: 11, 
      color: '#FFA500',
      indent: 20,
      align: 'center'
    }
  );
  
  generator.addText(
    'Будет доступна в следующей версии системы', 
    { 
      fontSize: 10, 
      color: COLORS.lightGray,
      indent: 20,
      align: 'center'
    }
  );

  // Добавляем номер на последнюю страницу
  const range = generator.doc.bufferedPageRange();
  const lastPage = range.count;
  const marginLeft = generator.doc.page.margins.left;
  const contentWidth = generator.getContentWidth();
  const pageHeight = generator.doc.page.height;
  
  generator.doc.save();
  generator.doc.fontSize(9).fillColor(COLORS.lightGray);
  const text = `Страница ${lastPage}`;
  const textWidth = generator.doc.widthOfString(text);
  const x = marginLeft + (contentWidth - textWidth) / 2;
  generator.doc.text(text, x, pageHeight - 30, { lineBreak: false });
  generator.doc.restore();
  
  // Вставляем оглавление на страницу 2
  generator.doc.switchToPage(1);
  generator.addTableOfContents();
  
  // Добавляем номер "Страница 2" на страницу оглавления
  const tocMarginLeft = generator.doc.page.margins.left;
  const tocContentWidth = generator.getContentWidth();
  const tocPageHeight = generator.doc.page.height;
  
  generator.doc.save();
  generator.doc.fontSize(9).fillColor(COLORS.lightGray);
  const tocText = 'Страница 2';
  const tocTextWidth = generator.doc.widthOfString(tocText);
  const tocX = tocMarginLeft + (tocContentWidth - tocTextWidth) / 2;
  generator.doc.text(tocText, tocX, tocPageHeight - 30, { lineBreak: false });
  generator.doc.restore();

  // Завершаем документ и собираем буфер
  return new Promise((resolve, reject) => {
    const chunks = [];
    generator.doc.on('data', chunk => chunks.push(chunk));
    generator.doc.on('end', () => resolve(Buffer.concat(chunks)));
    generator.doc.on('error', reject);
    generator.doc.end();
  });
}

module.exports = {
  ReportGenerator,
  generateEmployeeReport,
  generateDepartmentReport,
  generateCompanyReport
};
