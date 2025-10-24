const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkHRUser() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, email, role, first_name, last_name, password_hash 
      FROM users 
      WHERE role = 'hr' OR email LIKE '%hr%'
    `);
    
    console.log('\n👤 HR пользователи:');
    if (result.rows.length === 0) {
      console.log('  ❌ Нет HR пользователей!');
    } else {
      result.rows.forEach(user => {
        console.log(`  ${user.id}. ${user.email} - ${user.first_name} ${user.last_name} (${user.role})`);
        console.log(`     Password hash: ${user.password_hash.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkHRUser();
