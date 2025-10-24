const { Client } = require('pg');

async function checkTable() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'wink_performance_review',
    user: 'postgres',
    password: 'postgres'
  });

  await client.connect();
  
  const result = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'manager_evaluations' 
    ORDER BY ordinal_position
  `);
  
  console.table(result.rows);
  
  await client.end();
}

checkTable();
