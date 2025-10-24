const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function seedCompleteEvaluations() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');

    // Получаем всех сотрудников (не HR и не admin)
    const usersResult = await client.query(`
      SELECT id, first_name || ' ' || last_name as name, role 
      FROM users 
      WHERE role IN ('employee', 'manager')
      ORDER BY id
    `);
    
    const users = usersResult.rows;
    console.log(`📋 Найдено ${users.length} сотрудников для оценки`);

    // ID цикла и вопросов
    const cycleId = 2; // "Первое полугодие 2025"

    // Получаем вопросы для самооценки
    const selfQuestionsResult = await client.query(`
      SELECT id FROM self_assessment_questions ORDER BY id LIMIT 5
    `);
    const selfQuestionIds = selfQuestionsResult.rows.map(r => r.id);

    // Получаем вопросы для peer review
    const peerQuestionsResult = await client.query(`
      SELECT id FROM peer_review_questions ORDER BY id LIMIT 5
    `);
    const peerQuestionIds = peerQuestionsResult.rows.map(r => r.id);

    console.log('\n🔄 Начинаем заполнение оценок...\n');

    for (const user of users) {
      console.log(`\n📝 Обработка: ${user.name} (${user.role})`);

      // 1. САМООЦЕНКА - уже есть, пропускаем
      const selfCheck = await client.query(
        'SELECT COUNT(*) as count FROM self_assessments WHERE user_id = $1 AND cycle_id = $2',
        [user.id, cycleId]
      );
      
      if (selfCheck.rows[0].count === '0') {
        // Получаем случайную задачу
        const taskResult = await client.query('SELECT id FROM tasks ORDER BY RANDOM() LIMIT 1');
        const taskId = taskResult.rows[0]?.id || 1;

        // Добавляем самооценку, если её нет
        for (const questionId of selfQuestionIds) {
          const score = Math.floor(Math.random() * 3) + 3; // 3-5
          await client.query(`
            INSERT INTO self_assessments (user_id, task_id, question_id, cycle_id, answer_score, answer_text, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [user.id, taskId, questionId, cycleId, score, `Самооценка по вопросу ${questionId}`]);
        }
        console.log('  ✅ Добавлена самооценка');
      } else {
        console.log('  ⏭️  Самооценка уже есть');
      }

      // 2. ОЦЕНКА РУКОВОДИТЕЛЯ - только для employee, не для manager
      if (user.role === 'employee') {
        const managerCheck = await client.query(
          'SELECT COUNT(*) as count FROM manager_reviews WHERE employee_id = $1 AND cycle_id = $2',
          [user.id, cycleId]
        );

        if (managerCheck.rows[0].count === '0') {
          // Находим менеджера (берем первого manager из списка)
          const managerResult = await client.query(
            "SELECT id FROM users WHERE role = 'manager' LIMIT 1"
          );
          const managerId = managerResult.rows[0]?.id || 3;

          // Получаем случайную задачу
          const taskResult = await client.query('SELECT id FROM tasks ORDER BY RANDOM() LIMIT 1');
          const taskId = taskResult.rows[0]?.id || 1;

          // Получаем вопросы для manager review
          const managerQuestionsResult = await client.query(`
            SELECT id FROM manager_review_questions ORDER BY id LIMIT 5
          `);
          const managerQuestionIds = managerQuestionsResult.rows.map(r => r.id);

          // Добавляем ответы на каждый вопрос
          for (const questionId of managerQuestionIds) {
            const score = Math.floor(Math.random() * 4) + 6; // 6-10
            await client.query(`
              INSERT INTO manager_reviews 
              (employee_id, manager_id, task_id, cycle_id, question_id, answer_score, answer_text, feedback_summary, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [user.id, managerId, taskId, cycleId, questionId, score, `Ответ на вопрос ${questionId}`, `Оценка руководителя для ${user.name}`]);
          }
          
          console.log('  ✅ Добавлена оценка руководителя');
        } else {
          console.log('  ⏭️  Оценка руководителя уже есть');
        }
      } else {
        console.log('  ⏭️  Оценка руководителя не нужна (это manager)');
      }

      // 3. PEER REVIEW - от коллег
      const peerCheck = await client.query(
        'SELECT COUNT(*) as count FROM peer_reviews WHERE employee_id = $1 AND cycle_id = $2',
        [user.id, cycleId]
      );

      if (peerCheck.rows[0].count === '0') {
        // Выбираем случайного коллегу (не самого себя)
        const peerResult = await client.query(
          "SELECT id FROM users WHERE role IN ('employee', 'manager') AND id != $1 ORDER BY RANDOM() LIMIT 1",
          [user.id]
        );
        const respondentId = peerResult.rows[0]?.id || (user.id === 2 ? 3 : 2);

        // Получаем случайную задачу
        const taskResult = await client.query('SELECT id FROM tasks ORDER BY RANDOM() LIMIT 1');
        const taskId = taskResult.rows[0]?.id || 1;

        // Добавляем ответы на вопросы
        for (const questionId of peerQuestionIds) {
          const score = Math.floor(Math.random() * 3) + 3; // 3-5
          await client.query(`
            INSERT INTO peer_reviews 
            (employee_id, respondent_id, task_id, question_id, cycle_id, answer_score, answer_text, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `, [user.id, respondentId, taskId, questionId, cycleId, score, `Оценка коллеги по вопросу ${questionId}`]);
        }
        
        console.log('  ✅ Добавлена peer review');
      } else {
        console.log('  ⏭️  Peer review уже есть');
      }

      // 4. POTENTIAL ASSESSMENT - оценка потенциала
      const potentialCheck = await client.query(
        'SELECT COUNT(*) as count FROM potential_assessments WHERE employee_id = $1 AND cycle_id = $2',
        [user.id, cycleId]
      );

      if (potentialCheck.rows[0].count === '0') {
        const managerResult = await client.query("SELECT id FROM users WHERE role = 'manager' LIMIT 1");
        const managerId = managerResult.rows[0]?.id || 3;

        const readinessOptions = ['1-2_years', '3_years', '3+_years', 'not_ready'];
        const readiness = readinessOptions[Math.floor(Math.random() * readinessOptions.length)];
        const growthScore = Math.floor(Math.random() * 6) + 5; // 5-10

        await client.query(`
          INSERT INTO potential_assessments 
          (employee_id, manager_id, cycle_id, professional_qualities, takes_responsibility, 
           transparent_communication, shares_information, organizes_work, growth_mindset_score, 
           readiness_timeframe, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, [
          user.id, managerId, cycleId,
          ['Ответственность', 'Ориентация на результат'], // массив качеств
          true, true, false, true, // boolean поля
          growthScore,
          readiness
        ]);
        
        console.log('  ✅ Добавлена оценка потенциала');
      } else {
        console.log('  ⏭️  Оценка потенциала уже есть');
      }
    }

    console.log('\n\n✅ Все оценки успешно добавлены!');
    console.log('\n📊 Статистика:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM self_assessments WHERE cycle_id = 2) as self_count,
        (SELECT COUNT(DISTINCT user_id) FROM self_assessments WHERE cycle_id = 2) as self_employees,
        (SELECT COUNT(*) FROM manager_reviews WHERE cycle_id = 2) as manager_count,
        (SELECT COUNT(*) FROM peer_reviews WHERE cycle_id = 2) as peer_count,
        (SELECT COUNT(DISTINCT employee_id) FROM peer_reviews WHERE cycle_id = 2) as peer_employees,
        (SELECT COUNT(*) FROM potential_assessments WHERE cycle_id = 2) as potential_count
    `);
    
    const s = stats.rows[0];
    console.log(`   Самооценки: ${s.self_count} записей (${s.self_employees} сотрудников)`);
    console.log(`   Оценки руководителя: ${s.manager_count} записей`);
    console.log(`   Peer reviews: ${s.peer_count} записей (${s.peer_employees} сотрудников)`);
    console.log(`   Оценки потенциала: ${s.potential_count} записей`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

seedCompleteEvaluations();
