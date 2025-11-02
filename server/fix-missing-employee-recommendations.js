const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function fixMissingEmployeeRecommendations() {
  console.log('\n=== Исправление отсутствующих employee_recommendations ===\n');

  try {
    // Найдем все completed периоды, у которых есть manager_recommendations, но нет employee_recommendations
    const periodsWithoutEmpRec = await pool.query(`
      SELECT 
        p.id as period_id,
        p.user_id,
        p.name as period_name,
        u.first_name || ' ' || u.last_name as employee_name,
        mr.recommendations as manager_rec
      FROM employee_review_periods p
      JOIN users u ON u.id = p.user_id
      JOIN manager_recommendations mr ON mr.period_id = p.id AND mr.employee_id = p.user_id
      LEFT JOIN employee_recommendations er ON er.period_id = p.id AND er.employee_id = p.user_id
      WHERE p.status = 'completed'
        AND er.id IS NULL
      ORDER BY p.id
    `);

    console.log(`Найдено периодов без employee_recommendations: ${periodsWithoutEmpRec.rows.length}\n`);

    if (periodsWithoutEmpRec.rows.length === 0) {
      console.log('✅ Все completed периоды уже имеют employee_recommendations');
      return;
    }

    for (const period of periodsWithoutEmpRec.rows) {
      console.log(`\nПериод ${period.period_id}: ${period.period_name}`);
      console.log(`  Сотрудник: ${period.employee_name} (ID: ${period.user_id})`);
      
      // Создаем базовые рекомендации на основе manager_recommendations
      // Разделяем текст на примерные части
      const managerText = period.manager_rec || '';
      
      // Простое разделение: первая треть - достижения, вторая - улучшения, третья - план
      const textLength = managerText.length;
      const thirdLength = Math.floor(textLength / 3);
      
      const achievements = managerText.substring(0, thirdLength) || 'Достижения будут добавлены позже.';
      const improvements = managerText.substring(thirdLength, thirdLength * 2) || 'Области для улучшения будут добавлены позже.';
      const developmentPlan = managerText.substring(thirdLength * 2) || 'План развития будет добавлен позже.';

      // Создаем запись в employee_recommendations
      await pool.query(`
        INSERT INTO employee_recommendations (period_id, employee_id, achievements, improvements, development_plan, sent_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [period.period_id, period.user_id, achievements, improvements, developmentPlan]);

      console.log(`  ✅ Создана employee_recommendations`);
    }

    console.log(`\n✅ Обработано ${periodsWithoutEmpRec.rows.length} периодов`);
    console.log(`\nℹ️  ВАЖНО: Созданные рекомендации являются временными и разделены автоматически.`);
    console.log(`   Рекомендуется отредактировать их в интерфейсе калькуляции.`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixMissingEmployeeRecommendations();
