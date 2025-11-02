const { query } = require('./database');

async function fixPotentialScores() {
  try {
    console.log('🔧 Начинаем исправление оценок потенциала...');
    
    // Получаем все записи с неправильными значениями potential_final_score
    const wrongScores = await query(`
      SELECT id, employee_id, potential_raw_score, potential_final_score 
      FROM potential_assessments 
      WHERE potential_final_score > 2
    `);
    
    console.log(`📊 Найдено записей с неправильными значениями: ${wrongScores.rows.length}`);
    
    for (const row of wrongScores.rows) {
      // Пересчитываем правильное значение на основе raw_score
      let correctFinalScore = 0;
      if (row.potential_raw_score >= 8) {
        correctFinalScore = 2;
      } else if (row.potential_raw_score >= 1) {
        correctFinalScore = 1;
      } else {
        correctFinalScore = 0;
      }
      
      console.log(`  ID ${row.id}, employee_id=${row.employee_id}: ${row.potential_final_score} → ${correctFinalScore} (raw=${row.potential_raw_score})`);
      
      // Обновляем запись
      await query(`
        UPDATE potential_assessments 
        SET potential_final_score = $1 
        WHERE id = $2
      `, [correctFinalScore, row.id]);
    }
    
    console.log('✅ Все оценки потенциала исправлены!');
    
    // Проверяем результат
    const check = await query(`
      SELECT id, employee_id, potential_raw_score, potential_final_score 
      FROM potential_assessments 
      ORDER BY id
    `);
    
    console.log('\n📋 Финальное состояние всех оценок потенциала:');
    check.rows.forEach(r => {
      console.log(`  ID ${r.id}, employee_id=${r.employee_id}: raw=${r.potential_raw_score}, final=${r.potential_final_score} (${r.potential_final_score}★)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

fixPotentialScores();
