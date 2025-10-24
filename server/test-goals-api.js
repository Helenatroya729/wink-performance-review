const fetch = require('node-fetch');

async function testGoalsAPI() {
  try {
    // 1. Логин как emp1
    console.log('1. Авторизация как emp1@wink.ru...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emp1@wink.ru',
        password: '123456'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('✅ Логин успешен');
    console.log('Пользователь:', loginData.user.first_name, loginData.user.last_name);
    console.log('Роль:', loginData.user.role);
    
    const token = loginData.token;
    
    // 2. Получаем цели
    console.log('\n2. Получение целей...');
    const goalsRes = await fetch('http://localhost:5000/api/goals', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const goals = await goalsRes.json();
    console.log(`\n📋 Получено целей: ${goals.length}`);
    
    if (goals.length > 0) {
      goals.forEach((g, i) => {
        console.log(`\n${i + 1}. ${g.title}`);
        console.log(`   ID: ${g.id}, Цикл: ${g.cycle_id}, Статус: ${g.status}`);
        console.log(`   Описание: ${g.description || 'нет'}`);
      });
    } else {
      console.log('❌ Целей не найдено!');
    }
    
    // 3. Получаем циклы
    console.log('\n3. Получение циклов...');
    const cyclesRes = await fetch('http://localhost:5000/api/cycles', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const cycles = await cyclesRes.json();
    console.log(`\n📅 Получено циклов: ${cycles.length}`);
    cycles.forEach(c => {
      console.log(`   ID: ${c.id}, Название: ${c.name}, Статус: ${c.status}`);
    });
    
    console.log('\n✅ Тест завершен!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testGoalsAPI();
