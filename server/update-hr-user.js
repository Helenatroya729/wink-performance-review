const pool = require('./database');

async function updateHRUser() {
  try {
    console.log('\n🔄 Обновление HR пользователя...\n');
    
    // Обновляем HR пользователя
    await pool.query(`
      UPDATE users 
      SET 
        first_name = 'Ольга',
        last_name = 'Соколова',
        email = 'hr@wink.ru',
        position = 'HR Менеджер'
      WHERE role = 'hr'
    `);
    
    console.log('✅ HR пользователь обновлен: Ольга Соколова (hr@wink.ru)');
    
    // Показываем всех пользователей
    const users = await pool.query(`
      SELECT id, first_name, last_name, email, role, position
      FROM users
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'hr' THEN 2
          WHEN 'manager' THEN 3
          WHEN 'employee' THEN 4
        END,
        last_name
    `);
    
    console.log('\n📋 Все пользователи в системе:');
    console.log('='.repeat(80));
    
    users.rows.forEach(u => {
      const roleLabel = {
        'admin': 'Администратор',
        'hr': 'HR',
        'manager': 'Руководитель',
        'employee': 'Сотрудник'
      }[u.role];
      
      console.log(`${roleLabel.padEnd(15)} | ${(u.first_name + ' ' + u.last_name).padEnd(25)} | ${u.email.padEnd(25)} | ${u.position || ''}`);
    });
    
    console.log('='.repeat(80));
    console.log('\n✅ Готово!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

updateHRUser();
