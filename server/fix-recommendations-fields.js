const { query } = require('./database');

async function fixRecommendations() {
  try {
    console.log('🔧 Начинаем исправление полей рекомендаций...');
    
    // Получаем все рекомендации, где improvements и development_plan пустые, но achievements заполнен
    const wrongRecs = await query(`
      SELECT id, employee_id, achievements, period_id
      FROM employee_recommendations 
      WHERE achievements IS NOT NULL 
        AND (improvements IS NULL OR development_plan IS NULL)
        AND LENGTH(achievements) > 500
    `);
    
    console.log(`📊 Найдено записей с неправильным форматом: ${wrongRecs.rows.length}`);
    
    for (const rec of wrongRecs.rows) {
      const fullText = rec.achievements;
      
      // Пытаемся разделить текст на три части по ключевым фразам
      let achievements = '';
      let improvements = '';
      let developmentPlan = '';
      
      // Ищем маркеры разделов
      const improvementsMatch = fullText.match(/Области для улучшения[^\n]*:\n\n([\s\S]*?)(?=\n\n[А-Я1-9]|$)/);
      const developmentMatch = fullText.match(/(?:План развития|РАЗВИТИЕ СИЛЬНЫХ СТОРОН|1\. РАЗВИТИЕ СИЛЬНЫХ СТОРОН)[^\n]*\n([\s\S]*)/);
      
      if (improvementsMatch) {
        // Есть явный раздел "Области для улучшения"
        achievements = fullText.substring(0, fullText.indexOf(improvementsMatch[0])).trim();
        improvements = improvementsMatch[1].trim();
        
        if (developmentMatch) {
          improvements = fullText.substring(
            fullText.indexOf(improvementsMatch[0]) + improvementsMatch[0].length,
            fullText.indexOf(developmentMatch[0])
          ).trim();
          developmentPlan = developmentMatch[1].trim();
        } else {
          // Если нет явного раздела развития, всё остальное - это улучшения
          improvements = fullText.substring(fullText.indexOf(improvementsMatch[0]) + improvementsMatch[0].length).trim();
        }
      } else {
        // Нет явных разделов, оставляем как есть
        achievements = fullText;
      }
      
      console.log(`\n  ID ${rec.id}, employee_id=${rec.employee_id}, period_id=${rec.period_id}:`);
      console.log(`    - achievements: ${achievements.substring(0, 100)}...`);
      console.log(`    - improvements: ${improvements ? improvements.substring(0, 100) + '...' : 'НЕТ'}`);
      console.log(`    - development_plan: ${developmentPlan ? developmentPlan.substring(0, 100) + '...' : 'НЕТ'}`);
      
      // Обновляем запись
      await query(`
        UPDATE employee_recommendations 
        SET 
          achievements = $1,
          improvements = $2,
          development_plan = $3
        WHERE id = $4
      `, [achievements, improvements, developmentPlan, rec.id]);
    }
    
    console.log('\n✅ Все рекомендации исправлены!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

fixRecommendations();
