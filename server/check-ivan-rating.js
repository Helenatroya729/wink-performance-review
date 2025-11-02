const { query } = require('./database');

async function checkIvanRating() {
  try {
    const userId = 9; // Иван

    console.log('=== Проверка рейтинга Ивана (ID=9) ===\n');

    // Оценка менеджера
    const mgrResult = await query(`
      SELECT performance_total 
      FROM manager_evaluations 
      WHERE employee_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);
    const mgrScore = mgrResult.rows[0]?.performance_total || 0;
    console.log('Оценка менеджера (performance_total):', mgrScore);

    // Самооценка
    const selfResult = await query(`
      SELECT AVG(answer_score) * 2 as self_score 
      FROM self_assessments 
      WHERE user_id = $1
    `, [userId]);
    const selfScore = parseFloat(selfResult.rows[0]?.self_score || 0);
    console.log('Самооценка (avg * 2):', selfScore.toFixed(2));

    // Оценка коллег
    const peerResult = await query(`
      SELECT AVG(answer_score) * 2 as peer_score 
      FROM peer_reviews 
      WHERE employee_id = $1
    `, [userId]);
    const peerScore = parseFloat(peerResult.rows[0]?.peer_score || 0);
    console.log('Оценка коллег (avg * 2):', peerScore.toFixed(2));

    // Потенциал
    const potResult = await query(`
      SELECT potential_final_score 
      FROM potential_assessments 
      WHERE employee_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);
    const potScore = parseFloat(potResult.rows[0]?.potential_final_score || 0);
    console.log('Потенциал (final_score * 5):', (potScore * 5).toFixed(2));

    // Итоговый балл (среднее из всех ненулевых оценок)
    const scores = [mgrScore, selfScore, peerScore, potScore * 5].filter(x => x > 0);
    const totalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    console.log('\n--- ИТОГ ---');
    console.log('Ненулевые оценки:', scores);
    console.log('ИТОГОВЫЙ БАЛЛ (среднее):', totalScore.toFixed(2));
    console.log('\n--- ТЕКУЩИЙ ENDPOINT ВОЗВРАЩАЕТ ---');
    console.log('score:', mgrScore.toFixed(1), '(только manager_evaluations.performance_total)');
    console.log('label:', mgrScore > 0 ? 'Есть данные' : 'Нет данных');

    console.log('\n--- ДОЛЖЕН ВОЗВРАЩАТЬ ---');
    console.log('score:', totalScore.toFixed(1), '(среднее из всех оценок)');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit();
  }
}

checkIvanRating();
