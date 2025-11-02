// ==================== HR QUICK ACTIONS ENDPOINTS ====================
// Эти эндпоинты нужно добавить в server-new.js после endpoints триггеров (после строки 2755)

// Получить список отделов
app.get('/api/hr/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT DISTINCT u.department as name, COUNT(*) as employee_count
      FROM users u
      WHERE u.role IN ('employee', 'manager')
        AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY u.department
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения отделов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить список менеджеров
app.get('/api/hr/managers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT u.id, u.first_name, u.last_name, u.position, u.department
      FROM users u
      WHERE u.role = 'manager'
      ORDER BY u.last_name, u.first_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения менеджеров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех сотрудников с их руководителями
app.get('/api/hr/all-employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.position,
        u.department,
        u.manager_id,
        m.first_name || ' ' || m.last_name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.role IN ('employee', 'manager')
      ORDER BY u.last_name, u.first_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения сотрудников:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все периоды PR всех сотрудников
app.get('/api/hr/all-periods', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT 
        erp.id,
        erp.user_id,
        u.first_name,
        u.last_name,
        u.position,
        u.department,
        erp.start_date,
        erp.end_date,
        erp.status,
        erp.cycle_id,
        rc.name as cycle_name,
        -- Проверяем завершенность самооценки
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM self_assessments sa 
            WHERE sa.user_id = erp.user_id AND sa.cycle_id = erp.cycle_id
          ) THEN true 
          ELSE false 
        END as self_completed,
        -- Проверяем завершенность оценки руководителя
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM manager_evaluations me 
            WHERE me.employee_id = erp.user_id AND me.cycle_id = erp.cycle_id
          ) THEN true 
          ELSE false 
        END as manager_completed,
        -- Проверяем завершенность peer review
        CASE 
          WHEN erp.peer_reviews_completed = true THEN true
          ELSE false
        END as peer_completed
      FROM employee_review_periods erp
      LEFT JOIN users u ON erp.user_id = u.id
      LEFT JOIN review_cycles rc ON erp.cycle_id = rc.id
      WHERE rc.status = 'active'
      ORDER BY u.last_name, u.first_name, erp.start_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения периодов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Изменить руководителя сотрудника
app.post('/api/hr/change-manager', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { employeeId, newManagerId } = req.body;

    if (!employeeId || !newManagerId) {
      return res.status(400).json({ error: 'Необходимо указать сотрудника и нового руководителя' });
    }

    // Проверяем, что сотрудник существует
    const employeeCheck = await query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1',
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    // Проверяем, что новый руководитель существует и является менеджером
    const managerCheck = await query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [newManagerId]
    );

    if (managerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Руководитель не найден' });
    }

    if (managerCheck.rows[0].role !== 'manager' && managerCheck.rows[0].role !== 'admin') {
      return res.status(400).json({ error: 'Указанный пользователь не является руководителем' });
    }

    // Обновляем руководителя
    await query(
      'UPDATE users SET manager_id = $1 WHERE id = $2',
      [newManagerId, employeeId]
    );

    const employee = employeeCheck.rows[0];
    const manager = managerCheck.rows[0];

    res.json({
      message: 'Руководитель успешно изменен',
      employee: `${employee.first_name} ${employee.last_name}`,
      newManager: `${manager.first_name} ${manager.last_name}`
    });
  } catch (error) {
    console.error('Ошибка изменения руководителя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Генерация PDF отчета
app.get('/api/hr/generate-report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { type, employeeId, department } = req.query;

    // Для генерации PDF нужны дополнительные библиотеки
    // Временно возвращаем JSON с данными для отчета
    
    let data = {};
    const activeCycle = await query(
      `SELECT id, name, start_date, end_date 
       FROM review_cycles 
       WHERE status = 'active' 
       ORDER BY created_at DESC LIMIT 1`
    );

    if (activeCycle.rows.length === 0) {
      return res.status(404).json({ error: 'Активный цикл не найден' });
    }

    const cycleId = activeCycle.rows[0].id;
    data.cycle = activeCycle.rows[0];

    if (type === 'employee' && employeeId) {
      // Отчет по одному сотруднику
      const employee = await query(`
        SELECT u.*, m.first_name || ' ' || m.last_name as manager_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        WHERE u.id = $1
      `, [employeeId]);

      if (employee.rows.length === 0) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
      }

      data.employee = employee.rows[0];

      // Получаем все данные сотрудника
      const goals = await query(
        `SELECT * FROM employee_goals WHERE user_id = $1 AND period_id IN (
          SELECT id FROM employee_review_periods WHERE user_id = $1 AND cycle_id = $2
        )`,
        [employeeId, cycleId]
      );

      const selfAssessments = await query(
        'SELECT * FROM self_assessments WHERE user_id = $1 AND cycle_id = $2',
        [employeeId, cycleId]
      );

      const managerEvaluations = await query(
        'SELECT * FROM manager_evaluations WHERE employee_id = $1 AND cycle_id = $2',
        [employeeId, cycleId]
      );

      const peerFeedback = await query(
        `SELECT pf.*, u.first_name || ' ' || u.last_name as reviewer_name
         FROM peer_feedbacks pf
         LEFT JOIN users u ON pf.reviewer_id = u.id
         WHERE pf.requester_id = $1 AND pf.period_id IN (
           SELECT id FROM employee_review_periods WHERE cycle_id = $2
         )`,
        [employeeId, cycleId]
      );

      const recommendations = await query(
        `SELECT * FROM employee_recommendations 
         WHERE employee_id = $1 AND period_id IN (
           SELECT id FROM employee_review_periods WHERE user_id = $1 AND cycle_id = $2
         )`,
        [employeeId, cycleId]
      );

      data.goals = goals.rows;
      data.selfAssessments = selfAssessments.rows;
      data.managerEvaluations = managerEvaluations.rows;
      data.peerFeedback = peerFeedback.rows;
      data.recommendations = recommendations.rows;

    } else if (type === 'department' && department) {
      // Отчет по отделу
      const employees = await query(
        `SELECT u.id, u.first_name, u.last_name, u.position
         FROM users u
         WHERE u.department = $1 AND u.role IN ('employee', 'manager')
         ORDER BY u.last_name`,
        [department]
      );

      data.department = department;
      data.employees = employees.rows;

    } else if (type === 'company') {
      // Отчет по компании
      const stats = await query(`
        SELECT 
          COUNT(DISTINCT u.id) as total_employees,
          COUNT(DISTINCT u.department) as total_departments,
          COUNT(DISTINCT sa.id) as completed_self_assessments,
          COUNT(DISTINCT me.id) as completed_manager_evaluations,
          AVG(me.overall_score) as avg_performance
        FROM users u
        LEFT JOIN self_assessments sa ON u.id = sa.user_id AND sa.cycle_id = $1
        LEFT JOIN manager_evaluations me ON u.id = me.employee_id AND me.cycle_id = $1
        WHERE u.role IN ('employee', 'manager')
      `, [cycleId]);

      data.companyStats = stats.rows[0];
    }

    // TODO: Здесь нужно генерировать PDF
    // Пока возвращаем JSON
    res.json({
      message: 'Функция генерации PDF будет добавлена',
      reportData: data,
      note: 'Требуется установка библиотеки pdfkit или puppeteer для генерации PDF'
    });

  } catch (error) {
    console.error('Ошибка генерации отчета:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Экспорт данных в Excel
app.get('/api/hr/export-data', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { type, employeeId, department } = req.query;

    // Для экспорта в Excel нужна библиотека exceljs
    // Временно возвращаем JSON

    res.json({
      message: 'Функция экспорта в Excel будет добавлена',
      exportType: type,
      note: 'Требуется установка библиотеки exceljs для экспорта в Excel'
    });

  } catch (error) {
    console.error('Ошибка экспорта данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== END HR QUICK ACTIONS ENDPOINTS ====================
