import React from 'react';
import Header from '../components/Header';
import './Dashboard.css';

const HRDashboard = ({ user, onLogout }) => {
  const analytics = [
    { id: 1, title: 'Общий охват оценки', value: '87%', trend: '+5%' },
    { id: 2, title: 'Средний рейтинг по компании', value: '7.8', trend: '+0.3' },
    { id: 3, title: 'Завершенных оценок', value: '145/167', trend: '87%' },
    { id: 4, title: 'Планов развития', value: '132', trend: '+12' }
  ];

  const salaryRecommendations = [
    { category: 'Высокий результат', count: 45, budget: '15%' },
    { category: 'Средний результат', count: 78, budget: '8%' },
    { category: 'Низкий результат', count: 22, budget: '0%' }
  ];

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>HR Аналитика</h1>
          <p>Анализ данных и управление процессами оценки</p>
        </div>

        <div className="analytics-grid">
          {analytics.map(item => (
            <div key={item.id} className="analytics-card">
              <div className="analytics-value">{item.value}</div>
              <div className="analytics-title">{item.title}</div>
              <div className="analytics-trend">{item.trend}</div>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <h2 className="section-title">Матрица 9-Box по компании</h2>
              <div className="nine-box-full">
                <div className="nine-box-labels">
                  <div className="y-label">Потенциал</div>
                  <div className="nine-box-matrix">
                    <div className="box-row">
                      <div className="box high-potential">
                        <div className="box-title">Высокий потенциал</div>
                        <div className="box-count">12 чел.</div>
                      </div>
                      <div className="box high-potential">
                        <div className="box-title">Звезды</div>
                        <div className="box-count">18 чел.</div>
                      </div>
                      <div className="box high-potential">
                        <div className="box-title">Топ-исполнители</div>
                        <div className="box-count">8 чел.</div>
                      </div>
                    </div>
                    <div className="box-row">
                      <div className="box medium-potential">
                        <div className="box-title">Развивающиеся</div>
                        <div className="box-count">15 чел.</div>
                      </div>
                      <div className="box medium-potential">
                        <div className="box-title">Ключевые игроки</div>
                        <div className="box-count">32 чел.</div>
                      </div>
                      <div className="box medium-potential">
                        <div className="box-title">Эффективные</div>
                        <div className="box-count">24 чел.</div>
                      </div>
                    </div>
                    <div className="box-row">
                      <div className="box low-potential">
                        <div className="box-title">Новички</div>
                        <div className="box-count">8 чел.</div>
                      </div>
                      <div className="box low-potential">
                        <div className="box-title">Стабильные</div>
                        <div className="box-count">18 чел.</div>
                      </div>
                      <div className="box low-potential">
                        <div className="box-title">Риск</div>
                        <div className="box-count">12 чел.</div>
                      </div>
                    </div>
                  </div>
                  <div className="x-label">Эффективность</div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Рекомендации по Salary Increase</h2>
              <div className="salary-table">
                <table>
                  <thead>
                    <tr>
                      <th>Категория</th>
                      <th>Кол-во сотрудников</th>
                      <th>Рекомендуемый бюджет</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecommendations.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.category}</strong></td>
                        <td>{item.count}</td>
                        <td className="budget-cell">{item.budget}</td>
                        <td>
                          <span className={`status-badge ${item.budget === '0%' ? 'not-recommended' : 'recommended'}`}>
                            {item.budget === '0%' ? 'Не включать' : 'Включить'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Быстрые действия</h2>
              <div className="action-buttons">
                <button className="action-button">Экспорт данных</button>
                <button className="action-button">Создать отчет</button>
                <button className="action-button">Управление калибровками</button>
                <button className="action-button">Отправить напоминания</button>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Прогресс цикла PR</h2>
              <div className="cycle-progress">
                <div className="progress-step completed">
                  <div className="step-number">1</div>
                  <div className="step-text">Постановка целей</div>
                </div>
                <div className="progress-step completed">
                  <div className="step-number">2</div>
                  <div className="step-text">Оценка 360°</div>
                </div>
                <div className="progress-step active">
                  <div className="step-number">3</div>
                  <div className="step-text">Калибровка</div>
                </div>
                <div className="progress-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Финализация</div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Тренды развития</h2>
              <div className="trends-list">
                <div className="trend-item">
                  <span className="trend-label">Лидерство</span>
                  <span className="trend-value">42%</span>
                </div>
                <div className="trend-item">
                  <span className="trend-label">Технические навыки</span>
                  <span className="trend-value">38%</span>
                </div>
                <div className="trend-item">
                  <span className="trend-label">Коммуникация</span>
                  <span className="trend-value">28%</span>
                </div>
                <div className="trend-item">
                  <span className="trend-label">Управление проектами</span>
                  <span className="trend-value">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
