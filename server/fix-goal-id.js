const { query } = require('./database');

async function fixGoalIdConstraint() {
  try {
    // Проверяем constraint
    const constraints = await query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'manager_evaluations' AND constraint_name LIKE '%goal%'
    `);
    
    console.log('📋 Constraints на goal_id:', constraints.rows);
    
    // Делаем goal_id nullable
    console.log('\n🔧 Делаю goal_id nullable...');
    await query(`
      ALTER TABLE manager_evaluations 
      ALTER COLUMN goal_id DROP NOT NULL
    `);
    
    console.log('✅ goal_id теперь может быть NULL');
    
    // Проверяем текущую структуру
    const columns = await query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'manager_evaluations' AND column_name = 'goal_id'
    `);
    
    console.log('\n📊 Новая структура goal_id:', columns.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

fixGoalIdConstraint();
