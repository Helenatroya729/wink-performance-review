/**
 * Скрипт для диагностики подключения к PostgreSQL
 * Помогает найти правильные настройки для .env файла
 */

const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection(config) {
  const pool = new Pool(config);
  try {
    const result = await pool.query('SELECT current_user, current_database(), version()');
    await pool.end();
    return { success: true, data: result.rows[0] };
  } catch (error) {
    await pool.end();
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n=== ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ К POSTGRESQL ===\n');
  console.log('Этот скрипт поможет найти правильные настройки для .env файла\n');

  // Попробуем стандартные настройки
  console.log('1. Пробую стандартные настройки (postgres/wink2025 на порту 5433)...');
  let result = await testConnection({
    host: 'localhost',
    port: 5433,
    database: 'postgres',
    user: 'postgres',
    password: 'wink2025'
  });

  if (result.success) {
    console.log('✅ ПОДКЛЮЧЕНИЕ УСПЕШНО!');
    console.log('   Пользователь:', result.data.current_user);
    console.log('   База данных:', result.data.current_database);
    console.log('   Версия:', result.data.version);
    console.log('\n📝 Используйте эти настройки в .env:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5433');
    console.log('   DB_USER=postgres');
    console.log('   DB_PASSWORD=wink2025');
    rl.close();
    return;
  }

  console.log('❌ Не удалось подключиться:', result.error);

  // Попробуем другой порт
  console.log('\n2. Пробую порт 5432 (стандартный порт PostgreSQL)...');
  result = await testConnection({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'wink2025'
  });

  if (result.success) {
    console.log('✅ ПОДКЛЮЧЕНИЕ УСПЕШНО на порту 5432!');
    console.log('   Пользователь:', result.data.current_user);
    console.log('\n📝 Используйте в .env:');
    console.log('   DB_PORT=5432');
    rl.close();
    return;
  }

  console.log('❌ Не удалось подключиться:', result.error);

  // Запрашиваем настройки вручную
  console.log('\n3. Давайте попробуем ввести настройки вручную\n');
  
  const host = await question('Хост (обычно localhost): ') || 'localhost';
  const port = await question('Порт (обычно 5432 или 5433): ') || '5433';
  const user = await question('Имя пользователя PostgreSQL: ');
  const password = await question('Пароль: ');
  const database = await question('База данных (для теста используйте postgres): ') || 'postgres';

  console.log('\nПроверяю подключение...');
  result = await testConnection({
    host,
    port: parseInt(port),
    database,
    user,
    password
  });

  if (result.success) {
    console.log('\n✅ ПОДКЛЮЧЕНИЕ УСПЕШНО!');
    console.log('   Пользователь:', result.data.current_user);
    console.log('   База данных:', result.data.current_database);
    console.log('   Версия:', result.data.version);
    console.log('\n📝 Используйте эти настройки в .env:');
    console.log(`   DB_HOST=${host}`);
    console.log(`   DB_PORT=${port}`);
    console.log(`   DB_USER=${user}`);
    console.log(`   DB_PASSWORD=${password}`);
  } else {
    console.log('\n❌ ПОДКЛЮЧЕНИЕ НЕ УДАЛОСЬ:', result.error);
    console.log('\n💡 Возможные решения:');
    console.log('   1. Проверьте, что PostgreSQL запущен (Services -> postgresql)');
    console.log('   2. Проверьте имя пользователя и пароль в pgAdmin');
    console.log('   3. Проверьте порт в файле postgresql.conf');
    console.log('   4. Убедитесь, что в pg_hba.conf разрешены локальные подключения');
  }

  rl.close();
}

main().catch(err => {
  console.error('Ошибка:', err);
  rl.close();
  process.exit(1);
});
