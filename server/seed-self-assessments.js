const { pool } = require('./database');

async function addSelfAssessments() {
  try {
    console.log('🔍 Проверяем структуру self_assessments...');
    
    // Проверяем структуру таблицы
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'self_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Колонки таблицы:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Получаем всех активных сотрудников
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name 
      FROM users 
      WHERE is_active = true AND role IN ('employee', 'manager')
      ORDER BY id
    `);
    
    console.log(`\n👥 Найдено ${usersResult.rows.length} сотрудников`);
    
    // Получаем активный цикл оценки
    const cycleResult = await pool.query(`
      SELECT id FROM review_cycles 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (cycleResult.rows.length === 0) {
      console.error('❌ Нет активного цикла оценки');
      return;
    }
    
    const cycleId = cycleResult.rows[0].id;
    console.log(`📅 Используем цикл ID: ${cycleId}`);
    
    let insertCount = 0;
    
    // Для каждого сотрудника создаем самооценки (5 вопросов)
    for (const user of usersResult.rows) {
      console.log(`\n📝 Добавляем самооценку для: ${user.first_name} ${user.last_name}`);
      
      // Генерируем 5 ответов с баллами 3-4 (хорошая самооценка)
      for (let questionId = 1; questionId <= 5; questionId++) {
        const score = Math.floor(Math.random() * 2) + 3; // 3-4 балла
        
        try {
          await pool.query(`
            INSERT INTO self_assessments (
              user_id, 
              cycle_id, 
              task_id,
              question_id, 
              answer_score
            ) VALUES ($1, $2, 1, $3, $4)
            ON CONFLICT DO NOTHING
          `, [user.id, cycleId, questionId, score]);
          
          insertCount++;
          console.log(`  ✅ Вопрос ${questionId}: ${score} балла`);
        } catch (err) {
          console.error(`  ⚠️ Ошибка для вопроса ${questionId}:`, err.message);
        }
      }
    }
    
    console.log(`\n✅ Добавлено ${insertCount} записей самооценки`);
    
    // Проверяем результат
    const checkResult = await pool.query(`
      SELECT 
        u.first_name, 
        u.last_name, 
        AVG(sa.answer_score) as avg_score,
        COUNT(*) as answer_count
      FROM self_assessments sa
      JOIN users u ON sa.user_id = u.id
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY u.last_name
    `);
    
    console.log('\n📊 Проверка самооценок:');
    checkResult.rows.forEach(row => {
      console.log(`  ${row.first_name} ${row.last_name}: ${row.avg_score.toFixed(2)} (${row.answer_count} ответов)`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

addSelfAssessments();
