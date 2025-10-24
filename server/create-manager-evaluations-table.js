const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function createManagerEvaluationsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Создание таблицы manager_evaluations...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS manager_evaluations (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES employee_goals(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        result_achievement_rating INTEGER CHECK (result_achievement_rating >= 0 AND result_achievement_rating <= 10),
        personal_qualities_comment TEXT,
        personal_contribution_comment TEXT,
        interaction_quality_rating INTEGER CHECK (interaction_quality_rating >= 0 AND interaction_quality_rating <= 10),
        improvement_suggestions TEXT,
        overall_rating INTEGER CHECK (overall_rating >= 0 AND overall_rating <= 10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(goal_id, employee_id, manager_id, cycle_id)
      );
    `);

    console.log('✅ Таблица manager_evaluations создана');

    // Создаём индексы
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_manager_evaluations_employee 
      ON manager_evaluations(employee_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_manager_evaluations_manager 
      ON manager_evaluations(manager_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_manager_evaluations_cycle 
      ON manager_evaluations(cycle_id);
    `);

    console.log('✅ Индексы созданы');

    // Проверяем структуру таблицы
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'manager_evaluations'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Структура таблицы manager_evaluations:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка при создании таблицы:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createManagerEvaluationsTable();
