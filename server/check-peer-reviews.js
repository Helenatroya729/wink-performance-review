const { query } = require('./database');

async function checkPeerReviews() {
  try {
    console.log('🔍 Проверяем peer reviews в базе данных...\n');
    
    // Проверяем структуру таблицы
    const structure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'peer_reviews'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы peer_reviews:');
    console.log(JSON.stringify(structure.rows, null, 2));
    
    // Проверяем данные для сотрудников команды Кирилла
    const result = await query(`
      SELECT 
        pr.id,
        pr.employee_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        pr.respondent_id,
        CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_name,
        pr.question_id,
        prq.question_text,
        pr.answer_score,
        pr.answer_text,
        pr.created_at
      FROM peer_reviews pr
      LEFT JOIN users u ON pr.employee_id = u.id
      LEFT JOIN users reviewer ON pr.respondent_id = reviewer.id
      LEFT JOIN peer_review_questions prq ON pr.question_id = prq.id
      WHERE pr.employee_id IN (9, 10, 11)
      ORDER BY pr.employee_id, pr.created_at DESC
      LIMIT 20
    `);
    
    console.log('\n📊 Peer reviews для команды:');
    if (result.rows.length === 0) {
      console.log('❌ Нет данных в таблице peer_reviews');
    } else {
      console.log(JSON.stringify(result.rows, null, 2));
      
      // Рассчитаем средний балл для каждого сотрудника
      const scores = {};
      result.rows.forEach(row => {
        if (!scores[row.employee_id]) {
          scores[row.employee_id] = { name: row.employee_name, sum: 0, count: 0 };
        }
        if (row.answer_score !== null && row.answer_score !== undefined) {
          scores[row.employee_id].sum += parseFloat(row.answer_score);
          scores[row.employee_id].count++;
        }
      });
      
      console.log('\n📈 Средние баллы:');
      Object.keys(scores).forEach(empId => {
        const data = scores[empId];
        const avgScore = data.count > 0 ? (data.sum / data.count * 2).toFixed(2) : 0;
        console.log(`  ${data.name}: ${avgScore}/10 (из ${data.count} отзывов)`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPeerReviews();
