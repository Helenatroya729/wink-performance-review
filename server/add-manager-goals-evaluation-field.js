const { query } = require('./database');

async function addManagerEvaluationField() {
  try {
    console.log('\n📋 Добавляем поле manager_goals_evaluation_completed...\n');
    
    // Проверяем, существует ли уже поле
    const checkField = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'employee_review_periods'
        AND column_name = 'manager_goals_evaluation_completed'
    `);
    
    if (checkField.rows.length > 0) {
      console.log('✅ Поле manager_goals_evaluation_completed уже существует');
      process.exit(0);
    }
    
    // Добавляем поле
    await query(`
      ALTER TABLE employee_review_periods
      ADD COLUMN manager_goals_evaluation_completed BOOLEAN DEFAULT false,
      ADD COLUMN manager_goals_evaluation_completed_at TIMESTAMP
    `);
    
    console.log('✅ Поле manager_goals_evaluation_completed добавлено');
    console.log('✅ Поле manager_goals_evaluation_completed_at добавлено');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

addManagerEvaluationField();
