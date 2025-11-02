const { query } = require('./database');

async function fixAnnaPeriods() {
  try {
    console.log('\n=== Исправление дубликатов периодов Анны ===\n');
    
    // Деактивируем дублирующие периоды
    const result = await query(`
      UPDATE employee_review_periods 
      SET is_active = false
      WHERE id IN (15, 16, 31) AND user_id = 10
      RETURNING id, name, status, is_active
    `);
    
    console.log('Деактивированные периоды:');
    result.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.name} - ${row.status} (active: ${row.is_active})`);
    });
    
    // Проверяем активные периоды Анны
    const check = await query(`
      SELECT id, name, status, is_active
      FROM employee_review_periods 
      WHERE user_id = 10 AND is_active = true
      ORDER BY id
    `);
    
    console.log('\nАктивные периоды Анны после исправления:');
    check.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.name} - ${row.status}`);
    });
    
    console.log('\n✅ Периоды успешно исправлены!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

fixAnnaPeriods();
