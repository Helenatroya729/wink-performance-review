const { query } = require('./database');

async function checkRecommendationsEndpoint() {
  try {
    const periodId = 26;
    
    console.log('=== Проверка endpoint /api/hr/recommendations/26 ===\n');
    
    // Получаем информацию о периоде
    const period = await query(`SELECT id, user_id FROM employee_review_periods WHERE id = $1`, [periodId]);
    if (period.rows.length === 0) {
      console.log('❌ Период не найден');
      process.exit(1);
    }

    const userId = period.rows[0].user_id;
    console.log(`✅ Период найден, user_id: ${userId}`);

    // Загружаем рекомендации для сотрудника
    console.log('\n--- Запрос employee_recommendations ---');
    const empRec = await query(`
      SELECT achievements, improvements, development_plan 
      FROM employee_recommendations 
      WHERE employee_id = $1 AND period_id = $2
      ORDER BY sent_at DESC
      LIMIT 1
    `, [userId, periodId]);
    
    console.log(`Найдено записей: ${empRec.rows.length}`);
    if (empRec.rows.length > 0) {
      console.log('achievements:', empRec.rows[0].achievements?.substring(0, 50));
    }

    // Загружаем рекомендации для руководителя
    console.log('\n--- Запрос manager_recommendations (БЕЗ проверки manager_id) ---');
    const mgrRec = await query(`
      SELECT recommendations 
      FROM manager_recommendations 
      WHERE employee_id = $1 AND period_id = $2
      ORDER BY sent_at DESC
      LIMIT 1
    `, [userId, periodId]);
    
    console.log(`Найдено записей: ${mgrRec.rows.length}`);
    
    let managerRecommendations = null;
    if (mgrRec.rows.length > 0) {
      managerRecommendations = mgrRec.rows[0].recommendations;
      console.log('recommendations (первые 100 символов):', managerRecommendations.substring(0, 100) + '...');
    }

    // Формируем ответ как в endpoint
    const employeeRecommendations = empRec.rows.length > 0 ? {
      achievements: empRec.rows[0].achievements || '',
      improvements: empRec.rows[0].improvements || '',
      developmentPlan: empRec.rows[0].development_plan || ''
    } : null;

    console.log('\n=== РЕЗУЛЬТАТ (как вернет endpoint) ===');
    console.log('employeeRecommendations:', employeeRecommendations);
    console.log('managerRecommendations:', managerRecommendations ? managerRecommendations.substring(0, 100) + '...' : null);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit();
  }
}

checkRecommendationsEndpoint();
