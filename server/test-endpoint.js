const axios = require('axios');

async function testEndpoint() {
  try {
    // Сначала логинимся
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'emp5@wink.ru',  // Иван Иванов
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    
    console.log('✅ Залогинились как:', loginResponse.data.user.first_name, loginResponse.data.user.last_name);
    console.log('   User ID:', userId);
    console.log('   Token:', token.substring(0, 20) + '...\n');
    
    // Теперь запрашиваем периоды
    const periodsResponse = await axios.get(`http://localhost:5000/api/employee-review-periods/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Ответ от /api/employee-review-periods/' + userId + ':');
    console.log('   Количество периодов:', periodsResponse.data.length);
    
    if (periodsResponse.data.length > 0) {
      const first = periodsResponse.data[0];
      console.log('\n✅ Первый период:');
      console.log('   ID:', first.id);
      console.log('   cycle_id:', first.cycle_id);
      console.log('   self_assessment_count:', first.self_assessment_count);
      console.log('   peer_reviews_count:', first.peer_reviews_count);
      console.log('   manager_evaluation_completed:', first.manager_evaluation_completed);
      
      console.log('\n🔍 Все поля первого периода:');
      console.log(JSON.stringify(first, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testEndpoint();
