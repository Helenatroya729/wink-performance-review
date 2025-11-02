const { query } = require('./database');

async function updateStatuses() {
  try {
    console.log('🔄 Обновляем статусы для Ивана и Анны на "awaiting_calculation"...\n');
    
    // Обновляем статус для Ивана (period_id: 23)
    await query(`
      UPDATE employee_review_periods 
      SET status = 'awaiting_calculation'
      WHERE id = 23
    `);
    console.log('✅ Статус Ивана Иванова обновлен');
    
    // Обновляем статус для Анны (period_id: 31)
    await query(`
      UPDATE employee_review_periods 
      SET status = 'awaiting_calculation'
      WHERE id = 31
    `);
    console.log('✅ Статус Анны Сидоровой обновлен');
    
    // Проверяем обновленные статусы
    const result = await query(`
      SELECT 
        u.first_name,
        u.last_name,
        erp.status,
        erp.id as period_id
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id IN (23, 31, 32)
      ORDER BY u.last_name
    `);
    
    console.log('\n📊 Обновленные статусы:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

updateStatuses();
