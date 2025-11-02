const { query } = require('./database');

async function checkIvanStatus() {
  try {
    console.log('Проверка всех периодов Ивана:\n');
    
    const result = await query(`
      SELECT 
        u.id, 
        u.first_name || ' ' || u.last_name as full_name,
        erp.status, 
        erp.name as period_name,
        erp.id as period_id
      FROM users u 
      LEFT JOIN employee_review_periods erp ON u.id = erp.user_id 
      WHERE u.first_name = 'Иван' AND u.last_name = 'Петров'
      ORDER BY erp.id
    `);
    
    result.rows.forEach(row => {
      console.log(`\nПериод: ${row.period_name || 'не найден'}`);
      console.log(`ID периода: ${row.period_id || 'нет'}`);
      console.log(`Статус: ${row.status || 'нет статуса'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkIvanStatus();
