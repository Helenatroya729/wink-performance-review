const { query } = require('./database');

async function checkAllIvan() {
  try {
    console.log('ВСЕ периоды Ивана:\n');
    
    const result = await query(`
      SELECT 
        u.id, 
        u.first_name || ' ' || u.last_name as full_name,
        erp.status, 
        erp.name as period_name,
        erp.id as period_id,
        erp.is_active
      FROM users u 
      LEFT JOIN employee_review_periods erp ON u.id = erp.user_id 
      WHERE u.first_name = 'Иван' AND u.last_name = 'Петров'
      ORDER BY erp.id DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Иван не найден или у него нет периодов');
    } else {
      console.log(`Найдено ${result.rows.length} периодов:\n`);
      result.rows.forEach(row => {
        console.log(`ID периода: ${row.period_id || 'нет'}`);
        console.log(`Период: ${row.period_name || 'не указан'}`);
        console.log(`Статус: ${row.status || 'нет статуса'}`);
        console.log(`Активен: ${row.is_active}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkAllIvan();
