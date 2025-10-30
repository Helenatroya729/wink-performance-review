const { query } = require('./database');

async function migratePotentialTable() {
  try {
    console.log('🔄 Миграция таблицы potential_assessments...\n');
    
    // Удаляем старую таблицу (так как структура сильно отличается)
    console.log('📝 Удаляю старую таблицу...');
    await query('DROP TABLE IF EXISTS potential_assessments CASCADE');
    console.log('✅ Старая таблица удалена\n');
    
    // Создаем новую таблицу с правильной структурой
    console.log('📝 Создаю новую таблицу с правильной структурой...');
    await query(`
      CREATE TABLE potential_assessments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) NOT NULL,
        manager_id INTEGER REFERENCES users(id) NOT NULL,
        cycle_id INTEGER REFERENCES review_cycles(id) NOT NULL,
        
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, cycle_id)
      )
    `);
    
    console.log('✅ Новая таблица создана!\n');
    
    // Проверяем структуру
    const structure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'potential_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Структура новой таблицы:');
    structure.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Миграция завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    process.exit(1);
  }
}

migratePotentialTable();
