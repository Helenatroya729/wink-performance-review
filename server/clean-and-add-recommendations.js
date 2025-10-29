// Скрипт для очистки и добавления рекомендаций БЕЗ эмодзи
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink2025'
});

async function cleanAndAddRecommendations() {
  const client = await pool.connect();
  
  try {
    console.log('Очистка старых рекомендаций...\n');

    // Получаем ID сотрудника (emp1@wink.ru)
    const empResult = await client.query(`
      SELECT id FROM users WHERE email = 'emp1@wink.ru'
    `);
    
    if (empResult.rows.length === 0) {
      console.log('Сотрудник emp1@wink.ru не найден');
      return;
    }
    
    const employeeId = empResult.rows[0].id;

    // Получаем ID HR (hr@wink.ru)
    const hrResult = await client.query(`
      SELECT id FROM users WHERE email = 'hr@wink.ru'
    `);
    
    if (hrResult.rows.length === 0) {
      console.log('HR hr@wink.ru не найден');
      return;
    }
    
    const hrId = hrResult.rows[0].id;

    // Удаляем старые рекомендации
    await client.query(`
      DELETE FROM employee_recommendations WHERE employee_id = $1
    `, [employeeId]);
    
    console.log('Старые рекомендации удалены');

    // Добавляем новые рекомендации БЕЗ эмодзи
    console.log('Добавление новых рекомендаций...');
    await client.query(`
      INSERT INTO employee_recommendations 
        (employee_id, hr_id, achievements, improvements, development_plan, sent_at, is_read)
      VALUES 
        ($1, $2, $3, $4, $5, NOW(), false)
    `, [
      employeeId,
      hrId,
      `• Отличное выполнение проекта по автоматизации HR-процессов
• Высокая инициативность в предложении новых решений
• Эффективная коммуникация с командой
• Быстрое освоение новых технологий`,
      `• Необходимо улучшить навыки планирования времени
• Рекомендуется больше внимания уделять документированию кода
• Стоит развивать навыки публичных выступлений`,
      `• Пройти курс по Time Management (до конца квартала)
• Изучить best practices по документированию в React (2 недели)
• Подготовить и провести презентацию для команды (следующий месяц)
• Участвовать в code review коллег (еженедельно)
• Прочитать книгу "Clean Code" (2 месяца)`
    ]);

    console.log('Рекомендации успешно добавлены!');
    
    // Проверяем
    const checkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM employee_recommendations
      WHERE employee_id = $1
    `, [employeeId]);

    console.log(`Всего рекомендаций: ${checkResult.rows[0].count}`);

  } catch (error) {
    console.error('Ошибка:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAndAddRecommendations();
