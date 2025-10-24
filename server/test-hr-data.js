const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function checkData() {
  const client = await pool.connect();
  try {
    // Проверяем пользователей
    const users = await client.query(`
      SELECT id, first_name, last_name, role 
      FROM users 
      WHERE is_active = true AND role NOT IN ('hr', 'admin')
      ORDER BY id
    `);
    
    console.log('\n👥 Пользователи (не HR/Admin):');
    users.rows.forEach(u => {
      console.log(`  ${u.id}. ${u.first_name} ${u.last_name} (${u.role})`);
    });
    
    // Проверяем manager_evaluations
    const managerEvals = await client.query(`
      SELECT 
        me.id, 
        me.employee_id, 
        u.first_name, 
        u.last_name,
        me.professional_qualities_score,
        me.personal_qualities_score,
        me.performance_total
      FROM manager_evaluations me
      JOIN users u ON me.employee_id = u.id
    `);
    
    console.log('\n📊 Manager Evaluations:');
    if (managerEvals.rows.length === 0) {
      console.log('  ❌ Нет данных!');
    } else {
      managerEvals.rows.forEach(me => {
        console.log(`  ${me.first_name} ${me.last_name}: prof=${me.professional_qualities_score}, pers=${me.personal_qualities_score}, perf_total=${me.performance_total}`);
      });
    }
    
    // Проверяем potential_assessments
    const potentialAssess = await client.query(`
      SELECT 
        pa.id,
        pa.employee_id,
        u.first_name,
        u.last_name,
        pa.performance_score,
        pa.potential_score,
        pa.box_position
      FROM potential_assessments pa
      JOIN users u ON pa.employee_id = u.id
    `);
    
    console.log('\n🌟 Potential Assessments:');
    if (potentialAssess.rows.length === 0) {
      console.log('  ❌ Нет данных!');
    } else {
      potentialAssess.rows.forEach(pa => {
        console.log(`  ${pa.first_name} ${pa.last_name}: performance=${pa.performance_score}, potential=${pa.potential_score}, box=${pa.box_position}`);
      });
    }
    
    // Проверяем self_assessments
    const selfAssess = await client.query('SELECT COUNT(*) FROM self_assessments');
    console.log(`\n📝 Self Assessments: ${selfAssess.rows[0].count} записей`);
    
    // Проверяем peer_responses
    const peerResp = await client.query('SELECT COUNT(*) FROM peer_responses');
    console.log(`👥 Peer Responses: ${peerResp.rows[0].count} записей`);
    
    // Теперь выполним тот же запрос, что использует API
    console.log('\n\n🔍 Тестируем запрос API для employee-scores:\n');
    const apiResult = await client.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COALESCE(AVG(sa.answer_score), 0) as self_score,
        COALESCE(me.performance_total, 0) as manager_score,
        COALESCE(AVG(pr.answer_score), 0) as peer_score
      FROM users u
      LEFT JOIN self_assessments sa ON u.id = sa.user_id
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id
      LEFT JOIN peer_reviews pr ON u.id = pr.employee_id
      WHERE u.is_active = true AND u.role NOT IN ('hr', 'admin')
      GROUP BY u.id, u.first_name, u.last_name, me.performance_total
      ORDER BY u.last_name, u.first_name
      LIMIT 50
    `);
    
    console.log('Результаты API запроса:');
    if (apiResult.rows.length === 0) {
      console.log('  ❌ Запрос вернул 0 строк!');
    } else {
      apiResult.rows.forEach(row => {
        console.log(`  ${row.name}: self=${row.self_score}, manager=${row.manager_score}, peer=${row.peer_score}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();
