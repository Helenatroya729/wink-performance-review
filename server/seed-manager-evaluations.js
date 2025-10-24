const { Client } = require('pg');

async function seedManagerEvaluations() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'wink_performance_review',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    const cycleId = 2; // "Первое полугодие 2025"
    const managerId = 7; // Кирилл Менеджеров

    // Удаляем старые оценки
    await client.query('DELETE FROM manager_evaluations WHERE cycle_id = 2 AND manager_id = 7');
    console.log('🗑️ Старые оценки менеджера удалены\n');

    // Создаем оценки для формирования матрицы 9-box
    const evaluations = [
      // ЗВЕЗДЫ - высокая эффективность (performance_total: 8-10)
      {
        employeeId: 10, // Анна Сидорова
        performanceTotal: 9, // Высокая эффективность
        potentialTotal: 9,
        professionalQualitiesScore: 5,
        personalQualitiesScore: 4, // макс 4
        communicationWithColleagues: true,
        employeeDevelopmentWillingness: true,
        considersAsSuccessor: true,
        developmentReadiness: '1-2_years',
        turnoverRiskScore: 1,
        resultAchievementRating: 10,
        interactionQualityRating: 10,
        overallRating: 10,
        feedbackSummary: 'Отличный сотрудник с высоким потенциалом роста'
      },

      // КЛЮЧЕВЫЕ ИГРОКИ - высокая эффективность + средний потенциал
      {
        employeeId: 9, // Иван Иванов
        performanceTotal: 8,
        potentialTotal: 6,
        professionalQualitiesScore: 5,
        personalQualitiesScore: 4,
        communicationWithColleagues: true,
        employeeDevelopmentWillingness: true,
        considersAsSuccessor: false,
        developmentReadiness: '3_years',
        turnoverRiskScore: 2,
        resultAchievementRating: 8,
        interactionQualityRating: 7,
        overallRating: 8,
        feedbackSummary: 'Стабильные высокие результаты'
      },
      {
        employeeId: 11, // Петр Петров
        performanceTotal: 7,
        potentialTotal: 6,
        professionalQualitiesScore: 4,
        personalQualitiesScore: 4,
        communicationWithColleagues: true,
        employeeDevelopmentWillingness: false,
        considersAsSuccessor: false,
        developmentReadiness: '3_years',
        turnoverRiskScore: 2,
        resultAchievementRating: 7,
        interactionQualityRating: 7,
        overallRating: 7,
        feedbackSummary: 'Надежный специалист'
      },

      // СТАБИЛЬНЫЕ - средняя эффективность + средний потенциал
      {
        employeeId: 12, // Ольга Васильева
        performanceTotal: 5,
        potentialTotal: 5,
        professionalQualitiesScore: 3,
        personalQualitiesScore: 3,
        communicationWithColleagues: false,
        employeeDevelopmentWillingness: true,
        considersAsSuccessor: false,
        developmentReadiness: '3+_years',
        turnoverRiskScore: 3,
        resultAchievementRating: 5,
        interactionQualityRating: 5,
        overallRating: 5,
        feedbackSummary: 'Средние результаты, есть потенциал'
      },

      // РИСК - низкая эффективность + низкий потенциал
      {
        employeeId: 13, // Дмитрий Смирнов
        performanceTotal: 3,
        potentialTotal: 2,
        professionalQualitiesScore: 2,
        personalQualitiesScore: 2,
        communicationWithColleagues: false,
        employeeDevelopmentWillingness: false,
        considersAsSuccessor: false,
        developmentReadiness: 'not_ready',
        turnoverRiskScore: 5,
        resultAchievementRating: 3,
        interactionQualityRating: 3,
        overallRating: 3,
        feedbackSummary: 'Требует значительного развития'
      }
    ];

    console.log('📝 Создаю оценки менеджера...\n');

    for (const evalData of evaluations) {
      await client.query(`
        INSERT INTO manager_evaluations (
          employee_id, manager_id, cycle_id,
          professional_qualities_score, personal_qualities_score,
          communication_with_colleagues, employee_development_willingness,
          considers_as_successor, development_readiness, turnover_risk_score,
          performance_total, potential_total,
          result_achievement_rating, interaction_quality_rating,
          overall_rating, feedback_summary,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        evalData.employeeId,
        managerId,
        cycleId,
        evalData.professionalQualitiesScore,
        evalData.personalQualitiesScore,
        evalData.communicationWithColleagues,
        evalData.employeeDevelopmentWillingness,
        evalData.considersAsSuccessor,
        evalData.developmentReadiness,
        evalData.turnoverRiskScore,
        evalData.performanceTotal,
        evalData.potentialTotal,
        evalData.resultAchievementRating,
        evalData.interactionQualityRating,
        evalData.overallRating,
        evalData.feedbackSummary
      ]);

      const empResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [evalData.employeeId]
      );
      const emp = empResult.rows[0];

      console.log(`✅ ${emp.first_name} ${emp.last_name}: Performance=${evalData.performanceTotal}, Potential=${evalData.potentialTotal}`);
    }

    console.log('\n✅ Оценки менеджера созданы!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

seedManagerEvaluations().catch(console.error);
