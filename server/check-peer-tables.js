const { pool } = require('./database');

async function checkPeerTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'peer%'
      ORDER BY table_name
    `);
    
    console.log('\n🔍 Проверка таблиц для оценки от коллег:\n');
    
    if (result.rows.length === 0) {
      console.log('❌ Таблицы peer_feedback НЕ НАЙДЕНЫ');
      console.log('\nНужно запустить: node create-peer-feedback-tables.js');
    } else {
      console.log('✅ Найдены таблицы:');
      for (const row of result.rows) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`   - ${row.table_name} (${count.rows[0].count} записей)`);
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPeerTables();
