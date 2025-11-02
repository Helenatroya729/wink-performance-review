const { query } = require('./database');

async function fixIvanPeriod23() {
  try {
    console.log('=== Исправление периода 23 (Иван) ===\n');

    // Проверяем текущее состояние
    const current = await query('SELECT * FROM employee_review_periods WHERE id = 23');
    const period = current.rows[0];
    
    console.log('Текущее состояние периода 23:');
    console.log(`  Название: ${period.name}`);
    console.log(`  Статус: ${period.status}`);
    console.log(`  self_assessment_completed: ${period.self_assessment_completed}`);
    console.log(`  manager_goals_evaluation_completed: ${period.manager_goals_evaluation_completed}`);
    console.log(`  peer_reviews_completed: ${period.peer_reviews_completed}`);
    console.log(`  potential_assessment_completed: ${period.potential_assessment_completed}`);

    const completedCount = [
      period.self_assessment_completed,
      period.manager_goals_evaluation_completed,
      period.peer_reviews_completed,
      period.potential_assessment_completed
    ].filter(x => x).length;

    console.log(`\n  Завершено оценок: ${completedCount}/4`);

    if (completedCount === 0) {
      console.log('\n✅ Период не начат, меняем статус на "not_started"');
      
      await query(`
        UPDATE employee_review_periods 
        SET status = 'not_started' 
        WHERE id = 23
      `);

      console.log('✅ Статус изменен на "not_started"');
    } else {
      console.log('\n⚠️ Период частично заполнен, не меняем статус');
    }

    // Проверяем результат
    const updated = await query('SELECT id, name, status FROM employee_review_periods WHERE id = 23');
    console.log('\nОбновленное состояние:');
    console.log(updated.rows[0]);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit();
  }
}

fixIvanPeriod23();
