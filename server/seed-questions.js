const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'wink_performance_review'
});

async function seedQuestions() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');

    // Проверяем и добавляем вопросы для manager review
    const managerCountResult = await client.query('SELECT COUNT(*) as count FROM manager_review_questions');
    if (managerCountResult.rows[0].count === '0') {
      console.log('\n📝 Добавляю вопросы для оценки руководителя...');
      const managerQuestions = [
        'Качество выполнения работы',
        'Соблюдение сроков',
        'Инициативность',
        'Коммуникабельность',
        'Способность работать в команде'
      ];

      for (let i = 0; i < managerQuestions.length; i++) {
        await client.query(
          'INSERT INTO manager_review_questions (question_text, question_type, max_score, display_order, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [managerQuestions[i], 'scale_0_10', 10, i + 1]
        );
      }
      console.log(`✅ Добавлено ${managerQuestions.length} вопросов для оценки руководителя`);
    } else {
      console.log('⏭️  Вопросы для оценки руководителя уже существуют');
    }

    // Проверяем и добавляем вопросы для peer review
    const peerCountResult = await client.query('SELECT COUNT(*) as count FROM peer_review_questions');
    if (peerCountResult.rows[0].count === '0') {
      console.log('\n📝 Добавляю вопросы для peer review...');
      const peerQuestions = [
        'Эффективность совместной работы',
        'Готовность помогать коллегам',
        'Профессионализм',
        'Ответственность',
        'Конструктивность в общении'
      ];

      for (let i = 0; i < peerQuestions.length; i++) {
        await client.query(
          'INSERT INTO peer_review_questions (question_text, question_type, max_score, display_order, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [peerQuestions[i], 'scale_0_10', 10, i + 1]
        );
      }
      console.log(`✅ Добавлено ${peerQuestions.length} вопросов для peer review`);
    } else {
      console.log('⏭️  Вопросы для peer review уже существуют');
    }

    console.log('\n✅ Все вопросы добавлены!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
    console.log('👋 Отключено от базы данных');
  }
}

seedQuestions();
