const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433
});

async function seedHRData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Начинаем заполнение данных для HR Dashboard...\n');

    // Получаем список пользователей
    const usersResult = await client.query(`
      SELECT id, email, first_name, last_name, role, manager_id 
      FROM users 
      WHERE is_active = true 
      ORDER BY id
    `);
    
    console.log(`📊 Найдено пользователей: ${usersResult.rows.length}`);
    usersResult.rows.forEach(u => {
      console.log(`   - ${u.first_name} ${u.last_name} (${u.role})`);
    });

    // Получаем активный цикл оценки
    let cycleResult = await client.query(`
      SELECT id, name FROM review_cycles 
      WHERE status = 'active' 
      ORDER BY start_date DESC 
      LIMIT 1
    `);

    let cycleId;
    if (cycleResult.rows.length === 0) {
      console.log('\n📝 Создаём новый цикл оценки...');
      const newCycle = await client.query(`
        INSERT INTO review_cycles (name, start_date, end_date, status)
        VALUES ('Q4 2025 Performance Review', '2025-10-01', '2025-12-31', 'active')
        RETURNING id, name
      `);
      cycleId = newCycle.rows[0].id;
      console.log(`✅ Создан цикл: ${newCycle.rows[0].name} (ID: ${cycleId})`);
    } else {
      cycleId = cycleResult.rows[0].id;
      console.log(`\n✅ Используем существующий цикл: ${cycleResult.rows[0].name} (ID: ${cycleId})`);
    }

    // Фильтруем только сотрудников (не HR и не admin)
    const employees = usersResult.rows.filter(u => u.role === 'employee' || u.role === 'manager');
    
    console.log(`\n👥 Будем добавлять данные для ${employees.length} сотрудников\n`);

    // Генерируем случайные оценки для каждого сотрудника
    const competencies = [
      'Профессиональные знания',
      'Качество работы', 
      'Инициативность',
      'Коммуникация',
      'Работа в команде'
    ];

    let selfAssessmentCount = 0;
    let managerEvaluationCount = 0;
    let peerFeedbackCount = 0;
    let potentialAssessmentCount = 0;

    for (const employee of employees) {
      // 1. Самооценка (self_assessment)
      const selfRating = 6 + Math.floor(Math.random() * 4); // 6-9
      
      const selfAssessmentExists = await client.query(
        'SELECT id FROM self_assessments WHERE user_id = $1 AND cycle_id = $2',
        [employee.id, cycleId]
      );

      if (selfAssessmentExists.rows.length === 0) {
        await client.query(`
          INSERT INTO self_assessments (
            user_id, cycle_id, competency_ratings, overall_rating, 
            achievements, development_areas, status, submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          employee.id,
          cycleId,
          JSON.stringify(competencies.map(c => ({
            competency: c,
            rating: 6 + Math.floor(Math.random() * 4)
          }))),
          selfRating,
          `Достижения ${employee.first_name}: успешно завершил ключевые проекты`,
          'Развитие лидерских навыков, углубление технической экспертизы',
          'completed'
        ]);
        selfAssessmentCount++;
      }

      // 2. Оценка руководителя (manager_evaluation)
      if (employee.manager_id) {
        const managerRating = 5 + Math.floor(Math.random() * 5); // 5-9
        
        const managerEvalExists = await client.query(
          'SELECT id FROM manager_evaluations WHERE employee_id = $1 AND cycle_id = $2',
          [employee.id, cycleId]
        );

        if (managerEvalExists.rows.length === 0) {
          await client.query(`
            INSERT INTO manager_evaluations (
              employee_id, manager_id, cycle_id, competency_ratings,
              overall_rating, strengths, areas_for_improvement,
              performance_summary, status, submitted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          `, [
            employee.id,
            employee.manager_id,
            cycleId,
            JSON.stringify(competencies.map(c => ({
              competency: c,
              rating: 5 + Math.floor(Math.random() * 5)
            }))),
            managerRating,
            'Демонстрирует высокую ответственность и профессионализм',
            'Улучшить навыки планирования и тайм-менеджмента',
            `${employee.first_name} показал отличные результаты в этом периоде`,
            'completed'
          ]);
          managerEvaluationCount++;
        }
      }

      // 3. Оценки коллег (peer_feedback) - по 2-3 оценки на сотрудника
      const peerCount = 2 + Math.floor(Math.random() * 2); // 2-3 оценки
      const potentialReviewers = employees.filter(e => e.id !== employee.id);
      
      for (let i = 0; i < Math.min(peerCount, potentialReviewers.length); i++) {
        const reviewer = potentialReviewers[i];
        const peerRating = 6 + Math.floor(Math.random() * 4); // 6-9

        const peerExists = await client.query(
          'SELECT id FROM peer_feedback WHERE reviewee_id = $1 AND reviewer_id = $2 AND cycle_id = $3',
          [employee.id, reviewer.id, cycleId]
        );

        if (peerExists.rows.length === 0) {
          // Создаём запрос на peer feedback
          const requestResult = await client.query(`
            INSERT INTO peer_feedback_requests (
              requester_id, reviewer_id, cycle_id, status, created_at
            ) VALUES ($1, $2, $3, 'completed', NOW())
            RETURNING id
          `, [employee.id, reviewer.id, cycleId]);

          // Создаём саму оценку
          await client.query(`
            INSERT INTO peer_feedback (
              request_id, reviewee_id, reviewer_id, cycle_id,
              competency_ratings, overall_rating, strengths,
              areas_for_improvement, collaboration_feedback,
              status, submitted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          `, [
            requestResult.rows[0].id,
            employee.id,
            reviewer.id,
            cycleId,
            JSON.stringify(competencies.map(c => ({
              competency: c,
              rating: 6 + Math.floor(Math.random() * 4)
            }))),
            peerRating,
            'Отличный командный игрок, всегда готов помочь',
            'Можно улучшить коммуникацию по сложным вопросам',
            `Работать с ${employee.first_name} - одно удовольствие`,
            'completed'
          ]);
          peerFeedbackCount++;
        }
      }

      // 4. Оценка потенциала (potential_assessment)
      const potentialScore = 5 + Math.floor(Math.random() * 5); // 5-9
      
      const potentialExists = await client.query(
        'SELECT id FROM potential_assessments WHERE employee_id = $1 AND cycle_id = $2',
        [employee.id, cycleId]
      );

      if (potentialExists.rows.length === 0 && employee.manager_id) {
        await client.query(`
          INSERT INTO potential_assessments (
            employee_id, assessor_id, cycle_id, potential_score,
            learning_agility, adaptability, leadership_potential,
            strategic_thinking, innovation, assessment_notes,
            status, submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        `, [
          employee.id,
          employee.manager_id,
          cycleId,
          potentialScore,
          6 + Math.floor(Math.random() * 4),
          6 + Math.floor(Math.random() * 4),
          5 + Math.floor(Math.random() * 5),
          5 + Math.floor(Math.random() * 5),
          6 + Math.floor(Math.random() * 4),
          `${employee.first_name} демонстрирует высокий потенциал для роста`,
          'completed'
        ]);
        potentialAssessmentCount++;
      }
    }

    console.log('\n✅ Данные успешно добавлены:');
    console.log(`   📝 Самооценок: ${selfAssessmentCount}`);
    console.log(`   👔 Оценок руководителя: ${managerEvaluationCount}`);
    console.log(`   👥 Оценок коллег: ${peerFeedbackCount}`);
    console.log(`   🌟 Оценок потенциала: ${potentialAssessmentCount}`);
    
    // Показываем статистику
    console.log('\n📊 Итоговая статистика по таблицам:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM self_assessments WHERE status = 'completed') as self_count,
        (SELECT COUNT(*) FROM manager_evaluations WHERE status = 'completed') as manager_count,
        (SELECT COUNT(*) FROM peer_feedback WHERE status = 'completed') as peer_count,
        (SELECT COUNT(*) FROM potential_assessments WHERE status = 'completed') as potential_count
    `);
    
    console.log(`   Всего самооценок: ${stats.rows[0].self_count}`);
    console.log(`   Всего оценок руководителей: ${stats.rows[0].manager_count}`);
    console.log(`   Всего оценок коллег: ${stats.rows[0].peer_count}`);
    console.log(`   Всего оценок потенциала: ${stats.rows[0].potential_count}`);
    
    console.log('\n🎉 Готово! Теперь HR Dashboard будет показывать реальные данные.\n');

  } catch (error) {
    console.error('❌ Ошибка при заполнении данных:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seedHRData();
