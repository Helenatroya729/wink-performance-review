const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function checkAllRecommendations() {
  console.log('\n=== Проверка всех рекомендаций в системе ===\n');

  try {
    // 1. Проверим все рекомендации для сотрудников
    const empRecs = await pool.query(`
      SELECT 
        er.id,
        er.period_id,
        er.employee_id,
        u.first_name || ' ' || u.last_name as employee_name,
        p.status as period_status,
        LENGTH(er.achievements) as achievements_length,
        LENGTH(er.improvements) as improvements_length,
        LENGTH(er.development_plan) as plan_length,
        TO_CHAR(er.sent_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at,
        TO_CHAR(er.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM employee_recommendations er
      JOIN users u ON u.id = er.employee_id
      JOIN employee_review_periods p ON p.id = er.period_id
      ORDER BY er.created_at DESC
      LIMIT 20
    `);

    console.log(`📝 РЕКОМЕНДАЦИИ ДЛЯ СОТРУДНИКОВ (всего ${empRecs.rows.length}):\n`);
    if (empRecs.rows.length === 0) {
      console.log('   ❌ Нет записей в employee_recommendations!\n');
    } else {
      empRecs.rows.forEach(rec => {
        console.log(`   ID: ${rec.id}, Period: ${rec.period_id}, Employee: ${rec.employee_name} (ID: ${rec.employee_id})`);
        console.log(`   Статус периода: ${rec.period_status}`);
        console.log(`   Длина текстов: Достижения=${rec.achievements_length}, Улучшения=${rec.improvements_length}, План=${rec.plan_length}`);
        console.log(`   Создано: ${rec.created_at}, Отправлено: ${rec.sent_at || 'не отправлено'}`);
        console.log('');
      });
    }

    // 2. Проверим все рекомендации для руководителей
    const mgrRecs = await pool.query(`
      SELECT 
        mr.id,
        mr.period_id,
        mr.employee_id,
        mr.manager_id,
        u.first_name || ' ' || u.last_name as employee_name,
        m.first_name || ' ' || m.last_name as manager_name,
        p.status as period_status,
        LENGTH(mr.recommendations) as recommendations_length,
        TO_CHAR(mr.sent_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at,
        TO_CHAR(mr.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM manager_recommendations mr
      JOIN users u ON u.id = mr.employee_id
      LEFT JOIN users m ON m.id = mr.manager_id
      JOIN employee_review_periods p ON p.id = mr.period_id
      ORDER BY mr.created_at DESC
      LIMIT 20
    `);

    console.log(`👔 РЕКОМЕНДАЦИИ ДЛЯ РУКОВОДИТЕЛЕЙ (всего ${mgrRecs.rows.length}):\n`);
    if (mgrRecs.rows.length === 0) {
      console.log('   ❌ Нет записей в manager_recommendations!\n');
    } else {
      mgrRecs.rows.forEach(rec => {
        console.log(`   ID: ${rec.id}, Period: ${rec.period_id}, Employee: ${rec.employee_name} (ID: ${rec.employee_id})`);
        console.log(`   Manager: ${rec.manager_name || 'не указан'} (ID: ${rec.manager_id})`);
        console.log(`   Статус периода: ${rec.period_status}`);
        console.log(`   Длина текста: ${rec.recommendations_length} символов`);
        console.log(`   Создано: ${rec.created_at}, Отправлено: ${rec.sent_at || 'не отправлено'}`);
        console.log('');
      });
    }

    // 3. Проверим периоды со статусом completed или calculated
    const completedPeriods = await pool.query(`
      SELECT 
        p.id,
        p.user_id,
        u.first_name || ' ' || u.last_name as employee_name,
        p.name as period_name,
        p.status,
        p.is_active,
        TO_CHAR(p.calculated_at, 'YYYY-MM-DD HH24:MI:SS') as calculated_at,
        (SELECT COUNT(*) FROM employee_recommendations er WHERE er.period_id = p.id) as emp_rec_count,
        (SELECT COUNT(*) FROM manager_recommendations mr WHERE mr.period_id = p.id) as mgr_rec_count
      FROM employee_review_periods p
      JOIN users u ON u.id = p.user_id
      WHERE p.status IN ('completed', 'calculated')
      ORDER BY p.id DESC
      LIMIT 10
    `);

    console.log(`📅 ЗАВЕРШЁННЫЕ ПЕРИОДЫ (completed/calculated, всего ${completedPeriods.rows.length}):\n`);
    if (completedPeriods.rows.length === 0) {
      console.log('   ❌ Нет периодов со статусом completed или calculated!\n');
    } else {
      completedPeriods.rows.forEach(p => {
        console.log(`   Period ID: ${p.id}, ${p.period_name}`);
        console.log(`   Сотрудник: ${p.employee_name} (ID: ${p.user_id})`);
        console.log(`   Статус: ${p.status}, Активен: ${p.is_active}`);
        console.log(`   Рассчитан: ${p.calculated_at || 'нет'}`);
        console.log(`   Рекомендации: сотруднику=${p.emp_rec_count}, руководителю=${p.mgr_rec_count}`);
        
        if (p.emp_rec_count === 0 && p.mgr_rec_count === 0) {
          console.log(`   ⚠️  НЕТ РЕКОМЕНДАЦИЙ ДЛЯ ЭТОГО ПЕРИОДА!`);
        }
        console.log('');
      });
    }

    // 4. Найдём периоды, на которые можно посмотреть на скриншоте (Иван)
    console.log(`\n🔍 ПРОВЕРКА ДАННЫХ ДЛЯ ИВАНА ИВАНОВА:\n`);
    const ivan = await pool.query(`SELECT id, first_name, last_name FROM users WHERE first_name LIKE '%Иван%' LIMIT 1`);
    if (ivan.rows.length > 0) {
      const ivanId = ivan.rows[0].id;
      const ivanName = `${ivan.rows[0].first_name} ${ivan.rows[0].last_name}`;
      console.log(`   ${ivanName} найден: ID = ${ivanId}\n`);

      const ivanPeriods = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.status,
          TO_CHAR(p.calculated_at, 'YYYY-MM-DD HH24:MI:SS') as calculated_at,
          (SELECT COUNT(*) FROM employee_recommendations er WHERE er.period_id = p.id) as emp_rec_count,
          (SELECT COUNT(*) FROM manager_recommendations mr WHERE mr.period_id = p.id) as mgr_rec_count
        FROM employee_review_periods p
        WHERE p.user_id = $1
        ORDER BY p.id DESC
        LIMIT 5
      `, [ivanId]);

      console.log(`   Периоды Ивана:\n`);
      ivanPeriods.rows.forEach(p => {
        console.log(`   Period ${p.id}: ${p.name}`);
        console.log(`     Статус: ${p.status}, Рассчитан: ${p.calculated_at || 'нет'}`);
        console.log(`     Рекомендации: сотр=${p.emp_rec_count}, рук=${p.mgr_rec_count}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkAllRecommendations();
