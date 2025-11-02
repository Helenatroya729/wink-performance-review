const { query } = require('./database');

async function checkPotentialAssessments() {
  try {
    console.log('🔍 Проверяем структуру таблицы potential_assessments...\n');
    
    // Проверяем структуру таблицы
    const structure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'potential_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы potential_assessments:');
    console.log(JSON.stringify(structure.rows, null, 2));
    
    // Проверяем данные в таблице
    const result = await query(`
      SELECT 
        pa.*,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name
      FROM potential_assessments pa
      LEFT JOIN users u ON pa.employee_id = u.id
      ORDER BY pa.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📊 Последние оценки потенциала:');
    if (result.rows.length === 0) {
      console.log('❌ Нет данных в таблице potential_assessments');
    } else {
      console.log(JSON.stringify(result.rows, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPotentialAssessments();
