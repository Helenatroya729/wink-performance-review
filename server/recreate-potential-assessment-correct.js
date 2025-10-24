const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function recreatePotentialAssessmentTable() {
  const client = await pool.connect();
  
  try {
    console.log('Удаление старой таблицы potential_assessments...');
    await client.query('DROP TABLE IF EXISTS potential_assessments CASCADE;');
    console.log('✓ Старая таблица удалена');
    
    console.log('\nСоздание новой таблицы potential_assessments с правильной структурой...');
    
    await client.query(`
      CREATE TABLE potential_assessments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        
        -- РАЗДЕЛ 1: ПРОФЕССИОНАЛЬНЫЕ КАЧЕСТВА (5 вопросов Да/Нет, по 1 баллу каждый)
        prof_responsibility BOOLEAN DEFAULT FALSE,           -- 1. Ответственность
        prof_result_oriented BOOLEAN DEFAULT FALSE,          -- 2. Ориентация на результат
        prof_proactivity BOOLEAN DEFAULT FALSE,              -- 3. Проактивность
        prof_open_mindset BOOLEAN DEFAULT FALSE,             -- 4. Открытое мышление
        prof_team_player BOOLEAN DEFAULT FALSE,              -- 5. Командный игрок
        professional_comment TEXT,                           -- Комментарий к профессиональным качествам
        
        -- РАЗДЕЛ 2: ЛИЧНЫЕ КАЧЕСТВА (4 вопроса Да/Нет, по 1 баллу каждый)
        pers_took_responsibility BOOLEAN DEFAULT FALSE,      -- 1. Не боялся брать на себя больше ответственности
        pers_transparent_communication BOOLEAN DEFAULT FALSE,-- 2. Выстраивал открытую прозрачную коммуникацию
        pers_shared_info BOOLEAN DEFAULT FALSE,              -- 3. Оперативно делился информацией
        pers_organized_work BOOLEAN DEFAULT FALSE,           -- 4. Выстраивал работу по задаче
        personal_comment TEXT,                               -- Комментарий к личным качествам
        
        -- ВОПРОС 3.1: Приходилось ли проводить 1:1 для мотивации (Да/Нет, 0/1 балл)
        had_motivation_one_on_one BOOLEAN DEFAULT FALSE,
        
        -- ВОПРОС 3.2: Знаешь о случаях дискоммуникации (Да/Нет, 0/1 балл)
        knows_miscommunication_cases BOOLEAN DEFAULT FALSE,
        
        -- ВОПРОС 3.3: Желание развиваться (4 варианта, 0-1 балл)
        development_desire VARCHAR(50), -- 'proactive' (1 балл), 'needs_help' (1 балл), 'not_sure' (0), 'no' (0)
        
        -- ВОПРОС 3.4: Считаешь преемником (Да/Нет, 1/0 балл)
        is_successor BOOLEAN DEFAULT FALSE,
        
        -- ВОПРОС 3.5: Когда будет готов (3 варианта, 0-2 балла)
        successor_ready_timing VARCHAR(50), -- '1-2_years' (2 балла), '3_years' (1 балл), '3_plus_years' (0)
        
        -- ВОПРОС 3.6: Риск ухода (шкала 0-10)
        turnover_risk INTEGER CHECK (turnover_risk BETWEEN 0 AND 10) DEFAULT 5,
        
        -- ВОПРОС 3.7 и 3.8: Приоритеты из ОЛЭ (по 1 баллу)
        ole_priority_1 TEXT,
        ole_priority_2 TEXT,
        
        -- ИТОГОВЫЕ ПОКАЗАТЕЛИ (рассчитываются автоматически)
        performance_raw_score INTEGER, -- Сумма профессиональных + личных качеств (0-9)
        performance_final_score INTEGER, -- Итоговая оценка результативности (1-3)
        potential_raw_score INTEGER,   -- Сумма всех вопросов потенциала (0-16)
        potential_final_score INTEGER, -- Итоговая оценка потенциала (1-3)
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, cycle_id)
      );
    `);
    
    console.log('✓ Таблица potential_assessments создана с правильной структурой');
    
    // Создаем индексы
    await client.query(`
      CREATE INDEX idx_potential_assessments_employee ON potential_assessments(employee_id);
      CREATE INDEX idx_potential_assessments_manager ON potential_assessments(manager_id);
      CREATE INDEX idx_potential_assessments_cycle ON potential_assessments(cycle_id);
    `);
    
    console.log('✓ Индексы созданы');
    
    console.log('\n✅ Миграция завершена успешно!');
    console.log('\n📊 Структура оценки:');
    console.log('   РЕЗУЛЬТАТИВНОСТЬ (0-9 баллов → 1-3):');
    console.log('   - Профессиональные качества: 5 вопросов × 1 балл = 0-5');
    console.log('   - Личные качества: 4 вопроса × 1 балл = 0-4');
    console.log('   Итого: 4 = 1★, 5-7 = 2★, 8-11 = 3★\n');
    console.log('   ПОТЕНЦИАЛ (0-16 баллов → 1-3):');
    console.log('   - Мотивация 1:1: 0-1');
    console.log('   - Дискоммуникация: 0-1');
    console.log('   - Желание развиваться: 0-1');
    console.log('   - Преемник: 0-1');
    console.log('   - Готовность: 0-2');
    console.log('   - Риск ухода: 0-3');
    console.log('   - ОЛЭ приоритеты: 2 × 1 = 0-2');
    console.log('   Итого: 1-7 = 1★, 8-12 = 2★, 13-16 = 3★');
    
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recreatePotentialAssessmentTable();
