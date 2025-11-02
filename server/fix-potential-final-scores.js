const { query } = require('./database');

async function fixPotentialFinalScores() {
  try {
    console.log('=== Исправление potential_final_score ===\n');
    
    // Находим все записи, где potential_final_score не соответствует potential_raw_score
    const records = await query(`
      SELECT id, employee_id, potential_raw_score, potential_final_score
      FROM potential_assessments
      WHERE potential_final_score != potential_raw_score
      ORDER BY id
    `);

    console.log(`Найдено записей для исправления: ${records.rows.length}\n`);

    if (records.rows.length === 0) {
      console.log('✅ Все записи уже корректны!');
      process.exit(0);
    }

    // Показываем, что будет исправлено
    console.log('Записи, которые будут исправлены:');
    records.rows.forEach(row => {
      console.log(`  ID ${row.id} (employee_id ${row.employee_id}): ${row.potential_final_score} → ${row.potential_raw_score}`);
    });

    console.log('\n🔄 Начинаем исправление...\n');

    // Обновляем записи
    const updateResult = await query(`
      UPDATE potential_assessments
      SET potential_final_score = potential_raw_score
      WHERE potential_final_score != potential_raw_score
    `);

    console.log(`✅ Обновлено записей: ${updateResult.rowCount}`);

    // Проверяем результат
    console.log('\n=== Проверка результатов ===\n');
    const verification = await query(`
      SELECT id, employee_id, potential_raw_score, potential_final_score
      FROM potential_assessments
      WHERE id IN (${records.rows.map(r => r.id).join(',')})
      ORDER BY id
    `);

    verification.rows.forEach(row => {
      const status = row.potential_final_score === row.potential_raw_score ? '✅' : '❌';
      console.log(`${status} ID ${row.id}: raw=${row.potential_raw_score}, final=${row.potential_final_score}`);
    });

    console.log('\n✅ Исправление завершено!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit();
  }
}

fixPotentialFinalScores();
