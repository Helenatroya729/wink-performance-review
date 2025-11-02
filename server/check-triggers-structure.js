const { query } = require('./database');

async function checkTriggersStructure() {
  try {
    // Проверяем структуру recommendation_triggers
    console.log('📋 Структура recommendation_triggers:');
    const triggersStructure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'recommendation_triggers'
      ORDER BY ordinal_position
    `);
    triggersStructure.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // Проверяем данные
    console.log('\n📊 Данные в recommendation_triggers:');
    const triggers = await query('SELECT * FROM recommendation_triggers ORDER BY id');
    console.log(JSON.stringify(triggers.rows, null, 2));
    
    // Проверяем структуру company_triggers
    console.log('\n📋 Структура company_triggers:');
    const companyStructure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'company_triggers'
      ORDER BY ordinal_position
    `);
    companyStructure.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // Проверяем данные
    console.log('\n📊 Данные в company_triggers:');
    const companyTriggers = await query('SELECT * FROM company_triggers ORDER BY id');
    console.log(JSON.stringify(companyTriggers.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkTriggersStructure();
