const { query } = require('./database');

async function fixCyclesEncoding() {
  try {
    console.log('Исправление кодировки названий циклов...');
    
    // Обновляем названия существующих циклов
    await query(
      `UPDATE review_cycles SET name = $1 WHERE id = 1`,
      ['Годовая оценка 2025 (01.01.2025 - 31.03.2025)']
    );
    console.log('✅ Обновлен цикл 1');
    
    await query(
      `UPDATE review_cycles SET name = $1, status = $2 WHERE id = 2`,
      ['Полугодовая оценка 2025 (01.01.2025 - 30.06.2025)', 'active']
    );
    console.log('✅ Обновлен цикл 2');
    
    await query(
      `UPDATE review_cycles SET name = $1 WHERE id = 3`,
      ['Годовая оценка 2025 (01.01.2025 - 31.03.2025)']
    );
    console.log('✅ Обновлен цикл 3');
    
    // Проверим результат
    const result = await query('SELECT id, name, status FROM review_cycles ORDER BY id');
    console.log('\n📋 Текущие циклы:');
    result.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.name} [${row.status}]`);
    });
    
    console.log('\n✅ Все циклы успешно обновлены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

fixCyclesEncoding();
