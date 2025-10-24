// Скрипт создания схемы БД для локального PostgreSQL
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink2025'
});

// Импортируем логику из api/init-db.js, но используем локальное подключение
const bcrypt = require('bcryptjs');

async function initSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Начинаю создание схемы базы данных...\n');

    // Создание таблицы пользователей
    console.log('📋 Создание таблицы users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'manager', 'hr', 'admin')),
        position VARCHAR(100),
        department VARCHAR(100),
        manager_id INTEGER REFERENCES users(id),
        hire_date DATE,
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание таблицы циклов оценки
    console.log('📋 Создание таблицы review_cycles...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS review_cycles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'archived')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание таблицы целей
    console.log('📋 Создание таблицы employee_goals...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        weight INTEGER DEFAULT 100,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'completed')),
        manager_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Задачи к целям
    console.log('📋 Создание таблицы goal_tasks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS goal_tasks (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES employee_goals(id) ON DELETE CASCADE,
        task_title TEXT NOT NULL,
        deadline DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание таблицы самооценки
    console.log('📋 Создание таблицы self_assessments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS self_assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        goal_id INTEGER REFERENCES employee_goals(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        achievement_percent INTEGER CHECK (achievement_percent >= 0 AND achievement_percent <= 100),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, goal_id, cycle_id)
      );
    `);

    // Peer feedback запросы
    console.log('📋 Создание таблицы peer_feedback_requests...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS peer_feedback_requests (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(requester_id, reviewer_id, cycle_id)
      );
    `);

    // Peer feedback ответы
    console.log('📋 Создание таблицы peer_feedbacks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS peer_feedbacks (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES peer_feedback_requests(id) ON DELETE CASCADE,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
        technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
        communication INTEGER CHECK (communication >= 1 AND communication <= 5),
        teamwork INTEGER CHECK (teamwork >= 1 AND teamwork <= 5),
        problem_solving INTEGER CHECK (problem_solving >= 1 AND problem_solving <= 5),
        initiative INTEGER CHECK (initiative >= 1 AND initiative <= 5),
        strengths TEXT,
        areas_for_improvement TEXT,
        additional_comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Manager evaluations
    console.log('📋 Создание таблицы manager_evaluations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS manager_evaluations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
        technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
        communication INTEGER CHECK (communication >= 1 AND communication <= 5),
        teamwork INTEGER CHECK (teamwork >= 1 AND teamwork <= 5),
        problem_solving INTEGER CHECK (problem_solving >= 1 AND problem_solving <= 5),
        leadership INTEGER CHECK (leadership >= 1 AND leadership <= 5),
        strengths TEXT,
        areas_for_improvement TEXT,
        development_plan TEXT,
        overall_comment TEXT,
        overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
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
        cycle_id INTEGER NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
        performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
        potential_rating INTEGER CHECK (potential_rating >= 1 AND potential_rating <= 5),
        readiness_for_promotion VARCHAR(50),
        development_areas TEXT,
        recommended_actions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, manager_id, cycle_id)
      );
    `);

    // Создаем индексы
    console.log('\n📊 Создание индексов...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
      CREATE INDEX IF NOT EXISTS idx_goals_user_cycle ON employee_goals(user_id, cycle_id);
      CREATE INDEX IF NOT EXISTS idx_peer_requests_status ON peer_feedback_requests(status);
      CREATE INDEX IF NOT EXISTS idx_manager_eval_employee ON manager_evaluations(employee_id, cycle_id);
    `);

    console.log('\n✅ Схема базы данных успешно создана!');
    console.log('\nТеперь можно запустить seed.js для заполнения тестовыми данными.');
    
  } catch (error) {
    console.error('❌ Ошибка при создании схемы:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initSchema()
  .then(() => {
    console.log('\n🎉 Инициализация завершена!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Ошибка инициализации:', error);
    process.exit(1);
  });
