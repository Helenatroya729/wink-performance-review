const { query } = require('./database');

async function checkUsers() {
  try {
    console.log('Проверка пользователей в базе данных:\n');
    
    const result = await query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        password_hash,
        LENGTH(password_hash) as hash_length
      FROM users 
      ORDER BY id
      LIMIT 10
    `);
    
    console.log(`Найдено пользователей: ${result.rows.length}\n`);
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Email: ${row.email}`);
      console.log(`Имя: ${row.first_name} ${row.last_name}`);
      console.log(`Роль: ${row.role}`);
      console.log(`Хеш пароля: ${row.password_hash ? row.password_hash.substring(0, 30) + '...' : 'отсутствует'}`);
      console.log(`Длина хеша: ${row.hash_length || 0}`);
      console.log('---\n');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkUsers();
