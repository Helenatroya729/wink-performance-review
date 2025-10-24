const { pool } = require('./database');

async function seedSimpleSelfAssessments() {
  try {
    console.log('📝 Добавляем простые самооценки (без привязки к вопросам)...');
    
    // Получаем всех активных сотрудников
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name 
      FROM users 
      WHERE role IN ('employee', 'manager')
      ORDER BY id
    `);
    
    console.log(`👥 Найдено ${usersResult.rows.length} сотрудников`);
    
    // Получаем последний цикл
    const cycleResult = await pool.query(`
      SELECT id FROM review_cycles 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const cycleId = cycleResult.rows[0].id;
    console.log(`📅 Цикл ID: ${cycleId}\n`);
    
    // Временно удаляем foreign key constraint
    await pool.query(`
      ALTER TABLE self_assessments 
      DROP CONSTRAINT IF EXISTS self_assessments_question_id_fkey
    `);
    console.log('✅ Foreign key constraint удален\n');
    
    let insertCount = 0;
    
    // Для каждого сотрудника
    for (const user of usersResult.rows) {
      console.log(`📝 ${user.first_name} ${user.last_name}:`);
      
      // Создаем 5 ответов с баллами 3-5
      for (let questionId = 1; questionId <= 5; questionId++) {
        const score = Math.floor(Math.random() * 3) + 3; // 3-5 баллов
        
        await pool.query(`
          INSERT INTO self_assessments (
            user_id, 
            cycle_id, 
            task_id,
            question_id, 
            answer_score
          ) VALUES ($1, $2, 1, $3, $4)
        `, [user.id, cycleId, questionId, score]);
        
        insertCount++;
      }
      
      console.log(`  ✅ Добавлено 5 ответов`);
    }
    
    console.log(`\n✅ Всего добавлено ${insertCount} записей\n`);
    
    // Проверяем результат
    const checkResult = await pool.query(`
      SELECT 
        u.first_name, 
        u.last_name, 
        AVG(sa.answer_score)::numeric(10,2) as avg_score,
        COUNT(*) as answer_count
      FROM self_assessments sa
      JOIN users u ON sa.user_id = u.id
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY u.last_name
    `);
    
    console.log('📊 Средние баллы самооценки:');
    checkResult.rows.forEach(row => {
      console.log(`  ${row.first_name} ${row.last_name}: ${row.avg_score} (${row.answer_count} ответов)`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

seedSimpleSelfAssessments();
