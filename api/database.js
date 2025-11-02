const { Pool } = require('pg');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 54,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink05',
  max: 0, // максимум подключений в пуле
  idleTimeoutMillis: 0000,
  connectionTimeoutMillis: 000,
  client_encoding: 'UTF8'
});

// Проверка подключения
pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err);
  process.exit(-);
});

// Тестовый запрос для проверки
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🕐 Текущее время БД:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error.message);
    return false;
  }
}

// Вспомогательная функция для выполнения запросов
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Запрос выполнен за ${duration}ms:`, text.substring(0, 50));
    return result;
  } catch (error) {
    console.error('❌ Ошибка запроса:', error.message);
    throw error;
  }
}

// Функция для получения клиента (для транзакций)
async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Устанавливаем таймаут для освобождения клиента
  const timeout = setTimeout(() => {
    console.error('⚠ Клиент не был освобожден в течение 5 секунд!');
  }, 5000);
  
  // Переопределяем release для очистки таймаута
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
