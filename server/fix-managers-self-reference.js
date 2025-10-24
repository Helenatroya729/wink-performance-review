const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function fixManagers() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Обновляем manager_id для всех руководителей на NULL
    const result = await client.query(`
      UPDATE users 
      SET manager_id = NULL 
      WHERE role = 'manager' AND manager_id = id
      RETURNING id, email, first_name, last_name, manager_id
    `);

    console.log(`✅ Обновлено ${result.rowCount} руководителей:\n`);
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

fixManagers();
