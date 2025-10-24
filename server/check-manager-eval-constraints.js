const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkPotentialTotal() {
  const client = await pool.connect();
  try {
    // Проверяем constraint для potential_total
    const result = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'manager_evaluations'::regclass
      AND conname LIKE '%potential_total%'
    `);
    
    console.log('\n🔒 Constraints для potential_total:');
    result.rows.forEach(row => {
      console.log(`\n${row.constraint_name}:`);
      console.log(row.constraint_definition);
    });
    
    // Также проверим personal_qualities_score
    const personalResult = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'manager_evaluations'::regclass
      AND conname LIKE '%personal_qualities%'
    `);
    
    console.log('\n🔒 Constraints для personal_qualities_score:');
    personalResult.rows.forEach(row => {
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

checkPotentialTotal();
