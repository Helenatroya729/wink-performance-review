const { query } = require('./database');

async function checkPotentialIssue() {
  try {
    // Проверяем структуру таблицы
    console.log('=== Структура таблицы potential_assessments ===');
    const structure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'potential_assessments' 
      ORDER BY ordinal_position
    `);
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });

    // Получаем user_id для периода 26
    const periodData = await query('SELECT user_id FROM employee_review_periods WHERE id = 26');
    const userId = periodData.rows[0].user_id;
    console.log(`\n=== Данные для пользователя ${userId} (период 26) ===`);

    // Проверяем все оценки потенциала для этого пользователя
    const potentials = await query(`
      SELECT id, employee_id, cycle_id, potential_raw_score, potential_final_score, created_at
      FROM potential_assessments 
      WHERE employee_id = $1 
      ORDER BY id DESC
    `, [userId]);

    console.log(`\nНайдено оценок потенциала: ${potentials.rows.length}`);
    potentials.rows.forEach(row => {
      console.log(`\nID: ${row.id}`);
      console.log(`  employee_id: ${row.employee_id}`);
      console.log(`  cycle_id: ${row.cycle_id}`);
      console.log(`  potential_raw_score: ${row.potential_raw_score}`);
      console.log(`  potential_final_score: ${row.potential_final_score}`);
      console.log(`  created_at: ${row.created_at}`);
    });

    // Проверяем данные периода 26
    console.log('\n=== Данные периода 26 ===');
    const period = await query('SELECT * FROM employee_review_periods WHERE id = 26');
    console.log(`Период: ${period.rows[0].name}`);
    console.log(`Статус: ${period.rows[0].status}`);
    console.log(`Цикл: ${period.rows[0].cycle_id}`);

    // Проверяем, какие данные используются для расчета потенциала
    console.log('\n=== Данные для расчета 9-бокс (endpoint /api/hr/nine-box) ===');
    const nineBoxData = await query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        p.cycle_id,
        p.potential_raw_score,
        p.potential_final_score,
        erp.id as period_id,
        erp.status as period_status
      FROM users u
      LEFT JOIN potential_assessments p ON u.id = p.employee_id
      LEFT JOIN employee_review_periods erp ON u.id = erp.user_id AND erp.cycle_id = p.cycle_id
      WHERE u.id = $1
      ORDER BY p.id DESC
      LIMIT 1
    `, [userId]);

    if (nineBoxData.rows.length > 0) {
      console.log('Данные для 9-бокс:');
      console.log(JSON.stringify(nineBoxData.rows[0], null, 2));
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    process.exit();
  }
}

checkPotentialIssue();
