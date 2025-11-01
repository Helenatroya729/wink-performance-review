const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { 
  generateEmployeeReport, 
  generateDepartmentReport, 
  generateCompanyReport 
} = require('./pdf-report-generator');
require('dotenv').config();

const { query, getClient, testConnection } = require('./database');

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

// ==================== SELF-ASSESSMENT ENDPOINT ====================
app.get('/api/self-assessment/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const periodId = req.query.periodId ? parseInt(req.query.periodId) : null;
    
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
    
    let queryText, params;
    
    if (periodId) {
      // Если указан periodId, получаем cycle_id из периода
      queryText = `
        SELECT sa.* 
        FROM self_assessments sa
        JOIN employee_review_periods erp ON erp.cycle_id = sa.cycle_id
        WHERE sa.user_id = $1 AND erp.id = $2
        ORDER BY sa.id DESC
      `;
      params = [employeeId, periodId];
    } else {
      // Без periodId - все самооценки
      queryText = `SELECT * FROM self_assessments WHERE user_id = $1 ORDER BY id DESC`;
      params = [employeeId];
    }
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
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
    const { reviewer_id, period_id, message } = req.body;

    if (!reviewer_id || !period_id) {
      return res.status(400).json({ error: 'Не указан коллега или период оценки' });
    }

    // Проверяем, что не запрашиваем оценку у самого себя
    if (reviewer_id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя запросить оценку у самого себя' });
    }

    // Проверяем, нет ли уже такого запроса
    const existingRequest = await query(`
      SELECT id FROM peer_feedback_requests 
      WHERE requester_id = $1 AND reviewer_id = $2 AND period_id = $3
    `, [req.user.id, reviewer_id, period_id]);

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Запрос этому коллеге уже отправлен' });
    }

    // Создаем запрос
    const result = await query(`
      INSERT INTO peer_feedback_requests (requester_id, reviewer_id, period_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, reviewer_id, period_id, message || null]);

    // Получаем данные запросившего и период для уведомления
    const requesterData = await query(`
      SELECT u.first_name, u.last_name, erp.name as period_name
      FROM users u
      JOIN employee_review_periods erp ON erp.id = $1
      WHERE u.id = $2
    `, [period_id, req.user.id]);

    if (requesterData.rows.length > 0) {
      const requester = requesterData.rows[0];
      
      // Создаем уведомление для коллеги
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        reviewer_id,
        'peer_feedback_request',
        'Запрос на оценку',
        `${requester.first_name} ${requester.last_name} запросил у вас peer review для периода "${requester.period_name}"`,
        req.user.id,
        result.rows[0].id
      ]);
    }

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
        erp.name as cycle_name
      FROM peer_feedback_requests r
      JOIN users u ON r.reviewer_id = u.id
      JOIN employee_review_periods erp ON r.period_id = erp.id
      WHERE r.requester_id = $1
        AND erp.status = 'in_progress'
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
        erp.name as cycle_name
      FROM peer_feedback_requests r
      JOIN users u ON r.requester_id = u.id
      JOIN employee_review_periods erp ON r.period_id = erp.id
      WHERE r.reviewer_id = $1 
        AND r.status = 'pending'
        AND erp.status = 'in_progress'
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
        request_id, requester_id, reviewer_id, period_id,
        result_achievement_rating, personal_qualities_comment, 
        interaction_quality_rating, improvement_suggestions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      request_id,
      request.requester_id,
      req.user.id,
      request.period_id,
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

    // Проверяем, все ли peer отзывы получены для этого периода
    const allRequestsCheck = await query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests
      FROM peer_feedback_requests
      WHERE requester_id = $1 AND period_id = $2
    `, [request.requester_id, request.period_id]);

    const { total_requests, completed_requests } = allRequestsCheck.rows[0];

    // Если все отзывы получены
    if (parseInt(total_requests) > 0 && parseInt(total_requests) === parseInt(completed_requests)) {
      // Обновляем поле peer_reviews_completed
      await query(`
        UPDATE employee_review_periods
        SET peer_reviews_completed = true
        WHERE id = $1
      `, [request.period_id]);

      // Получаем данные сотрудника и его менеджера
      const employeeData = await query(`
        SELECT 
          u.first_name, u.last_name, u.manager_id,
          erp.name as period_name
        FROM users u
        JOIN employee_review_periods erp ON erp.id = $1
        WHERE u.id = $2
      `, [request.period_id, request.requester_id]);

      if (employeeData.rows.length > 0) {
        const employee = employeeData.rows[0];
        
        // Отправляем уведомление менеджеру
        if (employee.manager_id) {
          await query(`
            INSERT INTO notifications (user_id, type, title, message, related_user_id, is_read, created_at)
            VALUES ($1, $2, $3, $4, $5, false, NOW())
          `, [
            employee.manager_id,
            'peer_reviews_completed',
            'Все peer отзывы получены',
            `${employee.first_name} ${employee.last_name} получил все peer отзывы для периода "${employee.period_name}". Можно переходить к оценке руководителя.`,
            request.requester_id
          ]);
        }
      }
    }

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
        erp.name as cycle_name
      FROM peer_feedbacks f
      JOIN users u ON f.reviewer_id = u.id
      JOIN employee_review_periods erp ON f.period_id = erp.id
      WHERE f.requester_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении оценок от коллег:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить оценки от коллег для конкретного сотрудника (доступно для менеджера этого сотрудника, HR или admin)
