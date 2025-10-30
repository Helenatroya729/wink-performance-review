const { query } = require('./database');

async function markIvanPotentialComplete() {
  try {
    console.log('🔄 Обновление флага potential_assessment_completed для Ивана...\n');
    
    await query(`
      UPDATE employee_review_periods 
      SET potential_assessment_completed = true
      WHERE user_id = 9 AND cycle_id = 1 AND status = 'in_progress'
    `);
    
    console.log('✅ Флаг обновлен!\n');
    
    // Проверяем результат
    const result = await query(`
      SELECT 
        id,
        user_id,
        cycle_id,
        self_assessment_completed,
        peer_reviews_completed,
        manager_goals_evaluation_completed,
        potential_assessment_completed
      FROM employee_review_periods
      WHERE user_id = 9 AND status = 'in_progress'
    `);
    
    if (result.rows.length > 0) {
      const p = result.rows[0];
      console.log('📋 Текущий статус Ивана:');
      console.log(`  Period ID: ${p.id}`);
      console.log(`  Self Assessment: ${p.self_assessment_completed ? '✅' : '❌'}`);
      console.log(`  Peer Reviews: ${p.peer_reviews_completed ? '✅' : '❌'}`);
      console.log(`  Manager Goals Evaluation: ${p.manager_goals_evaluation_completed ? '✅' : '❌'}`);
      console.log(`  Potential Assessment: ${p.potential_assessment_completed ? '✅' : '❌'}`);
      
      if (p.potential_assessment_completed) {
        console.log('\n✅ Все этапы оценки Ивана завершены!');
        console.log('   Теперь данные готовы для калькуляции HR и формирования рекомендаций.');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

markIvanPotentialComplete();
