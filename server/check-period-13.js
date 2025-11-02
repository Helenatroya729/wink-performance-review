const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function checkPeriod13() {
  console.log('\n=== Проверка периода 13 Ивана ===\n');

  try {
    // Рекомендации для сотрудника
    const empRec = await pool.query(`
      SELECT achievements, improvements, development_plan
      FROM employee_recommendations
      WHERE period_id = 13 AND employee_id = 9
    `);

    console.log('📝 Employee Recommendations:');
    if (empRec.rows.length > 0) {
      console.log('   Достижения:', empRec.rows[0].achievements.substring(0, 100) + '...');
      console.log('   Улучшения:', empRec.rows[0].improvements.substring(0, 100) + '...');
      console.log('   План развития:', empRec.rows[0].development_plan.substring(0, 100) + '...');
    } else {
      console.log('   ❌ Нет записей');
    }

    // Рекомендации для руководителя
    const mgrRec = await pool.query(`
      SELECT recommendations
      FROM manager_recommendations
      WHERE period_id = 13 AND employee_id = 9
    `);

    console.log('\n👔 Manager Recommendations:');
    if (mgrRec.rows.length > 0) {
      console.log('   ', mgrRec.rows[0].recommendations.substring(0, 200) + '...');
    } else {
      console.log('   ❌ Нет записей');
    }

    // Попробуем загрузить через тот же запрос, что использует endpoint
    console.log('\n🔍 Проверка через запрос endpoint:');
    
    const empRecEndpoint = await pool.query(`
      SELECT achievements, improvements, development_plan 
      FROM employee_recommendations 
      WHERE employee_id = $1 AND period_id = $2
      ORDER BY sent_at DESC
      LIMIT 1
    `, [9, 13]);

    console.log('   Employee (endpoint query):', empRecEndpoint.rows.length > 0 ? 'НАЙДЕНО' : '❌ НЕ НАЙДЕНО');

    const mgrRecEndpoint = await pool.query(`
      SELECT recommendations 
      FROM manager_recommendations 
      WHERE employee_id = $1 AND period_id = $2
      ORDER BY sent_at DESC
      LIMIT 1
    `, [9, 13]);

    console.log('   Manager (endpoint query):', mgrRecEndpoint.rows.length > 0 ? 'НАЙДЕНО' : '❌ НЕ НАЙДЕНО');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkPeriod13();
