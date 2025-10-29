const { query } = require('./database.js');

async function setupPerformanceReviewCycle() {
  try {
    console.log('🔧 Настройка цикла Performance Review...\n');
    
    // 1. Создаем таблицу для статуса Performance Review каждого сотрудника в каждом периоде
    console.log('📝 Создаем таблицу performance_review_status...');
    await query(`
      CREATE TABLE IF NOT EXISTS performance_review_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period_id INTEGER NOT NULL REFERENCES employee_review_periods(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'not_started',
        -- Статусы: not_started, pending_approval, manager_approved, available, in_progress, submitted, completed
        
        -- Досрочный запрос
        early_request_date TIMESTAMP,
        early_request_comment TEXT,
        
        -- Одобрение руководителем
        manager_approved_date TIMESTAMP,
        manager_approved_by INTEGER REFERENCES users(id),
        manager_approval_comment TEXT,
        
        -- Одобрение HR
        hr_approved_date TIMESTAMP,
        hr_approved_by INTEGER REFERENCES users(id),
        hr_approval_comment TEXT,
        
        -- Даты заполнения компонентов
        self_assessment_date TIMESTAMP,
        peer_feedback_completed_date TIMESTAMP,
        manager_evaluation_date TIMESTAMP,
        potential_assessment_date TIMESTAMP,
        
        -- Финальное завершение
        completed_date TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(user_id, period_id)
      );
    `);
    console.log('✅ Таблица performance_review_status создана');
    
    // 2. Создаем индексы для быстрого поиска
    await query(`
      CREATE INDEX IF NOT EXISTS idx_pr_status_user_id ON performance_review_status(user_id);
      CREATE INDEX IF NOT EXISTS idx_pr_status_period_id ON performance_review_status(period_id);
      CREATE INDEX IF NOT EXISTS idx_pr_status_status ON performance_review_status(status);
    `);
    console.log('✅ Индексы созданы');
    
    // 3. Инициализируем статусы для всех сотрудников и их периодов
    console.log('\n📝 Инициализируем статусы Performance Review...');
    
    const periodsResult = await query(`
      SELECT erp.id as period_id, erp.user_id, erp.start_date, erp.end_date, erp.name
      FROM employee_review_periods erp
    `);
    
    for (const period of periodsResult.rows) {
      // Проверяем, нужно ли автоматически открыть период
      const now = new Date();
      const endDate = new Date(period.end_date);
      const startOfLastMonth = new Date(endDate);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth(), 1); // Первый день последнего месяца
      
      let initialStatus = 'not_started';
      if (now >= startOfLastMonth && now <= endDate) {
        initialStatus = 'available'; // Автоматически доступен в последний месяц
      }
      
      // Вставляем или обновляем статус
      await query(`
        INSERT INTO performance_review_status (user_id, period_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, period_id) 
        DO UPDATE SET status = CASE 
          WHEN performance_review_status.status = 'not_started' THEN $3
          ELSE performance_review_status.status
        END
      `, [period.user_id, period.period_id, initialStatus]);
    }
    
    console.log(`✅ Статусы инициализированы для ${periodsResult.rows.length} периодов`);
    
    // 4. Показываем текущие статусы
    console.log('\n📊 Текущие статусы Performance Review:\n');
    const statusResult = await query(`
      SELECT 
        prs.*,
        u.first_name,
        u.last_name,
        erp.name as period_name,
        erp.start_date,
        erp.end_date
      FROM performance_review_status prs
      JOIN users u ON prs.user_id = u.id
      JOIN employee_review_periods erp ON prs.period_id = erp.id
      ORDER BY u.id, erp.start_date
    `);
    
    let currentUserId = null;
    statusResult.rows.forEach(row => {
      if (currentUserId !== row.user_id) {
        currentUserId = row.user_id;
        console.log(`\n👤 ${row.first_name} ${row.last_name}`);
      }
      console.log(`   📅 ${row.period_name}`);
      console.log(`      Период: ${new Date(row.start_date).toLocaleDateString('ru-RU')} - ${new Date(row.end_date).toLocaleDateString('ru-RU')}`);
      console.log(`      Статус: ${row.status}`);
    });
    
    console.log('\n✅ Цикл Performance Review успешно настроен!');
    console.log('\n💡 Логика работы:');
    console.log('   - В последний месяц периода статус автоматически становится "available"');
    console.log('   - Досрочный запрос: pending_approval → manager_approved → hr одобряет → available');
    console.log('   - После заполнения всех компонентов → submitted → completed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupPerformanceReviewCycle();
