const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function createPotentialAssessmentTable() {
  const client = await pool.connect();
  
  try {
    console.log('Создание таблицы potential_assessments...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS potential_assessments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        
        -- Профессиональные качества (1-5 баллов, вес 1)
        professional_qualities_score INTEGER CHECK (professional_qualities_score BETWEEN 1 AND 5),
        professional_qualities_comment TEXT,
        
        -- Личные качества (1-4 балла, вес 1)
        personal_qualities_score INTEGER CHECK (personal_qualities_score BETWEEN 1 AND 4),
        personal_qualities_comment TEXT,
        
        -- Вопросы Да/Нет (0/1 балл каждый)
        took_more_responsibility BOOLEAN, -- Приходилось ли тебе за последние полгода проводить 1:1
        communicated_transparently BOOLEAN, -- Выстраивал открытую прозрачную и точную коммуникацию с коллегами
        shared_knowledge BOOLEAN, -- Делился информацией о задаче с коллегами
        completed_task BOOLEAN, -- Выстраивал работу по задаче
        
        -- Готовность к развитию (0-1 балл)
        ready_for_development VARCHAR(50), -- '1-2_years', '3_years', '3_plus_years'
        
        -- Преемник (Да/Нет, 0/1 балл)
        is_successor BOOLEAN,
        
        -- Риск ухода (шкала 0-10, вес 0)
        turnover_risk INTEGER CHECK (turnover_risk BETWEEN 0 AND 10),
        
        -- Итоговые баллы (рассчитываются автоматически)
        performance_total INTEGER, -- Результативность (4-15-7-28-11-3)
        potential_total INTEGER,   -- Потенциал (0-161-7-18-12-213-16-3)
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, cycle_id)
      );
    `);
    
    console.log('✓ Таблица potential_assessments создана');
    
    // Создаем индексы
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_potential_assessments_employee 
      ON potential_assessments(employee_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_potential_assessments_manager 
      ON potential_assessments(manager_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_potential_assessments_cycle 
      ON potential_assessments(cycle_id);
    `);
    
    console.log('✓ Индексы созданы');
    console.log('\n✅ Миграция завершена успешно!');
    
  } catch (error) {
    console.error('Ошибка при создании таблицы:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createPotentialAssessmentTable();
