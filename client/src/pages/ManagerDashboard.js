import React from 'react';
import Header from '../components/Header';
import './Dashboard.css';

const ManagerDashboard = ({ user, onLogout }) => {
  const teamMembers = [
    { id: 1, name: 'Иван Иванов', role: 'Senior Developer', goals: 5, completed: 3, rating: 8.5, status: 'pending-review' },
    { id: 2, name: 'Петр Петров', role: 'Middle Developer', goals: 4, completed: 4, rating: 9.0, status: 'approved' },
    { id: 3, name: 'Анна Смирнова', role: 'Junior Developer', goals: 3, completed: 2, rating: 7.5, status: 'pending-review' }
  ];

  const pendingActions = [
    { id: 1, type: 'Утверждение целей', count: 3 },
    { id: 2, type: 'Оценка сотрудников', count: 2 },
    { id: 3, type: 'Обратная связь', count: 5 }
  ];

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Панель руководителя</h1>
          <p>Управление командой и оценка сотрудников</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">12</div>
            <div className="stat-label">Сотрудников в команде</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">5</div>
            <div className="stat-label">Ожидают оценки</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">7</div>
            <div className="stat-label">Оценки завершены</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-value">8.2</div>
            <div className="stat-label">Средний рейтинг</div>
          </div>
        </div>

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <h2 className="section-title">Моя команда</h2>
              <div className="team-table">
                <table>
                  <thead>
                    <tr>
                      <th>Сотрудник</th>
                      <th>Должность</th>
                      <th>Цели</th>
                      <th>Рейтинг</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr key={member.id}>
                        <td><strong>{member.name}</strong></td>
                        <td>{member.role}</td>
                        <td>
                          <span className="goals-progress">
                            {member.completed}/{member.goals}
                          </span>
                        </td>
                        <td>
                          <span className="rating-badge">{member.rating}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${member.status}`}>
                            {member.status === 'pending-review' ? 'Ожидает' : 'Утверждено'}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn">Оценить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Калибровочная сессия</h2>
              <div className="calibration-info">
                <p className="calibration-date">Следующая сессия: 30 октября 2025, 14:00</p>
                <p className="calibration-participants">Участники: 5 руководителей, HR</p>
                <button className="primary-button">Подготовить данные</button>
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Требуют внимания</h2>
              <div className="pending-list">
                {pendingActions.map(action => (
                  <div key={action.id} className="pending-item">
                    <div className="pending-count">{action.count}</div>
                    <div className="pending-type">{action.type}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">9-Box матрица</h2>
              <div className="nine-box-preview">
                <div className="nine-box-grid">
                  <div className="box high">2</div>
                  <div className="box high">3</div>
                  <div className="box high">1</div>
                  <div className="box medium">1</div>
                  <div className="box medium">2</div>
                  <div className="box medium">1</div>
                  <div className="box low">0</div>
                  <div className="box low">1</div>
                  <div className="box low">1</div>
                </div>
                <button className="secondary-button">Открыть полную матрицу</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
