// ==================== SELF-ASSESSMENT ENDPOINT ====================
app.get('/api/self-assessment/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
    const result = await query(
      `SELECT * FROM self_assessments WHERE user_id = $1 ORDER BY id DESC`,
      [employeeId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
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
      overall_rating
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
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [
        result_achievement_rating,
        personal_qualities_comment,
        personal_contribution_comment,
        interaction_quality_rating,
        improvement_suggestions,
        overall_rating,
        existingEval.rows[0].id
      ]);
    } else {
      // Создаем новую оценку
      result = await query(`
        INSERT INTO manager_evaluations (
          goal_id, employee_id, manager_id, cycle_id,
          result_achievement_rating, personal_qualities_comment,
          personal_contribution_comment, interaction_quality_rating,
          improvement_suggestions, overall_rating
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        overall_rating
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

// ==================== EARLY PR WORKFLOW ENDPOINTS ====================

// 1. Запрос раннего PR от сотрудника
app.post('/api/review-periods/:periodId/request-early', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const userId = req.user.id;

    const period = await query(
      'SELECT * FROM employee_review_periods WHERE id = $1 AND user_id = $2',
      [periodId, userId]
    );

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    await query(`
      UPDATE employee_review_periods
      SET status = 'pending_manager_approval',
          requested_early_at = NOW()
      WHERE id = $1
    `, [periodId]);

    const userInfo = await query(
      'SELECT u.*, m.id as manager_id FROM users u LEFT JOIN users m ON u.manager_id = m.id WHERE u.id = $1',
      [userId]
    );

    if (userInfo.rows[0].manager_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        userInfo.rows[0].manager_id,
        'early_pr_request',
        'Запрос раннего Performance Review',
        `${userInfo.rows[0].first_name} ${userInfo.rows[0].last_name} запросил ранний Performance Review`,
        userId,
        periodId
      ]);
    }

    res.json({ success: true, message: 'Запрос отправлен руководителю' });
  } catch (error) {
    console.error('Error requesting early PR:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Утверждение руководителем
app.post('/api/review-periods/:periodId/manager-approve', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const managerId = req.user.id;

    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1 AND u.manager_id = $2
    `, [periodId, managerId]);

    if (period.rows.length === 0) {
      return res.status(403).json({ error: 'Вы не руководитель этого сотрудника' });
    }

    await query(`
      UPDATE employee_review_periods
      SET status = 'pending_hr_approval',
          manager_approved = true,
          manager_approved_at = NOW(),
          manager_approved_by = $1
      WHERE id = $2
    `, [managerId, periodId]);

    const hrUsers = await query('SELECT id FROM users WHERE role = $1', ['hr']);

    for (const hr of hrUsers.rows) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        hr.id,
        'early_pr_hr_approval',
        'Требуется утверждение раннего PR',
        `Руководитель утвердил ранний PR для ${period.rows[0].first_name} ${period.rows[0].last_name}`,
        period.rows[0].user_id,
        periodId
      ]);
    }

    res.json({ success: true, message: 'Отправлено HR на утверждение' });
  } catch (error) {
    console.error('Error approving by manager:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Утверждение HR
app.post('/api/review-periods/:periodId/hr-approve', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);

    if (req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Только HR может утверждать' });
    }

    const period = await query(`
      SELECT erp.*, u.first_name, u.last_name, u.id as employee_id
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1
    `, [periodId]);

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    await query(`
      UPDATE employee_review_periods
      SET status = 'in_progress',
          hr_approved = true,
          hr_approved_at = NOW(),
          hr_approved_by = $1
      WHERE id = $2
    `, [req.user.id, periodId]);

    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
    `, [
      period.rows[0].employee_id,
      'early_pr_approved',
      'Ранний PR утвержден',
      'Ваш запрос утвержден. Приступайте к самооценке и запросам обратной связи.',
      periodId
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving by HR:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Получение своих периодов
app.get('/api/review-periods/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        erp.*,
        (SELECT COUNT(*) FROM peer_feedback_requests 
         WHERE requester_id = erp.user_id AND period_id = erp.id AND status = 'completed') as completed_peer_reviews
      FROM employee_review_periods erp
      WHERE erp.user_id = $1
      ORDER BY erp.start_date DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting my periods:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Периоды для утверждения руководителем
app.get('/api/review-periods/pending-manager-approval', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.position
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE u.manager_id = $1 AND erp.status = 'pending_manager_approval'
      ORDER BY erp.requested_early_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Периоды для утверждения HR
app.get('/api/review-periods/pending-hr-approval', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Только для HR' });
    }

    const result = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.position
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.status = 'pending_hr_approval'
      ORDER BY erp.manager_approved_at DESC
    `, []);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting HR pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Завершение самооценки
app.post('/api/review-periods/:periodId/complete-self-assessment', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);

    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1 AND erp.user_id = $2
    `, [periodId, req.user.id]);

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    await query(`
      UPDATE employee_review_periods
      SET self_assessment_completed = true,
          self_assessment_completed_at = NOW()
      WHERE id = $1
    `, [periodId]);

    if (period.rows[0].peer_reviews_count >= 3 && period.rows[0].manager_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        period.rows[0].manager_id,
        'ready_for_manager_evaluation',
        'Готово к оценке',
        `${period.rows[0].first_name} ${period.rows[0].last_name} завершил самооценку и получил обратную связь`,
        req.user.id,
        periodId
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing self assessment:', error);
    res.status(500).json({ error: error.message });
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
  console.log('   GET  /api/peer-feedback/colleagues - Список коллег');
  console.log('   POST /api/peer-feedback/request - Запросить оценку');
  console.log('   GET  /api/peer-feedback/my-requests - Мои запросы');
  console.log('   GET  /api/peer-feedback/pending-reviews - Ожидающие оценки');
  console.log('   POST /api/peer-feedback/submit - Отправить оценку');
  console.log('   GET  /api/peer-feedback/received - Полученные оценки');
  console.log('   POST /api/manager-evaluation/submit - Оценка сотрудника менеджером');
  console.log('   GET  /api/manager-evaluation/employee/:id/cycle/:id - Оценки сотрудника');
  console.log('   POST /api/review-periods/:id/request-early - Запросить ранний PR');
  console.log('   POST /api/review-periods/:id/manager-approve - Утвердить (руководитель)');
  console.log('   POST /api/review-periods/:id/hr-approve - Утвердить (HR)');
  console.log('   GET  /api/review-periods/my - Мои периоды');
  console.log('   GET  /api/health - Проверка здоровья API\n');
});

// Экспорт для Vercel Serverless Functions
module.exports = app;
