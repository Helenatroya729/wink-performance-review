const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: 'admin'
});

async function updateAllPasswords() {
  try {
    console.log('🔧 Обновление всех паролей на 123456...\n');

    // Хешируем новый пароль
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Получаем всех пользователей
    const usersResult = await pool.query('SELECT id, email, first_name, last_name, role FROM users ORDER BY id');
    
    console.log(`📋 Найдено пользователей: ${usersResult.rows.length}\n`);

    // Обновляем пароль для каждого пользователя
    for (const user of usersResult.rows) {
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );

      console.log(`✅ ${user.first_name} ${user.last_name} (${user.email}) - роль: ${user.role}`);
    }

    console.log('\n✅ Все пароли успешно обновлены на: 123456');
    console.log('\n📝 Список пользователей для входа:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const adminUsers = usersResult.rows.filter(u => u.role === 'admin');
    const hrUsers = usersResult.rows.filter(u => u.role === 'hr');
    const managerUsers = usersResult.rows.filter(u => u.role === 'manager');
    const employeeUsers = usersResult.rows.filter(u => u.role === 'employee');

    if (adminUsers.length > 0) {
      console.log('\n👑 АДМИНИСТРАТОРЫ:');
      adminUsers.forEach(u => {
        console.log(`   ${u.first_name} ${u.last_name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Пароль: 123456\n`);
      });
    }

    if (hrUsers.length > 0) {
      console.log('👔 HR МЕНЕДЖЕРЫ:');
      hrUsers.forEach(u => {
        console.log(`   ${u.first_name} ${u.last_name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Пароль: 123456\n`);
      });
    }

    if (managerUsers.length > 0) {
      console.log('📊 РУКОВОДИТЕЛИ:');
      managerUsers.forEach(u => {
        console.log(`   ${u.first_name} ${u.last_name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Пароль: 123456\n`);
      });
    }

    if (employeeUsers.length > 0) {
      console.log('👥 СОТРУДНИКИ:');
      employeeUsers.forEach(u => {
        console.log(`   ${u.first_name} ${u.last_name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Пароль: 123456\n`);
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Ошибка при обновлении паролей:', error);
  } finally {
    await pool.end();
  }
}

updateAllPasswords();
