const { query } = require('./database');

async function addPotentialCompletedField() {
  try {
    console.log('🔄 Добавление поля potential_assessment_completed...\n');
    
    // Проверяем, существует ли уже это поле
    const checkField = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employee_review_periods' 
      AND column_name = 'potential_assessment_completed'
    `);
    
    if (checkField.rows.length > 0) {
      console.log('✅ Поле potential_assessment_completed уже существует');
    } else {
      console.log('📝 Добавляю поле potential_assessment_completed...');
      await query(`
        ALTER TABLE employee_review_periods 
        ADD COLUMN potential_assessment_completed BOOLEAN DEFAULT false
      `);
      console.log('✅ Поле добавлено!');
    }
    
    // Проверяем текущую структуру
    const structure = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employee_review_periods'
      AND column_name LIKE '%completed%'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Поля статуса завершения:');
    structure.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
    });
    
    // Проверяем данные для Ивана
    const ivanData = await query(`
      SELECT 
        id,
        user_id,
        self_assessment_completed,
        peer_reviews_completed,
        manager_goals_evaluation_completed,
        potential_assessment_completed,
        status
      FROM employee_review_periods
      WHERE user_id = 9 AND status = 'in_progress'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (ivanData.rows.length > 0) {
      console.log('\n📋 Текущий статус периода Ивана (period_id=' + ivanData.rows[0].id + ')');
      console.log('  Self Assessment:', ivanData.rows[0].self_assessment_completed ? '✅' : '❌');
      console.log('  Peer Reviews:', ivanData.rows[0].peer_reviews_completed ? '✅' : '❌');
      console.log('  Manager Goals Evaluation:', ivanData.rows[0].manager_goals_evaluation_completed ? '✅' : '❌');
      console.log('  Potential Assessment:', ivanData.rows[0].potential_assessment_completed ? '✅' : '❌');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

addPotentialCompletedField();
