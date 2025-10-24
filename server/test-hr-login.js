const API_URL = 'http://localhost:5000/api';

async function testHRDashboard() {
  try {
    console.log('🔐 1. Входим как HR...\n');
    
    // Логин
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@wink.ru',
        password: 'password'
      })
    });
    
    const loginData = await loginResponse.json();
    
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('❌ Токен не получен! Ответ:', loginData);
      return;
    }
    
    const token = loginData.token;
    
    console.log('✅ Успешно вошли!');
    console.log(`Token: ${token.substring(0, 20)}...\n`);
    
    // Получаем employee-scores
    console.log('📊 2. Загружаем employee-scores...\n');
    
    const scoresResponse = await fetch(`${API_URL}/hr/employee-scores`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const scoresData = await scoresResponse.json();
    
    console.log(`✅ Получено сотрудников: ${scoresData.length}\n`);
    console.log('Данные:');
    console.log(JSON.stringify(scoresData, null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testHRDashboard();
