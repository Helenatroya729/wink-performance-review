const { Pool } = require('pg');

async function checkTables(dbName) {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: dbName,
    user: 'postgres',
    password: 'wink2025'
  });

  try {
    console.log(`\n📊 База данных: ${dbName}`);
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`   Таблиц: ${tables.rows.length}`);
    
    if (tables.rows.length > 0) {
      console.log('   Список таблиц:');
      for (const row of tables.rows) {
        const tableName = row.table_name;
        const count = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`   - ${tableName} (записей: ${count.rows[0].count})`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.log(`   ❌ Ошибка: ${error.message}`);
    await pool.end();
  }
}

async function main() {
  console.log('🔍 Проверяю все базы данных на порту 5433...\n');
  
  const databases = ['postgres', 'LocalBase', 'wink_performance_review'];
  
  for (const db of databases) {
    await checkTables(db);
  }
}

main().catch(console.error);
