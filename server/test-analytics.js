const API_URL = 'http://localhost:5000/api';

async function testAnalytics() {
  try {
    // 1. Логин
    console.log('🔐 Логин как HR...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@wink.ru',
        password: 'password'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Токен получен');

    // 2. Получаем аналитику
    console.log('\n📊 Запрос HR аналитики...');
    const analyticsResponse = await fetch(`${API_URL}/hr/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const analyticsData = await analyticsResponse.json();
    console.log('✅ Статус:', analyticsResponse.status);
    console.log('✅ Ответ /hr/analytics:');
    console.log(JSON.stringify(analyticsData, null, 2));

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testAnalytics();
