const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkProfessional() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'manager_evaluations'::regclass
      AND conname LIKE '%professional%'
    `);
    
    console.log('\n🔒 Constraints для professional_qualities_score:');
    result.rows.forEach(row => {
      console.log(`\n${row.constraint_name}:`);
      console.log(row.constraint_definition);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkProfessional();
