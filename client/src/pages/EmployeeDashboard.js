import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const EmployeeDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, statsData, cyclesData, reviewsData] = await Promise.all([
        api.goals.getAll(),
        api.dashboard.getStats(),
        api.cycles.getAll(),
        api.peerFeedback.getPendingReviews()
      ]);
      setGoals(goalsData);
      setStats(statsData);
      setCycles(cyclesData);
      setPendingReviews(reviewsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [newGoal, setNewGoal] = useState({
    cycle_id: 2, // По умолчанию Годовая оценка 2025
    title: '',
    description: '',
    expected_deadline: '',
    expected_results: '',
    key_tasks: ''
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackGoal, setFeedbackGoal] = useState(null);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        // Обновление существующей цели
        await api.goals.update(editingGoal.id, newGoal);
        alert('Цель успешно обновлена!');
      } else {
        // Создание новой цели
        await api.goals.create(newGoal);
        alert('Цель успешно создана!');
      }
      
      setShowGoalForm(false);
      setEditingGoal(null);
      setNewGoal({
        cycle_id: 2,
        title: '',
        description: '',
        expected_deadline: '',
        expected_results: '',
        key_tasks: ''
      });
      loadData(); // Перезагружаем данные
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      cycle_id: goal.cycle_id,
      title: goal.title,
      description: goal.description || '',
      expected_deadline: goal.expected_deadline ? goal.expected_deadline.split('T')[0] : '',
      expected_results: goal.expected_results || '',
      key_tasks: goal.key_tasks || ''
    });
    setShowGoalForm(true);
  };

  const handleShowFeedback = (goal) => {
    setFeedbackGoal(goal);
    setShowFeedbackModal(true);
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
    setFeedbackGoal(null);
  };

  const handleEditFromFeedback = (goal) => {
    handleCloseFeedback();
    handleEditGoal(goal);
  };

  const handleSubmitForApproval = async (goalId) => {
    if (!window.confirm('Отправить цель на утверждение руководителю?')) {
      return;
    }
    
    try {
      await api.goals.update(goalId, { status: 'submitted' });
      alert('Цель отправлена на утверждение! Руководитель получит уведомление.');
      loadData();
    } catch (error) {
      alert('Ошибка при отправке: ' + error.message);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту цель?')) {
      return;
    }
    
    try {
      await api.goals.delete(goalId);
      alert('Цель удалена');
      loadData();
    } catch (error) {
      alert('Ошибка при удалении: ' + error.message);
    }
  };

  const quickActions = [
    { id: 1, title: 'Создать цели', icon: '', color: '#FF6B00', action: () => setShowGoalForm(true) },
    { id: 2, title: 'Самооценка', icon: '', color: '#FF8533', action: () => navigate('/self-assessment') },
    { id: 3, title: 'Запросить оценку', icon: '', color: '#FFA366', action: () => navigate('/peer-feedback') },
    { id: 4, title: 'План развития', icon: '', color: '#FFB580', action: () => alert('Функция в разработке') }
  ];

  // Формируем уведомления на основе реальных данных
  const notifications = [];
  
  // Добавляем уведомление о запросах на оценку от коллег
  if (pendingReviews.length > 0) {
    const latestReview = pendingReviews[0];
    notifications.push({
      id: 1,
      text: `${latestReview.requester_first_name} ${latestReview.requester_last_name} запрашивает вашу оценку`,
      time: new Date(latestReview.created_at).toLocaleDateString(),
      action: () => navigate('/peer-feedback?tab=pending')
    });
  }
  
  // Добавляем уведомление об обратной связи от руководителя
  const goalWithFeedback = goals.find(g => g.rejection_comment || g.manager_comment);
  if (goalWithFeedback) {
    notifications.push({
      id: 2,
      text: 'Руководитель оставил обратную связь',
      time: '1 день назад',
      action: () => handleShowFeedback(goalWithFeedback)
    });
  }
  
  // Добавляем напоминание о самооценке
  notifications.push({
    id: 3,
    text: 'Напоминание: завершить самооценку до 25 октября',
    time: '3 дня назад',
    action: () => navigate('/self-assessment')
  });

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Черновик',
      'submitted': 'Отправлено',
      'approved': 'Утверждено',
      'rejected': 'Отклонено'
    };
    return labels[status] || status;
  };

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
            <div 
              key={action.id} 
              className="action-card" 
              style={{ borderLeftColor: action.color, cursor: 'pointer' }}
              onClick={action.action}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-title">{action.title}</div>
            </div>
          ))}
        </div>

        {/* Модальная форма создания цели */}
        {showGoalForm && (
          <div className="modal-overlay" onClick={() => setShowGoalForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingGoal ? 'Редактировать цель' : 'Создать новую цель'}</h2>
              
              {/* Показываем обратную связь от менеджера, если есть */}
              {editingGoal && (editingGoal.rejection_comment || editingGoal.manager_comment) && (
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: editingGoal.status === 'rejected' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  borderLeft: `4px solid ${editingGoal.status === 'rejected' ? '#dc2626' : '#3b82f6'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: editingGoal.status === 'rejected' ? '#dc2626' : '#3b82f6',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {editingGoal.status === 'rejected' ? 'Цель отклонена' : 'Комментарий менеджера'}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--wink-white)',
                    lineHeight: '1.5'
                  }}>
          {editingGoal.rejection_comment || editingGoal.manager_comment}
                  </div>
                  {editingGoal.status === 'rejected' && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--wink-light-gray)',
                      marginTop: '8px',
                      fontStyle: 'italic'
                    }}>
                      Пожалуйста, внесите изменения и отправьте цель повторно
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleCreateGoal}>
                <div className="form-group">
                  <label>Цикл оценки *</label>
                  <select
                    required
                    value={newGoal.cycle_id}
                    onChange={(e) => setNewGoal({...newGoal, cycle_id: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--wink-medium-gray)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--wink-black)',
                      color: 'var(--wink-white)',
                      fontSize: '14px'
                    }}
                  >
                    {cycles.map(cycle => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name} ({new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Название цели *</label>
                  <input
                    type="text"
                    required
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    placeholder="Например: Повысить конверсию на 15%"
                  />
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    placeholder="Подробное описание цели..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Ожидаемые результаты</label>
                  <textarea
                    value={newGoal.expected_results}
                    onChange={(e) => setNewGoal({...newGoal, expected_results: e.target.value})}
                    placeholder="Что должно быть достигнуто..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Ключевые задачи</label>
                  <textarea
                    value={newGoal.key_tasks}
                    onChange={(e) => setNewGoal({...newGoal, key_tasks: e.target.value})}
                    placeholder="Основные шаги для достижения цели..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Ожидаемый срок</label>
                  <input
                    type="date"
                    value={newGoal.expected_deadline}
                    onChange={(e) => setNewGoal({...newGoal, expected_deadline: e.target.value})}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="btn-primary">
                    {editingGoal ? 'Сохранить изменения' : 'Создать цель'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowGoalForm(false);
                      setEditingGoal(null);
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFeedbackModal && feedbackGoal && (
          <div className="modal-overlay" onClick={handleCloseFeedback}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Комментарий руководителя</h2>
              <div style={{
                margin: '16px 0',
                padding: '16px',
                backgroundColor: 'var(--wink-dark-gray)',
                borderRadius: '8px',
                borderLeft: `4px solid ${feedbackGoal.status === 'rejected' ? '#dc2626' : 'var(--wink-orange)'}`
              }}>
                <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>Цель</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--wink-white)', marginBottom: '12px' }}>
                  {feedbackGoal.title}
                </div>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>
                    Цикл: {cycles.find(cycle => cycle.id === feedbackGoal.cycle_id)?.name || '—'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>
                    Статус: {getStatusLabel(feedbackGoal.status)}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>Комментарий</div>
                <div style={{
                  fontSize: '15px',
                  color: 'var(--wink-white)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  marginTop: '8px'
                }}>
                  {feedbackGoal.rejection_comment || feedbackGoal.manager_comment || 'Комментарий не указан'}
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleEditFromFeedback(feedbackGoal)}
                >
                  Редактировать цель
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseFeedback}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <h2 className="section-title">Мои цели на период</h2>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
              ) : (
                <>
                  <div className="goals-list">
                    {goals.length > 0 ? (
                      goals.map(goal => (
                        <div key={goal.id} className="goal-item">
                          <div className="goal-header">
                            <h3>{goal.title}</h3>
                            <span className={`goal-status ${goal.status === 'submitted' ? 'in-progress' : goal.status === 'approved' ? 'approved' : 'planned'}`}>
                              {getStatusLabel(goal.status)}
                            </span>
                          </div>
                          {goal.description && (
                            <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>
                              {goal.description}
                            </p>
                          )}
                          {goal.expected_results && (
                            <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>
                              <strong>Ожидаемый результат:</strong> {goal.expected_results}
                            </p>
                          )}
                          {goal.expected_deadline && (
                            <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>
                              <strong>Срок:</strong> {new Date(goal.expected_deadline).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                          
                          {goal.rejection_comment && goal.status === 'rejected' && (
                            <div style={{ 
                              marginTop: '12px', 
                              padding: '12px', 
                              backgroundColor: 'rgba(244,67,54,0.1)', 
                              borderLeft: '3px solid #f44336', 
                              borderRadius: '4px' 
                            }}>
                              <strong style={{ color: '#f44336', fontSize: '13px' }}>
                                Причина отклонения:
                              </strong>
                              <p style={{ color: '#ccc', fontSize: '13px', margin: '4px 0 0 0' }}>
                                {goal.rejection_comment}
                              </p>
                            </div>
                          )}
                          
                          <div className="goal-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            {goal.status === 'draft' && (
                              <>
                                <button 
                                  className="btn-action btn-primary-small"
                                  onClick={() => handleSubmitForApproval(goal.id)}
                                >
                                  Отправить на утверждение
                                </button>
                                <button 
                                  className="btn-action btn-edit"
                                  onClick={() => handleEditGoal(goal)}
                                >
                                  Редактировать
                                </button>
                                <button 
                                  className="btn-action btn-delete"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                >
                                  Удалить
                                </button>
                              </>
                            )}
                            {goal.status === 'submitted' && (
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => handleEditGoal(goal)}
                              >
                                Редактировать
                              </button>
                            )}
                            {goal.status === 'approved' && (
                              <span style={{ color: '#4CAF50', fontSize: '13px' }}>
                                Утверждено руководителем
                              </span>
                            )}
                            {goal.status === 'rejected' && (
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => handleEditGoal(goal)}
                              >
                                Исправить и отправить повторно
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        Нет целей. Создайте свою первую цель!
                      </div>
                    )}
                  </div>
                  <button className="add-goal-button" onClick={() => setShowGoalForm(true)}>
                    + Добавить новую цель
                  </button>
                </>
              )}
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
                  <div 
                    key={notif.id} 
                    className="notification-item"
                    onClick={notif.action}
                    style={{ cursor: 'pointer' }}
                  >
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
