const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function testCalculationEndpoint() {
  console.log('\n=== Тест расчета для Ивана (ID=9) ===\n');

  try {
    const id = 9; // Иван

    // 1. Самооценка (шкала 2-10)
    const selfResult = await pool.query(`
      SELECT answer_score
      FROM self_assessments
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [id]);
    
    const selfScore = selfResult.rows.length > 0
      ? (selfResult.rows.reduce((sum, r) => sum + r.answer_score, 0) / selfResult.rows.length * 2)
      : 0;

    // 2. Оценка менеджера (шкала 0-10)
    const managerResult = await pool.query(`
      SELECT performance_total
      FROM manager_evaluations
      WHERE employee_id = $1
        AND performance_total IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);
    const managerScore = managerResult.rows.length > 0 ? parseFloat(managerResult.rows[0].performance_total) : 0;

    // 3. Оценка коллег (шкала 2-10)
    const peerResult = await pool.query(`
      SELECT answer_score
      FROM peer_reviews
      WHERE employee_id = $1
    `, [id]);
    
    const peerScore = peerResult.rows.length > 0
      ? (peerResult.rows.reduce((sum, r) => sum + r.answer_score, 0) / peerResult.rows.length * 2)
      : 0;

    // 4. Потенциал (шкала 0-10, БЕЗ умножения)
    const potentialResult = await pool.query(`
      SELECT potential_final_score
      FROM potential_assessments
      WHERE employee_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);
    
    let potentialScore = 0;
    if (potentialResult.rows.length > 0 && potentialResult.rows[0].potential_final_score !== null) {
      potentialScore = potentialResult.rows[0].potential_final_score; // Уже в шкале 0-10
    }

    console.log('📊 РЕЗУЛЬТАТЫ:\n');
    console.log(`  Самооценка: ${selfScore.toFixed(2)}`);
    console.log(`  Оценка руководителя: ${managerScore.toFixed(2)}`);
    console.log(`  Оценки коллег: ${peerScore.toFixed(2)}`);
    console.log(`  Оценка потенциала: ${potentialScore.toFixed(2)}`);
    console.log('');

    // Расчет итогового балла
    let totalScore = 0;
    let evaluationsCount = 0;

    if (selfScore > 0) {
      totalScore += selfScore;
      evaluationsCount++;
    }
    if (managerScore > 0) {
      totalScore += managerScore;
      evaluationsCount++;
    }
    if (peerScore > 0) {
      totalScore += peerScore;
      evaluationsCount++;
    }
    if (potentialScore > 0) {
      totalScore += potentialScore;
      evaluationsCount++;
    }

    totalScore = evaluationsCount > 0 ? totalScore / evaluationsCount : 0;

    console.log('🧮 РАСЧЕТ:\n');
    console.log(`  Формула: (${selfScore.toFixed(2)} + ${managerScore.toFixed(2)} + ${peerScore.toFixed(2)} + ${potentialScore.toFixed(2)}) / ${evaluationsCount} = ${totalScore.toFixed(2)}`);
    console.log('');
    console.log(`  ✅ Итоговый балл: ${totalScore.toFixed(2)} из 10`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

testCalculationEndpoint();
