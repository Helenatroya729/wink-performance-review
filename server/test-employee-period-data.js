const { query } = require('./database');

async function testEmployeePeriodData() {
  try {
    const userId = 9; // Иван Иванов
    
    console.log('🔍 Проверяем данные периода для сотрудника ID:', userId, '\n');
    
    const result = await query(`
      SELECT 
        erp.id,
        erp.user_id,
        erp.start_date,
        erp.end_date,
        erp.status,
        erp.cycle_id,
        erp.self_assessment_completed,
        erp.manager_evaluation_completed,
        erp.manager_goals_evaluation_completed,
        erp.potential_assessment_completed,
        erp.peer_reviews_completed,
        u.first_name,
        u.last_name,
        -- Количество заполненных вопросов самооценки
        (SELECT COUNT(*) FROM self_assessments sa 
         WHERE sa.user_id = erp.user_id AND sa.created_at BETWEEN erp.start_date AND erp.end_date) as self_assessment_count,
        -- Количество полученных peer reviews
        (SELECT COUNT(DISTINCT pr.respondent_id) FROM peer_reviews pr 
         WHERE pr.employee_id = erp.user_id AND pr.created_at BETWEEN erp.start_date AND erp.end_date) as peer_reviews_count
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.user_id = $1
      ORDER BY erp.start_date DESC
    `, [userId]);
    
    console.log('📊 Результат запроса:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    if (result.rows.length > 0) {
      const period = result.rows[0];
      console.log('\n✅ Первый период:');
      console.log('  - ID:', period.id);
      console.log('  - Сотрудник:', period.first_name, period.last_name);
      console.log('  - Даты:', period.start_date, '-', period.end_date);
      console.log('  - Самооценка:', period.self_assessment_count, 'ответов');
      console.log('  - Peer reviews:', period.peer_reviews_count, 'коллег');
      console.log('  - Оценка менеджера:', period.manager_evaluation_completed);
    }
    
    // Дополнительная проверка - сколько всего самооценок у Ивана
    const saCount = await query(`
      SELECT COUNT(*) as total FROM self_assessments WHERE user_id = $1
    `, [userId]);
    console.log('\n📋 Всего самооценок у Ивана:', saCount.rows[0].total);
    
    // Сколько peer reviews
    const prCount = await query(`
      SELECT COUNT(DISTINCT respondent_id) as total FROM peer_reviews WHERE employee_id = $1
    `, [userId]);
    console.log('📋 Всего уникальных peer reviews у Ивана:', prCount.rows[0].total);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

testEmployeePeriodData();
