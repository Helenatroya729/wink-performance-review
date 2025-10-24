const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433
});

async function checkDBStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Проверка структуры таблиц...\n');

    // Проверяем manager_evaluations
    const meColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'manager_evaluations'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 manager_evaluations:');
    meColumns.rows.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));

    // Проверяем self_assessments  
    const saColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'self_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 self_assessments:');
    saColumns.rows.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));

    // Проверяем peer_feedback
    const pfColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'peer_feedback'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 peer_feedback:');
    pfColumns.rows.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));

    // Проверяем potential_assessments
    const paColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'potential_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 potential_assessments:');
    paColumns.rows.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));

    // Проверяем текущие данные
    console.log('\n📊 Текущие данные:');
    
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM manager_evaluations) as manager_evals,
        (SELECT COUNT(*) FROM self_assessments) as self_assess,
        (SELECT COUNT(*) FROM peer_feedback) as peer_fb,
        (SELECT COUNT(*) FROM potential_assessments) as potential_assess
    `);
    
    console.log(`   manager_evaluations: ${counts.rows[0].manager_evals}`);
    console.log(`   self_assessments: ${counts.rows[0].self_assess}`);
    console.log(`   peer_feedback: ${counts.rows[0].peer_fb}`);
    console.log(`   potential_assessments: ${counts.rows[0].potential_assess}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDBStructure();
