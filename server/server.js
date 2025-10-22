const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'wink-performance-review-secret-key-2025';

// Middleware
app.use(cors());
app.use(express.json());

// Тестовые пользователи (в реальном проекте - база данных)
const users = [
  {
    id: 1,
    username: 'employee',
    password: bcrypt.hashSync('employee123', 10),
    name: 'Иван Иванов',
    email: 'ivan@wink.ru',
    role: 'employee'
  },
  {
    id: 2,
    username: 'manager',
    password: bcrypt.hashSync('manager123', 10),
    name: 'Мария Петрова',
    email: 'maria@wink.ru',
    role: 'manager'
  },
  {
    id: 3,
    username: 'hr',
    password: bcrypt.hashSync('hr123', 10),
    name: 'Елена Сидорова',
    email: 'elena@wink.ru',
    role: 'hr'
  },
  {
    id: 4,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Администратор',
    email: 'admin@wink.ru',
    role: 'admin'
  }
];

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
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Получение информации о текущем пользователе
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// Получение всех пользователей (только для admin)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const usersList = users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role
  }));

  res.json(usersList);
});

// Аудит действий (заглушка для демонстрации)
app.get('/api/audit', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const auditLogs = [
    { id: 1, user: 'hr@wink.ru', action: 'Экспорт данных 9-Box', timestamp: new Date(), ip: '192.168.1.15' },
    { id: 2, user: 'manager@wink.ru', action: 'Утверждение целей сотрудника', timestamp: new Date(), ip: '192.168.1.22' },
    { id: 3, user: 'employee@wink.ru', action: 'Создание новой цели', timestamp: new Date(), ip: '192.168.1.34' }
  ];

  res.json(auditLogs);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WINK Performance Review API работает' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`WINK Performance Review API готов к работе`);
});
