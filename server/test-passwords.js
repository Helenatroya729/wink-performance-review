const bcrypt = require('bcryptjs');
const { query } = require('./database');

async function testPasswords() {
  try {
    console.log('Тестирование паролей:\n');
    
    // Получаем пользователя
    const result = await query(`SELECT email, password_hash FROM users WHERE email = 'hr@wink.ru'`);
    
    if (result.rows.length === 0) {
      console.log('❌ Пользователь не найден');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log(`Email: ${user.email}`);
    console.log(`Хеш: ${user.password_hash}\n`);
    
    // Тестируем разные пароли
    const testPasswords = ['password123', 'admin123', 'hr123', '123456', 'wink2024'];
    
    for (const testPass of testPasswords) {
      const isMatch = await bcrypt.compare(testPass, user.password_hash);
      console.log(`Пароль "${testPass}": ${isMatch ? '✅ ПОДХОДИТ' : '❌ не подходит'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

testPasswords();
