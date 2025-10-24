const { query } = require('./database');

async function createTestPeerFeedbackRequests() {
  try {
    console.log('Создание тестовых запросов на оценку от коллег...');

    // Получаем пользователей
    const usersResult = await query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE role IN ('employee', 'manager')
      ORDER BY id
    `);
    
    console.log('\n👥 Пользователи в системе:');
    usersResult.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Имя: ${user.first_name} ${user.last_name}`);
    });

    // Получаем активные циклы
    const cyclesResult = await query(`
      SELECT id, name 
      FROM review_cycles 
      WHERE status = 'active'
      ORDER BY id
    `);
    
    console.log('\n📅 Активные циклы:');
    cyclesResult.rows.forEach(cycle => {
      console.log(`  ID: ${cycle.id}, Название: ${cycle.name}`);
    });

    if (usersResult.rows.length < 2 || cyclesResult.rows.length === 0) {
      console.log('\n⚠️  Недостаточно данных для создания запросов');
      process.exit(0);
    }

    // Создаем несколько запросов
    // 1. Запрос от emp1@wink.ru к emp2@wink.ru
    const emp1 = usersResult.rows.find(u => u.email === 'emp1@wink.ru');
    const emp2 = usersResult.rows.find(u => u.email === 'emp2@wink.ru');
    const cycle = cyclesResult.rows[0];

    if (emp1 && emp2 && cycle) {
      // Проверяем, нет ли уже такого запроса
      const existing = await query(`
        SELECT id FROM peer_feedback_requests 
        WHERE requester_id = $1 AND reviewer_id = $2 AND cycle_id = $3
      `, [emp2.id, emp1.id, cycle.id]);

      if (existing.rows.length === 0) {
        // Создаем запрос от emp2 к emp1 (чтобы emp1 получил входящий запрос)
        await query(`
          INSERT INTO peer_feedback_requests (requester_id, reviewer_id, cycle_id, message, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [emp2.id, emp1.id, cycle.id, 'Привет! Мы работали вместе над проектом микросервисной архитектуры. Буду благодарен за обратную связь по моей работе.', 'pending']);
        
        console.log(`\n✅ Создан запрос от ${emp2.first_name} ${emp2.last_name} к ${emp1.first_name} ${emp1.last_name}`);
      } else {
        console.log(`\n⚠️  Запрос от ${emp2.first_name} ${emp2.last_name} к ${emp1.first_name} ${emp1.last_name} уже существует`);
      }
    }

    // Проверяем созданные запросы
    const requestsResult = await query(`
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

    console.log('\n📋 Все запросы на оценку:');
    requestsResult.rows.forEach(req => {
      console.log(`  ${req.requester_first_name} ${req.requester_last_name} → ${req.reviewer_first_name} ${req.reviewer_last_name}`);
      console.log(`    Цикл: ${req.cycle_name}, Статус: ${req.status}`);
    });

    console.log('\n✅ Готово!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

createTestPeerFeedbackRequests();
