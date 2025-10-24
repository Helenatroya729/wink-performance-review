const { pool } = require('./database');

async function checkEmployeeGoals() {
  try {
    // Проверяем структуру таблицы
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'employee_goals'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы employee_goals:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Проверяем данные
    const dataResult = await pool.query('SELECT * FROM employee_goals LIMIT 5');
    console.log('\n📊 Данные в таблице:', dataResult.rowCount, 'записей');
    if (dataResult.rows.length > 0) {
      console.log('Пример записи:', dataResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmployeeGoals();
