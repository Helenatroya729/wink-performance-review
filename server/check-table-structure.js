const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkTables() {
  const client = await pool.connect();
  try {
    // Проверяем структуру self_assessments
    const selfColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'self_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Колонки в self_assessments:');
    selfColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Проверяем структуру manager_evaluations
    const managerColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'manager_evaluations'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Колонки в manager_evaluations:');
    managerColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Проверяем данные
    const selfData = await client.query('SELECT COUNT(*) FROM self_assessments');
    const managerData = await client.query('SELECT COUNT(*) FROM manager_evaluations');
    
    console.log('\n📈 Данные:');
    console.log(`  self_assessments: ${selfData.rows[0].count} записей`);
    console.log(`  manager_evaluations: ${managerData.rows[0].count} записей`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
