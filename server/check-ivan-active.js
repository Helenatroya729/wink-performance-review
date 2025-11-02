const { query } = require('./database');

async function checkIvan() {
  try {
    console.log('Активные периоды Ивана:\n');
    
    const result = await query(`
      SELECT 
        u.id, 
        u.first_name || ' ' || u.last_name as full_name,
        erp.status, 
        erp.name as period_name,
        erp.id as period_id,
        erp.is_active
      FROM users u 
      INNER JOIN employee_review_periods erp ON u.id = erp.user_id 
      WHERE u.first_name = 'Иван' AND u.last_name = 'Петров'
      AND erp.is_active = true
      ORDER BY erp.id
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ У Ивана нет активных периодов');
    } else {
      result.rows.forEach(row => {
        console.log(`\n👤 ${row.full_name}`);
        console.log(`   ID пользователя: ${row.id}`);
        console.log(`   Период: ${row.period_name}`);
        console.log(`   ID периода: ${row.period_id}`);
        console.log(`   Статус: ${row.status}`);
        console.log(`   Активен: ${row.is_active}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkIvan();
