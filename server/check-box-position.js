const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433
});

async function checkBoxPositions() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT DISTINCT box_position 
      FROM potential_assessments 
      WHERE box_position IS NOT NULL
    `);
    
    console.log('Существующие значения box_position:');
    result.rows.forEach(r => console.log(`  - ${r.box_position}`));
    
    // Проверим constraint
    const constraint = await client.query(`
      SELECT pg_get_constraintdef(con.oid) as def, con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'potential_assessments'
        AND con.contype = 'c'
        AND con.conname LIKE '%box%'
    `);
    
    console.log('\nConstraints для box_position:');
    constraint.rows.forEach(r => console.log(`  ${r.conname}: ${r.def}`));
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBoxPositions();
