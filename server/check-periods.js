const { query } = require('./database.js');

async function checkPeriods() {
  try {
    const result = await query('SELECT id, name, start_date, end_date, is_active FROM review_periods ORDER BY start_date');
    
    console.log('\n📅 Периоды оценки в базе данных:\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Период: ${new Date(row.start_date).toLocaleDateString('ru-RU')} - ${new Date(row.end_date).toLocaleDateString('ru-RU')}`);
      console.log(`   Активный: ${row.is_active ? 'Да' : 'Нет'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

checkPeriods();
