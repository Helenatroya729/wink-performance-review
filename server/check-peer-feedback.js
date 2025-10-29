const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: '12345'
});

async function checkPeerFeedback() {
  try {
    console.log('\n=== ЗАПРОСЫ PEER FEEDBACK ===\n');
    
    const requestsResult = await pool.query(`
      SELECT 
        pfr.id,
        pfr.requester_id,
        u1.first_name || ' ' || u1.last_name as requester_name,
        pfr.reviewer_id,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        pfr.cycle_id,
        pfr.status,
        pfr.created_at
      FROM peer_feedback_requests pfr
      JOIN users u1 ON pfr.requester_id = u1.id
      JOIN users u2 ON pfr.reviewer_id = u2.id
      ORDER BY pfr.created_at DESC
    `);
    
    console.table(requestsResult.rows);
    
    console.log('\n=== ОТВЕТЫ PEER FEEDBACK ===\n');
    
    const answersResult = await pool.query(`
      SELECT 
        pf.id,
        pf.reviewer_id,
        u1.first_name || ' ' || u1.last_name as reviewer_name,
        pf.employee_id,
        u2.first_name || ' ' || u2.last_name as employee_name,
        pf.cycle_id,
        pf.created_at
      FROM peer_feedback pf
      JOIN users u1 ON pf.reviewer_id = u1.id
      JOIN users u2 ON pf.employee_id = u2.id
      ORDER BY pf.created_at DESC
    `);
    
    console.table(answersResult.rows);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkPeerFeedback();
