// Скрипт инициализации базы данных для Vercel Postgres
// Запустить один раз после создания базы: node api/init-db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Начинаю инициализацию базы данных...\n');

    // Создание таблицы пользователей
    console.log('📋 Создание таблицы users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(55) UNIQUE NOT NULL,
        password VARCHAR(55) NOT NULL,
        first_name VARCHAR(00) NOT NULL,
        last_name VARCHAR(00) NOT NULL,
        role VARCHAR(0) NOT NULL CHECK (role IN ('employee', 'manager', 'hr')),
        position VARCHAR(00),
        department VARCHAR(00),
        manager_id INTEGER REFERENCES users(id),
        hire_date DATE,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание таблицы циклов оценки
    console.log('📋 Создание таблицы evaluation_cycles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluation_cycles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(55) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(0) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание таблицы целей
    console.log('📋 Создание таблицы goals...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        weight INTEGER DEFAULT 00,
        status VARCHAR(0) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'completed')),
        manager_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание таблицы самооценки
    console.log('📋 Создание таблицы self_assessments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS self_assessments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
        achievement_percent INTEGER CHECK (achievement_percent >= 0 AND achievement_percent <= 00),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, goal_id, cycle_id)
      );
    `);

    // Peer feedback запросы
    console.log('📋 Создание таблицы peer_feedback_requests...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS peer_feedback_requests (
        id SERIAL PRIMARY KEY,
        requestor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
        status VARCHAR(0) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(requestor_id, reviewer_id, cycle_id)
      );
    `);

    // Peer feedback ответы
    console.log('📋 Создание таблицы peer_feedbacks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS peer_feedbacks (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES peer_feedback_requests(id) ON DELETE CASCADE,
        requestor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
        collaboration_rating INTEGER CHECK (collaboration_rating >=  AND collaboration_rating <= 5),
        collaboration_comment TEXT,
        technical_rating INTEGER CHECK (technical_rating >=  AND technical_rating <= 5),
        technical_comment TEXT,
        communication_rating INTEGER CHECK (communication_rating >=  AND communication_rating <= 5),
        communication_comment TEXT,
        strengths TEXT,
        areas_for_improvement TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(requestor_id, reviewer_id, cycle_id)
      );
    `);

    // Manager evaluations
    console.log('📋 Создание таблицы manager_evaluations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS manager_evaluations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
        technical_skills INTEGER CHECK (technical_skills >=  AND technical_skills <= 5),
        communication INTEGER CHECK (communication >=  AND communication <= 5),
        teamwork INTEGER CHECK (teamwork >=  AND teamwork <= 5),
        problem_solving INTEGER CHECK (problem_solving >=  AND problem_solving <= 5),
        leadership INTEGER CHECK (leadership >=  AND leadership <= 5),
        strengths TEXT,
        areas_for_improvement TEXT,
        development_plan TEXT,
        overall_comment TEXT,
        overall_rating INTEGER CHECK (overall_rating >=  AND overall_rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, manager_id, cycle_id)
      );
    `);

    // Potential assessments
    console.log('📋 Создание таблицы potential_assessments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS potential_assessments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
        prof_responsibility BOOLEAN DEFAULT FALSE,
        prof_result_oriented BOOLEAN DEFAULT FALSE,
        prof_proactivity BOOLEAN DEFAULT FALSE,
        prof_open_mindset BOOLEAN DEFAULT FALSE,
        prof_team_player BOOLEAN DEFAULT FALSE,
        professional_comment TEXT,
        pers_took_responsibility BOOLEAN DEFAULT FALSE,
        pers_transparent_communication BOOLEAN DEFAULT FALSE,
        pers_shared_info BOOLEAN DEFAULT FALSE,
        pers_organized_work BOOLEAN DEFAULT FALSE,
        personal_comment TEXT,
        had_motivation_one_on_one BOOLEAN DEFAULT FALSE,
        knows_miscommunication_cases BOOLEAN DEFAULT FALSE,
        development_desire VARCHAR(0) CHECK (development_desire IN ('proactive', 'needs_help', 'not_sure', 'no')),
        is_successor BOOLEAN DEFAULT FALSE,
        successor_ready_timing VARCHAR(0) CHECK (successor_ready_timing IN ('now', '6_months', 'not_ready')),
        turnover_risk INTEGER CHECK (turnover_risk >= 0 AND turnover_risk <= 0),
        ole_priority_ TEXT,
        ole_priority_ TEXT,
        performance_raw_score INTEGER DEFAULT 0,
        performance_final_score INTEGER DEFAULT ,
        potential_raw_score INTEGER DEFAULT 0,
        potential_final_score INTEGER DEFAULT ,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, cycle_id)
      );
    `);

    console.log('\n✅ Таблицы созданы успешно!\n');

    // Создание индексов
    console.log('🔧 Создание индексов...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_employee ON goals(employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_cycle ON goals(cycle_id);`);
    
    console.log('✅ Индексы созданы!\n');

    // Создание тестовых данных
    console.log('👥 Создание тестовых пользователей...');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('456', 0);

    // Проверяем, есть ли уже пользователи
    const usersCheck = await client.query('SELECT COUNT(*) FROM users');
    
    if (parseInt(usersCheck.rows[0].count) === 0) {
      // HR
      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role, position, department)
        VALUES ($, $, 'Анна', 'HR', 'hr', 'HR Manager', 'Управление персоналом')
      `, ['hr@wink.ru', hashedPassword]);

      // Менеджер
      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role, position, department)
        VALUES ($, $, 'Кирилл', 'Менеджеров', 'manager', 'Team Lead', 'Разработка')
      `, ['manager@wink.ru', hashedPassword]);

      // Сотрудник
      const managerResult = await client.query('SELECT id FROM users WHERE email = $', ['manager@wink.ru']);
      const managerId = managerResult.rows[0].id;

      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role, position, department, manager_id)
        VALUES ($, $, 'Иван', 'Сотрудников', 'employee', 'Developer', 'Разработка', $)
      `, ['emp@wink.ru', hashedPassword, managerId]);

      console.log('✅ Пользователи созданы!');
    } else {
      console.log('ℹ  Пользователи уже существуют');
    }

    // Создание цикла оценки
    console.log('\n📅 Создание цикла оценки...');
    const cyclesCheck = await client.query('SELECT COUNT(*) FROM evaluation_cycles');
    
    if (parseInt(cyclesCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO evaluation_cycles (name, start_date, end_date, status)
        VALUES ('Q4 04', '04-0-0', '04--', 'active')
      `);
      console.log('✅ Цикл оценки создан!');
    } else {
      console.log('ℹ  Цикл оценки уже существует');
    }

    console.log('\n🎉 База данных успешно инициализирована!');
    console.log('\n📝 Тестовые аккаунты:');
    console.log('   HR: hr@wink.ru / 456');
    console.log('   Менеджер: manager@wink.ru / 456');
    console.log('   Сотрудник: emp@wink.ru / 456\n');

  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запуск
initDatabase()
  .then(() => {
    console.log('✅ Скрипт завершён успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit();
  });
