const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function resetHRPassword() {
  const client = await pool.connect();
  try {
    const password = 'password';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('\n🔐 Сбрасываем пароль для HR...');
    
    await client.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE email = 'hr@wink.ru'
    `, [passwordHash]);
    
    console.log(`✅ Пароль обновлен!`);
    console.log(`   Email: hr@wink.ru`);
    console.log(`   Password: ${password}`);
    console.log(`   Hash: ${passwordHash.substring(0, 30)}...`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetHRPassword();
