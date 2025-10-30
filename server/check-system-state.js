const { query } = require('./database');

async function checkSystemState() {
  try {
    console.log('🔍 Проверка состояния системы после изменений...\n');
    
    // 1. Проверяем структуру employee_review_periods
    console.log('📊 Поля завершения в employee_review_periods:');
    const fields = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employee_review_periods'
      AND column_name LIKE '%completed%'
      ORDER BY ordinal_position
    `);
    fields.rows.forEach(f => console.log(`  ✓ ${f.column_name}`));
    
    // 2. Проверяем статус Ивана
    console.log('\n📋 Статус периода Ивана (user_id=9):');
    const ivanPeriod = await query(`
      SELECT 
        id,
        user_id,
        cycle_id,
        status,
        self_assessment_completed,
        peer_reviews_completed,
        manager_goals_evaluation_completed,
        potential_assessment_completed
      FROM employee_review_periods
      WHERE user_id = 9 AND status = 'in_progress'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (ivanPeriod.rows.length > 0) {
      const p = ivanPeriod.rows[0];
      console.log(`  Period ID: ${p.id}`);
      console.log(`  Cycle ID: ${p.cycle_id}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Self Assessment: ${p.self_assessment_completed ? '✅' : '❌'}`);
      console.log(`  Peer Reviews: ${p.peer_reviews_completed ? '✅' : '❌'}`);
      console.log(`  Manager Goals Evaluation: ${p.manager_goals_evaluation_completed ? '✅' : '❌'}`);
      console.log(`  Potential Assessment: ${p.potential_assessment_completed ? '✅' : '❌'}`);
    } else {
      console.log('  ❌ Период не найден');
    }
    
    // 3. Проверяем оценки потенциала
    console.log('\n📈 Оценки потенциала в базе:');
    const assessments = await query(`
      SELECT 
        pa.id,
        pa.employee_id,
        u.first_name,
        u.last_name,
        pa.cycle_id,
        pa.performance_raw_score,
        pa.performance_final_score,
        pa.potential_raw_score,
        pa.potential_final_score,
        pa.created_at
      FROM potential_assessments pa
      JOIN users u ON pa.employee_id = u.id
      ORDER BY pa.created_at DESC
    `);
    
    if (assessments.rows.length > 0) {
      console.log(`  Всего оценок: ${assessments.rows.length}`);
      assessments.rows.forEach(a => {
        console.log(`\n  📝 ${a.first_name} ${a.last_name} (user_id=${a.employee_id}, cycle_id=${a.cycle_id})`);
        console.log(`     Результативность: ${a.performance_raw_score} баллов → ${a.performance_final_score}★`);
        console.log(`     Потенциал: ${a.potential_raw_score} баллов → ${a.potential_final_score}★`);
        console.log(`     Создано: ${new Date(a.created_at).toLocaleString('ru-RU')}`);
      });
    } else {
      console.log('  ℹ️  Пока нет оценок потенциала');
    }
    
    // 4. Проверяем кто готов к оценке потенциала
    console.log('\n🎯 Сотрудники готовые к оценке потенциала:');
    const ready = await query(`
      SELECT 
        erp.id as period_id,
        erp.user_id,
        u.first_name,
        u.last_name,
        erp.cycle_id
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.status = 'in_progress'
        AND erp.self_assessment_completed = true
        AND erp.peer_reviews_completed = true
        AND erp.manager_goals_evaluation_completed = true
        AND erp.potential_assessment_completed = false
      ORDER BY u.last_name
    `);
    
    if (ready.rows.length > 0) {
      console.log(`  Готовы к оценке: ${ready.rows.length} человек(а)`);
      ready.rows.forEach(r => {
        console.log(`    - ${r.first_name} ${r.last_name} (period_id=${r.period_id}, cycle_id=${r.cycle_id})`);
      });
    } else {
      console.log('  ✅ Все оценки потенциала завершены!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkSystemState();
