const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: 'admin'
});

async function removeDuplicateEvaluations() {
  try {
    console.log('🧹 Удаление дубликатов оценок...\n');

    // Удаляем дубликаты из manager_evaluations, оставляя только самую свежую оценку для каждого сотрудника
    console.log('📋 Проверка дубликатов в manager_evaluations:');
    const managerDupsCheck = await pool.query(`
      SELECT employee_id, COUNT(*) as count
      FROM manager_evaluations
      GROUP BY employee_id
      HAVING COUNT(*) > 1
    `);

    if (managerDupsCheck.rows.length > 0) {
      console.log(`⚠️  Найдено ${managerDupsCheck.rows.length} сотрудников с дубликатами оценок менеджера\n`);
      
      for (const dup of managerDupsCheck.rows) {
        console.log(`Сотрудник ID ${dup.employee_id}: ${dup.count} оценок`);
        
        // Оставляем только самую последнюю оценку (с максимальным created_at)
        const result = await pool.query(`
          DELETE FROM manager_evaluations
          WHERE employee_id = $1
            AND id NOT IN (
              SELECT id FROM manager_evaluations
              WHERE employee_id = $1
              ORDER BY created_at DESC
              LIMIT 1
            )
          RETURNING id
        `, [dup.employee_id]);
        
        console.log(`  ✅ Удалено ${result.rowCount} дубликатов`);
      }
    } else {
      console.log('✅ Дубликатов в manager_evaluations не найдено');
    }

    // Удаляем дубликаты из potential_assessments
    console.log('\n📋 Проверка дубликатов в potential_assessments:');
    const potentialDupsCheck = await pool.query(`
      SELECT employee_id, COUNT(*) as count
      FROM potential_assessments
      GROUP BY employee_id
      HAVING COUNT(*) > 1
    `);

    if (potentialDupsCheck.rows.length > 0) {
      console.log(`⚠️  Найдено ${potentialDupsCheck.rows.length} сотрудников с дубликатами оценок потенциала\n`);
      
      for (const dup of potentialDupsCheck.rows) {
        console.log(`Сотрудник ID ${dup.employee_id}: ${dup.count} оценок`);
        
        const result = await pool.query(`
          DELETE FROM potential_assessments
          WHERE employee_id = $1
            AND id NOT IN (
              SELECT id FROM potential_assessments
              WHERE employee_id = $1
              ORDER BY created_at DESC
              LIMIT 1
            )
          RETURNING id
        `, [dup.employee_id]);
        
        console.log(`  ✅ Удалено ${result.rowCount} дубликатов`);
      }
    } else {
      console.log('✅ Дубликатов в potential_assessments не найдено');
    }

    // Показываем итоговую статистику
    console.log('\n📊 Итоговая статистика после очистки:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const finalStats = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        me.performance_total,
        pa.growth_mindset_score,
        CASE 
          WHEN me.performance_total >= 7 THEN 3
          WHEN me.performance_total >= 4 THEN 2
          ELSE 1
        END as performance_level,
        CASE 
          WHEN pa.growth_mindset_score >= 8 THEN 3
          WHEN pa.growth_mindset_score >= 5 THEN 2
          ELSE 1
        END as potential_level
      FROM users u
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id
      LEFT JOIN potential_assessments pa ON u.id = pa.employee_id
      WHERE me.performance_total IS NOT NULL AND pa.growth_mindset_score IS NOT NULL
      ORDER BY u.last_name, u.first_name
    `);

    finalStats.rows.forEach(row => {
      const perfLabel = row.performance_level === 3 ? 'Высокий' : row.performance_level === 2 ? 'Средний' : 'Низкий';
      const potLabel = row.potential_level === 3 ? 'Высокий' : row.potential_level === 2 ? 'Средний' : 'Низкий';
      console.log(`${row.first_name} ${row.last_name}: Performance=${row.performance_total} (${perfLabel}), Potential=${row.growth_mindset_score} (${potLabel})`);
    });

    console.log('\n✅ Очистка завершена!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

removeDuplicateEvaluations();
