const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function updateSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Обновление схемы таблицы peer_feedbacks...\n');

    // Удаляем старые колонки и добавляем новые
    await client.query(`
      ALTER TABLE peer_feedbacks
      DROP COLUMN IF EXISTS technical_skills,
      DROP COLUMN IF EXISTS communication,
      DROP COLUMN IF EXISTS teamwork,
      DROP COLUMN IF EXISTS problem_solving,
      DROP COLUMN IF EXISTS initiative,
      DROP COLUMN IF EXISTS strengths,
      DROP COLUMN IF EXISTS areas_for_improvement,
      DROP COLUMN IF EXISTS additional_comments;
    `);

    console.log('✅ Старые колонки удалены');

    await client.query(`
      ALTER TABLE peer_feedbacks
      ADD COLUMN IF NOT EXISTS result_achievement_rating INTEGER CHECK (result_achievement_rating >= 0 AND result_achievement_rating <= 10),
      ADD COLUMN IF NOT EXISTS personal_qualities_comment TEXT,
      ADD COLUMN IF NOT EXISTS interaction_quality_rating INTEGER CHECK (interaction_quality_rating >= 0 AND interaction_quality_rating <= 10),
      ADD COLUMN IF NOT EXISTS improvement_suggestions TEXT;
    `);

    console.log('✅ Новые колонки добавлены');

    // Проверяем структуру таблицы
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'peer_feedbacks'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Текущая структура таблицы peer_feedbacks:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка при обновлении схемы:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
