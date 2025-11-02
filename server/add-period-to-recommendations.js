// Миграция: добавляем period_id в таблицы рекомендаций
const { query } = require('./database');

async function addPeriodToRecommendations() {
  try {
    console.log('🔧 Добавляем колонку period_id в employee_recommendations...');
    
    // Проверяем, существует ли колонка period_id
    const checkEmployeeCol = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employee_recommendations' AND column_name = 'period_id'
    `);
    
    if (checkEmployeeCol.rows.length === 0) {
      await query(`
        ALTER TABLE employee_recommendations 
        ADD COLUMN period_id INTEGER REFERENCES employee_review_periods(id) ON DELETE CASCADE
      `);
      console.log('✅ Колонка period_id добавлена в employee_recommendations');
    } else {
      console.log('ℹ️  Колонка period_id уже существует в employee_recommendations');
    }

    console.log('🔧 Добавляем колонку period_id в manager_recommendations...');
    
    const checkManagerCol = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'manager_recommendations' AND column_name = 'period_id'
    `);
    
    if (checkManagerCol.rows.length === 0) {
      await query(`
        ALTER TABLE manager_recommendations 
        ADD COLUMN period_id INTEGER REFERENCES employee_review_periods(id) ON DELETE CASCADE
      `);
      console.log('✅ Колонка period_id добавлена в manager_recommendations');
    } else {
      console.log('ℹ️  Колонка period_id уже существует в manager_recommendations');
    }

    console.log('🎉 Миграция успешно завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  }
}

addPeriodToRecommendations();
