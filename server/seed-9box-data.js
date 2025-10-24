const { Client } = require('pg');

async function seed9BoxData() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'wink_performance_review',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    // Удаляем старые данные оценок потенциала
    await client.query('DELETE FROM potential_assessments WHERE cycle_id = 2');
    console.log('🗑️ Старые оценки потенциала удалены\n');

    const cycleId = 2; // "Первое полугодие 2025"
    const managerId = 7; // Кирилл Менеджеров

    // Создаем оценки потенциала для распределения по матрице 9-box
    const potentialData = [
      // ЗВЕЗДЫ (high performance + high potential) - 1 человек
      {
        employeeId: 10, // Анна Сидорова
        professionalQualities: ['Ответственность', 'Ориентация на результат', 'Стремление к развитию'],
        takesResponsibility: true,
        transparentCommunication: true,
        sharesInformation: true,
        organizesWork: true,
        growthMindsetScore: 10,
        readinessTimeframe: '1-2_years',
        isSuccessor: true,
        handlesCommunicationBarriers: true,
        reflectsOnResults: true,
        desiresRole: 'Team Lead',
        roleInterestLevel: 10,
        comments: 'Отличные результаты, высокий потенциал для роста до руководящей позиции'
      },
      
      // КЛЮЧЕВЫЕ ИГРОКИ (high performance + medium potential) - 2 человека
      {
        employeeId: 9, // Иван Иванов
        professionalQualities: ['Ответственность', 'Ориентация на результат'],
        takesResponsibility: true,
        transparentCommunication: true,
        sharesInformation: false,
        organizesWork: true,
        growthMindsetScore: 7,
        readinessTimeframe: '3_years',
        isSuccessor: false,
        handlesCommunicationBarriers: true,
        reflectsOnResults: true,
        desiresRole: 'Senior Developer',
        roleInterestLevel: 7,
        comments: 'Стабильно высокие результаты, хороший специалист'
      },
      {
        employeeId: 11, // Петр Петров
        professionalQualities: ['Ответственность', 'Надежность'],
        takesResponsibility: true,
        transparentCommunication: true,
        sharesInformation: true,
        organizesWork: true,
        growthMindsetScore: 6,
        readinessTimeframe: '3_years',
        isSuccessor: false,
        handlesCommunicationBarriers: true,
        reflectsOnResults: false,
        desiresRole: 'Senior Specialist',
        roleInterestLevel: 6,
        comments: 'Надежный сотрудник с отличными результатами'
      },

      // Добавим еще сотрудников для других категорий
      {
        employeeId: 12, // Ольга Васильева
        professionalQualities: ['Ответственность'],
        takesResponsibility: true,
        transparentCommunication: false,
        sharesInformation: false,
        organizesWork: false,
        growthMindsetScore: 5,
        readinessTimeframe: '3+_years',
        isSuccessor: false,
        handlesCommunicationBarriers: false,
        reflectsOnResults: true,
        desiresRole: 'Specialist',
        roleInterestLevel: 4,
        comments: 'Стабильные результаты, есть потенциал для развития'
      },
      {
        employeeId: 13, // Дмитрий Смирнов
        professionalQualities: ['Базовые навыки'],
        takesResponsibility: false,
        transparentCommunication: false,
        sharesInformation: false,
        organizesWork: false,
        growthMindsetScore: 3,
        readinessTimeframe: 'not_ready',
        isSuccessor: false,
        handlesCommunicationBarriers: false,
        reflectsOnResults: false,
        desiresRole: 'Junior',
        roleInterestLevel: 3,
        comments: 'Требует дополнительного развития навыков'
      }
    ];

    console.log('📝 Создаю оценки потенциала для матрицы 9-box...\n');

    for (const data of potentialData) {
      await client.query(`
        INSERT INTO potential_assessments (
          employee_id, manager_id, cycle_id,
          professional_qualities,
          takes_responsibility, transparent_communication, shares_information, organizes_work,
          growth_mindset_score,
          readiness_timeframe, is_successor,
          handles_communication_barriers, reflects_on_results,
          desires_role, role_interest_level,
          comments, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        data.employeeId,
        managerId,
        cycleId,
        data.professionalQualities,
        data.takesResponsibility,
        data.transparentCommunication,
        data.sharesInformation,
        data.organizesWork,
        data.growthMindsetScore,
        data.readinessTimeframe,
        data.isSuccessor,
        data.handlesCommunicationBarriers,
        data.reflectsOnResults,
        data.desiresRole,
        data.roleInterestLevel,
        data.comments
      ]);

      // Получаем имя сотрудника
      const empResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [data.employeeId]
      );
      const emp = empResult.rows[0];
      
      // Рассчитываем потенциал на основе growth_mindset_score
      let potential = 1; // Низкий
      if (data.growthMindsetScore >= 8) potential = 3; // Высокий
      else if (data.growthMindsetScore >= 5) potential = 2; // Средний
      
      const categoryMap = {
        '3-3': '⭐ ЗВЕЗДЫ',
        '3-2': '🔑 КЛЮЧЕВЫЕ ИГРОКИ',
        '3-1': '✅ ЭФФЕКТИВНЫЕ',
        '2-3': '🌱 РАЗВИВАЮЩИЕСЯ',
        '2-2': '⚖️ СТАБИЛЬНЫЕ',
        '2-1': '📊 СРЕДНИЕ',
        '1-3': '💎 ВЫСОКИЙ ПОТЕНЦИАЛ',
        '1-2': '⚠️ РИСК',
        '1-1': '👤 НОВИЧКИ'
      };
      
      // Performance будем брать из manager_evaluations позже
      console.log(`✅ ${emp.first_name} ${emp.last_name}: Потенциал=${potential} (growth score: ${data.growthMindsetScore})`);
    }

    console.log('\n📊 Проверяю распределение по матрице 9-box...\n');

    // Получаем статистику распределения
    // Рассчитываем performance из manager_evaluations, potential из growth_mindset_score
    const statsResult = await client.query(`
      SELECT 
        CASE
          WHEN COALESCE(me.performance_total, 0) >= 7 THEN 3
          WHEN COALESCE(me.performance_total, 0) >= 4 THEN 2
          ELSE 1
        END as performance_level,
        CASE
          WHEN pa.growth_mindset_score >= 8 THEN 3
          WHEN pa.growth_mindset_score >= 5 THEN 2
          ELSE 1
        END as potential_level,
        COUNT(*) as count,
        STRING_AGG(u.first_name || ' ' || u.last_name, ', ') as employees
      FROM potential_assessments pa
      JOIN users u ON pa.employee_id = u.id
      LEFT JOIN manager_evaluations me ON me.employee_id = pa.employee_id AND me.cycle_id = pa.cycle_id
      WHERE pa.cycle_id = 2
      GROUP BY performance_level, potential_level
      ORDER BY performance_level DESC, potential_level DESC
    `);

    console.log('Матрица 9-Box:');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const matrix = {
      3: { 3: [], 2: [], 1: [] },
      2: { 3: [], 2: [], 1: [] },
      1: { 3: [], 2: [], 1: [] }
    };

    statsResult.rows.forEach(row => {
      const perf = row.performance_level;
      const pot = row.potential_level;
      matrix[perf][pot].push(`${row.employees} (${row.count} чел.)`);
    });

    // Выводим матрицу
    console.log('                    ПОТЕНЦИАЛ');
    console.log('              Низкий | Средний | Высокий');
    console.log('            ─────────┼─────────┼─────────');
    console.log(`Высокая     ${formatCell(matrix[3][1])} | ${formatCell(matrix[3][2])} | ${formatCell(matrix[3][3])}`);
    console.log('ЭФФЕКТИВНОСТЬ ─────────┼─────────┼─────────');
    console.log(`Средняя     ${formatCell(matrix[2][1])} | ${formatCell(matrix[2][2])} | ${formatCell(matrix[2][3])}`);
    console.log('            ─────────┼─────────┼─────────');
    console.log(`Низкая      ${formatCell(matrix[1][1])} | ${formatCell(matrix[1][2])} | ${formatCell(matrix[1][3])}`);
    console.log('');

    console.log('\n✅ Данные для матрицы 9-box созданы!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n👋 Отключено от базы данных');
  }
}

function formatCell(employees) {
  if (employees.length === 0) return '   0   ';
  return `   ${employees.length}   `;
}

// Запускаем
seed9BoxData().catch(console.error);
