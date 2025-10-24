const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function createReviewPeriodsTable() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Создаем таблицу для индивидуальных периодов оценки
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_review_periods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        notification_sent BOOLEAN DEFAULT FALSE,
        reminder_sent BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, cycle_id)
      )
    `);

    console.log('✅ Таблица user_review_periods создана\n');

    // Добавляем индексы
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_review_periods_user_id ON user_review_periods(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_review_periods_cycle_id ON user_review_periods(cycle_id);
      CREATE INDEX IF NOT EXISTS idx_user_review_periods_dates ON user_review_periods(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_user_review_periods_status ON user_review_periods(status);
    `);

    console.log('✅ Индексы созданы\n');

    // Показываем структуру таблицы
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_review_periods'
      ORDER BY ordinal_position
    `);

    console.log('📋 Структура таблицы user_review_periods:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

createReviewPeriodsTable();
