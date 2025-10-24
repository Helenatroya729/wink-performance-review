const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkReadinessTimeframe() {
  const client = await pool.connect();
  try {
    // Проверяем constraint для readiness_timeframe
    const result = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'potential_assessments'::regclass
      AND conname LIKE '%readiness_timeframe%'
    `);
    
    console.log('\n🔒 Constraint для readiness_timeframe:');
    result.rows.forEach(row => {
      console.log(`\n${row.constraint_name}:`);
      console.log(row.constraint_definition);
    });
    
    // Также проверим тип колонки
    const colInfo = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'potential_assessments' 
      AND column_name = 'readiness_timeframe'
    `);
    
    console.log('\n📊 Информация о колонке readiness_timeframe:');
    console.log(colInfo.rows[0]);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkReadinessTimeframe();
