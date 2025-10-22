import React from 'react';
import Header from '../components/Header';
import './Dashboard.css';

const EmployeeDashboard = ({ user, onLogout }) => {
  const quickActions = [
    { id: 1, title: 'Создать цели', icon: '', color: '#FF6B00' },
    { id: 2, title: 'Самооценка', icon: '', color: '#FF8533' },
    { id: 3, title: 'Запросить оценку', icon: '', color: '#FFA366' },
    { id: 4, title: 'План развития', icon: '', color: '#FFB580' }
  ];

  const myGoals = [
    { id: 1, title: 'Разработка нового модуля аналитики', status: 'В процессе', progress: 65 },
    { id: 2, title: 'Оптимизация производительности API', status: 'В процессе', progress: 40 },
    { id: 3, title: 'Обучение команды новым технологиям', status: 'Запланировано', progress: 15 }
  ];

  const notifications = [
    { id: 1, text: 'Новый запрос на оценку от коллеги', time: '2 часа назад' },
    { id: 2, text: 'Руководитель оставил обратную связь', time: '1 день назад' },
    { id: 3, text: 'Напоминание: завершить самооценку до 25 октября', time: '3 дня назад' }
  ];

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Добро пожаловать, {user.name}!</h1>
          <p>Управляйте своими целями и развитием</p>
        </div>

        <div className="quick-actions">
          {quickActions.map(action => (
            <div key={action.id} className="action-card" style={{ borderLeftColor: action.color }}>
              <div className="action-icon">{action.icon}</div>
              <div className="action-title">{action.title}</div>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <h2 className="section-title">Мои цели на период</h2>
              <div className="goals-list">
                {myGoals.map(goal => (
                  <div key={goal.id} className="goal-item">
                    <div className="goal-header">
                      <h3>{goal.title}</h3>
                      <span className={`goal-status ${goal.status === 'В процессе' ? 'in-progress' : 'planned'}`}>
                        {goal.status}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                    <span className="progress-text">{goal.progress}% выполнено</span>
                  </div>
                ))}
              </div>
              <button className="add-goal-button">+ Добавить новую цель</button>
            </div>

            <div className="section-card">
              <h2 className="section-title">Оценка 360°</h2>
              <div className="assessment-status">
                <div className="status-item">
                  <div className="status-number">4/5</div>
                  <div className="status-label">Самооценка заполнена</div>
                </div>
                <div className="status-item">
                  <div className="status-number">3/5</div>
                  <div className="status-label">Ответы коллег</div>
                </div>
                <div className="status-item">
                  <div className="status-number">Ожидание</div>
                  <div className="status-label">Оценка руководителя</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Уведомления</h2>
              <div className="notifications-list">
                {notifications.map(notif => (
                  <div key={notif.id} className="notification-item">
                    <div className="notification-dot"></div>
                    <div>
                      <p className="notification-text">{notif.text}</p>
                      <span className="notification-time">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Мой рейтинг</h2>
              <div className="rating-display">
                <div className="rating-score">8.5</div>
                <div className="rating-label">Хороший результат</div>
                <div className="rating-trend">↗ +0.5 с прошлого периода</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
