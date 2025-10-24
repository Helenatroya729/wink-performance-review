const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function seedReviewPeriods() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Получаем всех сотрудников и менеджеров
    const users = await client.query(`
      SELECT id, first_name, last_name, role 
      FROM users 
      WHERE role IN ('employee', 'manager')
      ORDER BY id
    `);

    // Текущий цикл "Первое полугодие 2025" (ID: 2)
    const cycleId = 2;

    console.log(`📝 Создаю периоды оценки для ${users.rows.length} сотрудников...\n`);

    // Разные даты для разных сотрудников
    const periods = [
      // Уже прошедшие оценки (октябрь 2025)
      { userId: 3, startDate: '2025-10-01', endDate: '2025-10-15', status: 'completed' },
      { userId: 4, startDate: '2025-10-01', endDate: '2025-10-20', status: 'completed' },
      
      // Текущие оценки (идут сейчас)
      { userId: 5, startDate: '2025-10-15', endDate: '2025-10-31', status: 'in_progress' },
      { userId: 6, startDate: '2025-10-20', endDate: '2025-11-05', status: 'in_progress' },
      
      // Будущие оценки (начнутся в ноябре)
      { userId: 9, startDate: '2025-11-01', endDate: '2025-11-15', status: 'pending' },
      { userId: 10, startDate: '2025-11-05', endDate: '2025-11-20', status: 'pending' },
      { userId: 11, startDate: '2025-11-10', endDate: '2025-11-25', status: 'pending' },
      
      // Менеджеры (текущие и будущие)
      { userId: 2, startDate: '2025-10-20', endDate: '2025-11-10', status: 'in_progress' },
      { userId: 7, startDate: '2025-11-01', endDate: '2025-11-20', status: 'pending' },
      { userId: 8, startDate: '2025-11-01', endDate: '2025-11-20', status: 'pending' },
    ];

    for (const period of periods) {
      const user = users.rows.find(u => u.id === period.userId);
      if (!user) continue;

      await client.query(`
        INSERT INTO user_review_periods 
        (user_id, cycle_id, start_date, end_date, status, notification_sent, reminder_sent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, cycle_id) DO UPDATE
        SET start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            status = EXCLUDED.status
      `, [
        period.userId,
        cycleId,
        period.startDate,
        period.endDate,
        period.status,
        period.status !== 'pending', // Уведомления отправлены для активных/завершенных
        period.status === 'in_progress' // Напоминания для текущих
      ]);

      const statusEmoji = {
        'completed': '✅',
        'in_progress': '⏳',
        'pending': '📅'
      };

      console.log(`${statusEmoji[period.status]} ${user.first_name} ${user.last_name}: ${period.startDate} - ${period.endDate} (${period.status})`);
    }

    console.log('\n✅ Периоды оценки созданы!\n');

    // Показываем созданные периоды
    const result = await client.query(`
      SELECT 
        urp.id,
        u.first_name || ' ' || u.last_name as employee,
        u.role,
        urp.start_date,
        urp.end_date,
        urp.status,
        urp.notification_sent,
        urp.reminder_sent
      FROM user_review_periods urp
      JOIN users u ON u.id = urp.user_id
      ORDER BY urp.start_date, u.id
    `);

    console.log('📋 Созданные периоды оценки:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

seedReviewPeriods();
