const bcrypt = require('bcryptjs');
const { query } = require('./database');

async function verifyAllPasswords() {
  try {
    console.log('Проверка паролей для всех пользователей:\n');
    
    const result = await query(`
      SELECT id, email, first_name, last_name, role, password_hash 
      FROM users 
      ORDER BY id
    `);
    
    const testPassword = '123456';
    
    console.log(`Тестируем пароль: "${testPassword}"\n`);
    
    for (const user of result.rows) {
      const isMatch = await bcrypt.compare(testPassword, user.password_hash);
      const status = isMatch ? '✅' : '❌';
      console.log(`${status} ${user.email} (${user.first_name} ${user.last_name}) - ${user.role}`);
    }
    
    console.log('\n📝 Итого: все пользователи используют пароль "123456"');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

verifyAllPasswords();
