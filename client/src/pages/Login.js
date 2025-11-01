import React, { useState } from 'react';
import './Login.css';
import WinkLogo from '../assets/wink-logo.svg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = (userEmail) => {
    setEmail(userEmail);
    setPassword('123456');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при входе');
        setLoading(false);
        return;
      }

      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin({
        ...data.user,
        name: `${data.user.first_name} ${data.user.last_name}`,
        token: data.token
      });

    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите email"
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="test-credentials">
          <p className="test-title">📋 Тестовые учетные записи (пароль для всех: <strong>123456</strong>)</p>
          <p className="quick-login-hint">💡 Кликните на карточку для автозаполнения формы</p>
          
          <div className="credentials-section">
            <h4 className="role-header">👤 АДМИНИСТРАТОР</h4>
            <div className="credential-card" onClick={() => handleQuickLogin('admin@wink.ru')}>
              <div className="credential-name">Системный Администратор</div>
              <div className="credential-email">admin@wink.ru</div>
            </div>
          </div>

          <div className="credentials-section">
            <h4 className="role-header">👔 HR</h4>
            <div className="credential-card" onClick={() => handleQuickLogin('hr@wink.ru')}>
              <div className="credential-name">Ольга Соколова</div>
              <div className="credential-email">hr@wink.ru</div>
              <div className="credential-position">HR Менеджер</div>
            </div>
          </div>

          <div className="credentials-section">
            <h4 className="role-header">👨‍💼 Руководители</h4>
            <div className="credential-card" onClick={() => handleQuickLogin('manager1@wink.ru')}>
              <div className="credential-name">Кирилл Менеджеров</div>
              <div className="credential-email">manager1@wink.ru</div>
              <div className="credential-position">Team Lead</div>
            </div>
            <div className="credential-card" onClick={() => handleQuickLogin('manager2@wink.ru')}>
              <div className="credential-name">Мария Петрова</div>
              <div className="credential-email">manager2@wink.ru</div>
              <div className="credential-position">Marketing Manager</div>
            </div>
          </div>

          <div className="credentials-section">
            <h4 className="role-header">👥 Сотрудники</h4>
            <div className="credential-card" onClick={() => handleQuickLogin('emp1@wink.ru')}>
              <div className="credential-name">Иван Иванов</div>
              <div className="credential-email">emp1@wink.ru</div>
              <div className="credential-position">Senior Developer</div>
            </div>
            <div className="credential-card" onClick={() => handleQuickLogin('emp2@wink.ru')}>
              <div className="credential-name">Анна Сидорова</div>
              <div className="credential-email">emp2@wink.ru</div>
              <div className="credential-position">Middle Developer</div>
            </div>
            <div className="credential-card" onClick={() => handleQuickLogin('emp3@wink.ru')}>
              <div className="credential-name">Петр Петров</div>
              <div className="credential-email">emp3@wink.ru</div>
              <div className="credential-position">Junior Developer</div>
            </div>
            <div className="credential-card" onClick={() => handleQuickLogin('emp4@wink.ru')}>
              <div className="credential-name">Ольга Васильева</div>
              <div className="credential-email">emp4@wink.ru</div>
              <div className="credential-position">Marketing Specialist</div>
            </div>
            <div className="credential-card" onClick={() => handleQuickLogin('emp5@wink.ru')}>
              <div className="credential-name">Дмитрий Смирнов</div>
              <div className="credential-email">emp5@wink.ru</div>
              <div className="credential-position">Content Manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
