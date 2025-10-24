const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433
});

async function seedSimpleData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Добавляем данные для HR Dashboard...\n');

    // Получаем пользователей
    const users = await client.query(`
      SELECT id, first_name, last_name, role, manager_id
      FROM users 
      WHERE is_active = true AND role IN ('employee', 'manager')
      ORDER BY id
    `);

    console.log(`👥 Найдено сотрудников: ${users.rows.length}\n`);

    // Получаем активный цикл
    let cycle = await client.query(`
      SELECT id FROM review_cycles 
      WHERE status = 'active' 
      LIMIT 1
    `);

    let cycleId = cycle.rows[0]?.id;
    
    if (!cycleId) {
      const newCycle = await client.query(`
        INSERT INTO review_cycles (name, start_date, end_date, status)
        VALUES ('Q4 2025', '2025-10-01', '2025-12-31', 'active')
        RETURNING id
      `);
      cycleId = newCycle.rows[0].id;
      console.log(`✅ Создан новый цикл ID: ${cycleId}\n`);
    }

    let managerEvalsAdded = 0;
    let potentialEvalsAdded = 0;

    // Для каждого сотрудника добавляем оценки
    for (const user of users.rows) {
      if (!user.manager_id) continue; // Пропускаем сотрудников без менеджера

      console.log(`Обрабатываем: ${user.first_name} ${user.last_name}...`);

      // 1. Manager Evaluation
      const meExists = await client.query(
        'SELECT id FROM manager_evaluations WHERE employee_id = $1 AND cycle_id = $2',
        [user.id, cycleId]
      );

      if (meExists.rows.length === 0) {
        const prof_score = 1 + Math.floor(Math.random() * 5); // 1-5
        const pers_score = 1 + Math.floor(Math.random() * 4); // 1-4
        const perf_total = Math.floor((prof_score + pers_score) / 2);

        await client.query(`
          INSERT INTO manager_evaluations (
            employee_id, manager_id, cycle_id,
            professional_qualities_score, personal_qualities_score,
            communication_with_colleagues, employee_development_willingness,
            considers_as_successor, development_readiness,
            turnover_risk_score, performance_total, potential_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          user.id, user.manager_id, cycleId,
          prof_score, pers_score,
          Math.random() > 0.3, // 70% true
          Math.random() > 0.4, // 60% true
          Math.random() > 0.7, // 30% true
          ['Готов сейчас', 'Через 6 месяцев', 'Через год'][Math.floor(Math.random() * 3)],
          Math.floor(Math.random() * 11), // 0-10
          perf_total,
          1 + Math.floor(Math.random() * 5) // 1-5
        ]);
        managerEvalsAdded++;
      }

      // 2. Potential Assessment
      const paExists = await client.query(
        'SELECT id FROM potential_assessments WHERE employee_id = $1 AND cycle_id = $2',
        [user.id, cycleId]
      );

      if (paExists.rows.length === 0) {
        const potential_score = 1 + Math.floor(Math.random() * 10); // 1-10
        const performance_score = 1 + Math.floor(Math.random() * 10); // 1-10
        
        // Определяем позицию в 9-box (используем правильные названия)
        let box_position;
        if (potential_score >= 8 && performance_score >= 8) box_position = 'high_potential_high_performance';
        else if (potential_score >= 8 && performance_score >= 5) box_position = 'high_potential_medium_performance';
        else if (potential_score >= 8) box_position = 'high_potential_low_performance';
        else if (potential_score >= 5 && performance_score >= 8) box_position = 'medium_potential_high_performance';
        else if (potential_score >= 5 && performance_score >= 5) box_position = 'medium_potential_medium_performance';
        else if (potential_score >= 5) box_position = 'medium_potential_low_performance';
        else if (performance_score >= 8) box_position = 'low_potential_high_performance';
        else if (performance_score >= 5) box_position = 'low_potential_medium_performance';
        else box_position = 'low_potential_low_performance';

        await client.query(`
          INSERT INTO potential_assessments (
            employee_id, manager_id, cycle_id,
            professional_qualities, takes_responsibility,
            transparent_communication, shares_information,
            organizes_work, growth_mindset_score,
            readiness_timeframe, is_successor,
            handles_communication_barriers, reflects_on_results,
            desires_role, role_interest_level,
            risk_assessment, performance_score,
            potential_score, box_position,
            comments
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `, [
          user.id, user.manager_id, cycleId,
          ['Лидерство', 'Аналитика', 'Коммуникация'],
          Math.random() > 0.3,
          Math.random() > 0.4,
          Math.random() > 0.3,
          Math.random() > 0.4,
          1 + Math.floor(Math.random() * 10), // 1-10
          ['1-2_years', '3_years', '3+_years', 'not_ready'][Math.floor(Math.random() * 4)],
          Math.random() > 0.7,
          Math.random() > 0.4,
          Math.random() > 0.3,
          ['Руководитель', 'Эксперт', 'Текущая роль'][Math.floor(Math.random() * 3)],
          1 + Math.floor(Math.random() * 10), // 1-10
          Math.floor(Math.random() * 11),
          performance_score,
          potential_score,
          box_position,
          `Оценка потенциала для ${user.first_name} ${user.last_name}`
        ]);
        potentialEvalsAdded++;
      }
    }

    console.log('\n✅ Данные добавлены:');
    console.log(`   👔 Оценок менеджера: ${managerEvalsAdded}`);
    console.log(`   🌟 Оценок потенциала: ${potentialEvalsAdded}`);

    // Итоговая статистика
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM manager_evaluations) as total_manager,
        (SELECT COUNT(*) FROM potential_assessments) as total_potential
    `);

    console.log('\n📊 Общая статистика:');
    console.log(`   Всего оценок менеджера: ${stats.rows[0].total_manager}`);
    console.log(`   Всего оценок потенциала: ${stats.rows[0].total_potential}`);

    console.log('\n🎉 Готово! Данные для HR Dashboard добавлены.\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSimpleData();
