const { query } = require('./database');

async function testPeerFeedbackEndpoint() {
  try {
    console.log('🔍 Тестируем данные для эндпоинта peer feedback...\n');
    
    const employeeId = 9; // Иван Иванов
    
    // Получаем peer feedback (из peer_reviews)
    const peerFeedbackResult = await query(`
      SELECT 
        pr.id,
        pr.employee_id,
        pr.respondent_id,
        pr.question_id,
        pr.answer_score,
        pr.answer_text,
        pr.created_at as submitted_at,
        CONCAT(u.first_name, ' ', u.last_name) as reviewer_name,
        prq.question_text
      FROM peer_reviews pr
      LEFT JOIN users u ON pr.respondent_id = u.id
      LEFT JOIN peer_review_questions prq ON pr.question_id = prq.id
      WHERE pr.employee_id = $1
      ORDER BY pr.respondent_id, prq.display_order
    `, [employeeId]);

    console.log('📊 Все отзывы для Ивана:');
    console.log(JSON.stringify(peerFeedbackResult.rows, null, 2));

    // Группируем отзывы по respondent_id
    const groupedFeedbacks = {};
    peerFeedbackResult.rows.forEach(row => {
      if (!groupedFeedbacks[row.respondent_id]) {
        groupedFeedbacks[row.respondent_id] = {
          id: row.id,
          reviewer_name: row.reviewer_name || 'Анонимно',
          submitted_at: row.submitted_at,
          reviews: [],
          total_score: 0
        };
      }
      groupedFeedbacks[row.respondent_id].reviews.push({
        question_text: row.question_text,
        answer_score: row.answer_score,
        answer_text: row.answer_text
      });
    });

    // Рассчитываем средние баллы
    const formattedFeedbacks = Object.values(groupedFeedbacks).map(feedback => {
      const avgScore = feedback.reviews.length > 0
        ? feedback.reviews.reduce((sum, r) => sum + (r.answer_score || 0), 0) / feedback.reviews.length
        : 0;
      
      const totalScore = parseFloat((avgScore * 2).toFixed(1));
      
      return {
        id: feedback.id,
        reviewer_name: feedback.reviewer_name,
        submitted_at: feedback.submitted_at,
        result_achievement_rating: feedback.reviews[0]?.answer_score ? feedback.reviews[0].answer_score * 2 : 0,
        personal_qualities_comment: feedback.reviews[2]?.answer_text || feedback.reviews[1]?.answer_text || 'Не указано',
        interaction_quality_rating: feedback.reviews[1]?.answer_score ? feedback.reviews[1].answer_score * 2 : 0,
        improvement_suggestions: feedback.reviews[3]?.answer_text || feedback.reviews[feedback.reviews.length - 1]?.answer_text || 'Не указано',
        total_score: totalScore,
        all_reviews: feedback.reviews
      };
    });

    console.log('\n✅ Отформатированные данные:');
    console.log(JSON.stringify(formattedFeedbacks, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

testPeerFeedbackEndpoint();
