// Миграция: обновляем статус Ивана Иванова на 'completed'
const { query } = require('./database');

async function fixIvanStatus() {
  try {
    console.log('🔧 Обновляем статус для Ивана Иванова (user_id=9)...');
    
    // Находим актуальный период для Ивана
    const findPeriod = await query(`
      SELECT id, user_id, status, is_active
      FROM employee_review_periods 
      WHERE user_id = 9 AND is_active = true
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (findPeriod.rows.length === 0) {
      console.log('❌ Активный период для user_id=9 не найден');
      process.exit(1);
    }
    
    const period = findPeriod.rows[0];
    console.log(`📋 Найден период: id=${period.id}, user_id=${period.user_id}, текущий статус='${period.status}', is_active=${period.is_active}`);
    
    if (period.status === 'completed') {
      console.log('ℹ️  Статус уже установлен в "completed"');
      process.exit(0);
    }
    
    // Обновляем статус
    await query(`
      UPDATE employee_review_periods 
      SET status = 'completed'
      WHERE id = $1
    `, [period.id]);
    
    console.log('✅ Статус успешно обновлен на "completed"');
    
    // Проверяем результат
    const verify = await query(`
      SELECT id, user_id, status, is_active
      FROM employee_review_periods 
      WHERE id = $1
    `, [period.id]);
    
    console.log('📋 Проверка:', verify.rows[0]);
    console.log('🎉 Миграция успешно завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  }
}

fixIvanStatus();
