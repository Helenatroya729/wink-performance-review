const { query } = require('./database');

async function checkAndFixGoals() {
  try {
    console.log('Проверка целей и их связи с циклами...\n');
    
    // Проверяем циклы
    const cycles = await query('SELECT * FROM review_cycles ORDER BY id');
    console.log('📋 Циклы в базе:');
    cycles.rows.forEach(c => {
      console.log(`  ID: ${c.id}, Название: ${c.name}, Статус: ${c.status}`);
    });
    
    // Проверяем цели
    const goals = await query(`
      SELECT 
        g.id, g.user_id, g.cycle_id, g.title, g.status,
        u.first_name, u.last_name
      FROM employee_goals g
      JOIN users u ON g.user_id = u.id
      ORDER BY g.id
    `);
    
    console.log('\n🎯 Цели в базе:');
    if (goals.rows.length === 0) {
      console.log('  ❌ Целей нет в базе!');
    } else {
      goals.rows.forEach(g => {
        console.log(`  ID: ${g.id}, Цикл: ${g.cycle_id}, Сотрудник: ${g.first_name} ${g.last_name}, Статус: ${g.status}, Название: ${g.title}`);
      });
    }
    
    // Проверяем есть ли цели у конкретного пользователя (например emp1)
    const userGoals = await query(`
      SELECT * FROM employee_goals 
      WHERE user_id = (SELECT id FROM users WHERE email = 'emp1@wink.ru')
    `);
    
    console.log('\n👤 Цели для emp1@wink.ru:');
    console.log(`  Количество: ${userGoals.rows.length}`);
    
    // Если целей нет, создадим тестовые
    if (goals.rows.length === 0) {
      console.log('\n🔧 Создаем тестовые цели...');
      
      const emp1 = await query(`SELECT id FROM users WHERE email = 'emp1@wink.ru'`);
      const emp1Id = emp1.rows[0]?.id;
      
      if (emp1Id) {
        // Привязываем к циклу 2 (активный)
        await query(`
          INSERT INTO employee_goals (user_id, cycle_id, goal_number, title, description, status, expected_results, expected_deadline)
          VALUES 
            ($1, 2, 1, 'Внедрить микросервисную архитектуру', 'Разделить монолит на 5 независимых сервисов', 'approved', 'Система из 5 сервисов с независимым деплоем', '2025-06-30'),
            ($1, 2, 2, 'Повысить покрытие тестами до 80%', 'Написать unit и integration тесты', 'approved', 'Покрытие кода тестами 80%+', '2025-06-30'),
            ($1, 2, 3, 'Изучить React и TypeScript', 'Освоить современный стек фронтенда', 'approved', 'Проект на React + TypeScript', '2025-06-30')
        `, [emp1Id]);
        
        console.log('✅ Создано 3 тестовых цели для emp1');
      }
    }
    
    // Проверяем результат
    const finalCheck = await query(`
      SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
      FROM employee_goals
      WHERE cycle_id = 2
    `);
    
    console.log('\n📊 Итоговая статистика:');
    console.log(`  Всего целей в активном цикле (ID=2): ${finalCheck.rows[0].total}`);
    console.log(`  Утвержденных целей: ${finalCheck.rows[0].approved}`);
    
    console.log('\n✅ Проверка завершена!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkAndFixGoals();
