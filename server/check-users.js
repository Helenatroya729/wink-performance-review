const pool = require('./database');

async function checkUsers() {
  try {
    // Проверяем всех пользователей с ролями admin, hr, manager
    const result = await pool.query(`
      SELECT id, email, password_hash, role, first_name, last_name
      FROM users 
      WHERE role IN ('admin', 'hr', 'manager')
      ORDER BY role, id
    `);
    
    console.log('\n=== Пользователи в базе ===\n');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password Hash: ${user.password_hash}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log('---');
    });
    
    console.log('\n=== Проверка manager_id ===\n');
    const managers = await pool.query(`
      SELECT id, email, role, manager_id
      FROM users 
      WHERE role = 'manager'
    `);
    
    managers.rows.forEach(m => {
      console.log(`Manager ${m.email}: manager_id = ${m.manager_id}`);
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    process.exit();
  }
}

checkUsers();
