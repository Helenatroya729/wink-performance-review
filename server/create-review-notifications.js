const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function createReviewNotifications() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Получаем все периоды оценки
    const periods = await client.query(`
      SELECT 
        urp.*,
        u.first_name,
        u.last_name,
        u.manager_id,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name
      FROM user_review_periods urp
      JOIN users u ON u.id = urp.user_id
      LEFT JOIN users m ON m.id = u.manager_id
      WHERE urp.status IN ('pending', 'in_progress')
      ORDER BY urp.start_date
    `);

    console.log(`📝 Найдено ${periods.rows.length} активных периодов оценки\n`);

    let createdCount = 0;

    for (const period of periods.rows) {
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      const today = new Date();

      // Если период начался (статус in_progress) и уведомление не отправлено
      if (period.status === 'in_progress' && !period.notification_sent && period.manager_id) {
        await client.query(`
          INSERT INTO notifications (user_id, type, title, message, related_user_id, created_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
          period.manager_id,
          'review_period_started',
          'Начался период оценки',
          `Период Performance Review для ${period.first_name} ${period.last_name} активен до ${endDate.toLocaleDateString('ru-RU')}`,
          period.user_id
        ]);

        // Отмечаем, что уведомление отправлено
        await client.query(`
          UPDATE user_review_periods
          SET notification_sent = true
          WHERE id = $1
        `, [period.id]);

        console.log(`✅ Уведомление для менеджера: ${period.manager_first_name} ${period.manager_last_name} о начале оценки ${period.first_name} ${period.last_name}`);
        createdCount++;
      }

      // Если до конца периода осталось 3 дня и напоминание не отправлено
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (period.status === 'in_progress' && daysUntilEnd <= 3 && daysUntilEnd > 0 && !period.reminder_sent && period.manager_id) {
        await client.query(`
          INSERT INTO notifications (user_id, type, title, message, related_user_id, created_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
          period.manager_id,
          'review_period_reminder',
          '⚠️ Напоминание: заканчивается период оценки',
          `До окончания Performance Review для ${period.first_name} ${period.last_name} осталось ${daysUntilEnd} дн. Завершите оценку до ${endDate.toLocaleDateString('ru-RU')}`,
          period.user_id
        ]);

        // Отмечаем, что напоминание отправлено
        await client.query(`
          UPDATE user_review_periods
          SET reminder_sent = true
          WHERE id = $1
        `, [period.id]);

        console.log(`⚠️ Напоминание для менеджера: ${period.manager_first_name} ${period.manager_last_name} о скором окончании оценки ${period.first_name} ${period.last_name}`);
        createdCount++;
      }

      // Уведомления для самих сотрудников
      if (period.status === 'in_progress' && !period.notification_sent) {
        await client.query(`
          INSERT INTO notifications (user_id, type, title, message, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [
          period.user_id,
          'review_period_started',
          'Начался ваш Performance Review',
          `Период оценки активен до ${endDate.toLocaleDateString('ru-RU')}. Пожалуйста, заполните самооценку и запросите оценки коллег.`
        ]);

        console.log(`✅ Уведомление сотруднику: ${period.first_name} ${period.last_name} о начале его оценки`);
        createdCount++;
      }
    }

    console.log(`\n✅ Создано ${createdCount} уведомлений\n`);

    // Показываем все уведомления
    const notifications = await client.query(`
      SELECT 
        n.id,
        n.type,
        n.title,
        u.first_name || ' ' || u.last_name as recipient,
        n.is_read,
        n.created_at
      FROM notifications n
      JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
      LIMIT 20
    `);

    console.log('📬 Последние уведомления:');
    console.table(notifications.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

createReviewNotifications();
