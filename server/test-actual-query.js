const { query } = require('./database');

async function testActualQuery() {
  try {
    const userId = 9; // Иван
    
    console.log('🔍 Тестируем АКТУАЛЬНЫЙ SQL запрос для user_id:', userId, '\n');
    
    const result = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.hire_date,
        -- Количество заполненных вопросов самооценки для этого цикла
        (SELECT COUNT(*) FROM self_assessments sa 
         WHERE sa.user_id = erp.user_id AND sa.cycle_id = erp.cycle_id) as self_assessment_count,
        -- Количество уникальных коллег, оставивших peer reviews для этого цикла
        (SELECT COUNT(DISTINCT pr.respondent_id) FROM peer_reviews pr 
         WHERE pr.employee_id = erp.user_id AND pr.cycle_id = erp.cycle_id) as peer_reviews_count
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.user_id = $1
      ORDER BY erp.start_date DESC
    `, [userId]);
    
    console.log('📊 Результат (первый период):');
    if (result.rows.length > 0) {
      const first = result.rows[0];
      console.log('  ID:', first.id);
      console.log('  cycle_id:', first.cycle_id);
      console.log('  self_assessment_count:', first.self_assessment_count);
      console.log('  peer_reviews_count:', first.peer_reviews_count);
      console.log('  manager_evaluation_completed:', first.manager_evaluation_completed);
    } else {
      console.log('  ❌ Нет результатов!');
    }
    
    // Дополнительно проверим отдельно
    console.log('\n🔍 Отдельная проверка:');
    
    const saCheck = await query(`
      SELECT COUNT(*) as cnt FROM self_assessments WHERE user_id = $1 AND cycle_id = 2
    `, [userId]);
    console.log('  Самооценок для цикла 2:', saCheck.rows[0].cnt);
    
    const prCheck = await query(`
      SELECT COUNT(DISTINCT respondent_id) as cnt FROM peer_reviews WHERE employee_id = $1 AND cycle_id = 2
    `, [userId]);
    console.log('  Уникальных peer reviews для цикла 2:', prCheck.rows[0].cnt);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

testActualQuery();
