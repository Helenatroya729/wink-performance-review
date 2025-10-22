import React, { useState } from 'react';
import './Login.css';
import WinkLogo from '../assets/wink-logo.svg';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Тестовые пользователи для демонстрации
  const testUsers = [
    { username: 'employee', password: 'employee123', role: 'employee', name: 'Иван Иванов' },
    { username: 'manager', password: 'manager123', role: 'manager', name: 'Мария Петрова' },
    { username: 'hr', password: 'hr123', role: 'hr', name: 'Елена Сидорова' },
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Администратор' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = testUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      onLogin({
        username: user.username,
        name: user.name,
        role: user.role
      });
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src={WinkLogo} alt="WINK" className="wink-logo" />
        </div>
        
        <h1 className="login-title">Performance Review</h1>
        <p className="login-subtitle">Система оценки персонала</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Логин</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Войти
          </button>
        </form>

        <div className="test-credentials">
          <p className="test-title">Тестовые учетные записи:</p>
          <div className="credentials-grid">
            <div className="credential-item">
              <strong>Сотрудник:</strong> employee / employee123
            </div>
            <div className="credential-item">
              <strong>Руководитель:</strong> manager / manager123
            </div>
            <div className="credential-item">
              <strong>HR:</strong> hr / hr123
            </div>
            <div className="credential-item">
              <strong>Администратор:</strong> admin / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
