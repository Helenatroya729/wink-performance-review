// Проверка статусов конкретных сотрудников
const { query } = require('./database');

async function checkSpecificUsers() {
  try {
    console.log('🔍 Проверяем статусы Анны, Петра и Дмитрия...\n');
    
    const result = await query(`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        erp.id as period_id,
        erp.status,
        erp.is_active,
        erp.created_at,
        erp.self_assessment_completed,
        erp.manager_goals_evaluation_completed,
        erp.peer_reviews_completed,
        erp.potential_assessment_completed
      FROM users u
      LEFT JOIN employee_review_periods erp ON u.id = erp.user_id
      WHERE u.first_name IN ('Анна', 'Петр', 'Дмитрий')
      ORDER BY u.id, erp.created_at DESC
    `);
    
    let currentUser = null;
    result.rows.forEach(row => {
      if (currentUser !== row.name) {
        currentUser = row.name;
        console.log(`\n👤 ${row.name} (ID: ${row.id})`);
      }
      
      const completedCount = 
        (row.self_assessment_completed ? 1 : 0) +
        (row.manager_goals_evaluation_completed ? 1 : 0) +
        (row.peer_reviews_completed ? 1 : 0) +
        (row.potential_assessment_completed ? 1 : 0);
      
      console.log(`   Period ID: ${row.period_id}, Status: ${row.status}, Active: ${row.is_active}`);
      console.log(`   Завершено: ${completedCount}/4 этапов`);
      console.log(`   Created: ${row.created_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkSpecificUsers();
