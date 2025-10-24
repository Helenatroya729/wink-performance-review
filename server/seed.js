const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./database');

// Тестовые данные для заполнения БД
async function seedDatabase() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...\n');

  try {
    // Проверяем подключение
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Не удалось подключиться к базе данных');
    }

    // 1. Создаем пользователей
    console.log('👥 Создаем пользователей...');
    const passwordHash = await bcrypt.hash('123456', 10);
    
    const usersResult = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, department, position, is_active)
      VALUES 
        ('admin@wink.ru', $1, 'Администратор', 'Системный', 'admin', 'IT', 'System Admin', true),
        ('hr@wink.ru', $1, 'Елена', 'Губская', 'hr', 'HR', 'HR Manager', true),
        ('manager1@wink.ru', $1, 'Кирилл', 'Менеджеров', 'manager', 'Разработка', 'Team Lead', true),
        ('manager2@wink.ru', $1, 'Мария', 'Петрова', 'manager', 'Маркетинг', 'Marketing Manager', true),
        ('emp1@wink.ru', $1, 'Иван', 'Иванов', 'employee', 'Разработка', 'Senior Developer', true),
        ('emp2@wink.ru', $1, 'Анна', 'Сидорова', 'employee', 'Разработка', 'Middle Developer', true),
        ('emp3@wink.ru', $1, 'Петр', 'Петров', 'employee', 'Разработка', 'Junior Developer', true),
        ('emp4@wink.ru', $1, 'Ольга', 'Васильева', 'employee', 'Маркетинг', 'Marketing Specialist', true),
        ('emp5@wink.ru', $1, 'Дмитрий', 'Смирнов', 'employee', 'Маркетинг', 'Content Manager', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, first_name, last_name, role
    `, [passwordHash]);
    
    console.log(`✅ Создано ${usersResult.rowCount} пользователей`);
    usersResult.rows.forEach(u => console.log(`   - ${u.email} (${u.role}): ${u.first_name} ${u.last_name}`));

    // Получаем ID пользователей для связей
    const allUsers = await pool.query('SELECT id, email, role FROM users ORDER BY id');
    const userMap = {};
    allUsers.rows.forEach(u => {
      userMap[u.email] = u.id;
    });

    // Устанавливаем manager_id для сотрудников
    console.log('\n🔗 Устанавливаем связи руководитель-сотрудник...');
    await pool.query(`
      UPDATE users SET manager_id = $1 
      WHERE email IN ('emp1@wink.ru', 'emp2@wink.ru', 'emp3@wink.ru')
    `, [userMap['manager1@wink.ru']]);
    
    await pool.query(`
      UPDATE users SET manager_id = $1 
      WHERE email IN ('emp4@wink.ru', 'emp5@wink.ru')
    `, [userMap['manager2@wink.ru']]);
    console.log('✅ Связи установлены');

    // 2. Создаем цикл оценки
    console.log('\n🔄 Создаем цикл оценки...');
    const cycleResult = await pool.query(`
      INSERT INTO review_cycles (name, start_date, end_date, status)
      VALUES ('Годовая оценка 2025', '2025-01-01', '2025-03-31', 'active')
      RETURNING id, name, start_date, end_date
    `);
    
    const cycleId = cycleResult.rows[0].id;
    console.log(`✅ Создан цикл: ${cycleResult.rows[0].name} (${cycleResult.rows[0].start_date} - ${cycleResult.rows[0].end_date})`);

    // 3. Создаем цели для сотрудников
    console.log('\n🎯 Создаем цели сотрудников...');
    
    // Цели для emp1 (Иван Иванов - Senior Developer)
    const goal1 = await pool.query(`
      INSERT INTO employee_goals (user_id, cycle_id, title, description, status)
      VALUES ($1, $2, 'Внедрить микросервисную архитектуру', 'Разделить монолит на 5 независимых сервисов', 'submitted')
      RETURNING id
    `, [userMap['emp1@wink.ru'], cycleId]);
    
    await pool.query(`
      INSERT INTO goal_tasks (goal_id, task_title, deadline, status)
      VALUES 
        ($1, 'Проектирование архитектуры', '2025-02-01', 'completed'),
        ($1, 'Разработка API Gateway', '2025-02-15', 'in_progress'),
        ($1, 'Миграция первого сервиса', '2025-03-01', 'pending')
    `, [goal1.rows[0].id]);

    // Цели для emp2 (Анна Сидорова - Middle Developer)
    const goal2 = await pool.query(`
      INSERT INTO employee_goals (user_id, cycle_id, title, description, status)
      VALUES ($1, $2, 'Повысить покрытие тестами до 80%', 'Написать unit и integration тесты для критичных модулей', 'submitted')
      RETURNING id
    `, [userMap['emp2@wink.ru'], cycleId]);
    
    await pool.query(`
      INSERT INTO goal_tasks (goal_id, task_title, deadline, status)
      VALUES 
        ($1, 'Настроить CI/CD для тестов', '2025-01-20', 'completed'),
        ($1, 'Покрыть модуль авторизации', '2025-02-10', 'in_progress'),
        ($1, 'Покрыть бизнес-логику', '2025-03-15', 'pending')
    `, [goal2.rows[0].id]);

    // Цели для emp3 (Петр Петров - Junior Developer)
    const goal3 = await pool.query(`
      INSERT INTO employee_goals (user_id, cycle_id, title, description, status)
      VALUES ($1, $2, 'Изучить React и TypeScript', 'Освоить современный стек фронтенда', 'submitted')
      RETURNING id
    `, [userMap['emp3@wink.ru'], cycleId]);
    
    await pool.query(`
      INSERT INTO goal_tasks (goal_id, task_title, deadline, status)
      VALUES 
        ($1, 'Пройти курс по React', '2025-01-31', 'completed'),
        ($1, 'Разработать тестовый проект', '2025-02-28', 'in_progress'),
        ($1, 'Внедрить компонент в продукт', '2025-03-25', 'pending')
    `, [goal3.rows[0].id]);

    console.log('✅ Создано 3 цели с 9 подзадачами');

    // 4. Создаем самооценки (вопросы 1-5)
    console.log('\n✍️ Создаем самооценки...');
    
    const selfAssessmentQuestions = [
      { id: 1, text: 'Оцените качество выполненной работы' },
      { id: 2, text: 'Оцените вашу инициативность' },
      { id: 3, text: 'Оцените навыки командной работы' },
      { id: 4, text: 'Оцените соблюдение дедлайнов' },
      { id: 5, text: 'Оцените стремление к развитию' }
    ];

    // Самооценка для emp1
    for (let q of selfAssessmentQuestions) {
      await pool.query(`
        INSERT INTO self_assessments (user_id, cycle_id, question_id, rating, answer_text)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userMap['emp1@wink.ru'], 
        cycleId, 
        q.id, 
        Math.floor(Math.random() * 2) + 4, // 4-5
        `Ответ на вопрос: ${q.text}`
      ]);
    }

    // Самооценка для emp2
    for (let q of selfAssessmentQuestions) {
      await pool.query(`
        INSERT INTO self_assessments (user_id, cycle_id, question_id, rating, answer_text)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userMap['emp2@wink.ru'], 
        cycleId, 
        q.id, 
        Math.floor(Math.random() * 2) + 3, // 3-4
        `Ответ на вопрос: ${q.text}`
      ]);
    }

    console.log('✅ Создано 10 самооценок');

    // 5. Создаем peer reviews (360)
    console.log('\n👥 Создаем оценки коллег (360)...');
    
    const peerQuestions = [
      { id: 1, text: 'Качество кода и технические навыки' },
      { id: 2, text: 'Помощь коллегам' },
      { id: 3, text: 'Коммуникация в команде' },
      { id: 4, text: 'Надежность и ответственность' }
    ];

    // emp2 оценивает emp1
    for (let q of peerQuestions) {
      await pool.query(`
        INSERT INTO peer_reviews (user_id, reviewer_id, cycle_id, question_id, rating)
        VALUES ($1, $2, $3, $4, $5)
      `, [userMap['emp1@wink.ru'], userMap['emp2@wink.ru'], cycleId, q.id, 5]);
    }

    // emp3 оценивает emp1
    for (let q of peerQuestions) {
      await pool.query(`
        INSERT INTO peer_reviews (user_id, reviewer_id, cycle_id, question_id, rating)
        VALUES ($1, $2, $3, $4, $5)
      `, [userMap['emp1@wink.ru'], userMap['emp3@wink.ru'], cycleId, q.id, 4]);
    }

    // emp1 оценивает emp2
    for (let q of peerQuestions) {
      await pool.query(`
        INSERT INTO peer_reviews (user_id, reviewer_id, cycle_id, question_id, rating)
        VALUES ($1, $2, $3, $4, $5)
      `, [userMap['emp2@wink.ru'], userMap['emp1@wink.ru'], cycleId, q.id, 4]);
    }

    console.log('✅ Создано 12 peer reviews');

    // 6. Создаем оценки руководителя
    console.log('\n👨‍💼 Создаем оценки руководителя...');
    
    const managerQuestions = [
      { id: 1, text: 'Достижение целей' },
      { id: 2, text: 'Профессиональные компетенции' },
      { id: 3, text: 'Лидерские качества' },
      { id: 4, text: 'Потенциал роста' }
    ];

    // Менеджер оценивает emp1
    for (let q of managerQuestions) {
      await pool.query(`
        INSERT INTO manager_reviews (user_id, manager_id, cycle_id, question_id, rating, feedback_text)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userMap['emp1@wink.ru'], 
        userMap['manager1@wink.ru'], 
        cycleId, 
        q.id, 
        5,
        'Отличные результаты работы'
      ]);
    }

    // Менеджер оценивает emp2
    for (let q of managerQuestions) {
      await pool.query(`
        INSERT INTO manager_reviews (user_id, manager_id, cycle_id, question_id, rating, feedback_text)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userMap['emp2@wink.ru'], 
        userMap['manager1@wink.ru'], 
        cycleId, 
        q.id, 
        4,
        'Хорошая работа, есть потенциал для роста'
      ]);
    }

    console.log('✅ Создано 8 manager reviews');

    // 7. Создаем итоговые оценки
    console.log('\n📊 Создаем итоговые оценки...');
    
    await pool.query(`
      INSERT INTO final_reviews (
        user_id, cycle_id, 
        self_assessment_avg, peer_review_avg, manager_review_avg,
        total_score, rating, rating_category
      )
      VALUES 
        ($1, $2, 4.6, 4.5, 5.0, 4.73, 9, 'outstanding'),
        ($3, $2, 3.8, 4.0, 4.0, 3.96, 8, 'good_result')
    `, [
      userMap['emp1@wink.ru'], 
      cycleId,
      userMap['emp2@wink.ru']
    ]);

    console.log('✅ Создано 2 итоговых оценки');

    // 8. Проверяем статистику
    console.log('\n📈 Статистика базы данных:');
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM review_cycles) as cycles,
        (SELECT COUNT(*) FROM employee_goals) as goals,
        (SELECT COUNT(*) FROM goal_tasks) as tasks,
        (SELECT COUNT(*) FROM self_assessments) as self_assessments,
        (SELECT COUNT(*) FROM peer_reviews) as peer_reviews,
        (SELECT COUNT(*) FROM manager_reviews) as manager_reviews,
        (SELECT COUNT(*) FROM final_reviews) as final_reviews
    `);

    console.log('┌─────────────────────┬────────┐');
    console.log('│ Таблица             │ Записи │');
    console.log('├─────────────────────┼────────┤');
    Object.entries(stats.rows[0]).forEach(([table, count]) => {
      console.log(`│ ${table.padEnd(19)} │ ${String(count).padStart(6)} │`);
    });
    console.log('└─────────────────────┴────────┘');

    console.log('\n✅ База данных успешно заполнена тестовыми данными!');
    console.log('\n📝 Учетные данные для входа (пароль для всех: 123456):');
    console.log('   - admin@wink.ru (admin)');
    console.log('   - hr@wink.ru (hr)');
    console.log('   - manager1@wink.ru (manager)');
    console.log('   - emp1@wink.ru (employee)');
    console.log('   - emp2@wink.ru (employee)');

  } catch (error) {
    console.error('❌ Ошибка при заполнении БД:', error.message);
    console.error(error);
  } finally {
    await pool.end();
    console.log('\n🔌 Подключение к БД закрыто');
  }
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
