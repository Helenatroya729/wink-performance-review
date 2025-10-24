const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: 'wink2025'
});

async function restoreDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Восстановление базы данных wink_performance_review...\n');
    
    // Читаем SQL файл
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Убираем команды создания БД и переключения
    sql = sql.replace(/CREATE DATABASE[^;]+;/gi, '');
    sql = sql.replace(/\\c [^;]+;/gi, '');
    
    // Разбиваем на отдельные команды
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Найдено ${statements.length} SQL команд\n`);
    
    let created = 0;
    let errors = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Пропускаем комментарии
      if (statement.startsWith('--')) continue;
      
      try {
        await client.query(statement);
        created++;
        
        // Показываем прогресс для важных команд
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE\s+(\w+)/i);
          if (match) {
            console.log(`✅ Создана таблица: ${match[1]}`);
          }
        } else if (statement.toUpperCase().includes('INSERT INTO')) {
          const match = statement.match(/INSERT INTO\s+(\w+)/i);
          if (match) {
            console.log(`📥 Данные добавлены в: ${match[1]}`);
          }
        }
      } catch (error) {
        // Игнорируем ошибки "уже существует"
        if (error.message.includes('already exists')) {
          // Ничего не делаем
        } else {
          errors++;
          console.error(`❌ Ошибка: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`\n✅ Выполнено команд: ${created}`);
    if (errors > 0) {
      console.log(`⚠️  Ошибок: ${errors}`);
    }
    
    // Проверяем результат
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Создано таблиц: ${tables.rows.length}`);
    
    // Проверяем данные
    if (tables.rows.length > 0) {
      console.log('\n📈 Количество записей:');
      for (const row of tables.rows) {
        const tableName = row.table_name;
        const count = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`   ${tableName}: ${count.rows[0].count}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreDatabase().catch(console.error);
