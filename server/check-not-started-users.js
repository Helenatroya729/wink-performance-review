// Проверка сотрудников со статусом not_started
const { query } = require('./database');

async function checkNotStartedUsers() {
  try {
    console.log('🔍 Проверяем сотрудников со статусом not_started...\n');
    
    const result = await query(`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        erp.id as period_id,
        erp.status,
        erp.self_assessment_completed,
        erp.manager_goals_evaluation_completed,
        erp.peer_reviews_completed,
        erp.potential_assessment_completed,
        erp.is_active
      FROM users u
      LEFT JOIN employee_review_periods erp ON u.id = erp.user_id AND erp.is_active = true
      WHERE erp.status = 'not_started'
      ORDER BY u.id
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Нет сотрудников со статусом not_started');
      process.exit(0);
    }
    
    console.log(`Найдено сотрудников: ${result.rows.length}\n`);
    
    for (const row of result.rows) {
      console.log(`👤 ${row.name} (ID: ${row.id}, Period: ${row.period_id})`);
      console.log(`   Статус: ${row.status}`);
      console.log(`   Завершенные этапы:`);
      console.log(`     - Самооценка: ${row.self_assessment_completed ? '✅' : '❌'}`);
      console.log(`     - Оценка руководителя: ${row.manager_goals_evaluation_completed ? '✅' : '❌'}`);
      console.log(`     - Оценка коллег: ${row.peer_reviews_completed ? '✅' : '❌'}`);
      console.log(`     - Оценка потенциала: ${row.potential_assessment_completed ? '✅' : '❌'}`);
      
      const completedCount = 
        (row.self_assessment_completed ? 1 : 0) +
        (row.manager_goals_evaluation_completed ? 1 : 0) +
        (row.peer_reviews_completed ? 1 : 0) +
        (row.potential_assessment_completed ? 1 : 0);
      
      console.log(`   Завершено: ${completedCount}/4 этапов`);
      
      if (completedCount === 4) {
        console.log(`   ⚠️ ВСЕ ЭТАПЫ ЗАВЕРШЕНЫ! Статус должен быть awaiting_calculation!`);
      }
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkNotStartedUsers();
