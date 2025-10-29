// Проверка структуры таблицы employee_recommendations
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'wink_performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'wink2025'
});

async function checkTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Проверка структуры таблицы employee_recommendations...\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'employee_recommendations'
      ORDER BY ordinal_position
    `);

    if (result.rows.length === 0) {
      console.log('❌ Таблица employee_recommendations не найдена!');
    } else {
      console.log('✅ Колонки в таблице employee_recommendations:');
      result.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
