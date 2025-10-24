const { query } = require('./database');

async function createPeerFeedbackTables() {
  try {
    console.log('Создание таблиц для оценки от коллег...');

    // Таблица запросов на оценку
    await query(`
      CREATE TABLE IF NOT EXISTS peer_feedback_requests (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(requester_id, reviewer_id, cycle_id)
      )
    `);
    console.log('✅ Таблица peer_feedback_requests создана');

    // Таблица оценок от коллег
    await query(`
      CREATE TABLE IF NOT EXISTS peer_feedbacks (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES peer_feedback_requests(id) ON DELETE CASCADE,
        requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        
        -- Оценки по компетенциям (1-5)
        technical_skills INTEGER CHECK (technical_skills BETWEEN 1 AND 5),
        communication INTEGER CHECK (communication BETWEEN 1 AND 5),
        teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
        problem_solving INTEGER CHECK (problem_solving BETWEEN 1 AND 5),
        initiative INTEGER CHECK (initiative BETWEEN 1 AND 5),
        
        -- Текстовые комментарии
        strengths TEXT,
        areas_for_improvement TEXT,
        additional_comments TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица peer_feedbacks создана');

    // Проверяем созданные таблицы
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('peer_feedback_requests', 'peer_feedbacks')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Созданные таблицы:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✅ Все таблицы успешно созданы!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

createPeerFeedbackTables();
