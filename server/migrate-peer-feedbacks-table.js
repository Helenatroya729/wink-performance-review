const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: '12345'
});

async function migratePeerFeedbacks() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('\n🔄 Начинаем миграцию peer_feedbacks на индивидуальные периоды...\n');
    
    // 1. Добавляем новую колонку period_id
    console.log('1️⃣ Добавляем колонку period_id...');
    await client.query(`
      ALTER TABLE peer_feedbacks 
      ADD COLUMN IF NOT EXISTS period_id INTEGER REFERENCES employee_review_periods(id)
    `);
    
    // 2. Переносим данные через связь с peer_feedback_requests
    console.log('2️⃣ Переносим данные из cycle_id в period_id...');
    await client.query(`
      UPDATE peer_feedbacks pf
      SET period_id = pfr.period_id
      FROM peer_feedback_requests pfr
      WHERE pf.request_id = pfr.id
      AND pf.period_id IS NULL
    `);
    
    // 3. Проверяем результат
    const checkResult = await client.query(`
      SELECT 
        pf.id,
        pf.reviewer_id,
        u.first_name || ' ' || u.last_name as reviewer_name,
        pf.cycle_id as old_cycle_id,
        pf.period_id as new_period_id,
        erp.name as period_name
      FROM peer_feedbacks pf
      JOIN users u ON pf.reviewer_id = u.id
      LEFT JOIN employee_review_periods erp ON pf.period_id = erp.id
      ORDER BY pf.id
    `);
    
    console.log('\n📊 Результат миграции:');
    console.table(checkResult.rows);
    
    // 4. Проверяем, остались ли NULL
    const nullCheck = await client.query(`
      SELECT COUNT(*) as null_count 
      FROM peer_feedbacks 
      WHERE period_id IS NULL
    `);
    
    if (parseInt(nullCheck.rows[0].null_count) > 0) {
      console.log(`\n⚠️  Внимание: ${nullCheck.rows[0].null_count} записей не удалось мигрировать`);
      console.log('   Эти записи будут удалены...');
      
      await client.query(`
        DELETE FROM peer_feedbacks WHERE period_id IS NULL
      `);
    }
    
    // 5. Делаем period_id обязательным
    console.log('\n3️⃣ Делаем period_id обязательным полем...');
    await client.query(`
      ALTER TABLE peer_feedbacks 
      ALTER COLUMN period_id SET NOT NULL
    `);
    
    // 6. Удаляем старую колонку cycle_id
    console.log('4️⃣ Удаляем старую колонку cycle_id...');
    await client.query(`
      ALTER TABLE peer_feedbacks 
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

migratePeerFeedbacks();
