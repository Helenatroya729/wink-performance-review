// Скрипт для миграции таблицы employee_recommendations
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink2025'
});

async function migrateRecommendationsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Миграция таблиц рекомендаций...\n');

    // Удаляем старую таблицу employee_recommendations
    console.log('📋 Удаление старой таблицы employee_recommendations...');
    await client.query(`DROP TABLE IF EXISTS employee_recommendations CASCADE;`);
    console.log('✅ Старая таблица удалена');

    // Создаём новую таблицу employee_recommendations
    console.log('📋 Создание новой таблицы employee_recommendations...');
    await client.query(`
      CREATE TABLE employee_recommendations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hr_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        achievements TEXT,
        improvements TEXT,
        development_plan TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Новая таблица employee_recommendations создана');

    // Создаём индекс
    console.log('📋 Создание индекса...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_recommendations_employee 
      ON employee_recommendations(employee_id);
    `);
    console.log('✅ Индекс создан');

    // Проверяем, существует ли таблица manager_recommendations
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'manager_recommendations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Создаём таблицу manager_recommendations
      console.log('📋 Создание таблицы manager_recommendations...');
      await client.query(`
        CREATE TABLE manager_recommendations (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          hr_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          recommendations TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Таблица manager_recommendations создана');

      // Создаём индекс
      console.log('📋 Создание индекса для manager_recommendations...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_manager_recommendations_manager 
        ON manager_recommendations(manager_id);
      `);
      console.log('✅ Индекс создан');
    } else {
      console.log('✅ Таблица manager_recommendations уже существует');
    }

    console.log('\n✅ Миграция успешно завершена!');

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRecommendationsTables();
