const { query } = require('./database');

async function checkPotentialTable() {
  try {
    console.log('🔍 Проверка структуры таблицы potential_assessments...\n');
    
    // Проверяем, существует ли таблица
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'potential_assessments'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Таблица potential_assessments не существует!');
      console.log('\n📝 Нужно создать таблицу. Создаю...\n');
      
      await query(`
        CREATE TABLE IF NOT EXISTS potential_assessments (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER REFERENCES users(id),
          manager_id INTEGER REFERENCES users(id),
          cycle_id INTEGER REFERENCES review_cycles(id),
          
          -- Профессиональные качества (5 чекбоксов)
          prof_responsibility BOOLEAN DEFAULT false,
          prof_result_oriented BOOLEAN DEFAULT false,
          prof_proactivity BOOLEAN DEFAULT false,
          prof_open_mindset BOOLEAN DEFAULT false,
          prof_team_player BOOLEAN DEFAULT false,
          professional_comment TEXT,
          
          -- Личные качества (4 чекбокса)
          pers_took_responsibility BOOLEAN DEFAULT false,
          pers_transparent_communication BOOLEAN DEFAULT false,
          pers_shared_info BOOLEAN DEFAULT false,
          pers_organized_work BOOLEAN DEFAULT false,
          personal_comment TEXT,
          
          -- Вопросы потенциала
          had_motivation_one_on_one BOOLEAN DEFAULT false,
          knows_miscommunication_cases BOOLEAN DEFAULT false,
          development_desire VARCHAR(50),
          is_successor BOOLEAN DEFAULT false,
          successor_ready_timing VARCHAR(50),
          turnover_risk INTEGER,
          ole_priority_1 TEXT,
          ole_priority_2 TEXT,
          
          -- Расчетные поля
          performance_raw_score INTEGER,
          performance_final_score INTEGER,
          potential_raw_score INTEGER,
          potential_final_score INTEGER,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Таблица potential_assessments создана!');
    } else {
      console.log('✅ Таблица potential_assessments существует\n');
      
      // Получаем структуру таблицы
      const structure = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'potential_assessments'
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Колонки таблицы:');
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Проверяем данные
      const count = await query('SELECT COUNT(*) FROM potential_assessments');
      console.log(`\n📈 Записей в таблице: ${count.rows[0].count}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkPotentialTable();
