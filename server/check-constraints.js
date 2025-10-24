const { Client } = require('pg');

async function checkConstraints() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'wink_performance_review',
    user: 'postgres',
    password: 'postgres'
  });

  await client.connect();
  
  const result = await client.query(`
    SELECT con.conname, pg_get_constraintdef(con.oid) as definition
    FROM pg_constraint con 
    JOIN pg_class rel ON rel.oid = con.conrelid 
    WHERE rel.relname = 'manager_evaluations'
    AND con.contype = 'c'
  `);
  
  console.table(result.rows);
  
  await client.end();
}

checkConstraints();
