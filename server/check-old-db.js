const { Pool } = require('pg');

async function checkOldDatabase() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '12345'
  });

  try {
    console.log('\n🔍 Проверяю СТАРУЮ базу данных на порту 5432...\n');
    const result = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('✅ СТАРЫЙ PostgreSQL НАЙДЕН на порту 5432!');
    console.log('📁 Базы данных:');
    result.rows.forEach(row => console.log(`   - ${row.datname}`));
    
    const ourDb = result.rows.find(row => row.datname === 'wink_performance_review');
    if (ourDb) {
      console.log('\n🎉 База данных wink_performance_review НАЙДЕНА В СТАРОЙ БД!');
      
      const pool2 = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'wink_performance_review',
        user: 'postgres',
        password: '12345'
      });
      
      const tables = await pool2.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log(`📊 Найдено таблиц: ${tables.rows.length}`);
      if (tables.rows.length > 0) {
        console.log('\n📈 Таблицы с данными:');
        for (const row of tables.rows) {
          const tableName = row.table_name;
          const count = await pool2.query(`SELECT COUNT(*) FROM ${tableName}`);
          if (count.rows[0].count > 0) {
            console.log(`   ✅ ${tableName}: ${count.rows[0].count} записей`);
          }
        }
      }
      
      await pool2.end();
    }
    
    await pool.end();
  } catch (error) {
    console.log(`❌ Старая БД недоступна: ${error.message}`);
    await pool.end();
  }
}

checkOldDatabase().catch(console.error);
