const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function listAllUsers() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    const result = await client.query(`
      SELECT id, email, first_name, last_name, role, manager_id
      FROM users
      ORDER BY id
    `);

    console.log('📋 Все пользователи:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

listAllUsers();
