const { pool } = require('./database');

async function checkStatuses() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT status, COUNT(*) 
      FROM employee_goals 
      GROUP BY status
    `);
    
    console.log('📊 Статусы в employee_goals:');
    result.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} записей`);
    });
    
    // Проверим количество для текущего запроса
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM employee_goals 
      WHERE status IN ('in_progress', 'approved')
    `);
    console.log('\n✅ Целей со статусом in_progress или approved:', countResult.rows[0].count);
    
    // Проверим общее количество
    const totalResult = await pool.query('SELECT COUNT(*) FROM employee_goals');
    console.log('📝 Всего целей:', totalResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkStatuses();
