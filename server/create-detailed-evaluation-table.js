const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: 'wink2025'
});

async function createDetailedEvaluationTable() {
  try {
    await client.connect();
    console.log('Подключено к базе данных');

    // Удаляем старую таблицу manager_evaluations если она существует
    await client.query('DROP TABLE IF EXISTS manager_evaluations CASCADE');
    console.log('Старая таблица удалена');

    // Создаем новую расширенную таблицу
    await client.query(`
      CREATE TABLE manager_evaluations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE CASCADE,
        
        -- Профессиональные качества (1-5 баллов)
        professional_qualities_score INTEGER CHECK (professional_qualities_score BETWEEN 1 AND 5),
        
        -- Личные качества (1-4 балла)
        personal_qualities_score INTEGER CHECK (personal_qualities_score BETWEEN 1 AND 4),
        
        -- Коммуникация и развитие (Да/Нет - 0/1)
        communication_with_colleagues BOOLEAN,
        employee_development_willingness BOOLEAN,
        considers_as_successor BOOLEAN,
        
        -- Желание развиваться (текстовое поле с вариантами)
        development_readiness VARCHAR(50), -- '1-2 года', '3 года', '3+ лет'
        
        -- Риск ухода (0-10)
        turnover_risk_score INTEGER CHECK (turnover_risk_score BETWEEN 0 AND 10),
        
        -- Приоритеты из ОПЗ (текст)
        priorities_from_opz TEXT,
        
        -- Автоматически рассчитываемые итоги
        performance_total INTEGER, -- Результативность
        potential_total INTEGER,   -- Потенциал
        
        -- Метаданные
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Уникальность: один сотрудник - одна оценка за цикл от менеджера
        UNIQUE(employee_id, manager_id, cycle_id)
      )
    `);
    console.log('✅ Таблица manager_evaluations создана');

    // Создаем индексы
    await client.query(`
      CREATE INDEX idx_manager_eval_employee ON manager_evaluations(employee_id);
      CREATE INDEX idx_manager_eval_manager ON manager_evaluations(manager_id);
      CREATE INDEX idx_manager_eval_cycle ON manager_evaluations(cycle_id);
    `);
    console.log('✅ Индексы созданы');

    console.log('\n📊 Структура таблицы:');
    console.log('- Профессиональные качества: 1-5 баллов (вес 1)');
    console.log('- Личные качества: 1-4 балла (вес 1)');
    console.log('- Коммуникация с коллегами: Да/Нет (0/1)');
    console.log('- Желание развиваться: Да/Нет (0/1)');
    console.log('- Считаешь преемником: Да/Нет (0/1)');
    console.log('- Готовность к развитию: 1-2 года / 3 года / 3+ лет');
    console.log('- Риск ухода: 0-10');
    console.log('- Приоритеты из ОПЗ: текст');
    console.log('- Результативность: авто-расчет');
    console.log('- Потенциал: авто-расчет');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\nСоединение закрыто');
  }
}

createDetailedEvaluationTable()
  .then(() => {
    console.log('\n✅ Миграция завершена успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Миграция завершилась с ошибкой:', error);
    process.exit(1);
  });
