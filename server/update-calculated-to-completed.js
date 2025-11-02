const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function updateCalculatedToCompleted() {
  console.log('\n=== Обновление статуса calculated на completed ===\n');

  try {
    // Найдём все периоды со статусом calculated
    const calculated = await pool.query(`
      SELECT id, user_id, name, status 
      FROM employee_review_periods 
      WHERE status = 'calculated'
    `);

    console.log(`Найдено периодов со статусом 'calculated': ${calculated.rows.length}\n`);

    if (calculated.rows.length === 0) {
      console.log('✅ Нет периодов для обновления');
      return;
    }

    calculated.rows.forEach(p => {
      console.log(`  Period ID: ${p.id}, User ID: ${p.user_id}, Name: ${p.name}`);
    });

    // Обновляем все на completed
    const result = await pool.query(`
      UPDATE employee_review_periods
      SET status = 'completed'
      WHERE status = 'calculated'
      RETURNING id, user_id, name
    `);

    console.log(`\n✅ Обновлено ${result.rows.length} периодов:\n`);
    result.rows.forEach(p => {
      console.log(`  ✓ Period ID: ${p.id}, User ID: ${p.user_id}, Name: ${p.name}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

updateCalculatedToCompleted();
