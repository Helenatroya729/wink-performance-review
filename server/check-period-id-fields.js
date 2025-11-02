const { query } = require('./database');

async function checkPeriodIdFields() {
  try {
    console.log('🔍 Проверяем структуру таблиц...\n');
    
    // Проверяем self_assessments
    const saStructure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'self_assessments' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура self_assessments:');
    saStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Проверяем peer_reviews
    const prStructure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'peer_reviews' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Структура peer_reviews:');
    prStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPeriodIdFields();
