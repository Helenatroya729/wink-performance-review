const { pool } = require('./database');

async function createDiverseData() {
  try {
    console.log('🎭 Создаем разнообразные данные для Performance Review...\n');
    
    // Получаем всех сотрудников
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name, email
      FROM users 
      WHERE role IN ('employee', 'manager')
      ORDER BY id
    `);
    
    const users = usersResult.rows;
    console.log(`👥 Найдено ${users.length} сотрудников\n`);
    
    // Очистим старые данные
    console.log('🧹 Очищаем старые данные...');
    await pool.query('DELETE FROM self_assessments');
    await pool.query('DELETE FROM manager_evaluations WHERE employee_id IN (SELECT id FROM users WHERE role IN (\'employee\', \'manager\'))');
    await pool.query('DELETE FROM peer_reviews');
    await pool.query('DELETE FROM potential_assessments WHERE employee_id IN (SELECT id FROM users WHERE role IN (\'employee\', \'manager\'))');
    console.log('✅ Данные очищены\n');
    
    const cycleId = 2; // Текущий цикл
    
    // Разделим сотрудников на группы:
    // 1. Завершили все этапы (3 человека)
    // 2. В процессе - только самооценка (3 человека)
    // 3. В процессе - самооценка + оценка менеджера (2 человека)
    // 4. Не начали (1 человек)
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n📝 ${user.first_name} ${user.last_name}:`);
      
      if (i < 3) {
        // ЗАВЕРШИЛИ ВСЕ: самооценка + оценка менеджера + потенциал
        console.log('  ✅ Статус: ЗАВЕРШЕНО');
        
        // Самооценка (5 вопросов, 3-5 баллов)
        for (let q = 1; q <= 5; q++) {
          const score = Math.floor(Math.random() * 3) + 3;
          await pool.query(`
            INSERT INTO self_assessments (user_id, cycle_id, task_id, question_id, answer_score)
            VALUES ($1, $2, 1, $3, $4)
          `, [user.id, cycleId, q, score]);
        }
        console.log('    ✓ Самооценка: 5/5');
        
        // Оценка менеджера
        const perfScore = Math.floor(Math.random() * 3) + 2; // 2-4 из 5
        const profQuality = Math.floor(Math.random() * 2) + 3; // 3-4 из 5
        const persQuality = Math.floor(Math.random() * 2) + 3; // 3-4 из 4
        const performanceTotal = perfScore * 2; // Пересчитываем в шкалу 1-10
        const potentialTotal = (profQuality + persQuality);
        
        await pool.query(`
          INSERT INTO manager_evaluations (
            employee_id, manager_id, cycle_id,
            professional_qualities_score, personal_qualities_score,
            performance_total, potential_total
          ) VALUES ($1, 3, $2, $3, $4, $5, $6)
        `, [user.id, cycleId, profQuality, persQuality, performanceTotal, potentialTotal]);
        console.log('    ✓ Оценка менеджера: выполнена');
        
        // Оценка потенциала
        const potentialScore = Math.floor(Math.random() * 3) + 6; // 6-8 из 10
        const performanceScore = Math.floor(Math.random() * 3) + 6; // 6-8 из 10
        
        let boxPosition;
        if (potentialScore >= 7 && performanceScore >= 7) {
          boxPosition = 'high_potential_high_performance';
        } else if (potentialScore >= 7) {
          boxPosition = 'high_potential_medium_performance';
        } else if (performanceScore >= 7) {
          boxPosition = 'medium_potential_high_performance';
        } else {
          boxPosition = 'medium_potential_medium_performance';
        }
        
        await pool.query(`
          INSERT INTO potential_assessments (
            employee_id, manager_id, cycle_id,
            potential_score, performance_score,
            box_position, readiness_timeframe
          ) VALUES ($1, 3, $2, $3, $4, $5, '1-2_years')
        `, [user.id, cycleId, potentialScore, performanceScore, boxPosition]);
        console.log('    ✓ Оценка потенциала: выполнена');
        
        /* Оценки коллег отключены из-за foreign key
        // Оценка коллег (3 оценки от разных коллег)
        for (let p = 0; p < 3; p++) {
          for (let q = 1; q <= 3; q++) {
            const score = Math.floor(Math.random() * 2) + 3; // 3-4 балла
            await pool.query(`
              INSERT INTO peer_reviews (
                employee_id, respondent_id, cycle_id, task_id, question_id, answer_score
              ) VALUES ($1, $2, $3, 1, $4, $5)
            `, [user.id, users[(i + p + 1) % users.length].id, cycleId, q, score]);
          }
        }
        console.log('    ✓ Оценка коллег: 3 отзыва');
        */
        
      } else if (i < 6) {
        // В ПРОЦЕССЕ: только самооценка
        console.log('  🟡 Статус: В ПРОЦЕССЕ (только самооценка)');
        
        for (let q = 1; q <= 5; q++) {
          const score = Math.floor(Math.random() * 3) + 3;
          await pool.query(`
            INSERT INTO self_assessments (user_id, cycle_id, task_id, question_id, answer_score)
            VALUES ($1, $2, 1, $3, $4)
          `, [user.id, cycleId, q, score]);
        }
        console.log('    ✓ Самооценка: 5/5');
        console.log('    ⏳ Ожидает: оценка менеджера, коллег');
        
      } else if (i < 8) {
        // В ПРОЦЕССЕ: самооценка + оценка менеджера
        console.log('  🟡 Статус: В ПРОЦЕССЕ (самооценка + менеджер)');
        
        // Самооценка
        for (let q = 1; q <= 5; q++) {
          const score = Math.floor(Math.random() * 3) + 3;
          await pool.query(`
            INSERT INTO self_assessments (user_id, cycle_id, task_id, question_id, answer_score)
            VALUES ($1, $2, 1, $3, $4)
          `, [user.id, cycleId, q, score]);
        }
        console.log('    ✓ Самооценка: 5/5');
        
        // Оценка менеджера
        const perfScore = Math.floor(Math.random() * 3) + 2;
        const profQuality = Math.floor(Math.random() * 2) + 3;
        const persQuality = Math.floor(Math.random() * 2) + 3;
        const performanceTotal = perfScore * 2;
        const potentialTotal = (profQuality + persQuality);
        
        await pool.query(`
          INSERT INTO manager_evaluations (
            employee_id, manager_id, cycle_id,
            professional_qualities_score, personal_qualities_score,
            performance_total, potential_total
          ) VALUES ($1, 3, $2, $3, $4, $5, $6)
        `, [user.id, cycleId, profQuality, persQuality, performanceTotal, potentialTotal]);
        console.log('    ✓ Оценка менеджера: выполнена');
        console.log('    ⏳ Ожидает: оценка потенциала, коллег');
        
      } else {
        // НЕ НАЧАТО
        console.log('  🔴 Статус: НЕ НАЧАТО');
        console.log('    ⏳ Ожидает: все этапы оценки');
      }
    }
    
    console.log('\n✅ Данные успешно созданы!\n');
    
    // Проверка
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT sa.user_id) as with_self,
        COUNT(DISTINCT me.employee_id) as with_manager,
        COUNT(DISTINCT pr.employee_id) as with_peer,
        COUNT(DISTINCT pa.employee_id) as with_potential
      FROM users u
      LEFT JOIN self_assessments sa ON u.id = sa.user_id
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id
      LEFT JOIN peer_reviews pr ON u.id = pr.employee_id
      LEFT JOIN potential_assessments pa ON u.id = pa.employee_id
      WHERE u.role IN ('employee', 'manager')
    `);
    
    console.log('📊 Итоговая статистика:');
    console.log(`  С самооценкой: ${stats.rows[0].with_self} чел.`);
    console.log(`  С оценкой менеджера: ${stats.rows[0].with_manager} чел.`);
    console.log(`  С оценкой коллег: ${stats.rows[0].with_peer} чел.`);
    console.log(`  С оценкой потенциала: ${stats.rows[0].with_potential} чел.`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

createDiverseData();
