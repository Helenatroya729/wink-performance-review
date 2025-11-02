const { query } = require('./database');

async function checkTeamStatuses() {
  try {
    // Сначала найдем всех менеджеров
    const managersResult = await query(`
      SELECT id, first_name, last_name, email, role
      FROM users 
      WHERE role = 'manager'
    `);
    console.log('� Менеджеры:', managersResult.rows);
    
    const managerId = managersResult.rows[0]?.id;
    if (!managerId) {
      console.log('❌ Менеджер не найден');
      process.exit(1);
    }
    
    console.log(`\n📋 Проверяем команду менеджера ID ${managerId}...\n`);
    
    const result = await query(`
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.manager_id,
        erp.id as period_id,
        erp.status,
        erp.cycle_id,
        erp.start_date,
        erp.end_date,
        erp.potential_assessment_completed,
        erp.manager_goals_evaluation_completed,
        erp.self_assessment_completed,
        erp.peer_reviews_completed
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE u.manager_id = $1
        AND erp.cycle_id = 2
      ORDER BY u.last_name
    `, [managerId]);

    console.log('📊 Статусы команды в базе данных:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkTeamStatuses();
