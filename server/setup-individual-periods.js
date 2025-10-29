const { query } = require('./database.js');

async function addIndividualReviewPeriods() {
  try {
    console.log('🔧 Добавление индивидуальных периодов оценки...\n');
    
    // 1. Добавляем поле hire_date в таблицу users
    console.log('📝 Добавляем поле hire_date в таблицу users...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS hire_date DATE
    `);
    console.log('✅ Поле hire_date добавлено');
    
    // 2. Создаем таблицу для индивидуальных периодов оценки
    console.log('\n📝 Создаем таблицу employee_review_periods...');
    await query(`
      CREATE TABLE IF NOT EXISTS employee_review_periods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, start_date)
      );
    `);
    console.log('✅ Таблица employee_review_periods создана');
    
    // 3. Устанавливаем разные даты найма для сотрудников
    console.log('\n📝 Устанавливаем даты найма для сотрудников...');
    
    const hireDates = [
      { id: 1, hire_date: '2024-03-01' },  // Иван Иванов - март
      { id: 9, hire_date: '2024-06-15' },  // Иван Иванов - июнь
      { id: 10, hire_date: '2024-01-10' }, // Анна Сидорова - январь
      { id: 11, hire_date: '2024-08-01' }, // Петр Петров - август
      { id: 12, hire_date: '2024-04-20' }, // Ольга Васильева - апрель
      { id: 13, hire_date: '2024-09-05' }  // Дмитрий Смирнов - сентябрь
    ];
    
    for (const {id, hire_date} of hireDates) {
      await query('UPDATE users SET hire_date = $1 WHERE id = $2', [hire_date, id]);
    }
    console.log(`✅ Даты найма установлены для ${hireDates.length} сотрудников`);
    
    // 4. Генерируем индивидуальные периоды оценки на основе дат найма
    console.log('\n📝 Генерируем индивидуальные периоды оценки...');
    
    const usersResult = await query(`
      SELECT id, first_name, last_name, hire_date 
      FROM users 
      WHERE role = 'employee' AND hire_date IS NOT NULL
    `);
    
    for (const user of usersResult.rows) {
      const hireDate = new Date(user.hire_date);
      const currentYear = 2025;
      
      // Рассчитываем первое полугодие после найма
      let period1Start = new Date(hireDate);
      period1Start = new Date(currentYear, period1Start.getMonth(), 1);
      
      let period1End = new Date(period1Start);
      period1End.setMonth(period1End.getMonth() + 6);
      period1End.setDate(0); // Последний день предыдущего месяца
      
      let period2Start = new Date(period1End);
      period2Start.setDate(period2Start.getDate() + 1);
      
      let period2End = new Date(period2Start);
      period2End.setMonth(period2End.getMonth() + 6);
      period2End.setDate(0);
      
      // Форматируем даты
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      // Удаляем старые периоды
      await query('DELETE FROM employee_review_periods WHERE user_id = $1', [user.id]);
      
      // Вставляем новые периоды
      await query(`
        INSERT INTO employee_review_periods (user_id, name, start_date, end_date, is_active)
        VALUES 
          ($1, $2, $3, $4, true),
          ($1, $5, $6, $7, true)
      `, [
        user.id,
        `Полугодие 1 - 2025 (${user.first_name})`,
        formatDate(period1Start),
        formatDate(period1End),
        `Полугодие 2 - 2025 (${user.first_name})`,
        formatDate(period2Start),
        formatDate(period2End)
      ]);
      
      console.log(`  ✅ ${user.first_name} ${user.last_name}: ${formatDate(period1Start)} - ${formatDate(period1End)} и ${formatDate(period2Start)} - ${formatDate(period2End)}`);
    }
    
    // 5. Проверяем результат
    console.log('\n📊 Индивидуальные периоды оценки:\n');
    const periodsResult = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.hire_date
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      ORDER BY u.id, erp.start_date
    `);
    
    let currentUserId = null;
    periodsResult.rows.forEach(period => {
      if (currentUserId !== period.user_id) {
        currentUserId = period.user_id;
        console.log(`\n👤 ${period.first_name} ${period.last_name} (дата найма: ${new Date(period.hire_date).toLocaleDateString('ru-RU')})`);
      }
      console.log(`   - ${period.name}`);
      console.log(`     ${new Date(period.start_date).toLocaleDateString('ru-RU')} - ${new Date(period.end_date).toLocaleDateString('ru-RU')}`);
    });
    
    console.log('\n✅ Индивидуальные периоды оценки успешно настроены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addIndividualReviewPeriods();
