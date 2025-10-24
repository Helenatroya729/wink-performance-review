const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'wink_performance_review',
  user: 'postgres',
  password: 'admin'
});

async function checkDuplicates() {
  try {
    console.log('🔍 Проверка дубликатов в базе данных...\n');

    // Проверяем пользователей
    const usersResult = await pool.query(`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      ORDER BY last_name, first_name, id
    `);

    console.log('📋 Все пользователи в системе:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    usersResult.rows.forEach(u => {
      console.log(`ID: ${u.id.toString().padEnd(3)} | ${u.first_name} ${u.last_name.padEnd(15)} | ${u.email.padEnd(25)} | Роль: ${u.role}`);
    });

    // Проверяем дубликаты по имени
    const duplicateNamesResult = await pool.query(`
      SELECT first_name, last_name, COUNT(*) as count
      FROM users
      GROUP BY first_name, last_name
      HAVING COUNT(*) > 1
    `);

    if (duplicateNamesResult.rows.length > 0) {
      console.log('\n⚠️  НАЙДЕНЫ ДУБЛИКАТЫ ПО ИМЕНАМ:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      for (const dup of duplicateNamesResult.rows) {
        console.log(`\n"${dup.first_name} ${dup.last_name}" - ${dup.count} записей`);
        
        const details = await pool.query(
          'SELECT id, email, role FROM users WHERE first_name = $1 AND last_name = $2',
          [dup.first_name, dup.last_name]
        );
        
        details.rows.forEach(d => {
          console.log(`  → ID: ${d.id}, Email: ${d.email}, Роль: ${d.role}`);
        });
      }
    } else {
      console.log('\n✅ Дубликатов по именам не найдено');
    }

    // Проверяем оценки для дубликатов
    console.log('\n📊 Проверка оценок в 9-box матрице:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const nineBoxResult = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        pa.growth_mindset_score as potential,
        me.performance_total as performance
      FROM users u
      LEFT JOIN potential_assessments pa ON u.id = pa.employee_id
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id
      WHERE pa.growth_mindset_score IS NOT NULL 
         OR me.performance_total IS NOT NULL
      ORDER BY u.last_name, u.first_name, u.id
    `);

    nineBoxResult.rows.forEach(row => {
      console.log(`ID: ${row.id.toString().padEnd(3)} | ${row.first_name} ${row.last_name.padEnd(15)} | Perf: ${row.performance || 'N/A'} | Pot: ${row.potential || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkDuplicates();
