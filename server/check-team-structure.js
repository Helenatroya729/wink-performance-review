const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wink_performance_review',
  password: '123',
  port: 5432,
});

async function checkTeamStructure() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Структура команд:\n');

    // Получаем всех менеджеров
    const managers = await client.query(`
      SELECT id, first_name, last_name, email, position
      FROM users
      WHERE role = 'manager'
      ORDER BY id
    `);

    console.log(`Всего менеджеров: ${managers.rows.length}\n`);

    for (const manager of managers.rows) {
      console.log(`👤 ${manager.first_name} ${manager.last_name} (${manager.email})`);
      console.log(`   ID: ${manager.id}, Должность: ${manager.position}`);
      
      // Получаем сотрудников этого менеджера
      const team = await client.query(`
        SELECT id, first_name, last_name, email, position, role
        FROM users
        WHERE manager_id = $1
        ORDER BY id
      `, [manager.id]);

      if (team.rows.length === 0) {
        console.log('   ⚠️  Нет сотрудников в команде\n');
      } else {
        console.log(`   Команда (${team.rows.length} чел.):`);
        team.rows.forEach(emp => {
          console.log(`      - ${emp.first_name} ${emp.last_name} (${emp.email}) - ${emp.position}`);
        });
        console.log('');
      }
    }

    // Проверяем сотрудников без менеджера
    const noManager = await client.query(`
      SELECT id, first_name, last_name, email, position, role
      FROM users
      WHERE role = 'employee' AND (manager_id IS NULL OR manager_id = 0)
      ORDER BY id
    `);

    if (noManager.rows.length > 0) {
      console.log(`⚠️  Сотрудники без менеджера (${noManager.rows.length}):`);
      noManager.rows.forEach(emp => {
        console.log(`   - ${emp.first_name} ${emp.last_name} (${emp.email}) - ${emp.position}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTeamStructure();
