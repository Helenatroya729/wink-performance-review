const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: '12345'
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' AND table_name LIKE 'peer%' 
      ORDER BY table_name
    `);
    
    console.log('\n=== ТАБЛИЦЫ PEER FEEDBACK ===\n');
    console.table(result.rows);
    
    if (result.rows.some(r => r.table_name === 'peer_feedbacks')) {
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name='peer_feedbacks' 
        ORDER BY ordinal_position
      `);
      console.log('\n=== СТРУКТУРА peer_feedbacks ===\n');
      console.table(cols.rows);
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
