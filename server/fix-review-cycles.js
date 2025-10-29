const { query } = require('./database.js');

async function fixReviewCycles() {
  try {
    console.log('🔧 Исправление циклов оценки...\n');
    
    // Обновляем существующие циклы (не удаляем, чтобы не нарушить внешние ключи)
    await query(`
      UPDATE review_cycles SET
        name = 'Полугодие 1 - 2025',
        start_date = '2025-01-01',
        end_date = '2025-06-30',
        status = 'active'
      WHERE id = 1
    `);
    console.log('✅ Цикл 1 обновлен');
    
    await query(`
      UPDATE review_cycles SET
        name = 'Полугодие 2 - 2025',
        start_date = '2025-07-01',
        end_date = '2025-12-31',
        status = 'active'
      WHERE id = 2
    `);
    console.log('✅ Цикл 2 обновлен');
    
    // Проверяем результат
    const result = await query('SELECT id, name, start_date, end_date, status FROM review_cycles ORDER BY start_date');
    
    console.log('\n📊 Обновленные циклы оценки:\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Период: ${new Date(row.start_date).toLocaleDateString('ru-RU')} - ${new Date(row.end_date).toLocaleDateString('ru-RU')}`);
      console.log(`   Статус: ${row.status}`);
      console.log('');
    });
    
    console.log('✅ Циклы оценки успешно обновлены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

fixReviewCycles();
