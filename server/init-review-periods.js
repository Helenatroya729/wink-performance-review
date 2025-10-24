const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: '12345',
  port: 5433,
});

async function initReviewPeriods() {
  try {
    // Создаем таблицу review_periods
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table review_periods created');

    // Проверяем, есть ли уже данные
    const checkResult = await pool.query('SELECT COUNT(*) FROM review_periods');
    const count = parseInt(checkResult.rows[0].count);

    // Очищаем старые данные
    await pool.query('DELETE FROM review_periods');
    console.log('✓ Old review periods deleted');

    // Добавляем только полугодовые циклы оценки
    await pool.query(`
      INSERT INTO review_periods (name, start_date, end_date, is_active)
      VALUES
        ('Полугодие 1 - 2025', '2025-01-01', '2025-06-30', false),
        ('Полугодие 2 - 2025', '2025-07-01', '2025-12-31', true);
    `);
    console.log('✓ Semi-annual review periods added');

    // Показываем все циклы
    const result = await pool.query('SELECT * FROM review_periods ORDER BY id');
    console.log('\nReview periods:');
    result.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.name} (${row.start_date.toISOString().split('T')[0]} - ${row.end_date.toISOString().split('T')[0]}) ${row.is_active ? '✓ ACTIVE' : ''}`);
    });

    await pool.end();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

initReviewPeriods();
