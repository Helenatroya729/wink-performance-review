const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./database');

// Упрощенный seed для MVP функционала
async function seedDatabase() {
  console.log('🌱 Начинаем заполнение базы данных (MVP версия)...\n');

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
    if (usersResult.rowCount > 0) {
      usersResult.rows.forEach(u => console.log(`   - ${u.email} (${u.role}): ${u.first_name} ${u.last_name}`));
    }

    // Получаем ID всех пользователей
    const allUsers = await pool.query('SELECT id, email, role FROM users ORDER BY id');
    const userMap = {};
    allUsers.rows.forEach(u => {
      userMap[u.email] = u.id;
    });

    console.log(`📋 Всего пользователей в системе: ${allUsers.rowCount}`);

    // Устанавливаем manager_id для сотрудников
    console.log('\n🔗 Устанавливаем связи руководитель-сотрудник...');
    if (userMap['manager1@wink.ru']) {
      await pool.query(`
        UPDATE users SET manager_id = $1 
        WHERE email IN ('emp1@wink.ru', 'emp2@wink.ru', 'emp3@wink.ru')
      `, [userMap['manager1@wink.ru']]);
    }
    
    if (userMap['manager2@wink.ru']) {
      await pool.query(`
        UPDATE users SET manager_id = $1 
        WHERE email IN ('emp4@wink.ru', 'emp5@wink.ru')
      `, [userMap['manager2@wink.ru']]);
    }
    console.log('✅ Связи установлены');

    // 2. Создаем цикл оценки
    console.log('\n🔄 Создаем цикл оценки...');
    const existingCycle = await pool.query(`SELECT id, name FROM review_cycles WHERE name = 'Годовая оценка 2025'`);
    
    let cycleId;
    if (existingCycle.rowCount > 0) {
      cycleId = existingCycle.rows[0].id;
      console.log(`ℹ️  Цикл уже существует: ${existingCycle.rows[0].name} (id: ${cycleId})`);
    } else {
      const cycleResult = await pool.query(`
        INSERT INTO review_cycles (name, start_date, end_date, status)
        VALUES ('Годовая оценка 2025', '2025-01-01', '2025-03-31', 'active')
        RETURNING id, name, start_date, end_date
      `);
      cycleId = cycleResult.rows[0].id;
      console.log(`✅ Создан цикл: ${cycleResult.rows[0].name} (id: ${cycleId})`);
    }

    // 3. Создаем цели для сотрудников (упрощенная версия - БЕЗ подзадач пока)
    console.log('\n🎯 Создаем цели сотрудников...');
    
    if (userMap['emp1@wink.ru']) {
      await pool.query(`
        INSERT INTO employee_goals (user_id, cycle_id, goal_number, title, description, status)
        VALUES ($1, $2, 1, 'Внедрить микросервисную архитектуру', 'Разделить монолит на 5 независимых сервисов', 'submitted')
        ON CONFLICT (user_id, cycle_id, goal_number) DO NOTHING
      `, [userMap['emp1@wink.ru'], cycleId]);
    }
    
    if (userMap['emp2@wink.ru']) {
      await pool.query(`
        INSERT INTO employee_goals (user_id, cycle_id, goal_number, title, description, status)
        VALUES ($1, $2, 1, 'Повысить покрытие тестами до 80%', 'Написать unit и integration тесты для критичных модулей', 'submitted')
        ON CONFLICT (user_id, cycle_id, goal_number) DO NOTHING
      `, [userMap['emp2@wink.ru'], cycleId]);
    }

    if (userMap['emp3@wink.ru']) {
      await pool.query(`
        INSERT INTO employee_goals (user_id, cycle_id, goal_number, title, description, status)
        VALUES ($1, $2, 1, 'Изучить React и TypeScript', 'Освоить современный стек фронтенда', 'submitted')
        ON CONFLICT (user_id, cycle_id, goal_number) DO NOTHING
      `, [userMap['emp3@wink.ru'], cycleId]);
    }

    const goalCount = await pool.query('SELECT COUNT(*) FROM employee_goals');
    console.log(`✅ Целей в системе: ${goalCount.rows[0].count}`);

    // 4. Статистика
    console.log('\n📈 Статистика базы данных:');
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM review_cycles) as cycles,
        (SELECT COUNT(*) FROM employee_goals) as goals
    `);

    console.log('┌─────────────────────┬────────┐');
    console.log('│ Таблица             │ Записи │');
    console.log('├─────────────────────┼────────┤');
    Object.entries(stats.rows[0]).forEach(([table, count]) => {
      console.log(`│ ${table.padEnd(19)} │ ${String(count).padStart(6)} │`);
    });
    console.log('└─────────────────────┴────────┘');

    console.log('\n✅ База данных готова для работы!');
    console.log('\n📝 Учетные данные для входа (пароль для всех: 123456):');
    console.log('   - admin@wink.ru (admin)');
    console.log('   - hr@wink.ru (hr)');
    console.log('   - manager1@wink.ru (manager) - руководитель отдела Разработка');
    console.log('   - manager2@wink.ru (manager) - руководитель отдела Маркетинг');
    console.log('   - emp1@wink.ru (employee) - Senior Developer');
    console.log('   - emp2@wink.ru (employee) - Middle Developer');
    console.log('   - emp3@wink.ru (employee) - Junior Developer');

  } catch (error) {
    console.error('\n❌ Ошибка при заполнении БД:', error.message);
    if (error.detail) console.error('Детали:', error.detail);
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
