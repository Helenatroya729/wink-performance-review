const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: 'postgres',
  port: 5433,
});

async function fixBoxPositionSize() {
  const client = await pool.connect();
  try {
    console.log('🔧 Изменяем размер колонки box_position с VARCHAR(20) на VARCHAR(50)...\n');
    
    await client.query(`
      ALTER TABLE potential_assessments 
      ALTER COLUMN box_position TYPE VARCHAR(50);
    `);
    
    console.log('✅ Размер колонки box_position успешно изменен на VARCHAR(50)');
    
    // Проверяем изменение
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'potential_assessments' 
      AND column_name = 'box_position'
    `);
    
    console.log('\n📊 Новая информация о колонке:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixBoxPositionSize();
