const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { query, testConnection } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'wink-performance-review-secret-key-2025';

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Проверка подключения к БД при старте
testConnection().then(connected => {
  if (connected) {
    console.log('✅ Соединение с PostgreSQL активно');
  } else {
    console.error('❌ Не удалось подключиться к PostgreSQL');
  }
});

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Авторизация
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя по email
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Генерация токена
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });

  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

// Получение информации о текущем пользователе
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, department, position, manager_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = result.rows[0];

    // Получаем информацию о руководителе если есть
    let manager = null;
    if (user.manager_id) {
      const managerResult = await query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [user.manager_id]
      );
      if (managerResult.rows.length > 0) {
        manager = managerResult.rows[0];
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      department: user.department,
      position: user.position,
      manager
    });

  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех пользователей
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let result;
    
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      // HR и Admin видят всех пользователей
      result = await query(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.role, 
          u.department, u.position, u.is_active, u.manager_id,
          m.first_name as manager_first_name, 
          m.last_name as manager_last_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        ORDER BY u.role, u.last_name
      `);
    } else if (req.user.role === 'manager') {
      // Менеджер видит всех пользователей (нужно для выбора коллег в оценке)
      // но в основном использует для просмотра своей команды на фронтенде
      result = await query(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.role, 
          u.department, u.position, u.is_active, u.manager_id,
          m.first_name as manager_first_name, 
          m.last_name as manager_last_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        ORDER BY u.role, u.last_name
      `);
    } else {
      // Обычные сотрудники видят только коллег (для запроса peer feedback)
      result = await query(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.role, 
          u.department, u.position, u.is_active, u.manager_id,
          m.first_name as manager_first_name, 
          m.last_name as manager_last_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        WHERE u.role IN ('employee', 'manager')
        ORDER BY u.role, u.last_name
      `);
    }

    const users = result.rows.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      full_name: `${u.first_name} ${u.last_name}`,
      role: u.role,
      department: u.department,
      position: u.position,
      manager_id: u.manager_id,
      is_active: u.is_active,
      manager: u.manager_first_name ? `${u.manager_first_name} ${u.manager_last_name}` : null
    }));

    res.json(users);

  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение циклов оценки
app.get('/api/cycles', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, start_date, end_date, status, created_at
      FROM review_cycles
      ORDER BY start_date DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Ошибка при получении циклов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание цикла оценки (только HR и Admin)
app.post('/api/cycles', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { name, start_date, end_date, status } = req.body;

    const result = await query(`
      INSERT INTO review_cycles (name, start_date, end_date, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, start_date, end_date, status || 'draft']);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Ошибка при создании цикла:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение целей сотрудника
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { cycle_id, user_id } = req.query;

    // Сотрудник может видеть только свои цели
    // Менеджер может видеть цели своих подчиненных
    // HR и Admin могут видеть все
    let queryText = `
      SELECT 
        g.*,
        u.first_name, u.last_name, u.email, u.position
      FROM employee_goals g
      JOIN users u ON g.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (cycle_id) {
      params.push(cycle_id);
      queryText += ` AND g.cycle_id = $${params.length}`;
    }

    if (req.user.role === 'employee') {
      params.push(req.user.id);
      queryText += ` AND g.user_id = $${params.length}`;
    } else if (req.user.role === 'manager') {
      // Менеджер видит цели своих подчиненных
      params.push(req.user.id);
      queryText += ` AND u.manager_id = $${params.length}`;
    } else if (user_id) {
      // HR/Admin могут фильтровать по конкретному пользователю
      params.push(user_id);
      queryText += ` AND g.user_id = $${params.length}`;
    }

    queryText += ` ORDER BY g.created_at DESC`;

    const result = await query(queryText, params);

    res.json(result.rows);

  } catch (error) {
    console.error('Ошибка при получении целей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание цели
app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { cycle_id, title, description, expected_deadline, expected_results, key_tasks } = req.body;

    // Автоматически определяем следующий номер цели для пользователя в этом цикле
    const maxGoalNumber = await query(`
      SELECT COALESCE(MAX(goal_number), 0) as max_number
      FROM employee_goals
      WHERE user_id = $1 AND cycle_id = $2
    `, [req.user.id, cycle_id]);

    const goal_number = (maxGoalNumber.rows[0].max_number || 0) + 1;

    const result = await query(`
      INSERT INTO employee_goals (
        user_id, cycle_id, goal_number, title, description, 
        expected_deadline, expected_results, key_tasks, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
      RETURNING *
    `, [req.user.id, cycle_id, goal_number, title, description, expected_deadline, expected_results, key_tasks]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Ошибка при создании цели:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление цели
app.patch('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const goalId = req.params.id;
    const updates = req.body;

    // Проверяем, что цель принадлежит пользователю
    const goalCheck = await query(
      'SELECT * FROM employee_goals WHERE id = $1',
      [goalId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    const goal = goalCheck.rows[0];

    // Сотрудник может редактировать только свои цели
    if (req.user.role === 'employee' && goal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на редактирование этой цели' });
    }

    // Формируем SET часть запроса
    const fields = [];
    const values = [];
    let paramCounter = 1;

    Object.keys(updates).forEach(key => {
      if (['title', 'description', 'expected_deadline', 'expected_results', 'key_tasks', 'status', 'rejection_comment'].includes(key)) {
        fields.push(`${key} = $${paramCounter}`);
        values.push(updates[key]);
        paramCounter++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Нет полей для обновления' });
    }

    // Добавляем updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(goalId);

    const updateQuery = `
      UPDATE employee_goals 
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    // Уведомления при изменении статуса
    const userInfo = await query('SELECT first_name, last_name FROM users WHERE id = $1', [goal.user_id]);
    const userName = `${userInfo.rows[0]?.first_name} ${userInfo.rows[0]?.last_name}`;
    
    if (updates.status === 'submitted') {
      console.log(`📧 Уведомление: Сотрудник ${userName} отправил цель на утверждение`);
      // TODO: Здесь можно добавить запись в таблицу notifications
    }
    
    if (updates.status === 'approved') {
      console.log(`✅ Уведомление: Руководитель утвердил цель сотрудника ${userName}`);
      // TODO: Уведомление сотруднику об утверждении
    }
    
    if (updates.status === 'rejected' && updates.rejection_comment) {
      console.log(`❌ Уведомление: Руководитель отклонил цель сотрудника ${userName}. Причина: ${updates.rejection_comment}`);
      // TODO: Уведомление сотруднику об отклонении с комментарием
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Ошибка при обновлении цели:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление цели
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const goalId = req.params.id;

    // Проверяем, что цель принадлежит пользователю
    const goalCheck = await query(
      'SELECT * FROM employee_goals WHERE id = $1',
      [goalId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    const goal = goalCheck.rows[0];

    // Только владелец может удалять цель (или admin/hr)
    if (req.user.role === 'employee' && goal.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав на удаление этой цели' });
    }

    // Удаляем цель
    await query('DELETE FROM employee_goals WHERE id = $1', [goalId]);

    res.json({ message: 'Цель успешно удалена', id: goalId });

  } catch (error) {
    console.error('Ошибка при удалении цели:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика (для дашбордов)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'admin' || req.user.role === 'hr') {
      // Общая статистика для HR/Admin
      const totalUsers = await query('SELECT COUNT(*) FROM users WHERE is_active = true');
      const totalCycles = await query('SELECT COUNT(*) FROM review_cycles');
      const totalGoals = await query('SELECT COUNT(*) FROM employee_goals');
      
      stats = {
        total_users: parseInt(totalUsers.rows[0].count),
        total_cycles: parseInt(totalCycles.rows[0].count),
        total_goals: parseInt(totalGoals.rows[0].count)
      };

    } else if (req.user.role === 'manager') {
      // Статистика для менеджера (его команда)
      const teamSize = await query('SELECT COUNT(*) FROM users WHERE manager_id = $1', [req.user.id]);
      const teamGoals = await query(`
        SELECT COUNT(*) FROM employee_goals g
        JOIN users u ON g.user_id = u.id
        WHERE u.manager_id = $1
      `, [req.user.id]);
      
      stats = {
        team_size: parseInt(teamSize.rows[0].count),
        team_goals: parseInt(teamGoals.rows[0].count)
      };

    } else {
      // Статистика для сотрудника
      const myGoals = await query('SELECT COUNT(*) FROM employee_goals WHERE user_id = $1', [req.user.id]);
      
      stats = {
        my_goals: parseInt(myGoals.rows[0].count)
      };
    }

    res.json(stats);

  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connected = await testConnection();
    res.json({ 
      status: 'OK', 
      message: 'WINK Performance Review API работает',
      database: connected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Проблема с подключением к базе данных' 
    });
  }
});

// ==================== PEER FEEDBACK ENDPOINTS ====================

// Получить список коллег для запроса оценки
app.get('/api/peer-feedback/colleagues', authenticateToken, async (req, res) => {
  try {
    // Получаем всех пользователей кроме текущего
    const result = await query(`
      SELECT id, first_name, last_name, email, position 
      FROM users 
      WHERE id != $1 AND is_active = true AND role IN ('employee', 'manager')
      ORDER BY first_name, last_name
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении списка коллег:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать запрос на оценку от коллеги
app.post('/api/peer-feedback/request', authenticateToken, async (req, res) => {
  try {
    const { reviewer_id, cycle_id, message } = req.body;

    if (!reviewer_id || !cycle_id) {
      return res.status(400).json({ error: 'Не указан коллега или цикл оценки' });
    }

    // Проверяем, что не запрашиваем оценку у самого себя
    if (reviewer_id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя запросить оценку у самого себя' });
    }

    // Проверяем, нет ли уже такого запроса
    const existingRequest = await query(`
      SELECT id FROM peer_feedback_requests 
      WHERE requester_id = $1 AND reviewer_id = $2 AND cycle_id = $3
    `, [req.user.id, reviewer_id, cycle_id]);

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Запрос этому коллеге уже отправлен' });
    }

    // Создаем запрос
    const result = await query(`
      INSERT INTO peer_feedback_requests (requester_id, reviewer_id, cycle_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, reviewer_id, cycle_id, message || null]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании запроса на оценку:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить исходящие запросы (которые я отправил)
app.get('/api/peer-feedback/my-requests', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.*,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name,
        u.email as reviewer_email,
        u.position as reviewer_position,
        c.name as cycle_name
      FROM peer_feedback_requests r
      JOIN users u ON r.reviewer_id = u.id
      JOIN review_cycles c ON r.cycle_id = c.id
      WHERE r.requester_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении исходящих запросов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить входящие запросы (где меня просят оценить)
app.get('/api/peer-feedback/pending-reviews', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.*,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.email as requester_email,
        u.position as requester_position,
        c.name as cycle_name
      FROM peer_feedback_requests r
      JOIN users u ON r.requester_id = u.id
      JOIN review_cycles c ON r.cycle_id = c.id
      WHERE r.reviewer_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении входящих запросов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отправить оценку коллеге
app.post('/api/peer-feedback/submit', authenticateToken, async (req, res) => {
  try {
    const {
      request_id,
      result_achievement_rating,
      personal_qualities_comment,
      interaction_quality_rating,
      improvement_suggestions
    } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: 'Не указан ID запроса' });
    }

    // Проверяем, что запрос существует и адресован текущему пользователю
    const requestCheck = await query(`
      SELECT * FROM peer_feedback_requests 
      WHERE id = $1 AND reviewer_id = $2 AND status = 'pending'
    `, [request_id, req.user.id]);

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Запрос не найден или уже обработан' });
    }

    const request = requestCheck.rows[0];

    // Создаем оценку
    const feedbackResult = await query(`
      INSERT INTO peer_feedbacks (
        request_id, requester_id, reviewer_id, cycle_id,
        result_achievement_rating, personal_qualities_comment, 
        interaction_quality_rating, improvement_suggestions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      request_id,
      request.requester_id,
      req.user.id,
      request.cycle_id,
      result_achievement_rating,
      personal_qualities_comment,
      interaction_quality_rating,
      improvement_suggestions
    ]);

    // Обновляем статус запроса
    await query(`
      UPDATE peer_feedback_requests 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [request_id]);

    res.json(feedbackResult.rows[0]);
  } catch (error) {
    console.error('Ошибка при отправке оценки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});// Получить полученные оценки от коллег
app.get('/api/peer-feedback/received', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        f.*,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name,
        u.position as reviewer_position,
        c.name as cycle_name
      FROM peer_feedbacks f
      JOIN users u ON f.reviewer_id = u.id
      JOIN review_cycles c ON f.cycle_id = c.id
      WHERE f.requester_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении оценок от коллег:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============ ОЦЕНКА МЕНЕДЖЕРА ============

// Создать оценку сотрудника от менеджера
app.post('/api/manager-evaluation/submit', authenticateToken, async (req, res) => {
  try {
    const {
      goal_id,
      employee_id,
      cycle_id,
      result_achievement_rating,
      personal_qualities_comment,
      personal_contribution_comment,
      interaction_quality_rating,
      improvement_suggestions,
      overall_rating,
      feedback_summary
    } = req.body;

    if (!goal_id || !employee_id || !cycle_id) {
      return res.status(400).json({ error: 'Не указаны обязательные поля' });
    }

    // Проверяем, что текущий пользователь - менеджер сотрудника
    const employeeCheck = await query(`
      SELECT * FROM users WHERE id = $1 AND manager_id = $2
    `, [employee_id, req.user.id]);

    if (employeeCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Вы не являетесь менеджером этого сотрудника' });
    }

    // Проверяем, есть ли уже оценка
    const existingEval = await query(`
      SELECT * FROM manager_evaluations 
      WHERE goal_id = $1 AND employee_id = $2 AND manager_id = $3 AND cycle_id = $4
    `, [goal_id, employee_id, req.user.id, cycle_id]);

    let result;
    if (existingEval.rows.length > 0) {
      // Обновляем существующую оценку
      result = await query(`
        UPDATE manager_evaluations SET
          result_achievement_rating = $1,
          personal_qualities_comment = $2,
          personal_contribution_comment = $3,
          interaction_quality_rating = $4,
          improvement_suggestions = $5,
          overall_rating = $6,
          feedback_summary = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `, [
        result_achievement_rating,
        personal_qualities_comment,
        personal_contribution_comment,
        interaction_quality_rating,
        improvement_suggestions,
        overall_rating,
        feedback_summary,
        existingEval.rows[0].id
      ]);
    } else {
      // Создаем новую оценку
      result = await query(`
        INSERT INTO manager_evaluations (
          goal_id, employee_id, manager_id, cycle_id,
          result_achievement_rating, personal_qualities_comment,
          personal_contribution_comment, interaction_quality_rating,
          improvement_suggestions, overall_rating, feedback_summary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        goal_id,
        employee_id,
        req.user.id,
        cycle_id,
        result_achievement_rating,
        personal_qualities_comment,
        personal_contribution_comment,
        interaction_quality_rating,
        improvement_suggestions,
        overall_rating,
        feedback_summary
      ]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании оценки менеджера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить оценки менеджера для сотрудника
app.get('/api/manager-evaluation/employee/:employeeId/cycle/:cycleId', authenticateToken, async (req, res) => {
  try {
    const { employeeId, cycleId } = req.params;

    const result = await query(`
      SELECT 
        me.*,
        g.title as goal_title,
        g.description as goal_description,
        u.first_name as employee_first_name,
        u.last_name as employee_last_name
      FROM manager_evaluations me
      JOIN employee_goals g ON me.goal_id = g.id
      JOIN users u ON me.employee_id = u.id
      WHERE me.employee_id = $1 AND me.cycle_id = $2 AND me.manager_id = $3
      ORDER BY me.created_at DESC
    `, [employeeId, cycleId, req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении оценок менеджера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все оценки менеджера для сотрудника (без фильтра по циклу)
app.get('/api/manager-evaluation/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await query(`
      SELECT 
        me.*,
        g.title as goal_title,
        g.description as goal_description,
        u.first_name as employee_first_name,
        u.last_name as employee_last_name,
        rc.name as cycle_name
      FROM manager_evaluations me
      JOIN employee_goals g ON me.goal_id = g.id
      JOIN users u ON me.employee_id = u.id
      JOIN review_cycles rc ON me.cycle_id = rc.id
      WHERE me.employee_id = $1
      ORDER BY me.created_at DESC
    `, [employeeId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении оценок менеджера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============= ОЦЕНКА ПОТЕНЦИАЛА СОТРУДНИКА =============

// Создать/обновить оценку потенциала
app.post('/api/potential-assessment/submit', authenticateToken, async (req, res) => {
  try {
    const {
      employee_id,
      cycle_id,
      // Профессиональные качества (5 чекбоксов)
      prof_responsibility,
      prof_result_oriented,
      prof_proactivity,
      prof_open_mindset,
      prof_team_player,
      professional_comment,
      // Личные качества (4 чекбокса)
      pers_took_responsibility,
      pers_transparent_communication,
      pers_shared_info,
      pers_organized_work,
      personal_comment,
      // Вопросы потенциала
      had_motivation_one_on_one,
      knows_miscommunication_cases,
      development_desire,
      is_successor,
      successor_ready_timing,
      turnover_risk,
      ole_priority_1,
      ole_priority_2
    } = req.body;

    // Расчет РЕЗУЛЬТАТИВНОСТИ (0-8 баллов)
    let performance_raw_score = 0;
    
    // Профессиональные качества (позитивные, +1 за каждое)
    if (prof_responsibility) performance_raw_score += 1;
    if (prof_result_oriented) performance_raw_score += 1;
    if (prof_proactivity) performance_raw_score += 1;
    if (prof_open_mindset) performance_raw_score += 1;
    if (prof_team_player) performance_raw_score += 1;
    
    // Дискоммуникация (негативный, +1 если НЕТ проблем)
    if (!knows_miscommunication_cases) performance_raw_score += 1;
    
    // ОЛЭ приоритеты
    if (ole_priority_1) performance_raw_score += 1;
    if (ole_priority_2) performance_raw_score += 1;

    // Итоговая оценка результативности: 4 = 1★, 5-7 = 2★, 8-11 = 3★
    let performance_final_score = 1;
    if (performance_raw_score >= 8) performance_final_score = 3;
    else if (performance_raw_score >= 5) performance_final_score = 2;
    else if (performance_raw_score >= 4) performance_final_score = 1;
    
    // Расчет ПОТЕНЦИАЛА (0-12 баллов)
    let potential_raw_score = 0;
    
    // Личные качества (негативные, +1 если проблем НЕ было)
    if (!pers_took_responsibility) potential_raw_score += 1;
    if (!pers_transparent_communication) potential_raw_score += 1;
    if (!pers_shared_info) potential_raw_score += 1;
    if (!pers_organized_work) potential_raw_score += 1;
    
    // Мотивация 1:1 (негативный, +1 если НЕ приходилось)
    if (!had_motivation_one_on_one) potential_raw_score += 1;
    
    // Желание развиваться (0-1 балл)
    if (development_desire === 'proactive' || development_desire === 'needs_help') {
      potential_raw_score += 1;
    }
    
    // Преемник (0-1 балл)
    if (is_successor) potential_raw_score += 1;
    
    // Готовность преемника (0-2 балла)
    if (successor_ready_timing === '1-2_years') potential_raw_score += 2;
    else if (successor_ready_timing === '3_years') potential_raw_score += 1;
    
    // Риск ухода (0-3 балла): 0-2=3, 3-5=2, 6-7=1, 8-10=0
    const risk = parseInt(turnover_risk) || 5;
    if (risk <= 2) potential_raw_score += 3;
    else if (risk <= 5) potential_raw_score += 2;
    else if (risk <= 7) potential_raw_score += 1;

    // Итоговая оценка потенциала: 1-7 = 1★, 8-12 = 2★, 13-16 = 3★
    let potential_final_score = 1;
    if (potential_raw_score >= 13) potential_final_score = 3;
    else if (potential_raw_score >= 8) potential_final_score = 2;
    else if (potential_raw_score >= 1) potential_final_score = 1;

    // Проверяем, существует ли уже оценка
    const existing = await query(`
      SELECT id FROM potential_assessments 
      WHERE employee_id = $1 AND cycle_id = $2
    `, [employee_id, cycle_id]);

    if (existing.rows.length > 0) {
      // Обновляем существующую
      await query(`
        UPDATE potential_assessments SET
          prof_responsibility = $1,
          prof_result_oriented = $2,
          prof_proactivity = $3,
          prof_open_mindset = $4,
          prof_team_player = $5,
          professional_comment = $6,
          pers_took_responsibility = $7,
          pers_transparent_communication = $8,
          pers_shared_info = $9,
          pers_organized_work = $10,
          personal_comment = $11,
          had_motivation_one_on_one = $12,
          knows_miscommunication_cases = $13,
          development_desire = $14,
          is_successor = $15,
          successor_ready_timing = $16,
          turnover_risk = $17,
          ole_priority_1 = $18,
          ole_priority_2 = $19,
          performance_raw_score = $20,
          performance_final_score = $21,
          potential_raw_score = $22,
          potential_final_score = $23,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $24 AND cycle_id = $25
      `, [
        prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player,
        professional_comment,
        pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work,
        personal_comment,
        had_motivation_one_on_one, knows_miscommunication_cases,
        development_desire, is_successor, successor_ready_timing,
        risk, ole_priority_1, ole_priority_2,
        performance_raw_score, performance_final_score,
        potential_raw_score, potential_final_score,
        employee_id, cycle_id
      ]);
    } else {
      // Создаем новую
      await query(`
        INSERT INTO potential_assessments (
          employee_id, manager_id, cycle_id,
          prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player,
          professional_comment,
          pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work,
          personal_comment,
          had_motivation_one_on_one, knows_miscommunication_cases,
          development_desire, is_successor, successor_ready_timing,
          turnover_risk, ole_priority_1, ole_priority_2,
          performance_raw_score, performance_final_score,
          potential_raw_score, potential_final_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      `, [
        employee_id, req.user.id, cycle_id,
        prof_responsibility, prof_result_oriented, prof_proactivity, prof_open_mindset, prof_team_player,
        professional_comment,
        pers_took_responsibility, pers_transparent_communication, pers_shared_info, pers_organized_work,
        personal_comment,
        had_motivation_one_on_one, knows_miscommunication_cases,
        development_desire, is_successor, successor_ready_timing,
        risk, ole_priority_1, ole_priority_2,
        performance_raw_score, performance_final_score,
        potential_raw_score, potential_final_score
      ]);
    }

    res.json({ 
      message: 'Оценка потенциала успешно сохранена',
      performance_raw_score,
      performance_final_score,
      potential_raw_score,
      potential_final_score
    });
  } catch (error) {
    console.error('Ошибка при сохранении оценки потенциала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// HR Analytics: Общая статистика для HR Dashboard
app.get('/api/hr/analytics', authenticateToken, async (req, res) => {
  try {
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Общий охват оценки
    const totalUsersResult = await query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    
    const completedEvaluationsResult = await query(`
      SELECT COUNT(DISTINCT employee_id) FROM manager_evaluations
    `);
    const completedUsers = parseInt(completedEvaluationsResult.rows[0].count);
    const coveragePercent = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

    // Средний рейтинг по компании  
    const avgRatingResult = await query(`
      SELECT AVG(performance_total) as avg_rating 
      FROM manager_evaluations 
      WHERE performance_total IS NOT NULL
    `);
    const avgRating = avgRatingResult.rows[0].avg_rating 
      ? parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(1) 
      : '0.0';

    // Завершенных оценок
    const totalEvaluationsResult = await query(`
      SELECT COUNT(*) FROM manager_evaluations
    `);
    const completedEvaluations = parseInt(totalEvaluationsResult.rows[0].count);
    
    const totalExpectedResult = await query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const totalExpected = parseInt(totalExpectedResult.rows[0].count);
    const completionPercent = totalExpected > 0 ? Math.round((completedEvaluations / totalExpected) * 100) : 0;

    // Планов развития
    const developmentPlansResult = await query(`
      SELECT COUNT(*) FROM employee_goals WHERE status IN ('in_progress', 'approved')
    `);
    const developmentPlans = parseInt(developmentPlansResult.rows[0].count);

    res.json({
      coverage: {
        value: `${coveragePercent}%`,
        trend: '+5%'
      },
      avgRating: {
        value: avgRating,
        trend: '+0.3'
      },
      completedEvaluations: {
        value: `${completedEvaluations}/${totalExpected}`,
        trend: `${completionPercent}%`
      },
      developmentPlans: {
        value: developmentPlans,
        trend: '+12'
      }
    });

  } catch (error) {
    console.error('Ошибка при получении HR аналитики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// HR Analytics: Баллы сотрудников для калькуляции
app.get('/api/hr/employee-scores', authenticateToken, async (req, res) => {
  try {
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT 
        u.id,
        u.role,
        u.position,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COALESCE(AVG(sa.answer_score), 0) as self_score,
        COALESCE(MAX(me.performance_total), 0) as manager_score,
        COALESCE(AVG(pr.answer_score), 0) as peer_score,
        MAX(me.created_at) as last_review_date,
        MAX(sa.created_at) as last_self_assessment_date
      FROM users u
      LEFT JOIN self_assessments sa ON u.id = sa.user_id
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id
      LEFT JOIN peer_reviews pr ON u.id = pr.employee_id
      WHERE u.is_active = true AND u.role IN ('employee', 'manager')
      GROUP BY u.id, u.role, u.position, u.first_name, u.last_name
      LIMIT 50
    `);

    const scores = result.rows.map(row => {
      // Самооценка в шкале 1-5, пересчитываем в 1-10 (умножаем на 2)
      const selfScore = (parseFloat(row.self_score) || 0) * 2;
      
      // Оценка руководителя уже в шкале 1-10
      // Для руководителей (role='manager') не учитываем оценку менеджера
      const managerScore = row.role === 'manager' ? 0 : (parseFloat(row.manager_score) || 0);
      
      // Оценка коллег в шкале 1-5, пересчитываем в 1-10 (умножаем на 2)
      const peerScore = (parseFloat(row.peer_score) || 0) * 2;
      
      // Считаем только заполненные оценки (не нулевые)
      let sum = 0;
      let count = 0;
      
      if (selfScore > 0) {
        sum += selfScore;
        count++;
      }
      if (managerScore > 0) {
        sum += managerScore;
        count++;
      }
      if (peerScore > 0) {
        sum += peerScore;
        count++;
      }
      
      const total = count > 0 ? sum / count : 0;

      // Определяем статус Performance Review
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      const currentYear = now.getFullYear();
      
      // Проверяем дату последней оценки
      const lastReviewDate = row.last_review_date ? new Date(row.last_review_date) : null;
      const lastSelfAssessmentDate = row.last_self_assessment_date ? new Date(row.last_self_assessment_date) : null;
      
      let reviewStatus = 'not_started'; // not_started, in_progress, completed, overdue
      let reviewDueDate = null;
      
      // Performance Review должен быть пройден в октябре 2025
      const reviewMonth = 9; // октябрь (0-based)
      const reviewYear = 2025;
      
      // Проверяем, есть ли хоть какая-то оценка
      const hasAnyEvaluation = selfScore > 0 || managerScore > 0 || peerScore > 0;
      
      // Проверяем полноту оценки (для руководителей 2 из 2, для сотрудников 3 из 3)
      const maxExpectedEvaluations = row.role === 'manager' ? 2 : 3;
      const completedEvaluations = (selfScore > 0 ? 1 : 0) + (managerScore > 0 ? 1 : 0) + (peerScore > 0 ? 1 : 0);
      
      if (currentYear > reviewYear || (currentYear === reviewYear && currentMonth > reviewMonth)) {
        // Уже прошел срок review
        if (completedEvaluations >= maxExpectedEvaluations) {
          reviewStatus = 'completed';
        } else if (hasAnyEvaluation) {
          reviewStatus = 'overdue';
        } else {
          reviewStatus = 'overdue';
        }
      } else if (currentYear === reviewYear && currentMonth === reviewMonth) {
        // Текущий месяц - октябрь 2025, review должен быть пройден
        if (completedEvaluations >= maxExpectedEvaluations) {
          reviewStatus = 'completed';
        } else if (hasAnyEvaluation) {
          reviewStatus = 'in_progress';
        } else {
          reviewStatus = 'not_started';
        }
      } else {
        // До октября 2025
        if (completedEvaluations >= maxExpectedEvaluations) {
          reviewStatus = 'completed';
        } else if (hasAnyEvaluation) {
          reviewStatus = 'in_progress';
        } else {
          reviewStatus = 'not_started';
        }
      }
      
      reviewDueDate = new Date(reviewYear, reviewMonth, 31); // 31 октября 2025

      return {
        id: row.id,
        name: row.name,
        position: row.position || 'Не указано',
        selfScore: parseFloat(selfScore.toFixed(2)),
        managerScore: parseFloat(managerScore.toFixed(2)),
        peerScore: parseFloat(peerScore.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        reviewStatus: reviewStatus,
        reviewDueDate: reviewDueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        completedEvaluations: completedEvaluations,
        maxExpectedEvaluations: maxExpectedEvaluations
      };
    });
    
    // Сортируем по итоговому баллу (от большего к меньшему)
    scores.sort((a, b) => b.total - a.total);

    res.json(scores);

  } catch (error) {
    console.error('Ошибка при получении баллов сотрудников:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// HR Analytics: 9-Box матрица данные
app.get('/api/hr/nine-box', authenticateToken, async (req, res) => {
  try {
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Получаем оценки потенциала и производительности
    // Потенциал рассчитывается из growth_mindset_score
    // Performance рассчитывается из manager_evaluations.performance_total
    const result = await query(`
      SELECT 
        COUNT(*) as count,
        CASE 
          WHEN pa.growth_mindset_score >= 8 THEN 'high'
          WHEN pa.growth_mindset_score >= 5 THEN 'medium'
          ELSE 'low'
        END as potential,
        CASE 
          WHEN COALESCE(me.performance_total, 0) >= 7 THEN 'high'
          WHEN COALESCE(me.performance_total, 0) >= 4 THEN 'medium'
          ELSE 'low'
        END as performance
      FROM users u
      INNER JOIN potential_assessments pa ON u.id = pa.employee_id AND pa.cycle_id = 2
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id AND me.cycle_id = 2
      WHERE u.is_active = true AND u.role NOT IN ('hr', 'admin')
        AND pa.growth_mindset_score IS NOT NULL
      GROUP BY potential, performance
    `);

    console.log('📊 9-Box raw data:', result.rows);

    // Формируем матрицу 3x3
    const matrix = {
      high_high: 0,    // Высокая эффективность + Высокий потенциал (Звезды)
      high_medium: 0,  // Высокая эффективность + Средний потенциал (Ключевые игроки)
      high_low: 0,     // Высокая эффективность + Низкий потенциал (Топ-исполнители)
      medium_high: 0,  // Средняя эффективность + Высокий потенциал (Развивающиеся)
      medium_medium: 0,// Средняя эффективность + Средний потенциал (Стабильные)
      medium_low: 0,   // Средняя эффективность + Низкий потенциал (Эффективные)
      low_high: 0,     // Низкая эффективность + Высокий потенциал (Новички)
      low_medium: 0,   // Низкая эффективность + Средний потенциал (Риск)
      low_low: 0       // Низкая эффективность + Низкий потенциал (Критические)
    };

    result.rows.forEach(row => {
      // performance_potential (например: high_medium означает высокая эффективность + средний потенциал)
      const key = `${row.performance}_${row.potential}`;
      matrix[key] = parseInt(row.count);
      console.log(`  ${key}: ${row.count} чел.`);
    });

    console.log('📊 Final matrix:', matrix);

    res.json(matrix);

  } catch (error) {
    console.error('Ошибка при получении данных 9-Box:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить сотрудников из конкретной ячейки 9-Box матрицы
app.get('/api/hr/nine-box-employees', authenticateToken, async (req, res) => {
  try {
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { performance, potential } = req.query;

    if (!performance || !potential) {
      return res.status(400).json({ error: 'Необходимо указать performance и potential' });
    }

    // Преобразуем уровни в числовые значения (1=низкий, 2=средний, 3=высокий)
    const perfLevel = parseInt(performance);
    const potLevel = parseInt(potential);

    // Получаем сотрудников с оценками потенциала и эффективности
    const result = await query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.position,
        u.email,
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
        me.performance_total,
        pa.growth_mindset_score
      FROM users u
      LEFT JOIN potential_assessments pa ON u.id = pa.employee_id AND pa.cycle_id = 2
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id AND me.cycle_id = 2
      WHERE u.is_active = true 
        AND u.role NOT IN ('hr', 'admin')
        AND pa.id IS NOT NULL
        AND me.id IS NOT NULL
    `);

    // Фильтруем по уровням performance и potential
    const filteredEmployees = result.rows.filter(emp => {
      return emp.performance_level === perfLevel && emp.potential_level === potLevel;
    });

    res.json(filteredEmployees);

  } catch (error) {
    console.error('Ошибка при получении сотрудников из ячейки 9-Box:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить оценку потенциала для сотрудника
app.get('/api/potential-assessment/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await query(`
      SELECT 
        pa.*,
        u.first_name as employee_first_name,
        u.last_name as employee_last_name,
        rc.name as cycle_name
      FROM potential_assessments pa
      JOIN users u ON pa.employee_id = u.id
      JOIN review_cycles rc ON pa.cycle_id = rc.id
      WHERE pa.employee_id = $1
      ORDER BY pa.created_at DESC
    `, [employeeId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении оценки потенциала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить мой рейтинг (для текущего пользователя)
app.get('/api/employee/my-rating', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔍 Запрос рейтинга для пользователя ID:', userId);

    // Получаем информацию о пользователе
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    // Самооценка
    const selfAssessmentResult = await pool.query(
      `SELECT competencies_score, achievements_score, goals_completion_score, ole_priorities_score 
       FROM self_assessments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    let selfScore = 0;
    if (selfAssessmentResult.rows.length > 0) {
      const sa = selfAssessmentResult.rows[0];
      selfScore = ((sa.competencies_score || 0) + (sa.achievements_score || 0) + 
                   (sa.goals_completion_score || 0) + (sa.ole_priorities_score || 0)) / 4;
    }

    // Оценка от коллег (peer reviews)
    const peerReviewsResult = await pool.query(
      `SELECT AVG((collaboration_score + quality_score + leadership_score + innovation_score) / 4.0) as avg_score
       FROM peer_feedback 
       WHERE reviewee_id = $1 AND status = 'completed'`,
      [userId]
    );

    const peerScore = peerReviewsResult.rows[0]?.avg_score || 0;

    // Оценка от менеджера (только для не-руководителей)
    let managerScore = 0;
    if (user.role !== 'manager') {
      const managerEvalResult = await pool.query(
        `SELECT performance_total FROM manager_evaluations 
         WHERE employee_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );
      managerScore = managerEvalResult.rows[0]?.performance_total || 0;
    }

    // Рассчитываем общий рейтинг
    let totalScore = 0;
    let scoreCount = 0;

    if (selfScore > 0) {
      totalScore += selfScore;
      scoreCount++;
    }
    if (peerScore > 0) {
      totalScore += parseFloat(peerScore);
      scoreCount++;
    }
    if (managerScore > 0) {
      totalScore += managerScore;
      scoreCount++;
    }

    totalScore = scoreCount > 0 ? (totalScore / scoreCount) : 0;

    // Определяем категорию рейтинга
    let ratingLabel = 'Нет данных';
    if (totalScore >= 8) {
      ratingLabel = 'Отличный результат';
    } else if (totalScore >= 6) {
      ratingLabel = 'Хороший результат';
    } else if (totalScore >= 4) {
      ratingLabel = 'Удовлетворительный результат';
    } else if (totalScore > 0) {
      ratingLabel = 'Требуется улучшение';
    }

    // Получаем предыдущий рейтинг для расчета тренда (упрощенно)
    // В реальности нужно брать из предыдущего периода оценки
    const previousScore = totalScore > 0 ? totalScore - 0.5 : 0;
    const trend = totalScore - previousScore;

    console.log('✅ Рейтинг рассчитан:', {
      totalScore: totalScore.toFixed(1),
      ratingLabel,
      trend: trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)
    });

    res.json({
      score: parseFloat(totalScore.toFixed(1)),
      label: ratingLabel,
      trend: trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1),
      components: {
        selfScore: parseFloat(selfScore.toFixed(1)),
        peerScore: parseFloat(peerScore.toFixed(1)),
        managerScore: parseFloat(managerScore.toFixed(1))
      }
    });

  } catch (error) {
    console.error('❌ Ошибка при получении рейтинга:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// HR: Детальная информация о сотруднике
app.get('/api/hr/employee/:id/details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Получаем информацию о сотруднике
    const employeeResult = await query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.role
      FROM users u
      WHERE u.id = $1
    `, [id]);

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const employee = employeeResult.rows[0];

    // Получаем самооценку с вопросами и задачами
    const selfAssessmentResult = await query(`
      SELECT 
        sa.answer_score,
        sa.answer_text,
        sa.created_at,
        saq.question_text,
        t.name as task_name,
        CONCAT(u.first_name, ' ', u.last_name) as evaluator_name
      FROM self_assessments sa
      LEFT JOIN self_assessment_questions saq ON sa.question_id = saq.id
      LEFT JOIN tasks t ON sa.task_id = t.id
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE sa.user_id = $1
      ORDER BY sa.created_at DESC, saq.display_order
    `, [id]);

    // Средний балл самооценки (в шкале 1-10)
    const selfScore = selfAssessmentResult.rows.length > 0
      ? (selfAssessmentResult.rows.reduce((sum, r) => sum + r.answer_score, 0) / selfAssessmentResult.rows.length * 2).toFixed(2)
      : 0;

    // Получаем оценку руководителя (только для НЕ руководителей)
    let managerEvaluation = null;
    if (employee.role !== 'manager') {
      const managerEvaluationResult = await query(`
        SELECT 
          me.*,
          CONCAT(m.first_name, ' ', m.last_name) as manager_name,
          rc.name as cycle_name
        FROM manager_evaluations me
        LEFT JOIN users m ON me.manager_id = m.id
        LEFT JOIN review_cycles rc ON me.cycle_id = rc.id
        WHERE me.employee_id = $1
        ORDER BY me.created_at DESC
        LIMIT 1
      `, [id]);
      
      managerEvaluation = managerEvaluationResult.rows[0] || null;
    }

    // Получаем оценки коллег с вопросами и задачами
    const peerReviewsResult = await query(`
      SELECT 
        pr.answer_score,
        pr.answer_text,
        pr.created_at,
        prq.question_text,
        t.name as task_name,
        CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_name,
        CONCAT(employee.first_name, ' ', employee.last_name) as employee_name
      FROM peer_reviews pr
      LEFT JOIN peer_review_questions prq ON pr.question_id = prq.id
      LEFT JOIN tasks t ON pr.task_id = t.id
      LEFT JOIN users reviewer ON pr.respondent_id = reviewer.id
      LEFT JOIN users employee ON pr.employee_id = employee.id
      WHERE pr.employee_id = $1
      ORDER BY pr.created_at DESC, reviewer.first_name, prq.display_order
    `, [id]);

    // Средний балл от коллег (в шкале 1-10)
    const peerScore = peerReviewsResult.rows.length > 0
      ? (peerReviewsResult.rows.reduce((sum, r) => sum + r.answer_score, 0) / peerReviewsResult.rows.length * 2).toFixed(2)
      : 0;

    // Получаем оценку потенциала с данными оценщика
    const potentialAssessmentResult = await query(`
      SELECT 
        pa.*,
        CONCAT(m.first_name, ' ', m.last_name) as assessor_name,
        rc.name as cycle_name
      FROM potential_assessments pa
      LEFT JOIN users m ON pa.manager_id = m.id
      LEFT JOIN review_cycles rc ON pa.cycle_id = rc.id
      WHERE pa.employee_id = $1
      ORDER BY pa.created_at DESC
      LIMIT 1
    `, [id]);

    const potentialAssessment = potentialAssessmentResult.rows[0] || null;

    // Расчет итогового балла
    let totalScore = 0;
    let count = 0;

    if (parseFloat(selfScore) > 0) {
      totalScore += parseFloat(selfScore);
      count++;
    }

    // Оценку менеджера учитываем только для НЕ руководителей
    if (employee.role !== 'manager' && managerEvaluation && managerEvaluation.performance_total > 0) {
      totalScore += managerEvaluation.performance_total;
      count++;
    }

    if (parseFloat(peerScore) > 0) {
      totalScore += parseFloat(peerScore);
      count++;
    }

    totalScore = count > 0 ? (totalScore / count).toFixed(2) : 0;

    // Определение статуса оценки
    let evaluationStatus = 'Не начато';
    const maxExpectedEvaluations = employee.role === 'manager' ? 2 : 3; // Для руководителей только 2 оценки (без менеджера)
    
    if (count === maxExpectedEvaluations) {
      evaluationStatus = 'Завершено';
    } else if (count > 0) {
      evaluationStatus = 'В процессе';
    }

    res.json({
      employee: {
        ...employee,
        selfScore,
        peerScore,
        totalScore,
        evaluationStatus,
        position: employee.role === 'manager' ? 'Руководитель' : 'Сотрудник'
      },
      evaluations: {
        selfAssessment: selfAssessmentResult.rows,
        managerEvaluation,
        peerReviews: peerReviewsResult.rows,
        potentialAssessment
      }
    });

  } catch (error) {
    console.error('Ошибка при получении детальных данных сотрудника:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить результаты калькуляции для сотрудника (Функционал 3)
app.get('/api/employee/calculation-results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка доступа: пользователь может видеть только свои результаты
    if (req.user.id !== parseInt(id) && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Получаем информацию о сотруднике
    const employeeResult = await query(`
      SELECT 
        u.id,
        u.role,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email
      FROM users u
      WHERE u.id = $1
    `, [id]);

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const employee = employeeResult.rows[0];

    // Получаем самооценку
    const selfAssessmentResult = await query(`
      SELECT answer_score, created_at
      FROM self_assessments
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [id]);

    const selfScore = selfAssessmentResult.rows.length > 0
      ? (selfAssessmentResult.rows.reduce((sum, r) => sum + r.answer_score, 0) / selfAssessmentResult.rows.length * 2)
      : 0;

    // Получаем оценку руководителя (только для НЕ руководителей)
    let managerScore = 0;
    if (employee.role !== 'manager') {
      const managerEvaluationResult = await query(`
        SELECT performance_total
        FROM manager_evaluations
        WHERE employee_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [id]);
      
      if (managerEvaluationResult.rows.length > 0) {
        managerScore = managerEvaluationResult.rows[0].performance_total;
      }
    }

    // Получаем оценки коллег
    const peerReviewsResult = await query(`
      SELECT answer_score, created_at
      FROM peer_reviews
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `, [id]);

    const peerScore = peerReviewsResult.rows.length > 0
      ? (peerReviewsResult.rows.reduce((sum, r) => sum + r.answer_score, 0) / peerReviewsResult.rows.length * 2)
      : 0;

    // Расчет итогового балла
    let totalScore = 0;
    let evaluationsCount = 0;

    if (selfScore > 0) {
      totalScore += selfScore;
      evaluationsCount++;
    }
    if (managerScore > 0 && employee.role !== 'manager') {
      totalScore += managerScore;
      evaluationsCount++;
    }
    if (peerScore > 0) {
      totalScore += peerScore;
      evaluationsCount++;
    }

    totalScore = evaluationsCount > 0 ? totalScore / evaluationsCount : 0;

    // Определяем статус
    const maxExpectedEvaluations = employee.role === 'manager' ? 2 : 3;
    const status = evaluationsCount >= maxExpectedEvaluations ? 'completed' : 'in_progress';

    // Получаем название цикла
    const cycleResult = await query(`
      SELECT name 
      FROM review_cycles 
      WHERE status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    // Получаем дату последнего обновления
    const lastUpdatedResult = await query(`
      SELECT MAX(created_at) as last_updated
      FROM (
        SELECT created_at FROM self_assessments WHERE user_id = $1
        UNION ALL
        SELECT created_at FROM manager_evaluations WHERE employee_id = $1
        UNION ALL
        SELECT created_at FROM peer_reviews WHERE employee_id = $1
      ) as all_evaluations
    `, [id]);

    res.json({
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      totalScore: parseFloat(totalScore.toFixed(2)),
      selfScore: parseFloat(selfScore.toFixed(2)),
      managerScore: parseFloat(managerScore.toFixed(2)),
      peerScore: parseFloat(peerScore.toFixed(2)),
      selfAssessmentCount: selfAssessmentResult.rows.length,
      peerReviewsCount: peerReviewsResult.rows.length,
      evaluationsCount: evaluationsCount,
      maxExpectedEvaluations: maxExpectedEvaluations,
      status: status,
      cycleName: cycleResult.rows[0]?.name || 'Первое полугодие 2025',
      lastUpdated: lastUpdatedResult.rows[0]?.last_updated || null,
      instructions: null // Можно добавить в базу позже
    });

  } catch (error) {
    console.error('Ошибка при получении результатов калькуляции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сохранить итоги для сотрудника
app.post('/api/employee/save-summary/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { summaryText } = req.body;
    
    // Проверка доступа
    if (req.user.id !== parseInt(id) && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Сохраняем итоги в таблицу employee_summaries (создадим если нет)
    await query(`
      CREATE TABLE IF NOT EXISTS employee_summaries (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id),
        cycle_id INTEGER REFERENCES review_cycles(id),
        summary_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Получаем активный цикл
    const cycleResult = await query(`
      SELECT id FROM review_cycles WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
    `);
    const cycleId = cycleResult.rows[0]?.id || null;

    // Проверяем, есть ли уже запись
    const existingResult = await query(`
      SELECT id FROM employee_summaries WHERE employee_id = $1 AND cycle_id = $2
    `, [id, cycleId]);

    if (existingResult.rows.length > 0) {
      // Обновляем существующую запись
      await query(`
        UPDATE employee_summaries 
        SET summary_text = $1, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND cycle_id = $3
      `, [summaryText, id, cycleId]);
    } else {
      // Создаем новую запись
      await query(`
        INSERT INTO employee_summaries (employee_id, cycle_id, summary_text)
        VALUES ($1, $2, $3)
      `, [id, cycleId, summaryText]);
    }

    res.json({ success: true, message: 'Итоги сохранены успешно' });

  } catch (error) {
    console.error('Ошибка при сохранении итогов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// REVIEW PERIODS & NOTIFICATIONS
// ============================================

// Получить периоды оценки для команды менеджера
app.get('/api/manager/team-review-periods', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const managerId = req.user.role === 'manager' ? req.user.id : null;
    
    let whereClause = '';
    let params = [];
    
    if (managerId) {
      // Для менеджера - только его команда
      whereClause = 'WHERE u.manager_id = $1';
      params = [managerId];
    }
    // Для HR/Admin - все сотрудники (без WHERE)

    const result = await query(`
      SELECT 
        urp.id,
        urp.user_id,
        u.first_name,
        u.last_name,
        u.position,
        u.role,
        urp.cycle_id,
        rc.name as cycle_name,
        urp.start_date,
        urp.end_date,
        urp.status,
        urp.notification_sent,
        urp.reminder_sent,
        CASE 
          WHEN CURRENT_DATE < urp.start_date THEN 'upcoming'
          WHEN CURRENT_DATE > urp.end_date THEN 'expired'
          WHEN urp.status = 'completed' THEN 'completed'
          ELSE 'active'
        END as period_status,
        CURRENT_DATE BETWEEN urp.start_date AND urp.end_date as is_active
      FROM user_review_periods urp
      JOIN users u ON u.id = urp.user_id
      JOIN review_cycles rc ON rc.id = urp.cycle_id
      ${whereClause}
      ORDER BY urp.start_date, u.last_name
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка загрузки периодов оценки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверить, можно ли оценивать сотрудника
app.get('/api/manager/can-evaluate/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const cycleId = 2; // Текущий цикл

    const result = await query(`
      SELECT 
        urp.*,
        CURRENT_DATE BETWEEN urp.start_date AND urp.end_date as is_active,
        CASE 
          WHEN CURRENT_DATE < urp.start_date THEN 'not_started'
          WHEN CURRENT_DATE > urp.end_date THEN 'expired'
          WHEN urp.status = 'completed' THEN 'completed'
          ELSE 'active'
        END as period_status
      FROM user_review_periods urp
      WHERE urp.user_id = $1 AND urp.cycle_id = $2
    `, [employeeId, cycleId]);

    if (result.rows.length === 0) {
      return res.json({
        canEvaluate: false,
        reason: 'no_period',
        message: 'Период оценки для этого сотрудника не настроен'
      });
    }

    const period = result.rows[0];

    if (period.period_status === 'not_started') {
      return res.json({
        canEvaluate: false,
        reason: 'not_started',
        message: `Период оценки начнется ${new Date(period.start_date).toLocaleDateString('ru-RU')}`,
        start_date: period.start_date,
        end_date: period.end_date
      });
    }

    if (period.period_status === 'expired') {
      return res.json({
        canEvaluate: false,
        reason: 'expired',
        message: `Период оценки завершился ${new Date(period.end_date).toLocaleDateString('ru-RU')}`,
        start_date: period.start_date,
        end_date: period.end_date
      });
    }

    if (period.period_status === 'completed') {
      return res.json({
        canEvaluate: false,
        reason: 'completed',
        message: 'Оценка уже завершена',
        start_date: period.start_date,
        end_date: period.end_date
      });
    }

    res.json({
      canEvaluate: true,
      reason: 'active',
      message: 'Период оценки активен',
      start_date: period.start_date,
      end_date: period.end_date
    });
  } catch (error) {
    console.error('Ошибка проверки возможности оценки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запросить ранний Performance Review у HR
app.post('/api/manager/request-early-review', authenticateToken, async (req, res) => {
  try {
    const { employeeId, reason } = req.body;

    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Только менеджеры могут запрашивать ранние оценки' });
    }

    // Создаем запрос в таблице notifications или отдельной таблице early_review_requests
    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_user_id, created_at)
      VALUES (
        (SELECT id FROM users WHERE role = 'hr' LIMIT 1),
        'early_review_request',
        'Запрос на ранний Performance Review',
        $1,
        $2,
        CURRENT_TIMESTAMP
      )
    `, [
      `Менеджер запросил ранний Performance Review для сотрудника. Причина: ${reason}`,
      employeeId
    ]);

    res.json({
      success: true,
      message: 'Запрос отправлен в HR'
    });
  } catch (error) {
    console.error('Ошибка отправки запроса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить уведомления для пользователя
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        n.*,
        u.first_name,
        u.last_name
      FROM notifications n
      LEFT JOIN users u ON u.id = n.related_user_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка загрузки уведомлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отметить уведомление как прочитанное
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await query(`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка отметки уведомления:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  WINK Performance Review API           ║
║  Сервер запущен на порту ${PORT}        ║
║  http://localhost:${PORT}              ║
╚════════════════════════════════════════╝
  `);
  console.log('📝 Доступные эндпоинты:');
  console.log('   POST /api/auth/login - Авторизация');
  console.log('   GET  /api/auth/me - Текущий пользователь');
  console.log('   GET  /api/users - Список пользователей');
  console.log('   GET  /api/cycles - Циклы оценки');
  console.log('   POST /api/cycles - Создать цикл');
  console.log('   GET  /api/goals - Получить цели');
  console.log('   POST /api/goals - Создать цель');
  console.log('   GET  /api/dashboard/stats - Статистика');
  console.log('   GET  /api/hr/analytics - HR аналитика');
  console.log('   GET  /api/hr/employee-scores - Баллы сотрудников');
  console.log('   GET  /api/hr/nine-box - 9-Box матрица');
  console.log('   GET  /api/peer-feedback/colleagues - Список коллег');
  console.log('   POST /api/peer-feedback/request - Запросить оценку');
  console.log('   GET  /api/peer-feedback/my-requests - Мои запросы');
  console.log('   GET  /api/peer-feedback/pending-reviews - Ожидающие оценки');
  console.log('   POST /api/peer-feedback/submit - Отправить оценку');
  console.log('   GET  /api/peer-feedback/received - Полученные оценки');
  console.log('   POST /api/manager-evaluation/submit - Оценка сотрудника менеджером');
  console.log('   GET  /api/manager-evaluation/employee/:id/cycle/:id - Оценки сотрудника');
  console.log('   GET  /api/health - Проверка здоровья API\n');
});
