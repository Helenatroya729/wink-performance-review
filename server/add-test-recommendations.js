// Скрипт для добавления тестовых рекомендаций
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink2025'
});

async function addTestRecommendations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Добавление тестовых рекомендаций...\n');

    // Получаем ID сотрудника (emp1@wink.ru)
    const empResult = await client.query(`
      SELECT id FROM users WHERE email = 'emp1@wink.ru'
    `);
    
    if (empResult.rows.length === 0) {
      console.log('❌ Сотрудник emp1@wink.ru не найден');
      return;
    }
    
    const employeeId = empResult.rows[0].id;
    console.log(`✅ Найден сотрудник с ID: ${employeeId}`);

    // Получаем ID HR (hr@wink.ru)
    const hrResult = await client.query(`
      SELECT id FROM users WHERE email = 'hr@wink.ru'
    `);
    
    if (hrResult.rows.length === 0) {
      console.log('❌ HR hr@wink.ru не найден');
      return;
    }
    
    const hrId = hrResult.rows[0].id;
    console.log(`✅ Найден HR с ID: ${hrId}`);

    // Добавляем рекомендации
    console.log('\n📋 Добавление рекомендаций...');
    await client.query(`
      INSERT INTO employee_recommendations 
        (employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read)
      VALUES 
        ($1, $2, $3, $4, $5, NOW(), false)
    `, [
      employeeId,
      hrId,
      `✅ Отличное выполнение проекта по автоматизации HR-процессов
✅ Высокая инициативность в предложении новых решений
✅ Эффективная коммуникация с командой
✅ Быстрое освоение новых технологий`,
      `📌 Необходимо улучшить навыки планирования времени
📌 Рекомендуется больше внимания уделять документированию кода
📌 Стоит развивать навыки публичных выступлений`,
      `🎯 Пройти курс по Time Management (до конца квартала)
🎯 Изучить best practices по документированию в React (2 недели)
🎯 Подготовить и провести презентацию для команды (следующий месяц)
🎯 Участвовать в code review коллег (еженедельно)
🎯 Прочитать книгу "Clean Code" (2 месяца)`
    ]);

    console.log('✅ Рекомендации успешно добавлены!');
    
    // Проверяем, что данные добавлены
    const checkResult = await client.query(`
      SELECT 
        er.*,
        CONCAT(u.first_name, ' ', u.last_name) as hr_name,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM employee_recommendations er
      LEFT JOIN users u ON er.hr_id = u.id
      LEFT JOIN users e ON er.employee_id = e.id
      WHERE er.employee_id = $1
      ORDER BY er.sent_at DESC
    `, [employeeId]);

    console.log('\n📊 Проверка данных:');
    console.log(`   Найдено рекомендаций: ${checkResult.rows.length}`);
    if (checkResult.rows.length > 0) {
      const rec = checkResult.rows[0];
      console.log(`   Для сотрудника: ${rec.employee_name}`);
      console.log(`   От HR: ${rec.hr_name}`);
      console.log(`   Дата отправки: ${rec.sent_at}`);
      console.log(`   Прочитано: ${rec.is_read ? 'Да' : 'Нет'}`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTestRecommendations();