app.get('/api/peer-feedback/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const periodId = req.query.periodId ? parseInt(req.query.periodId) : null;

    // Проверяем права: менеджер сотрудника, HR или админ
    const emp = await query(`SELECT manager_id FROM users WHERE id = $1`, [employeeId]);
    if (emp.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const managerId = emp.rows[0].manager_id;
    if (req.user.role !== 'hr' && req.user.role !== 'admin' && req.user.id !== managerId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    let queryText = `
      SELECT 
        f.*,
        u.first_name as reviewer_first_name,
        u.last_name as reviewer_last_name,
        u.position as reviewer_position,
        erp.name as cycle_name
      FROM peer_feedbacks f
      JOIN users u ON f.reviewer_id = u.id
      JOIN employee_review_periods erp ON f.period_id = erp.id
      WHERE f.requester_id = $1`;
    
    let params = [employeeId];
    
    if (periodId) {
      queryText += ` AND f.period_id = $2`;
      params.push(periodId);
    }
    
    queryText += ` ORDER BY f.created_at DESC`;

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении оценок от коллег для сотрудника:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============ ОЦЕНКА МЕНЕДЖЕРА ============

// Создать оценку сотрудника от менеджера
app.post('/api/manager-evaluation/submit', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Получен запрос на сохранение оценки:', JSON.stringify(req.body, null, 2));
    
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
      feedback_summary,
      period_id // добавляем period_id для обновления статуса
    } = req.body;

    console.log(`🔍 Проверка полей: employee_id=${employee_id}, cycle_id=${cycle_id}, period_id=${period_id}`);

    if (!employee_id || !cycle_id) {
      console.log('❌ Не указаны обязательные поля');
      return res.status(400).json({ error: 'Не указаны обязательные поля (employee_id, cycle_id)' });
    }

    // Проверяем, что текущий пользователь - менеджер сотрудника
    console.log(`🔍 Проверка, что пользователь ${req.user.id} является менеджером сотрудника ${employee_id}`);
    const employeeCheck = await query(`
      SELECT * FROM users WHERE id = $1 AND manager_id = $2
    `, [employee_id, req.user.id]);

    if (employeeCheck.rows.length === 0) {
      console.log('❌ Пользователь не является менеджером');
      return res.status(403).json({ error: 'Вы не являетесь менеджером этого сотрудника' });
    }

    console.log('✅ Проверка менеджера пройдена');

    // Проверяем, есть ли уже оценка
    console.log('🔍 Проверка существующей оценки...');
    const existingEval = await query(`
      SELECT * FROM manager_evaluations 
      WHERE goal_id = $1 AND employee_id = $2 AND manager_id = $3 AND cycle_id = $4
    `, [goal_id, employee_id, req.user.id, cycle_id]);

    let result;
    if (existingEval.rows.length > 0) {
      console.log('♻️ Обновление существующей оценки...');
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
      console.log('✅ Оценка обновлена');
    } else {
      console.log('➕ Создание новой оценки...');
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
      console.log('✅ Новая оценка создана');
    }

    // Обновляем статус завершения оценки по целям в периоде
    console.log('🔄 Обновление статуса периода...');
    // Используем period_id из запроса или получаем из employee_review_periods
    let actualPeriodId = period_id;
    
    if (!actualPeriodId) {
      // Если period_id не передан, находим период по employee_id и cycle_id
      const periodResult = await query(`
        SELECT id FROM employee_review_periods 
        WHERE user_id = $1 AND cycle_id = $2 AND status = 'in_progress'
      `, [employee_id, cycle_id]);
      
      if (periodResult.rows.length > 0) {
        actualPeriodId = periodResult.rows[0].id;
      }
    }
    
    if (actualPeriodId) {
      await query(`
        UPDATE employee_review_periods
        SET manager_goals_evaluation_completed = true,
            manager_goals_evaluation_completed_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [actualPeriodId, employee_id]);
      
      console.log('✅ Статус периода обновлен');
      
      // Получаем информацию о сотруднике и менеджере для уведомления
      const empInfo = await query(`
        SELECT u.first_name, u.last_name, u.manager_id,
               m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        WHERE u.id = $1
      `, [employee_id]);
      
      if (empInfo.rows.length > 0 && empInfo.rows[0].manager_id) {
        // Создаем уведомление менеджеру о готовности к оценке потенциала
        await query(`
          INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
        `, [
          req.user.id, // уведомление самому менеджеру
          'potential_assessment_ready',
          'Готово к оценке потенциала',
          `${empInfo.rows[0].first_name} ${empInfo.rows[0].last_name} готов к оценке потенциала`,
          employee_id,
          actualPeriodId // используем actualPeriodId
        ]);
        
        console.log(`✅ Создано уведомление об оценке потенциала для ${empInfo.rows[0].first_name} ${empInfo.rows[0].last_name}`);
      }
    }

    console.log('🎉 Оценка успешно сохранена');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Ошибка при создании оценки менеджера:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
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

// Получить список сотрудников, готовых к оценке менеджером
app.get('/api/manager-evaluation/ready-employees', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 Запрос ready-employees от:', req.user.email, 'роль:', req.user.role);
    
    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const managerId = req.user.role === 'manager' ? req.user.id : null;
    
    let whereClause = '';
    let params = [];
    
    if (managerId) {
      whereClause = 'AND u.manager_id = $1';
      params = [managerId];
    }

    // Получаем сотрудников с активными периодами, где:
    // 1. Период в статусе 'in_progress'
    // 2. Самооценка завершена
    // 3. Получено минимум 3 peer отзыва
    // 4. Оценка менеджера НЕ завершена
    const result = await query(`
      SELECT 
        erp.id as period_id,
        erp.cycle_id as cycle_id,
        erp.user_id,
        u.first_name,
        u.last_name,
        u.position,
        erp.start_date,
        erp.end_date,
        erp.name as cycle_name,
        (SELECT COUNT(*) FROM peer_feedback_requests 
         WHERE requester_id = erp.user_id AND period_id = erp.id AND status = 'completed') as peer_reviews_count
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.status = 'in_progress'
        AND erp.self_assessment_completed = true
        AND erp.peer_reviews_completed = true
        AND COALESCE(erp.manager_goals_evaluation_completed, false) = false
        ${whereClause}
      ORDER BY u.last_name, u.first_name
    `, params);

    console.log(`✅ Найдено готовых к оценке: ${result.rows.length}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения готовых к оценке сотрудников:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============= ОЦЕНКА ПОТЕНЦИАЛА СОТРУДНИКА =============

// Получить список сотрудников готовых к оценке потенциала
app.get('/api/potential-assessment/ready-employees', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 Запрос ready-employees для оценки потенциала от:', req.user.email);
    
    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const managerId = req.user.role === 'manager' ? req.user.id : null;
    
    let whereClause = '';
    let params = [];
    
    if (managerId) {
      whereClause = 'AND u.manager_id = $1';
      params = [managerId];
    }

    // Получаем сотрудников готовых к оценке потенциала:
    // 1. Период в статусе 'in_progress'
    // 2. Самооценка завершена
    // 3. Получено минимум 3 peer отзыва
    // 4. Оценка по целям менеджера ЗАВЕРШЕНА
    // 5. Оценка потенциала ЕЩЁ НЕ ЗАВЕРШЕНА
    const result = await query(`
      SELECT 
        erp.id as period_id,
        erp.cycle_id as cycle_id,
        erp.user_id as employee_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        u.first_name,
        u.last_name,
        u.position,
        erp.name as cycle_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.status = 'in_progress'
        AND erp.self_assessment_completed = true
        AND erp.peer_reviews_completed = true
        AND erp.manager_goals_evaluation_completed = true
        AND erp.potential_assessment_completed = false
        ${whereClause}
      ORDER BY u.last_name, u.first_name
    `, params);

    console.log(`✅ Найдено готовых к оценке потенциала: ${result.rows.length}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения готовых к оценке потенциала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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
    
    // Профессиональные качества (позитивные, +1 за каждое отмеченное)
    if (prof_responsibility) performance_raw_score += 1;
    if (prof_result_oriented) performance_raw_score += 1;
    if (prof_proactivity) performance_raw_score += 1;
    if (prof_open_mindset) performance_raw_score += 1;
    if (prof_team_player) performance_raw_score += 1;
    
    // Дискоммуникация (если галочка стоит = есть проблемы = 0 баллов, если не стоит = нет проблем = +1 балл)
    if (!knows_miscommunication_cases) performance_raw_score += 1;
    
    // ОЛЭ приоритеты (за каждую указанную)
    if (ole_priority_1) performance_raw_score += 1;
    if (ole_priority_2) performance_raw_score += 1;
    
    // Расчет ПОТЕНЦИАЛА (0-12 баллов)
    let potential_raw_score = 0;
    
    // Личные качества (позитивные, +1 за каждое отмеченное)
    if (pers_took_responsibility) potential_raw_score += 1;
    if (pers_transparent_communication) potential_raw_score += 1;
    if (pers_shared_info) potential_raw_score += 1;
    if (pers_organized_work) potential_raw_score += 1;
    
    // Мотивация 1:1 (если галочка стоит = приходилось мотивировать = 0 баллов, если не стоит = не приходилось = +1 балл)
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

    // Итоговая оценка результативности: 4 = 1★, 5-7 = 2★, 8 = 3★ (максимум 8 баллов)
    let performance_final_score = 1;
    if (performance_raw_score >= 8) performance_final_score = 3;
    else if (performance_raw_score >= 5) performance_final_score = 2;
    else if (performance_raw_score >= 4) performance_final_score = 1;
    else performance_final_score = 0; // меньше 4 баллов = 0★

    // Итоговая оценка потенциала: 1-7 = 1★, 8-12 = 2★, больше 12 невозможно (максимум 12 баллов)
    let potential_final_score = 1;
    if (potential_raw_score >= 8) potential_final_score = 2;
    else if (potential_raw_score >= 1) potential_final_score = 1;
    else potential_final_score = 0; // 0 баллов = 0★

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

    // Обновляем флаг завершения оценки потенциала и статус периода
    await query(`
      UPDATE employee_review_periods 
      SET potential_assessment_completed = true,
          status = 'awaiting_calculation'
      WHERE user_id = $1 AND cycle_id = $2
    `, [employee_id, cycle_id]);

    // Получаем информацию о сотруднике для уведомления
    const empInfo = await query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [employee_id]
    );

    // Создаем уведомление сотруднику об изменении статуса
    if (empInfo.rows.length > 0) {
      await query(`
        INSERT INTO notifications (
          user_id, type, title, message, related_user_id, is_read
        ) VALUES ($1, $2, $3, $4, $5, false)
      `, [
        employee_id,
        'potential_assessment_submitted',
        'Оценка потенциала завершена',
        'Руководитель завершил оценку вашего потенциала. Ожидайте расчета итогов.',
        req.user.id
      ]);
      console.log(`✅ Создано уведомление для сотрудника ${empInfo.rows[0].first_name} ${empInfo.rows[0].last_name}`);
    }

    // Создаем уведомления для HR о том, что сотрудник готов к калькуляции
    try {
      const hrUsers = await query(`SELECT id, first_name, last_name FROM users WHERE role = 'hr' AND is_active = true`);
      if (hrUsers.rows.length > 0) {
        for (const hr of hrUsers.rows) {
          await query(`
            INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
          `, [
            hr.id,
            'employee_ready_for_calculation',
            'Сотрудник готов к калькуляции',
            `${empInfo.rows[0].first_name} ${empInfo.rows[0].last_name} готов(а) к калькуляции.`,
            employee_id,
            cycle_id
          ]);
        }
        console.log(`✅ Уведомления отправлены ${hrUsers.rows.length} HR-пользователям`);
      }
    } catch (e) {
      console.error('Ошибка при отправке уведомлений HR:', e);
    }

    console.log(`✅ Оценка потенциала сохранена для employee_id=${employee_id}, cycle_id=${cycle_id}`);
    console.log(`   Результативность: ${performance_raw_score} баллов (оценка: ${performance_final_score}★)`);
    console.log(`   Потенциал: ${potential_raw_score} баллов (оценка: ${potential_final_score}★)`);
    console.log(`   Статус периода изменен на: awaiting_calculation`);

    res.json({ 
      message: 'Оценка потенциала успешно сохранена и отправлена',
      performance_raw_score,
      performance_final_score,
      potential_raw_score,
      potential_final_score,
      status: 'awaiting_calculation'
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

    // Получаем активный цикл
    const activeCycleResult = await query(`
      SELECT id FROM review_cycles ORDER BY id DESC LIMIT 1
    `);
    const activeCycleId = activeCycleResult.rows[0]?.id;

    if (!activeCycleId) {
      return res.status(404).json({ error: 'Активный цикл не найден' });
    }

    // Общий охват оценки (сколько сотрудников имеют ЛЮБУЮ оценку в активном цикле)
    const totalUsersResult = await query(`
      SELECT COUNT(*) FROM users 
      WHERE is_active = true 
      AND role IN ('employee', 'manager')
    `);
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    
    // Сотрудники с хотя бы одной оценкой в активном цикле
    const usersWithEvaluationsResult = await query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      WHERE u.is_active = true 
      AND u.role IN ('employee', 'manager')
      AND (
        EXISTS (SELECT 1 FROM self_assessments sa WHERE sa.user_id = u.id)
        OR EXISTS (SELECT 1 FROM manager_evaluations me WHERE me.employee_id = u.id AND me.cycle_id = $1)
        OR EXISTS (SELECT 1 FROM peer_feedbacks pf WHERE pf.requester_id = u.id)
        OR EXISTS (SELECT 1 FROM potential_assessments pa WHERE pa.employee_id = u.id AND pa.cycle_id = $1)
      )
    `, [activeCycleId]);
    const completedUsers = parseInt(usersWithEvaluationsResult.rows[0].count);
    const coveragePercent = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

    // Средний рейтинг по компании (из manager_evaluations для активного цикла)
    const avgRatingResult = await query(`
      SELECT AVG(performance_total) as avg_rating 
      FROM manager_evaluations 
      WHERE performance_total IS NOT NULL
      AND cycle_id = $1
    `, [activeCycleId]);
    const avgRating = avgRatingResult.rows[0].avg_rating 
      ? parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(1) 
      : '0.0';

    // Завершенных оценок (периоды со статусом completed или calculated в активном цикле)
    const completedEvaluationsResult = await query(`
      SELECT COUNT(*) 
      FROM employee_review_periods 
      WHERE cycle_id = $1 
      AND status IN ('completed', 'calculated')
    `, [activeCycleId]);
    const completedEvaluations = parseInt(completedEvaluationsResult.rows[0].count);
    
    // Всего периодов в активном цикле
    const totalPeriodsResult = await query(`
      SELECT COUNT(*) 
      FROM employee_review_periods 
      WHERE cycle_id = $1
    `, [activeCycleId]);
    const totalPeriods = parseInt(totalPeriodsResult.rows[0].count);
    const completionPercent = totalPeriods > 0 ? Math.round((completedEvaluations / totalPeriods) * 100) : 0;

    // Планов развития (все цели из employee_goals для активного цикла)
    const developmentPlansResult = await query(`
      SELECT COUNT(DISTINCT eg.id) as count
      FROM employee_goals eg
      WHERE eg.cycle_id = $1
    `, [activeCycleId]);
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
        value: `${completedEvaluations}/${totalPeriods}`,
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

    // Берем ПОСЛЕДНИЙ АКТИВНЫЙ период для каждого сотрудника
    const result = await query(`
      WITH latest_periods AS (
        SELECT 
          erp.user_id,
          erp.id as period_id,
          erp.status,
          erp.self_assessment_completed,
          erp.manager_goals_evaluation_completed,
          erp.peer_reviews_completed,
          erp.potential_assessment_completed,
          erp.is_active,
          ROW_NUMBER() OVER (PARTITION BY erp.user_id ORDER BY erp.is_active DESC, erp.id DESC) as rn
        FROM employee_review_periods erp
      )
      SELECT 
        u.id,
        u.role,
        u.position,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        lp.period_id,
        lp.status,
        lp.is_active,
        lp.self_assessment_completed,
        lp.manager_goals_evaluation_completed,
        lp.peer_reviews_completed,
        lp.potential_assessment_completed,
        
        -- Самооценка: среднее из self_assessments (шкала 1-5, умножаем на 2 -> 1-10)
        COALESCE((SELECT AVG(sa.answer_score) * 2 FROM self_assessments sa WHERE sa.user_id = u.id), 0) as self_score,
        
        -- Оценка менеджера: из manager_evaluations (уже 1-10)
        COALESCE((SELECT AVG(me.performance_total) FROM manager_evaluations me WHERE me.employee_id = u.id), 0) as manager_score,
        
        -- Оценка коллег: среднее из peer_reviews (шкала 1-5, умножаем на 2 -> 1-10)
        COALESCE((SELECT AVG(pr.answer_score) * 2 FROM peer_reviews pr WHERE pr.employee_id = u.id), 0) as peer_score,
        
        -- Оценка потенциала: из potential_assessments (0-2 звезды, конвертируем * 5 -> 0, 5, 10)
        COALESCE((SELECT AVG(pa.potential_final_score) * 5 FROM potential_assessments pa WHERE pa.employee_id = u.id), 0) as potential_score
        
      FROM users u
      INNER JOIN latest_periods lp ON u.id = lp.user_id AND lp.rn = 1
      WHERE u.is_active = true 
        AND u.role IN ('employee', 'manager')
      ORDER BY u.id
      LIMIT 50
    `);

    console.log('🔍 RAW DATA from DB (all employees with latest periods):');
    result.rows.forEach(r => {
      console.log(`  ${r.name}: status="${r.status}", is_active=${r.is_active}`);
      console.log(`    Flags: self=${r.self_assessment_completed}, manager_goals=${r.manager_goals_evaluation_completed}, peer=${r.peer_reviews_completed}, potential=${r.potential_assessment_completed}`);
      console.log(`    Scores: self=${parseFloat(r.self_score).toFixed(2)}, manager=${parseFloat(r.manager_score).toFixed(2)}, peer=${parseFloat(r.peer_score).toFixed(2)}, potential=${parseFloat(r.potential_score).toFixed(2)}`);
    });

    const scores = result.rows.map(row => {
      const selfScore = parseFloat(row.self_score) || 0;
      const managerScore = parseFloat(row.manager_score) || 0;
      const peerScore = parseFloat(row.peer_score) || 0;
      const potentialScore = parseFloat(row.potential_score) || 0;
      
      // Итоговый балл - среднее из ВСЕХ 4 оценок
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
      if (potentialScore > 0) {
        sum += potentialScore;
        count++;
      }
      
      const total = count > 0 ? sum / count : 0;

      // Статус берем НАПРЯМУЮ из employee_review_periods
      let reviewStatus = row.status || 'awaiting_calculation';
      
      // Считаем завершенные оценки для UI (теперь 4 этапа)
      const completedCount = 
        (row.self_assessment_completed ? 1 : 0) +
        (row.manager_goals_evaluation_completed ? 1 : 0) +
        (row.peer_reviews_completed ? 1 : 0) +
        (row.potential_assessment_completed ? 1 : 0);

      return {
        id: row.id,
        name: row.name,
        position: row.position || 'Не указано',
        selfScore: parseFloat(selfScore.toFixed(2)),
        managerScore: parseFloat(managerScore.toFixed(2)),
        peerScore: parseFloat(peerScore.toFixed(2)),
        potentialScore: parseFloat(potentialScore.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        reviewStatus: reviewStatus,
        reviewDueDate: '2025-10-31',
        completedEvaluations: completedCount,
        maxExpectedEvaluations: 4,  // Теперь 4 этапа: самооценка, менеджер, коллеги, потенциал
        period_id: row.period_id,
        is_active: row.is_active,
        can_calculate: reviewStatus === 'awaiting_calculation' && completedCount === 4  // Можно калькулировать только если все готово
      };
    });
    
    // Сортируем по итоговому баллу
    scores.sort((a, b) => b.total - a.total);

    console.log('📊 /api/hr/employee-scores возвращает (все сотрудники):');
    scores.forEach(s => {
      console.log(`  ${s.name}: total=${s.total}, status=${s.reviewStatus}, can_calculate=${s.can_calculate}`);
    });

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

    // Получаем последний активный цикл
    const cycleResult = await query(`
      SELECT id FROM review_cycles ORDER BY id DESC LIMIT 1
    `);

    if (cycleResult.rows.length === 0) {
      return res.json({
        high_high: 0, high_medium: 0, high_low: 0,
        medium_high: 0, medium_medium: 0, medium_low: 0,
        low_high: 0, low_medium: 0, low_low: 0
      });
    }

    const activeCycleId = cycleResult.rows[0].id;

    // Получаем распределение сотрудников по матрице 9-Box
    const result = await query(`
      SELECT 
        COUNT(*) as count,
        CASE 
          WHEN COALESCE(pa.potential_final_score, 0) >= 8 THEN 'high'
          WHEN COALESCE(pa.potential_final_score, 0) >= 5 THEN 'medium'
          ELSE 'low'
        END as potential,
        CASE 
          WHEN COALESCE(me.performance_total, 0) >= 7 THEN 'high'
          WHEN COALESCE(me.performance_total, 0) >= 4 THEN 'medium'
          ELSE 'low'
        END as performance
      FROM users u
      LEFT JOIN potential_assessments pa ON u.id = pa.employee_id AND pa.cycle_id = $1
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id AND me.cycle_id = $1
      WHERE u.is_active = true 
        AND u.role NOT IN ('hr', 'admin')
        AND pa.id IS NOT NULL
        AND me.id IS NOT NULL
      GROUP BY potential, performance
    `, [activeCycleId]);

    console.log('📊 9-Box raw data (cycle ' + activeCycleId + '):', result.rows);

    // Формируем матрицу 3x3
    // Названия ключей: {potential}_{performance} (потенциал_эффективность)
    // Высокий потенциал = high, Средний потенциал = medium, Низкий потенциал = low
    // Высокая эффективность = high, Средняя = medium, Низкая = low
    const matrix = {
      high_low: 0,     // Высокий потенциал + Низкая эффективность (Высокий потенциал)
      high_medium: 0,  // Высокий потенциал + Средняя эффективность (Звезды)
      high_high: 0,    // Высокий потенциал + Высокая эффективность (Топ-исполнители)
      medium_low: 0,   // Средний потенциал + Низкая эффективность (Развивающиеся)
      medium_medium: 0,// Средний потенциал + Средняя эффективность (Ключевые игроки)
      medium_high: 0,  // Средний потенциал + Высокая эффективность (Эффективные)
      low_low: 0,      // Низкий потенциал + Низкая эффективность (Новички)
      low_medium: 0,   // Низкий потенциал + Средняя эффективность (Стабильные)
      low_high: 0      // Низкий потенциал + Высокая эффективность (Риск)
    };

    result.rows.forEach(row => {
      // Формат: {potential}_{performance}
      const key = `${row.potential}_${row.performance}`;
      matrix[key] = parseInt(row.count);
      console.log(`  ${key}: ${row.count} чел.`);
    });

    console.log('📊 Final matrix:', matrix);

    res.json(matrix);

  } catch (error) {
    console.error('❌ Ошибка при получении данных 9-Box:', error);
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

    // Получаем последний активный цикл
    const cycleResult = await query(`
      SELECT id FROM review_cycles ORDER BY id DESC LIMIT 1
    `);

    if (cycleResult.rows.length === 0) {
      return res.json([]);
    }

    const activeCycleId = cycleResult.rows[0].id;
    console.log('🔍 Используем cycle_id:', activeCycleId, 'для 9-Box матрицы');

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
          WHEN COALESCE(pa.potential_final_score, 0) >= 8 THEN 3
          WHEN COALESCE(pa.potential_final_score, 0) >= 5 THEN 2
          ELSE 1
        END as potential_level,
        me.performance_total,
        pa.potential_final_score as potential_score
      FROM users u
      LEFT JOIN potential_assessments pa ON u.id = pa.employee_id AND pa.cycle_id = $1
      LEFT JOIN manager_evaluations me ON u.id = me.employee_id AND me.cycle_id = $1
      WHERE u.is_active = true 
        AND u.role NOT IN ('hr', 'admin')
        AND pa.id IS NOT NULL
        AND me.id IS NOT NULL
    `, [activeCycleId]);

    console.log('📊 Найдено сотрудников с оценками:', result.rows.length);

    // Фильтруем по уровням performance и potential
    const filteredEmployees = result.rows.filter(emp => {
      return emp.performance_level === perfLevel && emp.potential_level === potLevel;
    });

    // Добавляем текстовые описания уровней
    const employeesWithLabels = filteredEmployees.map(emp => ({
      ...emp,
      performance_level_text: emp.performance_level === 3 ? 'Высокий' : emp.performance_level === 2 ? 'Средний' : 'Низкий',
      potential_level_text: emp.potential_level === 3 ? 'Высокий' : emp.potential_level === 2 ? 'Средний' : 'Низкий',
      performance_score: emp.performance_total,
      potential_score_value: emp.potential_score
    }));

    console.log(`✅ Сотрудников в ячейке (perf=${perfLevel}, pot=${potLevel}):`, employeesWithLabels.length);

    res.json(employeesWithLabels);

  } catch (error) {
    console.error('❌ Ошибка при получении сотрудников из ячейки 9-Box:', error);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
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
    const userId = req.user.id; // Исправлено: было req.user.userId
    
    console.log('🔍 Запрос рейтинга для пользователя ID:', userId);

    // Получаем информацию о пользователе
    const userResult = await query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    // Получаем оценку от менеджера
    const managerEvalResult = await query(
      `SELECT performance_total FROM manager_evaluations 
       WHERE employee_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    const totalScore = managerEvalResult.rows[0]?.performance_total || 0;

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
      trend: parseFloat(trend.toFixed(1)),
      components: {
        managerScore: parseFloat(totalScore.toFixed(1))
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

    // Получаем активный цикл
    const activeCycleResult = await query(`
      SELECT id FROM review_cycles ORDER BY id DESC LIMIT 1
    `);
    const activeCycleId = activeCycleResult.rows[0]?.id || null;

    // Получаем статус периода сотрудника для активного цикла
    let periodStatus = 'not_started';
    if (activeCycleId) {
      const periodResult = await query(`
        SELECT status FROM employee_review_periods 
        WHERE user_id = $1 AND cycle_id = $2
        LIMIT 1
      `, [id, activeCycleId]);
      
      if (periodResult.rows.length > 0) {
        periodStatus = periodResult.rows[0].status;
      }
    }

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
      ? parseFloat((selfAssessmentResult.rows.reduce((sum, r) => sum + (r.answer_score || 0), 0) / selfAssessmentResult.rows.length * 2).toFixed(2))
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
      ? parseFloat((peerReviewsResult.rows.reduce((sum, r) => sum + (r.answer_score || 0), 0) / peerReviewsResult.rows.length * 2).toFixed(2))
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

    if (selfScore > 0) {
      totalScore += selfScore;
      count++;
    }

    // Оценку менеджера учитываем только для НЕ руководителей
    if (employee.role !== 'manager' && managerEvaluation && managerEvaluation.performance_total > 0) {
      totalScore += managerEvaluation.performance_total;
      count++;
    }

    if (peerScore > 0) {
      totalScore += peerScore;
      count++;
    }

    totalScore = count > 0 ? parseFloat((totalScore / count).toFixed(2)) : 0;

    // Статус оценки берем из employee_review_periods
    const statusMapping = {
      'not_started': 'Не начато',
      'in_progress': 'В процессе',
      'completed': 'Завершено',
      'calculated': 'Рассчитано'
    };
    const evaluationStatus = statusMapping[periodStatus] || 'Не начато';

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
          AND performance_total IS NOT NULL
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

    // Получаем оценку потенциала
    const potentialResult = await query(`
      SELECT potential_final_score
      FROM potential_assessments
      WHERE employee_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);

    // Конвертируем звезды (0-2) в баллы (0, 5, 10)
    let potentialScore = 0;
    if (potentialResult.rows.length > 0 && potentialResult.rows[0].potential_final_score !== null) {
      const stars = potentialResult.rows[0].potential_final_score;
      potentialScore = stars * 5; // 0★→0, 1★→5, 2★→10
    }

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
    if (potentialScore > 0) {
      totalScore += potentialScore;
      evaluationsCount++;
    }

    totalScore = evaluationsCount > 0 ? totalScore / evaluationsCount : 0;

    // Определяем статус - теперь ожидаем 4 оценки (включая потенциал)
    const maxExpectedEvaluations = 4;
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
        UNION ALL
        SELECT created_at FROM potential_assessments WHERE employee_id = $1
      ) as all_evaluations
    `, [id]);

    res.json({
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      totalScore: parseFloat(totalScore.toFixed(2)),
      selfScore: parseFloat(selfScore.toFixed(2)),
      managerScore: parseFloat((managerScore || 0).toFixed(2)),
      peerScore: parseFloat(peerScore.toFixed(2)),
      potentialScore: parseFloat(potentialScore.toFixed(2)),
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

// Получить список сотрудников и статусы по периодам для HR (калькуляция)
app.get('/api/hr/calculations', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT
        erp.id as period_id,
        erp.cycle_id,
        erp.user_id as employee_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        u.position,
        erp.name as period_name,
        erp.status,
        erp.self_assessment_completed,
        erp.peer_reviews_completed,
        erp.manager_goals_evaluation_completed,
        erp.potential_assessment_completed
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      ORDER BY erp.status DESC, u.last_name, u.first_name
    `);

    // Добавляем флаг can_calculate: только когда статус awaiting_calculation
    const rows = result.rows.map(r => ({
      ...r,
      can_calculate: r.status === 'awaiting_calculation'
    }));

    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения списка калькуляций для HR:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Провести калькуляцию для конкретного периода (HR / admin)
app.post('/api/hr/calculate/:periodId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { periodId } = req.params;

    const period = await query(`SELECT id, user_id, cycle_id, status FROM employee_review_periods WHERE id = $1`, [periodId]);
    if (period.rows.length === 0) return res.status(404).json({ error: 'Период не найден' });

    const p = period.rows[0];
    if (p.status !== 'awaiting_calculation') {
      return res.status(400).json({ error: 'Калькуляция может быть запущена только для периодов в статусе awaiting_calculation' });
    }

    // Этот эндпоинт теперь только проверяет права и статус
    // Фактическое сохранение калькуляции происходит в /api/hr/save-calculation/:periodId
    res.json({ 
      message: 'Доступ к калькуляции разрешен',
      periodId: periodId,
      userId: p.user_id
    });
  } catch (error) {
    console.error('Ошибка при проверке доступа к калькуляции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Новый эндпоинт для сохранения калькуляции с рекомендациями
app.post('/api/hr/save-calculation/:periodId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { periodId } = req.params;
    const { employeeRecommendation, managerRecommendation } = req.body;

    // Проверяем, что рекомендации заполнены
    if (!employeeRecommendation || !managerRecommendation) {
      return res.status(400).json({ error: 'Необходимо сгенерировать обе рекомендации перед сохранением' });
    }

    const period = await query(`SELECT id, user_id, cycle_id, status FROM employee_review_periods WHERE id = $1`, [periodId]);
    if (period.rows.length === 0) return res.status(404).json({ error: 'Период не найден' });

    const p = period.rows[0];
    if (p.status !== 'awaiting_calculation') {
      return res.status(400).json({ error: 'Калькуляция может быть сохранена только для периодов в статусе awaiting_calculation' });
    }

    // Проверяем, существуют ли уже рекомендации для этого периода
    const existingRecs = await query(`
      SELECT id FROM employee_recommendations WHERE period_id = $1
    `, [periodId]);

    if (existingRecs.rows.length > 0) {
      // Обновляем существующие рекомендации
      await query(`
        UPDATE employee_recommendations 
        SET recommendation_text = $1, updated_at = NOW()
        WHERE period_id = $2
      `, [employeeRecommendation, periodId]);
    } else {
      // Создаем новую запись рекомендации для сотрудника
      await query(`
        INSERT INTO employee_recommendations (period_id, employee_id, recommendation_text, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [periodId, p.user_id, employeeRecommendation]);
    }

    // Проверяем таблицу manager_recommendations
    const existingManagerRecs = await query(`
      SELECT id FROM manager_recommendations WHERE period_id = $1
    `, [periodId]);

    if (existingManagerRecs.rows.length > 0) {
      // Обновляем существующие рекомендации
      await query(`
        UPDATE manager_recommendations 
        SET recommendation_text = $1, updated_at = NOW()
        WHERE period_id = $2
      `, [managerRecommendation, periodId]);
    } else {
      // Получаем менеджера сотрудника
      const managerRes = await query('SELECT manager_id FROM users WHERE id = $1', [p.user_id]);
      const managerId = managerRes.rows.length > 0 && managerRes.rows[0].manager_id 
        ? managerRes.rows[0].manager_id 
        : null;

      if (managerId) {
        // Создаем новую запись рекомендации для менеджера
        await query(`
          INSERT INTO manager_recommendations (period_id, employee_id, manager_id, recommendation_text, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [periodId, p.user_id, managerId, managerRecommendation]);
      }
    }

    // Меняем статус периода на 'calculated'
    await query(`
      UPDATE employee_review_periods
      SET status = 'calculated', calculated_at = NOW()
      WHERE id = $1
    `, [periodId]);

    // Создаем следующий период для сотрудника (для постановки целей)
    const currentPeriod = await query(`SELECT start_date, end_date, name FROM employee_review_periods WHERE id = $1`, [periodId]);
    const currentEndDate = new Date(currentPeriod.rows[0].end_date);
    const nextStartDate = new Date(currentEndDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1);
    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setMonth(nextEndDate.getMonth() + 6); // Следующий период на 6 месяцев

    const nextPeriodName = `Performance Review ${nextStartDate.getFullYear()} - ${nextStartDate.toLocaleString('ru-RU', { month: 'long' })}`;

    const nextPeriod = await query(`
      INSERT INTO employee_review_periods (user_id, cycle_id, name, start_date, end_date, status, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, 'not_started', true, NOW())
      RETURNING id
    `, [p.user_id, p.cycle_id, nextPeriodName, nextStartDate, nextEndDate]);

    const nextPeriodId = nextPeriod.rows[0].id;

    // Создаем уведомление сотруднику о завершении калькуляции и необходимости установить цели
    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
    `, [
      p.user_id,
      'calculation_completed',
      'Калькуляция завершена',
      `Ваша оценка была рассчитана и рекомендации готовы. Теперь установите цели на следующий период (ID: ${nextPeriodId}).`,
      req.user.id,
      periodId
    ]);

    // Создаем уведомление менеджеру (если есть)
    const managerRes = await query('SELECT manager_id FROM users WHERE id = $1', [p.user_id]);
    if (managerRes.rows.length > 0 && managerRes.rows[0].manager_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        managerRes.rows[0].manager_id,
        'calculation_completed',
        'Калькуляция завершена для сотрудника',
        `Калькуляция и рекомендации готовы для вашего сотрудника (periodId: ${periodId}).`,
        req.user.id,
        periodId
      ]);
    }

    res.json({ 
      message: 'Калькуляция успешно сохранена',
      periodId: periodId,
      status: 'calculated'
    });
  } catch (error) {
    console.error('Ошибка при сохранении калькуляции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статус периода
app.get('/api/hr/period/:periodId/status', authenticateToken, async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const period = await query(`SELECT id, status FROM employee_review_periods WHERE id = $1`, [periodId]);
    
    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }
    
    res.json({ 
      periodId: period.rows[0].id,
      status: period.rows[0].status 
    });
  } catch (error) {
    console.error('Ошибка при получении статуса периода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Установить цели для следующего периода
app.post('/api/goals/period/:periodId', authenticateToken, async (req, res) => {
  try {
    const { periodId } = req.params;
    const { goals } = req.body; // массив целей: [{ title, description }, ...]

    if (!goals || goals.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать хотя бы одну цель' });
    }

    // Проверяем, что период принадлежит пользователю
    const period = await query(`
      SELECT id, user_id, cycle_id, status FROM employee_review_periods WHERE id = $1
    `, [periodId]);

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    const p = period.rows[0];
    if (p.user_id !== req.user.id && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Удаляем старые цели для этого периода (если есть)
    await query(`DELETE FROM employee_goals WHERE period_id = $1`, [periodId]);

    // Создаем новые цели
    const createdGoals = [];
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      const result = await query(`
        INSERT INTO employee_goals (
          user_id, cycle_id, period_id, title, description, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, 'draft', NOW())
        RETURNING *
      `, [p.user_id, p.cycle_id, periodId, goal.title, goal.description]);
      
      createdGoals.push(result.rows[0]);
    }

    res.json({ 
      message: `Создано целей: ${createdGoals.length}`,
      goals: createdGoals
    });
  } catch (error) {
    console.error('Ошибка при установке целей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить цели для периода
app.get('/api/goals/period/:periodId', authenticateToken, async (req, res) => {
  try {
    const { periodId } = req.params;

    const goals = await query(`
      SELECT * FROM employee_goals WHERE period_id = $1 ORDER BY created_at
    `, [periodId]);

    res.json(goals.rows);
  } catch (error) {
    console.error('Ошибка при получении целей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Завершить PR после установки целей
app.post('/api/employee/complete-pr/:periodId', authenticateToken, async (req, res) => {
  try {
    const { periodId } = req.params;

    // Проверяем, что период принадлежит пользователю и находится в статусе 'calculated'
    const period = await query(`
      SELECT id, user_id, status FROM employee_review_periods WHERE id = $1
    `, [periodId]);

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    const p = period.rows[0];
    if (p.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    if (p.status !== 'calculated') {
      return res.status(400).json({ error: 'Период должен быть в статусе calculated' });
    }

    // Проверяем, что для СЛЕДУЮЩЕГО периода установлены цели
    const nextPeriod = await query(`
      SELECT id FROM employee_review_periods 
      WHERE user_id = $1 AND status = 'not_started' AND start_date > (SELECT end_date FROM employee_review_periods WHERE id = $2)
      ORDER BY start_date LIMIT 1
    `, [p.user_id, periodId]);

    if (nextPeriod.rows.length === 0) {
      return res.status(400).json({ error: 'Следующий период не найден' });
    }

    const nextPeriodId = nextPeriod.rows[0].id;

    // Проверяем наличие целей в следующем периоде
    const goalsCount = await query(`
      SELECT COUNT(*) FROM employee_goals WHERE period_id = $1
    `, [nextPeriodId]);

    if (parseInt(goalsCount.rows[0].count) === 0) {
      return res.status(400).json({ 
        error: 'Необходимо установить хотя бы одну цель на следующий период',
        nextPeriodId: nextPeriodId
      });
    }

    // Меняем статус текущего периода на 'completed'
    await query(`
      UPDATE employee_review_periods
      SET status = 'completed'
      WHERE id = $1
    `, [periodId]);

    res.json({ 
      message: 'Performance Review успешно завершен!',
      periodId: periodId,
      status: 'completed',
      nextPeriodId: nextPeriodId
    });
  } catch (error) {
    console.error('Ошибка при завершении PR:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== COMPANY TRIGGERS ENDPOINTS ====================

// Получить все триггеры компании
app.get('/api/hr/triggers', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, word, recommendation, created_at, updated_at FROM company_triggers ORDER BY word'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении триггеров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новый триггер (только HR/Admin)
app.post('/api/hr/triggers', authenticateToken, async (req, res) => {
  try {
    // Проверка прав доступа
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { word, recommendation } = req.body;

    if (!word || !recommendation) {
      return res.status(400).json({ error: 'Необходимо указать слово и рекомендацию' });
    }

    // Проверка на дубликаты
    const existing = await query(
      'SELECT id FROM company_triggers WHERE LOWER(word) = LOWER($1)',
      [word]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Триггер с таким словом уже существует' });
    }

    // Добавляем триггер
    const result = await query(
      `INSERT INTO company_triggers (word, recommendation) 
       VALUES ($1, $2) 
       RETURNING id, word, recommendation, created_at, updated_at`,
      [word.toLowerCase(), recommendation]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании триггера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить триггер (только HR/Admin)
app.put('/api/hr/triggers/:id', authenticateToken, async (req, res) => {
  try {
    // Проверка прав доступа
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { id } = req.params;
    const { word, recommendation } = req.body;

    if (!word || !recommendation) {
      return res.status(400).json({ error: 'Необходимо указать слово и рекомендацию' });
    }

    // Проверка на дубликаты (кроме текущего)
    const existing = await query(
      'SELECT id FROM company_triggers WHERE LOWER(word) = LOWER($1) AND id != $2',
      [word, id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Триггер с таким словом уже существует' });
    }

    // Обновляем триггер
    const result = await query(
      `UPDATE company_triggers 
       SET word = $1, recommendation = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, word, recommendation, created_at, updated_at`,
      [word.toLowerCase(), recommendation, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Триггер не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении триггера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить триггер (только HR/Admin)
app.delete('/api/hr/triggers/:id', authenticateToken, async (req, res) => {
  try {
    // Проверка прав доступа
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM company_triggers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Триггер не найден' });
    }

    res.json({ message: 'Триггер успешно удален', id: result.rows[0].id });
  } catch (error) {
    console.error('Ошибка при удалении триггера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== END COMPANY TRIGGERS ENDPOINTS ====================

// ==================== HR QUICK ACTIONS ENDPOINTS ====================

// Получить список отделов
app.get('/api/hr/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT DISTINCT u.department as name, COUNT(*) as employee_count
      FROM users u
      WHERE u.role IN ('employee', 'manager')
        AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY u.department
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения отделов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить список менеджеров
app.get('/api/hr/managers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT u.id, u.first_name, u.last_name, u.position, u.department
      FROM users u
      WHERE u.role = 'manager'
      ORDER BY u.last_name, u.first_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения менеджеров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех сотрудников с их руководителями
app.get('/api/hr/all-employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.position,
        u.department,
        u.manager_id,
        m.first_name || ' ' || m.last_name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.role IN ('employee', 'manager')
      ORDER BY u.last_name, u.first_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения сотрудников:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все периоды PR всех сотрудников
app.get('/api/hr/all-periods', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT 
        erp.id,
        erp.user_id,
        u.first_name,
        u.last_name,
        u.position,
        u.department,
        erp.start_date,
        erp.end_date,
        erp.status,
        erp.cycle_id,
        rc.name as cycle_name,
        -- Проверяем завершенность самооценки
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM self_assessments sa 
            WHERE sa.user_id = erp.user_id AND sa.cycle_id = erp.cycle_id
          ) THEN true 
          ELSE false 
        END as self_completed,
        -- Проверяем завершенность оценки руководителя
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM manager_evaluations me 
            WHERE me.employee_id = erp.user_id AND me.cycle_id = erp.cycle_id
          ) THEN true 
          ELSE false 
        END as manager_completed,
        -- Проверяем завершенность peer review
        CASE 
          WHEN erp.peer_reviews_completed = true THEN true
          ELSE false
        END as peer_completed
      FROM employee_review_periods erp
      LEFT JOIN users u ON erp.user_id = u.id
      LEFT JOIN review_cycles rc ON erp.cycle_id = rc.id
      WHERE rc.status = 'active'
      ORDER BY u.last_name, u.first_name, erp.start_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения периодов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Изменить руководителя сотрудника
app.post('/api/hr/change-manager', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { employeeId, newManagerId } = req.body;

    if (!employeeId || !newManagerId) {
      return res.status(400).json({ error: 'Необходимо указать сотрудника и нового руководителя' });
    }

    // Проверяем, что сотрудник существует
    const employeeCheck = await query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1',
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    // Проверяем, что новый руководитель существует и является менеджером
    const managerCheck = await query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [newManagerId]
    );

    if (managerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Руководитель не найден' });
    }

    if (managerCheck.rows[0].role !== 'manager' && managerCheck.rows[0].role !== 'admin') {
      return res.status(400).json({ error: 'Указанный пользователь не является руководителем' });
    }

    // Обновляем руководителя
    await query(
      'UPDATE users SET manager_id = $1 WHERE id = $2',
      [newManagerId, employeeId]
    );

    const employee = employeeCheck.rows[0];
    const manager = managerCheck.rows[0];

    res.json({
      message: 'Руководитель успешно изменен',
      employee: `${employee.first_name} ${employee.last_name}`,
      newManager: `${manager.first_name} ${manager.last_name}`
    });
  } catch (error) {
    console.error('Ошибка изменения руководителя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Генерация профессионального отчета в PDF
app.get('/api/hr/generate-report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { type, employeeId, department } = req.query;

    // Получаем активный цикл
    const activeCycle = await query(
      `SELECT id FROM review_cycles WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`
    );

    if (activeCycle.rows.length === 0) {
      return res.status(404).json({ error: 'Активный цикл не найден' });
    }

    const cycleId = activeCycle.rows[0].id;

    let pdfBuffer;
    let filename;
    let filenameEncoded;

    if (type === 'employee' && employeeId) {
      // Генерируем отчет по сотруднику
      pdfBuffer = await generateEmployeeReport(employeeId, cycleId);
      filename = `employee_report_${employeeId}_${Date.now()}.pdf`;
      filenameEncoded = encodeURIComponent(filename);
      
    } else if (type === 'department' && department) {
      // Генерируем отчет по отделу
      pdfBuffer = await generateDepartmentReport(department, cycleId);
      // Создаём безопасное имя файла без кириллицы
      const timestamp = Date.now();
      filename = `department_${department}_${timestamp}.pdf`;
      filenameEncoded = `department_report_${timestamp}.pdf`;
      
    } else if (type === 'company') {
      // Генерируем сводный отчет по компании
      pdfBuffer = await generateCompanyReport(cycleId);
      filename = `company_report_${Date.now()}.pdf`;
      filenameEncoded = filename;
      
    } else {
      return res.status(400).json({ error: 'Неверные параметры запроса' });
    }

    // Отправляем PDF с правильным кодированием имени файла
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameEncoded}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Ошибка генерации отчета:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка генерации отчета: ' + error.message });
    }
  }
});

// Экспорт данных (временно JSON, позже добавим Excel)
app.get('/api/hr/export-data', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Функция в разработке
    res.status(501).json({
      error: 'Функция экспорта в Excel находится в разработке',
      message: 'Данная функциональность будет доступна в следующей версии системы'
    });

  } catch (error) {
    console.error('Ошибка экспорта данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== END HR QUICK ACTIONS ENDPOINTS ====================

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

// Получить индивидуальные периоды оценки для команды менеджера
app.get('/api/manager/team-employee-periods', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const managerId = req.user.role === 'manager' ? req.user.id : null;
    
    let whereClause = '';
    let params = [];
    
    if (managerId) {
      // Для менеджера - только его команда, все периоды
      whereClause = 'WHERE u.manager_id = $1';
      params = [managerId];
    } else {
      // Для HR/Admin - все сотрудники, все периоды
      whereClause = '';
    }

    const result = await query(`
      SELECT DISTINCT ON (erp.user_id)
        erp.id,
        erp.user_id,
        u.first_name,
        u.last_name,
        u.position,
        u.role,
        erp.status as employee_status,
        erp.start_date,
        erp.end_date,
        erp.status,
        erp.cycle_id,
        erp.requested_early_at as early_request_date,
        erp.manager_approved_at as manager_approved_date,
        erp.hr_approved_at as hr_approved_date,
        erp.self_assessment_completed,
        (SELECT COUNT(*) FROM peer_feedback_requests 
         WHERE requester_id = erp.user_id AND period_id = erp.id AND status = 'completed') as peer_reviews_count,
        erp.manager_evaluation_completed,
        erp.manager_goals_evaluation_completed,
        erp.potential_assessment_completed,
        erp.peer_reviews_completed,
        CASE 
          WHEN CURRENT_DATE < erp.start_date THEN 'upcoming'
          WHEN CURRENT_DATE > erp.end_date THEN 'expired'
          WHEN erp.status = 'completed' THEN 'completed'
          WHEN erp.status = 'in_progress' THEN 'active'
          ELSE 'not_started'
        END as period_status
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      ${whereClause}
      ORDER BY 
        erp.user_id,
        CASE 
          WHEN erp.status = 'pending_manager_approval' THEN 1
          WHEN erp.status = 'pending_hr_approval' THEN 2
          WHEN erp.status = 'in_progress' THEN 3
          WHEN CURRENT_DATE BETWEEN erp.start_date AND erp.end_date THEN 4
          ELSE 5
        END,
        erp.start_date DESC
    `, params);

    console.log('🔍 Возвращаем периоды для менеджера:', result.rows.length, 'штук');
    result.rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.first_name} ${row.last_name}, status=${row.status}, period_status=${row.period_status}`);
    });

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения периодов команды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить периоды оценки для команды менеджера (старый эндпоинт - deprecated)
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

// Получить детальную информацию о сотруднике для руководителя
app.get('/api/manager/employee/:employeeId/details', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { cycleId } = req.query; // Опционально фильтруем по циклу

    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Если запрос от менеджера, проверяем что это его сотрудник
    if (req.user.role === 'manager') {
      const teamCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
        [employeeId, req.user.id]
      );
      if (teamCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Этот сотрудник не в вашей команде' });
      }
    }

    // Определяем активный цикл, если не указан
    let activeCycleId = cycleId;
    if (!activeCycleId) {
      const cycleResult = await query(
        'SELECT id FROM review_cycles ORDER BY id DESC LIMIT 1'
      );
      activeCycleId = cycleResult.rows[0]?.id;
    }

    // Получаем информацию о сотруднике
    const employeeResult = await query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.position,
        u.department,
        u.role
      FROM users u
      WHERE u.id = $1
    `, [employeeId]);

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const employee = employeeResult.rows[0];

    // Получаем цели сотрудника
    const goalsResult = await query(`
      SELECT 
        eg.*,
        erp.status as period_status,
        erp.cycle_id
      FROM employee_goals eg
      LEFT JOIN employee_review_periods erp ON eg.period_id = erp.id
      WHERE eg.user_id = $1
        ${activeCycleId ? 'AND (eg.cycle_id = $2 OR erp.cycle_id = $2)' : ''}
      ORDER BY eg.created_at DESC
    `, activeCycleId ? [employeeId, activeCycleId] : [employeeId]);

    // Получаем планы развития и рекомендации от HR
    const recommendationsResult = await query(`
      SELECT 
        er.id,
        er.employee_id,
        er.hr_id,
        er.achievements,
        er.improvements,
        er.development_plan,
        er.sent_at,
        er.is_read,
        er.created_at,
        hr.first_name as hr_first_name,
        hr.last_name as hr_last_name
      FROM employee_recommendations er
      LEFT JOIN users hr ON er.hr_id = hr.id
      WHERE er.employee_id = $1
      ORDER BY er.created_at DESC
      LIMIT 5
    `, [employeeId]);

    // Получаем рекомендации для руководителя по управлению сотрудником
    const managerRecommendationsResult = await query(`
      SELECT 
        mr.id,
        mr.employee_id,
        mr.period_id,
        mr.recommendations as recommendation_text,
        mr.created_at,
        mr.sent_at,
        mr.is_read,
        p.cycle_id,
        p.status as period_status
      FROM manager_recommendations mr
      LEFT JOIN employee_review_periods p ON mr.period_id = p.id
      WHERE mr.employee_id = $1
        ${activeCycleId ? 'AND (mr.period_id IS NULL OR p.cycle_id = $2)' : ''}
      ORDER BY mr.created_at DESC
      LIMIT 5
    `, activeCycleId ? [employeeId, activeCycleId] : [employeeId]);

    // Получаем период оценки
    const periodResult = await query(`
      SELECT 
        erp.*
      FROM employee_review_periods erp
      WHERE erp.user_id = $1
        ${activeCycleId ? 'AND erp.cycle_id = $2' : ''}
      ORDER BY erp.created_at DESC
      LIMIT 1
    `, activeCycleId ? [employeeId, activeCycleId] : [employeeId]);

    // Получаем оценки менеджера
    const evaluationsResult = await query(`
      SELECT 
        me.*
      FROM manager_evaluations me
      WHERE me.employee_id = $1
        ${activeCycleId ? 'AND me.cycle_id = $2' : ''}
      ORDER BY me.created_at DESC
    `, activeCycleId ? [employeeId, activeCycleId] : [employeeId]);

    // Получаем peer feedback (из peer_reviews) - каждый отзыв отдельно
    const peerFeedbackResult = await query(`
      SELECT 
        pr.id,
        pr.employee_id,
        pr.respondent_id,
        pr.question_id,
        pr.answer_score,
        pr.answer_text,
        pr.created_at as submitted_at,
        CONCAT(u.first_name, ' ', u.last_name) as reviewer_name,
        prq.question_text
      FROM peer_reviews pr
      LEFT JOIN users u ON pr.respondent_id = u.id
      LEFT JOIN peer_review_questions prq ON pr.question_id = prq.id
      WHERE pr.employee_id = $1
      ORDER BY pr.created_at DESC
    `, [employeeId]);

    // Форматируем каждый отзыв как отдельную карточку
    const formattedFeedbacks = peerFeedbackResult.rows.map(row => {
      // Конвертируем оценку из шкалы 1-5 в 1-10
      const score = row.answer_score ? row.answer_score * 2 : 0;
      
      return {
        id: row.id,
        reviewer_name: row.reviewer_name || 'Анонимно',
        submitted_at: row.submitted_at,
        result_achievement_rating: score,
        personal_qualities_comment: row.answer_text || row.question_text || 'Не указано',
        interaction_quality_rating: score,
        improvement_suggestions: row.answer_text || 'Не указано',
        total_score: score,
        question_text: row.question_text
      };
    });

    res.json({
      employee,
      goals: goalsResult.rows,
      recommendations: recommendationsResult.rows,
      managerRecommendations: managerRecommendationsResult.rows,
      period: periodResult.rows[0] || null,
      evaluations: evaluationsResult.rows,
      peerFeedback: formattedFeedbacks
    });
  } catch (error) {
    console.error('Ошибка получения детальной информации о сотруднике:', error);
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

// Получить циклы оценки
app.get('/api/review-periods', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, start_date, end_date, is_active, created_at
      FROM review_periods
      ORDER BY start_date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения циклов оценки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение индивидуальных периодов оценки для сотрудника
app.get('/api/employee-review-periods/:userId?', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Проверяем права доступа
    if (req.params.userId && req.user.id !== parseInt(userId)) {
      // Если запрашивают чужие периоды, проверяем роль
      if (req.user.role !== 'hr' && req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Недостаточно прав' });
      }
    }
    
    const result = await query(`
      SELECT 
        -- Количество заполненных вопросов самооценки для этого цикла
        (SELECT COUNT(*)::INTEGER FROM self_assessments sa 
         WHERE sa.user_id = erp.user_id AND sa.cycle_id = erp.cycle_id) as self_assessment_count,
        -- Количество уникальных коллег, оставивших peer reviews для этого цикла
        (SELECT COUNT(DISTINCT pr.respondent_id)::INTEGER FROM peer_reviews pr 
         WHERE pr.employee_id = erp.user_id AND pr.cycle_id = erp.cycle_id) as peer_reviews_count,
        erp.*,
        u.first_name,
        u.last_name,
        u.hire_date
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.user_id = $1
      ORDER BY erp.start_date DESC
    `, [userId]);
    
    console.log('🔍 /api/employee-review-periods/' + userId + ' - возвращаем:', result.rows.length, 'периодов');
    if (result.rows.length > 0) {
      console.log('   Первый период:', {
        id: result.rows[0].id,
        cycle_id: result.rows[0].cycle_id,
        self_assessment_count: result.rows[0].self_assessment_count,
        peer_reviews_count: result.rows[0].peer_reviews_count
      });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения индивидуальных периодов оценки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============= PERFORMANCE REVIEW CYCLE API =============

// Получить статус Performance Review для сотрудника и периода
app.get('/api/performance-review/status/:periodId?', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const periodId = req.params.periodId;
    
    let queryText, queryParams;
    
    if (periodId) {
      // Получить статус для конкретного периода
      queryText = `
        SELECT 
          prs.*,
          erp.name as period_name,
          erp.start_date,
          erp.end_date,
          u.first_name,
          u.last_name
        FROM performance_review_status prs
        JOIN employee_review_periods erp ON prs.period_id = erp.id
        JOIN users u ON prs.user_id = u.id
        WHERE prs.user_id = $1 AND prs.period_id = $2
      `;
      queryParams = [userId, periodId];
    } else {
      // Получить все статусы для пользователя
      queryText = `
        SELECT 
          prs.*,
          erp.name as period_name,
          erp.start_date,
          erp.end_date,
          u.first_name,
          u.last_name
        FROM performance_review_status prs
        JOIN employee_review_periods erp ON prs.period_id = erp.id
        JOIN users u ON prs.user_id = u.id
        WHERE prs.user_id = $1
        ORDER BY erp.start_date DESC
      `;
      queryParams = [userId];
    }
    
    const result = await query(queryText, queryParams);
    
    // Проверяем, доступен ли период автоматически (последний месяц)
    const now = new Date();
    result.rows = result.rows.map(row => {
      const endDate = new Date(row.end_date);
      const startOfLastMonth = new Date(endDate);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth(), 1);
      
      const isInLastMonth = now >= startOfLastMonth && now <= endDate;
      
      return {
        ...row,
        is_in_last_month: isInLastMonth,
        can_request_early: row.status === 'not_started' && !isInLastMonth
      };
    });
    
    res.json(periodId ? result.rows[0] : result.rows);
  } catch (error) {
    console.error('Ошибка получения статуса Performance Review:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запросить досрочное начало Performance Review
app.post('/api/performance-review/request-early/:periodId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const periodId = req.params.periodId;
    const { comment } = req.body;
    
    // Проверяем текущий статус
    const statusResult = await query(
      'SELECT * FROM performance_review_status WHERE user_id = $1 AND period_id = $2',
      [userId, periodId]
    );
    
    if (statusResult.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }
    
    const currentStatus = statusResult.rows[0];
    
    if (currentStatus.status !== 'not_started') {
      return res.status(400).json({ error: 'Невозможно запросить досрочное начало для этого периода' });
    }
    
    // Обновляем статус
    await query(`
      UPDATE performance_review_status
      SET 
        status = 'pending_approval',
        early_request_date = NOW(),
        early_request_comment = $1,
        updated_at = NOW()
      WHERE user_id = $2 AND period_id = $3
    `, [comment, userId, periodId]);
    
    res.json({ 
      success: true, 
      message: 'Запрос на досрочное начало Performance Review отправлен руководителю' 
    });
  } catch (error) {
    console.error('Ошибка запроса досрочного начала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Менеджер запрашивает досрочное начало PR для своего сотрудника
app.post('/api/performance-review/manager-request-early', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Только менеджеры могут запрашивать досрочное начало для сотрудников' });
    }
    
    const { user_id, period_id, reason } = req.body;
    
    // Проверяем, что сотрудник действительно в команде менеджера
    const employeeCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
      [user_id, req.user.id]
    );
    
    if (employeeCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Сотрудник не в вашей команде' });
    }
    
    // Проверяем текущий статус
    const statusResult = await query(
      'SELECT * FROM performance_review_status WHERE user_id = $1 AND period_id = $2',
      [user_id, period_id]
    );
    
    if (statusResult.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }
    
    const currentStatus = statusResult.rows[0];
    
    if (currentStatus.status !== 'not_started') {
      return res.status(400).json({ error: 'Невозможно запросить досрочное начало для этого периода' });
    }
    
    // Обновляем статус - автоматически одобряем от имени менеджера и отправляем на одобрение HR
    await query(`
      UPDATE performance_review_status
      SET 
        status = 'manager_approved',
        early_request_date = NOW(),
        early_request_comment = $1,
        manager_approved_date = NOW(),
        manager_approved_by = $2,
        manager_comment = 'Запрос от менеджера: ' || $1,
        updated_at = NOW()
      WHERE user_id = $3 AND period_id = $4
    `, [reason, req.user.id, user_id, period_id]);
    
    res.json({ 
      success: true, 
      message: 'Запрос отправлен HR на одобрение' 
    });
  } catch (error) {
    console.error('Ошибка запроса досрочного начала от менеджера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить список запросов на досрочное начало (для руководителя)
app.get('/api/performance-review/pending-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    let queryText;
    let queryParams = [];
    
    if (req.user.role === 'manager') {
      // Руководитель видит запросы своих подчиненных
      queryText = `
        SELECT 
          prs.id as status_id,
          prs.user_id,
          prs.period_id,
          prs.status,
          prs.early_request_date,
          prs.early_request_comment,
          erp.name as period_name,
          erp.start_date,
          erp.end_date,
          u.first_name || ' ' || u.last_name as employee_name,
          u.email,
          u.position
        FROM performance_review_status prs
        JOIN employee_review_periods erp ON prs.period_id = erp.id
        JOIN users u ON prs.user_id = u.id
        WHERE u.manager_id = $1 
          AND prs.status IN ('pending_approval', 'manager_approved')
        ORDER BY prs.early_request_date DESC
      `;
      queryParams = [req.user.id];
    } else {
      // HR видит все запросы со статусом manager_approved
      queryText = `
        SELECT 
          prs.id as status_id,
          prs.user_id,
          prs.period_id,
          prs.status,
          prs.early_request_date as requested_date,
          prs.early_request_comment as employee_comment,
          prs.manager_approved_date,
          prs.manager_approval_comment,
          erp.name as period_name,
          erp.start_date,
          erp.end_date,
          u.first_name || ' ' || u.last_name as employee_name,
          u.email,
          u.position,
          m.first_name as manager_first_name,
          m.last_name as manager_last_name
        FROM performance_review_status prs
        JOIN employee_review_periods erp ON prs.period_id = erp.id
        JOIN users u ON prs.user_id = u.id
        LEFT JOIN users m ON u.manager_id = m.id
        WHERE prs.status = 'manager_approved'
        ORDER BY prs.manager_approved_date DESC
      `;
    }
    
    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения списка запросов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Одобрить/отклонить запрос (руководитель)
app.post('/api/performance-review/manager-decision/:statusId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Только руководитель может принимать решение' });
    }
    
    const statusId = req.params.statusId;
    const { approved, comment } = req.body;
    
    // Проверяем, что это запрос от подчиненного
    const statusResult = await query(`
      SELECT prs.*, u.manager_id
      FROM performance_review_status prs
      JOIN employee_review_periods erp ON prs.period_id = erp.id
      JOIN users u ON prs.user_id = u.id
      WHERE prs.id = $1
    `, [statusId]);
    
    if (statusResult.rows.length === 0) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }
    
    const request = statusResult.rows[0];
    
    if (request.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Вы не являетесь руководителем этого сотрудника' });
    }
    
    if (request.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Этот запрос уже обработан' });
    }
    
    // Обновляем статус
    const newStatus = approved ? 'manager_approved' : 'not_started';
    
    await query(`
      UPDATE performance_review_status
      SET 
        status = $1,
        manager_approved_date = NOW(),
        manager_approved_by = $2,
        manager_approval_comment = $3,
        updated_at = NOW()
      WHERE id = $4
    `, [newStatus, req.user.id, comment, statusId]);
    
    res.json({ 
      success: true, 
      message: approved 
        ? 'Запрос одобрен. Ожидается одобрение HR.' 
        : 'Запрос отклонен'
    });
  } catch (error) {
    console.error('Ошибка принятия решения руководителем:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Одобрить/отклонить запрос (HR)
app.post('/api/performance-review/hr-decision/:statusId', authenticateToken, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Только HR может принимать финальное решение' });
    }
    
    const statusId = req.params.statusId;
    const { approved, comment } = req.body;
    
    // Проверяем статус
    const statusResult = await client.query(
      `SELECT prs.*, erp.user_id, erp.start_date, erp.end_date, erp.id as period_id
       FROM performance_review_status prs
       JOIN employee_review_periods erp ON prs.period_id = erp.id
       WHERE prs.id = $1`,
      [statusId]
    );
    
    if (statusResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Запрос не найден' });
    }
    
    const request = statusResult.rows[0];
    
    if (request.status !== 'manager_approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Запрос должен быть сначала одобрен руководителем' });
    }
    
    if (approved) {
      // ОДОБРЕНО: Делаем PR доступным и пересчитываем периоды
      const newStatus = 'available';
      
      await client.query(`
        UPDATE performance_review_status
        SET 
          status = $1,
          hr_approved_date = NOW(),
          hr_approved_by = $2,
          hr_approval_comment = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [newStatus, req.user.id, comment, statusId]);
      
      // Пересчитываем периоды: сокращаем текущий период и сдвигаем последующие
      const userId = request.user_id;
      const periodId = request.period_id;
      const originalEndDate = new Date(request.end_date);
      const newEndDate = new Date(); // Начинаем PR сейчас
      
      // Вычисляем сдвиг в днях
      const daysDiff = Math.floor((originalEndDate - newEndDate) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 Пересчет периодов для пользователя ${userId}:`);
      console.log(`   Период ID ${periodId}: конец сдвигается с ${originalEndDate.toISOString()} на ${newEndDate.toISOString()}`);
      console.log(`   Сдвиг: ${daysDiff} дней`);
      
      // Обновляем текущий период (завершаем его сейчас)
      await client.query(`
        UPDATE employee_review_periods
        SET end_date = CURRENT_DATE
        WHERE id = $1
      `, [periodId]);
      
      // Сдвигаем все последующие периоды на разницу в днях
      // Находим периоды, которые начинаются после текущего периода
      await client.query(`
        UPDATE employee_review_periods
        SET 
          start_date = start_date - INTERVAL '${daysDiff} days',
          end_date = end_date - INTERVAL '${daysDiff} days'
        WHERE user_id = $1 AND start_date > $2
      `, [userId, request.end_date]);
      
      console.log(`✅ Периоды пересчитаны для пользователя ${userId}`);
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Запрос одобрен. Performance Review начат досрочно. Последующие периоды пересчитаны.',
        periodAdjusted: true,
        daysSaved: daysDiff
      });
    } else {
      // ОТКЛОНЕНО: просто возвращаем статус
      await client.query(`
        UPDATE performance_review_status
        SET 
          status = 'not_started',
          hr_approved_date = NOW(),
          hr_approved_by = $1,
          hr_approval_comment = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [req.user.id, comment, statusId]);
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Запрос отклонен',
        periodAdjusted: false
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка принятия решения HR:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// HR: Отправка рекомендаций сотруднику
app.post('/api/hr/send-employee-recommendations/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { achievements, improvements, developmentPlan } = req.body;
    
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Проверяем, существует ли сотрудник
    const employeeCheck = await query('SELECT id, first_name, last_name FROM users WHERE id = $1', [employeeId]);
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    // Создаем таблицу для рекомендаций, если её нет
    await query(`
      CREATE TABLE IF NOT EXISTS employee_recommendations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hr_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        achievements TEXT,
        improvements TEXT,
        development_plan TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false
      )
    `);

    // Сохраняем рекомендации для сотрудника
    const result = await query(`
      INSERT INTO employee_recommendations 
        (employee_id, hr_id, achievements, improvements, development_plan, sent_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [employeeId, req.user.id, achievements, improvements, developmentPlan]);

    console.log(`✅ Рекомендации отправлены сотруднику ${employeeCheck.rows[0].first_name} ${employeeCheck.rows[0].last_name}`);

    res.json({ 
      success: true, 
      message: 'Рекомендации успешно отправлены сотруднику',
      recommendation: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Ошибка при отправке рекомендаций сотруднику:', error);
    res.status(500).json({ error: 'Ошибка сервера при отправке рекомендаций' });
  }
});

// HR: Отправка управленческих рекомендаций руководителю
app.post('/api/hr/send-manager-recommendations/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { recommendations } = req.body;
    
    // Проверка роли
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Получаем информацию о сотруднике и его руководителе
    const employeeResult = await query(`
      SELECT u.id, u.first_name, u.last_name, u.manager_id,
             m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.id = $1
    `, [employeeId]);

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const employee = employeeResult.rows[0];
    
    if (!employee.manager_id) {
      return res.status(400).json({ error: 'У сотрудника не назначен руководитель' });
    }

    // Создаем таблицу для управленческих рекомендаций, если её нет
    await query(`
      CREATE TABLE IF NOT EXISTS manager_recommendations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hr_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recommendations TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false
      )
    `);

    // Сохраняем управленческие рекомендации
    const result = await query(`
      INSERT INTO manager_recommendations 
        (employee_id, manager_id, hr_id, recommendations, sent_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [employeeId, employee.manager_id, req.user.id, recommendations]);

    console.log(`✅ Управленческие рекомендации отправлены руководителю ${employee.manager_first_name} ${employee.manager_last_name} по сотруднику ${employee.first_name} ${employee.last_name}`);

    res.json({ 
      success: true, 
      message: 'Управленческие рекомендации успешно отправлены руководителю',
      recommendation: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Ошибка при отправке управленческих рекомендаций:', error);
    res.status(500).json({ error: 'Ошибка сервера при отправке рекомендаций' });
  }
});

// Сотрудник: Получить свои рекомендации от HR
app.get('/api/employee/my-recommendations', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        er.id,
        er.achievements,
        er.improvements,
        er.development_plan,
        er.sent_at,
        er.is_read,
        CONCAT(u.first_name, ' ', u.last_name) as hr_name
      FROM employee_recommendations er
      LEFT JOIN users u ON er.hr_id = u.id
      WHERE er.employee_id = $1
      ORDER BY er.sent_at DESC
    `, [req.user.id]);

    res.json(result.rows);

  } catch (error) {
    console.error('❌ Ошибка при получении рекомендаций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Менеджер: Получить управленческие рекомендации по своим сотрудникам
app.get('/api/manager/recommendations', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const result = await query(`
      SELECT 
        mr.id,
        mr.employee_id,
        mr.recommendations,
        mr.sent_at,
        mr.is_read,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.position as employee_position,
        CONCAT(hr.first_name, ' ', hr.last_name) as hr_name
      FROM manager_recommendations mr
      JOIN users e ON mr.employee_id = e.id
      LEFT JOIN users hr ON mr.hr_id = hr.id
      WHERE mr.manager_id = $1
      ORDER BY mr.sent_at DESC
    `, [req.user.id]);

    res.json(result.rows);

  } catch (error) {
    console.error('❌ Ошибка при получении управленческих рекомендаций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отметить рекомендацию как прочитанную
app.post('/api/recommendations/mark-read/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'employee' или 'manager'

    const tableName = type === 'employee' ? 'employee_recommendations' : 'manager_recommendations';
    
    await query(`
      UPDATE ${tableName}
      SET is_read = true
      WHERE id = $1
    `, [id]);

    res.json({ success: true, message: 'Рекомендация отмечена как прочитанная' });

  } catch (error) {
    console.error('❌ Ошибка при обновлении статуса рекомендации:', error);
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
      SELECT erp.*, u.manager_id, u.first_name, u.last_name, u.id as employee_id
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
        period.rows[0].employee_id,
        periodId
      ]);
    }

    res.json({ success: true, message: 'Отправлено HR на утверждение' });
  } catch (error) {
    console.error('Error approving by manager:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Отклонение руководителем
app.post('/api/review-periods/:periodId/manager-reject', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const managerId = req.user.id;
    const { reason } = req.body;

    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name, u.id as employee_id
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1 AND u.manager_id = $2
    `, [periodId, managerId]);

    if (period.rows.length === 0) {
      return res.status(403).json({ error: 'Вы не руководитель этого сотрудника' });
    }

    await query(`
      UPDATE employee_review_periods
      SET status = 'not_started',
          requested_early_at = NULL,
          manager_approved = false,
          manager_approved_at = NULL,
          manager_approved_by = NULL
      WHERE id = $1
    `, [periodId]);

    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
    `, [
      period.rows[0].employee_id,
      'early_pr_rejected',
      '❌ Запрос на досрочный Performance Review отклонен',
      `Руководитель отклонил ваш запрос на досрочное начало Performance Review.\n\nПричина: ${reason || 'не указана'}\n\nВы можете подать новый запрос после устранения указанных замечаний.`,
      periodId
    ]);

    res.json({ success: true, message: 'Запрос отклонен' });
  } catch (error) {
    console.error('Error rejecting by manager:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Утверждение HR
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

    // Отметим связанные уведомления о раннем PR как прочитанные, чтобы они не оставались в списке
    await query(`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE related_id = $1 AND type LIKE 'early_pr_%'
    `, [periodId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving by HR:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4.5. Отклонение HR
app.post('/api/review-periods/:periodId/hr-reject', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const { reason } = req.body;

    if (req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Только HR может отклонять' });
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

    // Откатываем статус на pending_manager_approval
    await query(`
      UPDATE employee_review_periods
      SET status = 'pending_manager_approval',
          hr_approved = false,
          hr_approved_at = NULL,
          hr_approved_by = NULL
      WHERE id = $1
    `, [periodId]);

    // Уведомляем сотрудника
    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
    `, [
      period.rows[0].employee_id,
      'early_pr_rejected_by_hr',
      '❌ HR отклонил запрос на досрочный Performance Review',
      `HR отклонил ваш запрос на досрочное начало Performance Review.\n\nПричина: ${reason || 'не указана'}\n\nСвяжитесь с HR для уточнения деталей.`,
      periodId
    ]);

    // Отметим связанные уведомления о раннем PR как прочитанные, чтобы они не оставались в списке HR
    await query(`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE related_id = $1 AND type LIKE 'early_pr_%'
    `, [periodId]);

    res.json({ success: true, message: 'Запрос отклонен' });
  } catch (error) {
    console.error('Error rejecting by HR:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Получение своих периодов
app.get('/api/review-periods/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        erp.*,
        (SELECT COUNT(*) FROM peer_feedback_requests 
         WHERE requester_id = erp.user_id AND period_id = erp.id AND status = 'completed') as peer_reviews_count
      FROM employee_review_periods erp
      WHERE erp.user_id = $1
        AND (erp.status IN ('not_started', 'in_progress', 'pending_manager_approval', 'pending_hr_approval', 'awaiting_calculation', 'calculated') 
             OR erp.status = 'completed')
      ORDER BY 
        CASE 
          WHEN erp.status IN ('not_started', 'in_progress', 'pending_manager_approval', 'pending_hr_approval', 'awaiting_calculation') THEN 0
          WHEN erp.status = 'calculated' THEN 1
          ELSE 2
        END,
        erp.start_date DESC
      LIMIT 3
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting my periods:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Периоды для утверждения руководителем
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

// 7. Периоды для утверждения HR
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

// 8. Завершение самооценки
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

    // Проверяем, набралось ли минимум 3 отзыва
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

// 9. Обновление счетчика peer reviews
app.post('/api/peer-feedback/:requestId/complete', authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);

    const request = await query(
      'SELECT * FROM peer_feedback_requests WHERE id = $1 AND reviewer_id = $2',
      [requestId, req.user.id]
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    await query(`
      UPDATE peer_feedback_requests
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = $1
    `, [requestId]);

    // Обновляем счетчик
    await query(`
      UPDATE employee_review_periods
      SET peer_reviews_count = (
        SELECT COUNT(*) FROM peer_feedback_requests 
        WHERE requester_id = $1 AND period_id = $2 AND status = 'completed'
      )
      WHERE id = $2
    `, [request.rows[0].requester_id, request.rows[0].period_id]);

    // Проверяем условия для уведомления руководителя
    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1
    `, [request.rows[0].period_id]);

    if (period.rows.length > 0 && period.rows[0].peer_reviews_count >= 3 && 
        period.rows[0].self_assessment_completed && period.rows[0].manager_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        period.rows[0].manager_id,
        'ready_for_manager_evaluation',
        'Готово к оценке сотрудника',
        `${period.rows[0].first_name} ${period.rows[0].last_name} готов к итоговой оценке`,
        period.rows[0].user_id,
        period.rows[0].id
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing peer feedback:', error);
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
  console.log('   GET  /api/hr/analytics - HR аналитика');
  console.log('   GET  /api/hr/employee-scores - Баллы сотрудников');
  console.log('   GET  /api/hr/nine-box - 9-Box матрица');
  console.log('   POST /api/hr/send-employee-recommendations/:id - Отправить рекомендации сотруднику');
  console.log('   POST /api/hr/send-manager-recommendations/:id - Отправить рекомендации руководителю');
  console.log('   GET  /api/employee/my-recommendations - Получить свои рекомендации');
  console.log('   GET  /api/manager/recommendations - Получить рекомендации по команде');
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
  console.log('   POST /api/review-periods/:id/manager-reject - Отклонить (руководитель)');
  console.log('   POST /api/review-periods/:id/hr-approve - Утвердить (HR)');
  console.log('   GET  /api/review-periods/my - Мои периоды');
  console.log('   GET  /api/review-periods/pending-manager-approval - Ожидают утверждения руководителя');
  console.log('   GET  /api/review-periods/pending-hr-approval - Ожидают утверждения HR');
  console.log('   GET  /api/health - Проверка здоровья API\n');
});
