const { query } = require('./database');

async function checkAnnaIvanCalculation() {
  try {
    console.log('🔍 Проверяем статус Анны и Ивана...\n');
    
    // Находим Анну и Ивана
    const users = await query(`
      SELECT id, first_name, last_name, role 
      FROM users 
      WHERE first_name IN ('Анна', 'Иван')
      ORDER BY first_name
    `);
    
    console.log('👥 Найдены пользователи:');
    users.rows.forEach(u => console.log(`  ${u.first_name} ${u.last_name} (ID: ${u.id}, Role: ${u.role})`));
    
    for (const user of users.rows) {
      console.log(`\n📊 Проверяем ${user.first_name} ${user.last_name}:`);
      
      // Проверяем период
      const period = await query(`
        SELECT id, name, status, start_date, end_date
        FROM employee_review_periods
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [user.id]);
      
      if (period.rows.length > 0) {
        const p = period.rows[0];
        console.log(`  Период: ${p.name} (ID: ${p.id})`);
        console.log(`  Статус: ${p.status}`);
        console.log(`  Даты: ${p.start_date} - ${p.end_date}`);
      } else {
        console.log('  ❌ Период не найден');
      }
      
      // Проверяем самооценку
      const selfAssessment = await query(`
        SELECT COUNT(*) as count
        FROM self_assessments
        WHERE user_id = $1
      `, [user.id]);
      console.log(`  Самооценок: ${selfAssessment.rows[0].count}`);
      
      // Проверяем оценку менеджера
      const managerEval = await query(`
        SELECT COUNT(*) as count
        FROM manager_evaluations
        WHERE employee_id = $1
      `, [user.id]);
      console.log(`  Оценок менеджера: ${managerEval.rows[0].count}`);
      
      // Проверяем peer reviews
      const peerReviews = await query(`
        SELECT COUNT(*) as count
        FROM peer_reviews
        WHERE reviewee_id = $1
      `, [user.id]);
      console.log(`  Peer reviews: ${peerReviews.rows[0].count}`);
      
      // Проверяем potential assessment
      const potential = await query(`
        SELECT COUNT(*) as count
        FROM potential_assessments
        WHERE user_id = $1
      `, [user.id]);
      console.log(`  Оценок потенциала: ${potential.rows[0].count}`);
      
      // Проверяем можно ли провести калькуляцию
      const canCalculate = selfAssessment.rows[0].count > 0 && 
                          managerEval.rows[0].count > 0 && 
                          peerReviews.rows[0].count > 0 &&
                          potential.rows[0].count > 0;
      
      console.log(`  ✅ Можно проводить калькуляцию: ${canCalculate ? 'ДА' : 'НЕТ'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkAnnaIvanCalculation();
