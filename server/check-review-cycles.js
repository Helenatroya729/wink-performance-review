const { query } = require('./database.js');

async function checkReviewCycles() {
  try {
    const result = await query('SELECT id, name, start_date, end_date, status FROM review_cycles ORDER BY start_date');
    
    console.log('\n📊 Циклы оценки (review_cycles):\n');
    if (result.rows.length === 0) {
      console.log('❌ Нет данных в таблице review_cycles');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.name}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Период: ${new Date(row.start_date).toLocaleDateString('ru-RU')} - ${new Date(row.end_date).toLocaleDateString('ru-RU')}`);
        console.log(`   Статус: ${row.status}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkReviewCycles();
