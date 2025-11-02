const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_db',
  password: '12345',
  port: 5432,
});

async function checkMariaRecommendations() {
  console.log('\n=== Проверка данных для Марии Сидоровой ===\n');

  try {
    // 1. Найдем Марию Сидорову
    const users = await pool.query(`
      SELECT id, name, email FROM users 
      WHERE name LIKE '%Сидор%' OR name LIKE '%Мария%'
      ORDER BY id
    `);
    
    console.log('👥 Найденные пользователи:');
    users.rows.forEach(u => {
      console.log(`   ID: ${u.id}, Имя: ${u.name}, Email: ${u.email}`);
    });
    
    if (users.rows.length === 0) {
      console.log('\n❌ Мария Сидорова не найдена!');
      return;
    }

    const maria = users.rows.find(u => u.name.includes('Сидор')) || users.rows[0];
    console.log(`\n✅ Работаем с пользователем: ${maria.name} (ID: ${maria.id})`);

    // 2. Найдем все периоды Марии
    const periods = await pool.query(`
      SELECT id, name, status, is_active, 
             TO_CHAR(start_date, 'YYYY-MM-DD') as start_date,
             TO_CHAR(end_date, 'YYYY-MM-DD') as end_date,
             TO_CHAR(calculated_at, 'YYYY-MM-DD HH24:MI:SS') as calculated_at
      FROM employee_review_periods
      WHERE user_id = $1
      ORDER BY id DESC
    `, [maria.id]);

    console.log(`\n📅 Периоды Марии (всего ${periods.rows.length}):`);
    periods.rows.forEach(p => {
      console.log(`   Period ID: ${p.id}, Название: ${p.name}`);
      console.log(`   Статус: ${p.status}, Активен: ${p.is_active}`);
      console.log(`   Даты: ${p.start_date} - ${p.end_date}`);
      console.log(`   Рассчитан: ${p.calculated_at || 'нет'}`);
      console.log('');
    });

    // 3. Проверим рекомендации для каждого completed/calculated периода
    const completedPeriods = periods.rows.filter(p => 
      p.status === 'completed' || p.status === 'calculated'
    );

    console.log(`\n📊 Завершенные периоды (${completedPeriods.length}):`);
    
    for (const period of completedPeriods) {
      console.log(`\n--- Period ID: ${period.id} (${period.status}) ---`);
      
      // Рекомендации для сотрудника
      const empRec = await pool.query(`
        SELECT id, achievements, improvements, development_plan,
               TO_CHAR(sent_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at
        FROM employee_recommendations
        WHERE employee_id = $1 AND period_id = $2
        ORDER BY sent_at DESC
      `, [maria.id, period.id]);

      console.log(`   📝 Employee Recommendations (${empRec.rows.length} записей):`);
      if (empRec.rows.length > 0) {
        empRec.rows.forEach((rec, idx) => {
          console.log(`   Запись ${idx + 1} (ID: ${rec.id}):`);
          console.log(`     Отправлено: ${rec.sent_at || 'нет'}`);
          console.log(`     Достижения: ${rec.achievements ? rec.achievements.substring(0, 50) + '...' : 'пусто'}`);
          console.log(`     Улучшения: ${rec.improvements ? rec.improvements.substring(0, 50) + '...' : 'пусто'}`);
          console.log(`     План развития: ${rec.development_plan ? rec.development_plan.substring(0, 50) + '...' : 'пусто'}`);
        });
      } else {
        console.log('     ❌ Нет записей');
      }

      // Рекомендации для руководителя
      const mgrRec = await pool.query(`
        SELECT id, manager_id, recommendations,
               TO_CHAR(sent_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at
        FROM manager_recommendations
        WHERE employee_id = $1 AND period_id = $2
        ORDER BY sent_at DESC
      `, [maria.id, period.id]);

      console.log(`   👔 Manager Recommendations (${mgrRec.rows.length} записей):`);
      if (mgrRec.rows.length > 0) {
        mgrRec.rows.forEach((rec, idx) => {
          console.log(`   Запись ${idx + 1} (ID: ${rec.id}, Manager ID: ${rec.manager_id}):`);
          console.log(`     Отправлено: ${rec.sent_at || 'нет'}`);
          console.log(`     Рекомендации: ${rec.recommendations ? rec.recommendations.substring(0, 50) + '...' : 'пусто'}`);
        });
      } else {
        console.log('     ❌ Нет записей');
      }
    }

    // 4. Проверим все оценки для Марии
    console.log(`\n📊 Оценки для Марии:`);
    
    const selfAssessments = await pool.query(`
      SELECT COUNT(*) as count FROM self_assessments WHERE employee_id = $1
    `, [maria.id]);
    console.log(`   Самооценки: ${selfAssessments.rows[0].count}`);

    const peerReviews = await pool.query(`
      SELECT COUNT(*) as count FROM peer_reviews WHERE employee_id = $1
    `, [maria.id]);
    console.log(`   Оценки коллег: ${peerReviews.rows[0].count}`);

    const managerEvals = await pool.query(`
      SELECT COUNT(*) as count FROM manager_evaluations WHERE employee_id = $1
    `, [maria.id]);
    console.log(`   Оценки менеджера: ${managerEvals.rows[0].count}`);

    const potentialAssessments = await pool.query(`
      SELECT COUNT(*) as count, 
             AVG(potential_final_score) as avg_potential
      FROM potential_assessments 
      WHERE employee_id = $1
    `, [maria.id]);
    console.log(`   Оценки потенциала: ${potentialAssessments.rows[0].count}, Средний потенциал: ${potentialAssessments.rows[0].avg_potential}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkMariaRecommendations();
