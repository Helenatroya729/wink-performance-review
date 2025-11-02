import React from 'react';
import Header from '../components/Header';
import './Dashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const systemStats = [
    { id: 1, title: 'Активных пользователей', value: '247', icon: '👥' },
    { id: 2, title: 'Интеграций', value: '5', icon: '🔗' },
    { id: 3, title: 'Записей в аудите', value: '1,245', icon: '📋' },
    { id: 4, title: 'Активных сессий', value: '89', icon: '🔐' }
  ];

  const users = [
    { id: 1, name: 'Иван Иванов', email: 'ivan@wink.ru', role: 'employee', status: 'active' },
    { id: 2, name: 'Мария Петрова', email: 'maria@wink.ru', role: 'manager', status: 'active' },
    { id: 3, name: 'Елена Сидорова', email: 'elena@wink.ru', role: 'hr', status: 'active' },
    { id: 4, name: 'Петр Смирнов', email: 'petr@wink.ru', role: 'employee', status: 'inactive' }
  ];

  const integrations = [
    { id: 1, name: 'API Корпоративный портал', status: 'active', lastSync: '5 мин назад' },
    { id: 2, name: 'LDAP/Active Directory', status: 'active', lastSync: '1 час назад' },
    { id: 3, name: 'Email уведомления', status: 'active', lastSync: '10 мин назад' },
    { id: 4, name: 'Экспорт в Excel', status: 'active', lastSync: 'По запросу' },
    { id: 5, name: 'Webhooks', status: 'inactive', lastSync: 'Не настроено' }
  ];

  const recentAudit = [
    { id: 1, user: 'hr@wink.ru', action: 'Экспорт данных 9-Box', time: '10:45', ip: '192.168.1.25' },
    { id: 2, user: 'manager@wink.ru', action: 'Утверждение целей сотрудника', time: '10:32', ip: '192.168.1.15' },
    { id: 3, user: 'employee@wink.ru', action: 'Создание новой цели', time: '10:15', ip: '192.168.1.34' },
    { id: 4, user: 'admin@wink.ru', action: 'Изменение роли пользователя', time: '09:58', ip: '192.168.1.10' }
  ];

  const getRoleName = (role) => {
    const roles = {
      employee: 'Сотрудник',
      manager: 'Руководитель',
      hr: 'HR',
      admin: 'Администратор'
    };
    return roles[role] || role;
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Панель администратора</h1>
          <p>Управление системой и пользователями</p>
        </div>

        <div className="stats-grid">
          {systemStats.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon"></div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">Управление пользователями</h2>
                <button className="primary-button">+ Добавить пользователя</button>
              </div>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Имя</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td>
                          <span className="role-badge">{getRoleName(user.role)}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.status}`}>
                            {user.status === 'active' ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn small">Редактировать</button>
                          <button className="action-btn small">Удалить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Интеграции</h2>
              <div className="integrations-list">
                {integrations.map(integration => (
                  <div key={integration.id} className="integration-item">
                    <div className="integration-info">
                      <div className="integration-name">{integration.name}</div>
                      <div className="integration-sync">Последняя синхронизация: {integration.lastSync}</div>
                    </div>
                    <div className="integration-status">
                      <span className={`status-indicator ${integration.status}`}></span>
                      <span>{integration.status === 'active' ? 'Активна' : 'Неактивна'}</span>
                    </div>
                    <button className="action-btn">Настроить</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Аудит действий</h2>
              <div className="audit-table">
                <table>
                  <thead>
                    <tr>
                      <th>Время</th>
                      <th>Пользователь</th>
                      <th>Действие</th>
                      <th>IP-адрес</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAudit.map(log => (
                      <tr key={log.id}>
                        <td>{log.time}</td>
                        <td>{log.user}</td>
                        <td>{log.action}</td>
                        <td className="ip-cell">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="secondary-button">Показать все записи</button>
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Системные настройки</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-label">Автоматическая синхронизация</div>
                  <div className="toggle active"></div>
                </div>
                <div className="setting-item">
                  <div className="setting-label">Email уведомления</div>
                  <div className="toggle active"></div>
                </div>
                <div className="setting-item">
                  <div className="setting-label">Двухфакторная аутентификация</div>
                  <div className="toggle"></div>
                </div>
                <div className="setting-item">
                  <div className="setting-label">Резервное копирование</div>
                  <div className="toggle active"></div>
                </div>
              </div>
              <button className="secondary-button">Все настройки</button>
            </div>

            <div className="section-card">
              <h2 className="section-title">Роли и права</h2>
              <div className="roles-list">
                <div className="role-item">
                  <div className="role-name">Администратор</div>
                  <div className="role-count"> пользователя</div>
                </div>
                <div className="role-item">
                  <div className="role-name">HR</div>
                  <div className="role-count">5 пользователей</div>
                </div>
                <div className="role-item">
                  <div className="role-name">Руководитель</div>
                  <div className="role-count">8 пользователей</div>
                </div>
                <div className="role-item">
                  <div className="role-name">Сотрудник</div>
                  <div className="role-count"> пользователей</div>
                </div>
              </div>
              <button className="secondary-button">Управление ролями</button>
            </div>

            <div className="section-card">
              <h2 className="section-title">Экспорт данных</h2>
              <div className="export-buttons">
                <button className="export-btn">Excel</button>
                <button className="export-btn">PDF</button>
                <button className="export-btn">CSV</button>
                <button className="export-btn">JSON</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
