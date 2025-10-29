const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: '12345'
});

async function migratePeerFeedback() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('\n🔄 Начинаем миграцию peer feedback на индивидуальные периоды...\n');
    
    // 1. Добавляем новую колонку period_id
    console.log('1️⃣ Добавляем колонку period_id...');
    await client.query(`
      ALTER TABLE peer_feedback_requests 
      ADD COLUMN IF NOT EXISTS period_id INTEGER REFERENCES employee_review_periods(id)
    `);
    
    // 2. Удаляем старые запросы от пользователей без периодов (менеджеры, HR)
    console.log('2️⃣ Удаляем запросы от пользователей без периодов...');
    const deleteResult = await client.query(`
      DELETE FROM peer_feedback_requests pfr
      WHERE NOT EXISTS (
        SELECT 1 FROM employee_review_periods erp 
        WHERE erp.user_id = pfr.requester_id
      )
      RETURNING id, requester_id
    `);
    console.log(`   Удалено запросов: ${deleteResult.rowCount}`);
    
    // 3. Переносим данные: связываем старые cycle_id с новыми period_id
    // Логика: находим ТЕКУЩИЙ период пользователя
    console.log('3️⃣ Переносим данные из cycle_id в period_id...');
    await client.query(`
      UPDATE peer_feedback_requests pfr
      SET period_id = erp.id
      FROM employee_review_periods erp
      WHERE erp.user_id = pfr.requester_id
      AND CURRENT_DATE >= erp.start_date 
      AND CURRENT_DATE <= erp.end_date
      AND pfr.cycle_id IS NOT NULL
      AND pfr.period_id IS NULL
    `);
    
    // 4. Проверяем результат
    const checkResult = await client.query(`
      SELECT 
        pfr.id,
        pfr.requester_id,
        u.first_name || ' ' || u.last_name as requester_name,
        pfr.cycle_id as old_cycle_id,
        pfr.period_id as new_period_id,
        erp.name as period_name
      FROM peer_feedback_requests pfr
      JOIN users u ON pfr.requester_id = u.id
      LEFT JOIN employee_review_periods erp ON pfr.period_id = erp.id
      ORDER BY pfr.id
    `);
    
    console.log('\n📊 Результат миграции:');
    console.table(checkResult.rows);
    
    // 5. Делаем period_id обязательным
    console.log('\n4️⃣ Делаем period_id обязательным полем...');
    await client.query(`
      ALTER TABLE peer_feedback_requests 
      ALTER COLUMN period_id SET NOT NULL
    `);
    
    // 5. Удаляем старую колонку cycle_id
    console.log('5️⃣ Удаляем старую колонку cycle_id...');
    await client.query(`
      ALTER TABLE peer_feedback_requests 
      DROP COLUMN IF EXISTS cycle_id
    `);
    
    await client.query('COMMIT');
    console.log('\n✅ Миграция успешно завершена!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка миграции:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePeerFeedback();
