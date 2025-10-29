const { query } = require('./database.js');

async function checkUsersDates() {
  try {
    // Проверяем структуру таблицы users
    const columnsResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы users:\n');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Получаем сотрудников
    const usersResult = await query(`
      SELECT id, first_name, last_name, role, created_at 
      FROM users 
      WHERE role IN ('employee', 'manager') 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\n👥 Сотрудники:\n');
    usersResult.rows.forEach(u => {
      console.log(`${u.id}. ${u.first_name} ${u.last_name} (${u.role})`);
      console.log(`   Создан: ${new Date(u.created_at).toLocaleDateString('ru-RU')}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkUsersDates();
