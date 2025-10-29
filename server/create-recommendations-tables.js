// Скрипт для создания таблиц рекомендаций
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink2025'
});

async function createRecommendationsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Создание таблиц для рекомендаций...\n');

    // Таблица рекомендаций для сотрудников
    console.log('📋 Создание таблицы employee_recommendations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_recommendations (
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
    console.log('✅ Таблица employee_recommendations создана');

    // Таблица управленческих рекомендаций
    console.log('📋 Создание таблицы manager_recommendations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS manager_recommendations (
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

    // Создаем индексы для быстрого поиска
    console.log('📋 Создание индексов...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_recommendations_employee 
      ON employee_recommendations(employee_id);
      
      CREATE INDEX IF NOT EXISTS idx_manager_recommendations_manager 
      ON manager_recommendations(manager_id);
      
      CREATE INDEX IF NOT EXISTS idx_manager_recommendations_employee 
      ON manager_recommendations(employee_id);
    `);
    console.log('✅ Индексы созданы');

    console.log('\n✅ Все таблицы рекомендаций успешно созданы!');

  } catch (error) {
    console.error('❌ Ошибка при создании таблиц:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запуск
createRecommendationsTables()
  .then(() => {
    console.log('\n🎉 Миграция завершена успешно!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Ошибка миграции:', error);
    process.exit(1);
  });
