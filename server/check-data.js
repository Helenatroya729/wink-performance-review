const pool = require('./database');

async function checkData() {
  try {
    console.log('\n📊 ПРОВЕРКА ДАННЫХ В СИСТЕМЕ\n');
    console.log('=' .repeat(60));
    
    // Проверка запросов на оценку
    const requests = await pool.query(`
      SELECT 
        r.*,
        u1.first_name as requester_first_name,
        u1.last_name as requester_last_name,
        u2.first_name as reviewer_first_name,
        u2.last_name as reviewer_last_name,
        c.name as cycle_name
      FROM peer_feedback_requests r
      JOIN users u1 ON r.requester_id = u1.id
      JOIN users u2 ON r.reviewer_id = u2.id
      JOIN review_cycles c ON r.cycle_id = c.id
      ORDER BY r.created_at DESC
    `);
    
    console.log('\n🔔 ЗАПРОСЫ НА ОЦЕНКУ ОТ КОЛЛЕГ:');
    console.log(`   Всего запросов: ${requests.rows.length}`);
    if (requests.rows.length > 0) {
      requests.rows.forEach((req, idx) => {
        console.log(`\n   ${idx + 1}. ${req.requester_first_name} ${req.requester_last_name} → ${req.reviewer_first_name} ${req.reviewer_last_name}`);
        console.log(`      Цикл: ${req.cycle_name}`);
        console.log(`      Статус: ${req.status}`);
        console.log(`      Создан: ${new Date(req.created_at).toLocaleString('ru-RU')}`);
        if (req.message) {
          console.log(`      Сообщение: ${req.message.substring(0, 50)}...`);
        }
      });
    } else {
      console.log('   ⚠️  Нет запросов на оценку');
    }
    
    // Проверка целей
    const goals = await pool.query(`
      SELECT 
        g.*,
        u.first_name,
        u.last_name,
        c.name as cycle_name
      FROM employee_goals g
      JOIN users u ON g.user_id = u.id
      JOIN review_cycles c ON g.cycle_id = c.id
      ORDER BY g.created_at DESC
    `);
    
    console.log('\n\n🎯 ЦЕЛИ СОТРУДНИКОВ:');
    console.log(`   Всего целей: ${goals.rows.length}`);
    const statusCounts = {
      draft: goals.rows.filter(g => g.status === 'draft').length,
      submitted: goals.rows.filter(g => g.status === 'submitted').length,
      approved: goals.rows.filter(g => g.status === 'approved').length,
      rejected: goals.rows.filter(g => g.status === 'rejected').length
    };
    console.log(`   - Черновики: ${statusCounts.draft}`);
    console.log(`   - На утверждении: ${statusCounts.submitted}`);
    console.log(`   - Утверждено: ${statusCounts.approved}`);
    console.log(`   - Отклонено: ${statusCounts.rejected}`);
    
    // Проверка пользователей
    const users = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    
    console.log('\n\n👥 ПОЛЬЗОВАТЕЛИ:');
    users.rows.forEach(u => {
      console.log(`   ${u.role}: ${u.count}`);
    });
    
    // Проверка циклов оценки
    const cycles = await pool.query(`
      SELECT * FROM review_cycles ORDER BY id
    `);
    
    console.log('\n\n📅 ЦИКЛЫ ОЦЕНКИ:');
    cycles.rows.forEach(c => {
      console.log(`   ${c.id}. ${c.name} (${c.status})`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Проверка завершена!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkData();
