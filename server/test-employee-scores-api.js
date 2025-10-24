const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function testEmployeeScoresQuery() {
  const client = await pool.connect();
  try {
    console.log('\n🔍 Выполняем точный запрос из API /api/hr/employee-scores:\n');
    
    const result = await client.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COALESCE(AVG(sa.answer_score), 0) as self_score,
        COALESCE(MAX(me.performance_total), 0) as manager_score,
        COALESCE(AVG(pr.answer_score), 0) as peer_score
      FROM users u
      LEFT JOIN self_assessments sa ON u.id = sa.user_id
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id
      LEFT JOIN peer_reviews pr ON u.id = pr.employee_id
      WHERE u.is_active = true AND u.role NOT IN ('hr', 'admin')
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY u.last_name, u.first_name
      LIMIT 50
    `);
    
    console.log(`Найдено строк: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ ЗАПРОС ВЕРНУЛ 0 СТРОК!');
      
      // Проверим, есть ли вообще активные пользователи
      const usersCheck = await client.query(`
        SELECT COUNT(*) FROM users WHERE is_active = true AND role NOT IN ('hr', 'admin')
      `);
      console.log(`\nПроверка: активных пользователей (не HR/admin): ${usersCheck.rows[0].count}`);
      
    } else {
      console.log('✅ Данные получены! Вот что будет отправлено фронтенду:\n');
      
      const scores = result.rows.map(row => {
        const selfScore = parseFloat(row.self_score) || 0;
        const managerScore = parseFloat(row.manager_score) || 0;
        const peerScore = parseFloat(row.peer_score) || 0;
        
        const total = (selfScore + managerScore + peerScore) / 3;

        return {
          id: row.id,
          name: row.name,
          selfScore: selfScore,
          managerScore: managerScore,
          peerScore: parseFloat(peerScore.toFixed(1)),
          total: parseFloat(total.toFixed(2))
        };
      });
      
      console.log(JSON.stringify(scores, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

testEmployeeScoresQuery();
