// Тестирование API с PostgreSQL
const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Тестирование WINK Performance Review API\n');

  try {
    // 1. Проверка здоровья API
    console.log('1️⃣ Проверка health check...');
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health);
    console.log('');

    // 2. Авторизация как HR
    console.log('2️⃣ Авторизация как HR...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@wink.ru',
        password: '123456'
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Ошибка авторизации:', loginRes.status);
      const error = await loginRes.json();
      console.error(error);
      return;
    }

    const loginData = await loginRes.json();
    console.log('✅ Авторизация успешна!');
    console.log('   Пользователь:', loginData.user.first_name, loginData.user.last_name);
    console.log('   Роль:', loginData.user.role);
    console.log('   Токен:', loginData.token.substring(0, 20) + '...');
    console.log('');

    const token = loginData.token;

    // 3. Получение информации о текущем пользователе
    console.log('3️⃣ Получение информации о текущем пользователе...');
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const me = await meRes.json();
    console.log('✅ Текущий пользователь:', me.full_name, `(${me.email})`);
    console.log('   Должность:', me.position);
    console.log('   Отдел:', me.department);
    console.log('');

    // 4. Получение списка всех пользователей
    console.log('4️⃣ Получение списка всех пользователей...');
    const usersRes = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await usersRes.json();
    console.log(`✅ Всего пользователей: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.full_name} (${u.email}) - ${u.role} - ${u.department}`);
    });
    console.log('');

    // 5. Получение циклов оценки
    console.log('5️⃣ Получение циклов оценки...');
    const cyclesRes = await fetch(`${API_URL}/cycles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cycles = await cyclesRes.json();
    console.log(`✅ Всего циклов: ${cycles.length}`);
    cycles.forEach(c => {
      console.log(`   - ${c.name} (${c.start_date} - ${c.end_date}) - Статус: ${c.status}`);
    });
    console.log('');

    // 6. Получение целей
    console.log('6️⃣ Получение целей сотрудников...');
    const goalsRes = await fetch(`${API_URL}/goals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const goals = await goalsRes.json();
    console.log(`✅ Всего целей: ${goals.length}`);
    goals.forEach(g => {
      console.log(`   - ${g.first_name} ${g.last_name}: "${g.title}" (статус: ${g.status})`);
    });
    console.log('');

    // 7. Получение статистики
    console.log('7️⃣ Получение статистики для дашборда...');
    const statsRes = await fetch(`${API_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await statsRes.json();
    console.log('✅ Статистика:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // 8. Авторизация как Employee и получение своих целей
    console.log('8️⃣ Авторизация как сотрудник...');
    const empLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emp1@wink.ru',
        password: '123456'
      })
    });

    const empLoginData = await empLoginRes.json();
    console.log('✅ Авторизация сотрудника успешна!');
    console.log('   Пользователь:', empLoginData.user.first_name, empLoginData.user.last_name);
    console.log('');

    const empToken = empLoginData.token;

    console.log('9️⃣ Получение целей сотрудника...');
    const empGoalsRes = await fetch(`${API_URL}/goals`, {
      headers: { 'Authorization': `Bearer ${empToken}` }
    });
    const empGoals = await empGoalsRes.json();
    console.log(`✅ Мои цели: ${empGoals.length}`);
    empGoals.forEach(g => {
      console.log(`   - "${g.title}" (статус: ${g.status})`);
      if (g.description) console.log(`     Описание: ${g.description}`);
    });
    console.log('');

    console.log('🎉 Все тесты пройдены успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

testAPI();
