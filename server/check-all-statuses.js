// Проверка текущих статусов всех сотрудников
const { query } = require('./database');

async function checkAllStatuses() {
  try {
    console.log('🔍 Проверяем статусы всех сотрудников...\n');
    
    const result = await query(`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        erp.id as period_id,
        erp.status,
        erp.is_active,
        erp.created_at
      FROM users u
      LEFT JOIN employee_review_periods erp ON u.id = erp.user_id AND erp.is_active = true
      WHERE u.role = 'employee' AND u.is_active = true
      ORDER BY u.id
    `);
    
    console.log(`Всего сотрудников: ${result.rows.length}\n`);
    
    for (const row of result.rows) {
      console.log(`👤 ${row.name} (ID: ${row.id})`);
      console.log(`   Period ID: ${row.period_id}`);
      console.log(`   Статус: ${row.status}`);
      console.log(`   Создано: ${row.created_at}`);
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkAllStatuses();
