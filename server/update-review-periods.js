const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function updateReviewPeriods() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Обновляем периоды - делаем несколько активными прямо сейчас
    const updates = [
      // Активные периоды (сейчас идут)
      { userId: 3, startDate: '2025-10-20', endDate: '2025-11-05', status: 'in_progress' },
      { userId: 4, startDate: '2025-10-22', endDate: '2025-11-10', status: 'in_progress' },
      
      // Завершенные
      { userId: 5, startDate: '2025-10-01', endDate: '2025-10-15', status: 'completed' },
      
      // Будущие
      { userId: 6, startDate: '2025-11-01', endDate: '2025-11-15', status: 'pending' },
      { userId: 9, startDate: '2025-11-05', endDate: '2025-11-20', status: 'pending' },
      { userId: 10, startDate: '2025-11-10', endDate: '2025-11-25', status: 'pending' },
      
      // Менеджеры тоже имеют периоды
      { userId: 2, startDate: '2025-10-24', endDate: '2025-11-10', status: 'in_progress' },
    ];

    console.log('📝 Обновляю периоды оценки...\n');

    for (const update of updates) {
      const result = await client.query(`
        UPDATE user_review_periods
        SET start_date = $1::date,
            end_date = $2::date,
            status = $3::varchar,
            notification_sent = CASE 
              WHEN $3 = 'in_progress' THEN true 
              ELSE false 
            END,
            reminder_sent = false
        WHERE user_id = $4 AND cycle_id = 2
        RETURNING user_id
      `, [update.startDate, update.endDate, update.status, update.userId]);

      if (result.rowCount > 0) {
        const statusEmoji = {
          'in_progress': '🔥',
          'completed': '✅',
          'pending': '📅'
        };
        console.log(`${statusEmoji[update.status]} User ID ${update.userId}: ${update.startDate} - ${update.endDate} (${update.status})`);
      }
    }

    console.log('\n✅ Периоды обновлены!\n');

    // Показываем текущие периоды
    const result = await client.query(`
      SELECT 
        urp.id,
        u.first_name || ' ' || u.last_name as employee,
        u.manager_id,
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
      ORDER BY urp.start_date, u.id
    `);

    console.log('📋 Текущие периоды оценки:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

updateReviewPeriods();
