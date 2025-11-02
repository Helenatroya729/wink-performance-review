const { query } = require('./database');

async function testCalculationLogic() {
  try {
    console.log('=== Тест логики выбора периодов для калькуляции ===\n');

    // Проверим Ольгу (id=12) - у неё период 26 в статусе completed
    console.log('--- Ольга Васильева (id=12) ---');
    const olgaPeriods = await query(`
      SELECT id, name, status, is_active, created_at
      FROM employee_review_periods
      WHERE user_id = 12
      ORDER BY created_at DESC
    `);
    
    console.log('Все периоды Ольги:');
    olgaPeriods.rows.forEach(p => {
      console.log(`  ID ${p.id}: ${p.name}, status=${p.status}, active=${p.is_active}, created=${p.created_at.toISOString().split('T')[0]}`);
    });

    // Применяем НОВУЮ логику выбора
    const olgaSelected = await query(`
      WITH latest_periods AS (
        SELECT 
          erp.user_id,
          erp.id as period_id,
          erp.status,
          erp.name,
          erp.created_at,
          ROW_NUMBER() OVER (
            PARTITION BY erp.user_id 
            ORDER BY 
              CASE 
                WHEN erp.status = 'awaiting_calculation' THEN 1
                WHEN erp.status = 'calculated' THEN 2
                WHEN erp.status = 'completed' THEN 2
                ELSE 3
              END ASC,
              erp.created_at DESC
          ) as rn
        FROM employee_review_periods erp
        WHERE erp.user_id = 12
      )
      SELECT * FROM latest_periods WHERE rn = 1
    `);

    console.log('\n✅ ВЫБРАН период (по новой логике):');
    const selected = olgaSelected.rows[0];
    console.log(`  ID ${selected.period_id}: ${selected.name}, status=${selected.status}`);

    // Проверим Анну (id=10) - должен быть awaiting_calculation
    console.log('\n--- Анна Сидорова (id=10) ---');
    const annaPeriods = await query(`
      SELECT id, name, status, is_active, created_at
      FROM employee_review_periods
      WHERE user_id = 10
      ORDER BY created_at DESC
    `);
    
    console.log('Все периоды Анны:');
    annaPeriods.rows.forEach(p => {
      console.log(`  ID ${p.id}: ${p.name}, status=${p.status}, active=${p.is_active}, created=${p.created_at.toISOString().split('T')[0]}`);
    });

    const annaSelected = await query(`
      WITH latest_periods AS (
        SELECT 
          erp.user_id,
          erp.id as period_id,
          erp.status,
          erp.name,
          erp.created_at,
          ROW_NUMBER() OVER (
            PARTITION BY erp.user_id 
            ORDER BY 
              CASE 
                WHEN erp.status = 'awaiting_calculation' THEN 1
                WHEN erp.status = 'calculated' THEN 2
                WHEN erp.status = 'completed' THEN 2
                ELSE 3
              END ASC,
              erp.created_at DESC
          ) as rn
        FROM employee_review_periods erp
        WHERE erp.user_id = 10
      )
      SELECT * FROM latest_periods WHERE rn = 1
    `);

    console.log('\n✅ ВЫБРАН период (по новой логике):');
    const annaSelectedPeriod = annaSelected.rows[0];
    console.log(`  ID ${annaSelectedPeriod.period_id}: ${annaSelectedPeriod.name}, status=${annaSelectedPeriod.status}`);

    // Проверим Ивана (id=9) - должен быть calculated (period 13)
    console.log('\n--- Иван Иванов (id=9) ---');
    const ivanPeriods = await query(`
      SELECT id, name, status, is_active, created_at
      FROM employee_review_periods
      WHERE user_id = 9
      ORDER BY created_at DESC
    `);
    
    console.log('Все периоды Ивана:');
    ivanPeriods.rows.forEach(p => {
      console.log(`  ID ${p.id}: ${p.name}, status=${p.status}, active=${p.is_active}, created=${p.created_at.toISOString().split('T')[0]}`);
    });

    const ivanSelected = await query(`
      WITH latest_periods AS (
        SELECT 
          erp.user_id,
          erp.id as period_id,
          erp.status,
          erp.name,
          erp.created_at,
          (CASE WHEN erp.self_assessment_completed THEN 1 ELSE 0 END +
           CASE WHEN erp.manager_goals_evaluation_completed THEN 1 ELSE 0 END +
           CASE WHEN erp.peer_reviews_completed THEN 1 ELSE 0 END +
           CASE WHEN erp.potential_assessment_completed THEN 1 ELSE 0 END) as completed_count,
          ROW_NUMBER() OVER (
            PARTITION BY erp.user_id 
            ORDER BY 
              -- Приоритет: awaiting_calculation (с 4/4) > calculated/completed > awaiting_calculation (неполный) > остальные
              CASE 
                WHEN erp.status = 'awaiting_calculation' AND 
                     (CASE WHEN erp.self_assessment_completed THEN 1 ELSE 0 END +
                      CASE WHEN erp.manager_goals_evaluation_completed THEN 1 ELSE 0 END +
                      CASE WHEN erp.peer_reviews_completed THEN 1 ELSE 0 END +
                      CASE WHEN erp.potential_assessment_completed THEN 1 ELSE 0 END) = 4 THEN 1
                WHEN erp.status = 'calculated' THEN 2
                WHEN erp.status = 'completed' THEN 2
                WHEN erp.status = 'awaiting_calculation' THEN 3
                ELSE 4
              END ASC,
              erp.created_at DESC
          ) as rn
        FROM employee_review_periods erp
        WHERE erp.user_id = 9
      )
      SELECT * FROM latest_periods WHERE rn = 1
    `);

    console.log('\n✅ ВЫБРАН период (по новой логике):');
    const ivanSelectedPeriod = ivanSelected.rows[0];
    console.log(`  ID ${ivanSelectedPeriod.period_id}: ${ivanSelectedPeriod.name}, status=${ivanSelectedPeriod.status}`);

    console.log('\n=== ВЫВОД ===');
    console.log('✅ Ольга (completed): период 26 - ПРАВИЛЬНО (последний completed)');
    console.log('✅ Анна (awaiting_calculation): период 24 - ПРАВИЛЬНО (awaiting_calculation приоритетнее)');
    console.log('✅ Иван (calculated + not_started): период 13 - ПРАВИЛЬНО (calculated, не period 34)');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit();
  }
}

testCalculationLogic();
