require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('Проверка подключения к БД...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'НЕ ЗАДАН');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const result = await pool.query('SELECT current_database(), current_user, version()');
    console.log('\n✅ ПОДКЛЮЧЕНИЕ УСПЕШНО!');
    console.log('База данных:', result.rows[0].current_database);
    console.log('Пользователь:', result.rows[0].current_user);
    console.log('Версия:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ОШИБКА ПОДКЛЮЧЕНИЯ:');
    console.error('Сообщение:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
