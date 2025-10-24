const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function seedAllPeriods() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Очищаем старые периоды
    await client.query('DELETE FROM user_review_periods WHERE cycle_id = 2');
    console.log('🗑️ Старые периоды удалены\n');

    // Создаем периоды для всех сотрудников
    const periods = [
      // Активные периоды (сейчас идут) - СЕГОДНЯ 24 октября 2025
      { userId: 9, startDate: '2025-10-14', endDate: '2025-11-11', status: 'in_progress' },   // Иван Иванов - началось 10 дней назад
      { userId: 10, startDate: '2025-10-10', endDate: '2025-11-07', status: 'in_progress' },  // Анна Сидорова - началось 2 недели назад
      { userId: 2, startDate: '2025-10-01', endDate: '2025-10-31', status: 'in_progress' },   // Менеджер Петр - весь октябрь
      
      // Завершенные (закончились до 24 октября)
      { userId: 11, startDate: '2025-09-01', endDate: '2025-10-01', status: 'completed' },    // Петр Петров - сентябрь
      { userId: 12, startDate: '2025-08-15', endDate: '2025-09-30', status: 'completed' },    // Ольга Васильева - август-сентябрь
      
      // Будущие (начнутся после 24 октября)
      { userId: 13, startDate: '2025-11-01', endDate: '2025-12-01', status: 'pending' },      // Дмитрий - ноябрь
      { userId: 1, startDate: '2025-11-15', endDate: '2025-12-15', status: 'pending' },       // Иван (employee) - вторая половина ноября
      { userId: 7, startDate: '2025-12-01', endDate: '2026-01-01', status: 'pending' },       // Менеджер Кирилл - декабрь
      { userId: 8, startDate: '2025-12-15', endDate: '2026-01-15', status: 'pending' },       // Менеджер Мария - декабрь-январь
    ];

    console.log('📝 Создаю периоды оценки...\n');

    for (const period of periods) {
      await client.query(`
        INSERT INTO user_review_periods (user_id, cycle_id, start_date, end_date, status, notification_sent, reminder_sent)
        VALUES ($1, 2, $2, $3, $4, $5, false)
      `, [
        period.userId,
        period.startDate,
        period.endDate,
        period.status,
        period.status === 'in_progress' || period.status === 'completed'
      ]);

      const statusEmoji = {
        'in_progress': '🔥',
        'completed': '✅',
        'pending': '📅'
      };
      
      const user = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [period.userId]);
      const name = user.rows[0] ? `${user.rows[0].first_name} ${user.rows[0].last_name}` : `User ${period.userId}`;
      
      console.log(`${statusEmoji[period.status]} ${name}: ${period.startDate} - ${period.endDate} (${period.status})`);
    }

    console.log('\n✅ Периоды созданы!\n');

    // Показываем все периоды
    const result = await client.query(`
      SELECT 
        urp.id,
        u.first_name || ' ' || u.last_name as employee,
        u.manager_id,
        m.first_name || ' ' || m.last_name as manager,
        urp.start_date,
        urp.end_date,
        urp.status,
        CASE 
          WHEN CURRENT_DATE < urp.start_date THEN 'upcoming'
          WHEN CURRENT_DATE > urp.end_date THEN 'expired'
          WHEN urp.status = 'completed' THEN 'completed'
          ELSE 'active'
        END as period_status,
        CURRENT_DATE BETWEEN urp.start_date AND urp.end_date as is_active
      FROM user_review_periods urp
      JOIN users u ON u.id = urp.user_id
      LEFT JOIN users m ON m.id = u.manager_id
      ORDER BY urp.start_date, u.id
    `);

    console.log('📋 Все периоды оценки:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

seedAllPeriods();
