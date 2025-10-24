const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkBoxPosition() {
  const client = await pool.connect();
  try {
    // Проверяем тип колонки box_position
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = 'potential_assessments' 
      AND column_name = 'box_position'
    `);
    
    console.log('\n📊 Информация о колонке box_position:');
    console.log(result.rows[0]);
    
    // Проверяем constraint еще раз
    const constraintResult = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%box_position%'
    `);
    
    console.log('\n🔒 Constraint для box_position:');
    constraintResult.rows.forEach(row => {
      console.log(`${row.constraint_name}:`);
      console.log(row.check_clause);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBoxPosition();
