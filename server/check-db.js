const { Pool } = require('pg');

async function checkDatabase(port) {
  const pool = new Pool({
    host: 'localhost',
    port: port,
    database: 'postgres',
    user: 'postgres',
    password: 'wink2025'
  });

  try {
    console.log(`\n🔍 Проверяю порт ${port}...`);
    const result = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log(`✅ PostgreSQL найден на порту ${port}!`);
    console.log('📁 Базы данных:');
    result.rows.forEach(row => console.log(`   - ${row.datname}`));
    
    // Проверяем наличие нашей базы
    const ourDb = result.rows.find(row => row.datname === 'wink_performance_review');
    if (ourDb) {
      console.log('\n🎉 База данных wink_performance_review НАЙДЕНА!');
      
      // Проверяем таблицы
      const pool2 = new Pool({
        host: 'localhost',
        port: port,
        database: 'wink_performance_review',
        user: 'postgres',
        password: 'wink2025'
      });
      
      const tables = await pool2.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log(`📊 Найдено таблиц: ${tables.rows.length}`);
      if (tables.rows.length > 0) {
        console.log('Таблицы:');
        tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
      }
      
      await pool2.end();
    } else {
      console.log('⚠️ База данных wink_performance_review НЕ найдена');
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Порт ${port}: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('🔎 Ищу PostgreSQL и базу данных wink_performance_review...\n');
  
  const ports = [5432, 5433, 5434];
  
  for (const port of ports) {
    await checkDatabase(port);
  }
}

main().catch(console.error);
