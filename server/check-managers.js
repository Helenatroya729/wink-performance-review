const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function checkManagers() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    const result = await client.query(`
      SELECT id, email, first_name, last_name, role, manager_id 
      FROM users 
      WHERE role = 'manager' 
      ORDER BY id
    `);

    console.log('📋 Руководители:');
    console.table(result.rows);

    console.log('\n🔍 Проверка на самоссылки:');
    result.rows.forEach(row => {
      if (row.manager_id === row.id) {
        console.log(`⚠️  ${row.first_name} ${row.last_name} (id: ${row.id}) - manager_id указывает на самого себя!`);
      }
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

checkManagers();
