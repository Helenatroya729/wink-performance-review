const pool = require('./database');
const bcrypt = require('bcrypt');

async function fixPasswords() {
  try {
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('\n=== Обновление паролей ===\n');
    
    // Обновляем пароли для admin, hr, manager
    const usersToFix = ['admin@wink.ru', 'hr@wink.ru', 'manager@wink.ru'];
    
    for (const email of usersToFix) {
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log(`✅ Пароль обновлен для ${email}`);
    }
    
    // Также исправим manager_id для менеджеров (они сами себе менеджеры)
    console.log('\n=== Обновление manager_id для менеджеров ===\n');
    
    const managers = await pool.query(`
      SELECT id, email FROM users WHERE role = 'manager'
    `);
    
    for (const manager of managers.rows) {
      await pool.query(
        'UPDATE users SET manager_id = $1 WHERE id = $1',
        [manager.id]
      );
      console.log(`✅ manager_id установлен для ${manager.email} (id: ${manager.id})`);
    }
    
    console.log('\n✅ Все пароли и manager_id обновлены!');
    console.log('\nТеперь можно войти:');
    console.log('- admin@wink.ru / 123456');
    console.log('- hr@wink.ru / 123456');
    console.log('- manager@wink.ru / 123456');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit();
  }
}

fixPasswords();
