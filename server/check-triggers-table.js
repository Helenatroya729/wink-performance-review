const { query } = require('./database');

async function checkTriggersTable() {
  try {
    // Проверяем существующие таблицы
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%trigger%' OR table_name LIKE '%recommendation%')
    `);
    
    console.log('📋 Таблицы с триггерами/рекомендациями:');
    console.log(JSON.stringify(tables.rows, null, 2));
    
    // Проверяем все таблицы
    const allTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Все таблицы в БД:');
    allTables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkTriggersTable();
