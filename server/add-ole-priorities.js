const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'wink2025',
  port: 5433,
});

async function addOLEPriorities() {
  const client = await pool.connect();
  
  try {
    console.log('Добавление полей для приоритетов из ОЛЭ (вопросы 3.7 и 3.8)...');
    
    // Проверяем, существуют ли уже колонки
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'potential_assessments' 
      AND column_name IN ('ole_priority_1', 'ole_priority_2');
    `);
    
    if (checkColumns.rows.length === 0) {
      // Добавляем две колонки для приоритетов из ОЛЭ
      await client.query(`
        ALTER TABLE potential_assessments
        ADD COLUMN ole_priority_1 TEXT,
        ADD COLUMN ole_priority_2 TEXT;
      `);
      
      console.log('✓ Поля ole_priority_1 и ole_priority_2 добавлены');
    } else {
      console.log('⚠ Поля уже существуют, пропускаем');
    }
    
    console.log('✅ Миграция завершена успешно!');
    
  } catch (error) {
    console.error('Ошибка при добавлении полей:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addOLEPriorities();
