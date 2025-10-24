const { query } = require('./database');

async function fixDuplicateCycles() {
  try {
    console.log('Исправление дублирующихся циклов...');

    // Получаем все циклы
    const cyclesResult = await query('SELECT * FROM review_cycles ORDER BY id');
    console.log('\nТекущие циклы:');
    cyclesResult.rows.forEach(cycle => {
      console.log(`  ID: ${cycle.id}, Название: ${cycle.name}, Статус: ${cycle.status}`);
    });

    // Удаляем цикл с ID=1 (дубликат годовой оценки)
    await query('DELETE FROM review_cycles WHERE id = 1');
    console.log('\n✅ Удален дубликат цикла (ID=1)');

    // Обновляем цикл ID=3 на квартальную оценку
    await query(`
      UPDATE review_cycles 
      SET 
        name = 'Квартальная оценка Q1 2025 (01.01.2025 - 31.03.2025)',
        start_date = '2025-01-01',
        end_date = '2025-03-31'
      WHERE id = 3
    `);
    console.log('✅ Обновлен цикл ID=3 на квартальную оценку');

    // Проверяем результат
    const updatedCycles = await query('SELECT * FROM review_cycles ORDER BY id');
    console.log('\n📋 Обновленные циклы:');
    updatedCycles.rows.forEach(cycle => {
      console.log(`  ${cycle.id}. ${cycle.name} [${cycle.status}]`);
      console.log(`     Период: ${cycle.start_date.toISOString().split('T')[0]} - ${cycle.end_date.toISOString().split('T')[0]}`);
    });

    console.log('\n✅ Циклы успешно исправлены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

fixDuplicateCycles();
