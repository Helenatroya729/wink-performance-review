const { query } = require('./database.js');

async function checkUserPeriods() {
  try {
    // Проверяем пользователя employee@wink.ru (ID обычно 11)
    const userResult = await query(`
      SELECT id, first_name, last_name, email, hire_date 
      FROM users 
      WHERE email = 'employee@wink.ru'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь employee@wink.ru не найден');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log('\n👤 Пользователь:', user.first_name, user.last_name);
    console.log('   Email:', user.email);
    console.log('   ID:', user.id);
    console.log('   Дата найма:', user.hire_date || 'Не указана');
    
    // Проверяем периоды
    const periodsResult = await query(`
      SELECT * FROM employee_review_periods 
      WHERE user_id = $1
      ORDER BY start_date DESC
    `, [user.id]);
    
    console.log('\n📅 Периоды оценки:');
    if (periodsResult.rows.length === 0) {
      console.log('   ❌ Нет периодов для этого пользователя!');
    } else {
      periodsResult.rows.forEach(period => {
        console.log(`\n   - ${period.name}`);
        console.log(`     ID: ${period.id}`);
        console.log(`     Даты: ${new Date(period.start_date).toLocaleDateString('ru-RU')} - ${new Date(period.end_date).toLocaleDateString('ru-RU')}`);
        console.log(`     Активен: ${period.is_active}`);
      });
    }
    
    // Проверяем статусы PR
    const statusResult = await query(`
      SELECT * FROM performance_review_status 
      WHERE user_id = $1
    `, [user.id]);
    
    console.log('\n🔄 Статусы Performance Review:');
    if (statusResult.rows.length === 0) {
      console.log('   ❌ Нет статусов для этого пользователя!');
    } else {
      statusResult.rows.forEach(status => {
        console.log(`   - Period ID: ${status.period_id}, Status: ${status.status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkUserPeriods();
