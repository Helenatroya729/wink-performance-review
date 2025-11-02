const { query } = require('./database');

async function checkPeerFeedbacks() {
  try {
    console.log('🔍 Проверяем peer feedbacks в базе данных...\n');
    
    // Проверяем структуру таблицы
    const structure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'peer_feedbacks'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы peer_feedbacks:');
    console.log(JSON.stringify(structure.rows, null, 2));
    
    // Проверяем данные для Ивана (ID 9)
    const result = await query(`
      SELECT 
        pf.*,
        CONCAT(u.first_name, ' ', u.last_name) as reviewer_name
      FROM peer_feedbacks pf
      LEFT JOIN users u ON pf.reviewer_id = u.id
      WHERE pf.requester_id = 9
      ORDER BY pf.created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📊 Peer feedbacks для Ивана:');
    if (result.rows.length === 0) {
      console.log('❌ Нет данных в таблице peer_feedbacks для Ивана');
    } else {
      console.log(JSON.stringify(result.rows, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPeerFeedbacks();
