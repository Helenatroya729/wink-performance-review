const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function addFieldsToManagerEvaluations() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');

    console.log('\n📝 Добавляю новые поля в manager_evaluations...');

    // Проверяем и добавляем поля, если их нет
    const fieldsToAdd = [
      { name: 'goal_id', type: 'INTEGER REFERENCES employee_goals(id)' },
      { name: 'result_achievement_rating', type: 'INTEGER CHECK (result_achievement_rating BETWEEN 0 AND 10)' },
      { name: 'personal_qualities_comment', type: 'TEXT' },
      { name: 'personal_contribution_comment', type: 'TEXT' },
      { name: 'interaction_quality_rating', type: 'INTEGER CHECK (interaction_quality_rating BETWEEN 0 AND 10)' },
      { name: 'improvement_suggestions', type: 'TEXT' },
      { name: 'overall_rating', type: 'INTEGER CHECK (overall_rating BETWEEN 0 AND 10)' },
      { name: 'feedback_summary', type: 'TEXT' }
    ];

    for (const field of fieldsToAdd) {
      try {
        // Проверяем, существует ли поле
        const checkField = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'manager_evaluations' 
          AND column_name = $1
        `, [field.name]);

        if (checkField.rows.length === 0) {
          await client.query(`
            ALTER TABLE manager_evaluations 
            ADD COLUMN ${field.name} ${field.type}
          `);
          console.log(`  ✅ Добавлено поле: ${field.name}`);
        } else {
          console.log(`  ⏭️  Поле ${field.name} уже существует`);
        }
      } catch (err) {
        console.log(`  ⚠️  Ошибка при добавлении ${field.name}: ${err.message}`);
      }
    }

    console.log('\n✅ Миграция завершена!');

    // Показываем финальную структуру
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'manager_evaluations'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Текущая структура manager_evaluations:');
    console.table(structure.rows);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

addFieldsToManagerEvaluations();
