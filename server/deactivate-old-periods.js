// Деактивация старых периодов - оставляем только самый новый активный период для каждого сотрудника
const { query } = require('./database');

async function deactivateOldPeriods() {
  try {
    console.log('🔧 Деактивация старых периодов...\n');
    
    // Для каждого сотрудника оставляем только самый новый период активным
    const result = await query(`
      UPDATE employee_review_periods
      SET is_active = false
      WHERE id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM employee_review_periods
        WHERE is_active = true
        ORDER BY user_id, created_at DESC
      )
      AND is_active = true
      RETURNING id, user_id, status, created_at
    `);
    
    console.log(`✅ Деактивировано периодов: ${result.rows.length}\n`);
    
    if (result.rows.length > 0) {
      console.log('Деактивированные периоды:');
      result.rows.forEach(row => {
        console.log(`  Period ID: ${row.id}, User ID: ${row.user_id}, Status: ${row.status}, Created: ${row.created_at}`);
      });
    }
    
    // Проверка: выводим активные периоды для всех сотрудников
    console.log('\n📋 Активные периоды после деактивации:');
    const active = await query(`
      SELECT 
        erp.id as period_id,
        erp.user_id,
        u.first_name || ' ' || u.last_name as name,
        erp.status,
        erp.created_at
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.is_active = true
      ORDER BY u.id, erp.created_at DESC
    `);
    
    active.rows.forEach(row => {
      console.log(`  ${row.name} (User ID: ${row.user_id}) - Period ID: ${row.period_id}, Status: ${row.status}`);
    });
    
    console.log('\n🎉 Деактивация завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

deactivateOldPeriods();
