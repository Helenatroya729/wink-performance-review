import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const ManagerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [teamGoals, setTeamGoals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted'); // submitted, draft, approved, all
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingGoal, setRejectingGoal] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewPeriods, setReviewPeriods] = useState([]);
  const [pendingPRRequests, setPendingPRRequests] = useState([]);
  const [showPRDecisionModal, setShowPRDecisionModal] = useState(false);
  const [currentPRRequest, setCurrentPRRequest] = useState(null);
  const [prDecisionType, setPrDecisionType] = useState(null); // 'approve' or 'reject'
  const [prDecisionComment, setPrDecisionComment] = useState('');

  const scrollToGoals = () => {
    const goalsSection = document.querySelector('.content-grid');
    if (goalsSection) {
      goalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFilterAndScroll = (newFilter) => {
    setFilter(newFilter);
    setTimeout(() => scrollToGoals(), 100);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, statsData, reviewsData, periodsData, prRequestsData] = await Promise.all([
        api.goals.getAll(),
        api.dashboard.getStats(),
        api.peerFeedback.getPendingReviews(),
        api.get('/manager/team-employee-periods'),
        api.performanceReview.getPendingRequests()
      ]);
      setTeamGoals(goalsData);
      setStats(statsData);
      setPendingReviews(reviewsData);
      setReviewPeriods(periodsData);
      setPendingPRRequests(prRequestsData.filter(r => r.status === 'pending_approval'));
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (goalId) => {
    if (!window.confirm('Утвердить эту цель?')) {
      return;
    }

    try {
      await api.goals.update(goalId, { status: 'approved' });
      alert('Цель утверждена! Сотрудник получит уведомление.');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleRejectClick = (goal) => {
    setRejectingGoal(goal);
    setRejectComment('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectComment.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    try {
      await api.goals.update(rejectingGoal.id, { 
        status: 'rejected',
        rejection_comment: rejectComment 
      });
      alert('Цель отклонена. Сотрудник получит уведомление с комментарием.');
      setShowRejectModal(false);
      setRejectingGoal(null);
      setRejectComment('');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleRequestEarlyPR = async (period) => {
    const reason = prompt(`Запросить досрочное начало Performance Review для ${period.first_name} ${period.last_name}?\n\nУкажите причину:`);
    
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await api.performanceReview.managerRequestEarly(period.user_id, period.id, reason);
      alert('Запрос отправлен HR на одобрение');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleManagerPRDecision = async (request, approved) => {
    setCurrentPRRequest(request);
    setPrDecisionType(approved ? 'approve' : 'reject');
    setPrDecisionComment('');
    setShowPRDecisionModal(true);
  };

  const handleSubmitPRDecision = async (e) => {
    e.preventDefault();
    
    if (prDecisionType === 'reject' && !prDecisionComment.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    try {
      await api.performanceReview.managerDecision(
        currentPRRequest.status_id, 
        prDecisionType === 'approve', 
        prDecisionComment || ''
      );
      alert(prDecisionType === 'approve' ? 'Запрос одобрен и отправлен HR' : 'Запрос отклонен');
      setShowPRDecisionModal(false);
      setCurrentPRRequest(null);
      setPrDecisionComment('');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Черновик',
      'submitted': 'На утверждении',
      'approved': 'Утверждено',
      'rejected': 'Отклонено'
    };
    return labels[status] || status;
  };

  const filteredGoals = teamGoals.filter(goal => 
    filter === 'all' ? true : goal.status === filter
  );

  const pendingCount = teamGoals.filter(g => g.status === 'submitted').length;

  // Формируем уведомления для руководителя
  const notifications = [];
  
  // Уведомление о запросах на досрочное начало PR
  if (pendingPRRequests.length > 0) {
    const latestRequest = pendingPRRequests[0];
    notifications.push({
      id: 1,
      text: `${latestRequest.employee_name} запрашивает досрочное начало Performance Review`,
      time: new Date(latestRequest.early_request_date).toLocaleDateString(),
      action: () => handleManagerPRDecision(latestRequest, true)
    });
  }
  
  // Уведомление о целях на утверждении
  if (pendingCount > 0) {
    notifications.push({
      id: 2,
      text: `${pendingCount} ${pendingCount === 1 ? 'цель требует' : 'целей требуют'} утверждения`,
      time: 'Сейчас',
      action: () => handleFilterAndScroll('submitted')
    });
  }
  
  // Уведомление о запросах на оценку коллег
  if (pendingReviews.length > 0) {
    const latestReview = pendingReviews[0];
    notifications.push({
      id: 3,
      text: `${latestReview.requester_first_name} ${latestReview.requester_last_name} запрашивает вашу оценку`,
      time: new Date(latestReview.created_at).toLocaleDateString(),
      action: () => navigate('/peer-feedback?tab=pending')
    });
  }
  
  // Напоминание о необходимости провести оценку подчиненных
  const needsEvaluation = teamGoals.filter(g => g.status === 'approved').length > 0;
  if (needsEvaluation) {
    notifications.push({
      id: 4,
      text: 'Необходимо провести оценку сотрудников',
      time: '2 дня назад',
      action: () => navigate('/manager-evaluation')
    });
  }
  
  // Напоминание о самооценке
  notifications.push({
    id: 4,
    text: 'Завершить свою самооценку до 25 октября',
    time: '3 дня назад',
    action: () => navigate('/self-assessment')
  });

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Панель руководителя</h1>
          <p>Управление командой и личное развитие</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => navigate('/team')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{stats.team_size || 0}</div>
            <div className="stat-label">Сотрудников в команде</div>
          </div>
          <div className="stat-card clickable" style={{ borderColor: '#FF6B00', cursor: 'pointer' }} onClick={() => handleFilterAndScroll('submitted')}>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Ожидают утверждения</div>
          </div>
          <div className="stat-card clickable" onClick={() => handleFilterAndScroll('all')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{stats.team_goals || 0}</div>
            <div className="stat-label">Всего целей команды</div>
          </div>
          <div className="stat-card clickable" onClick={() => handleFilterAndScroll('approved')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{teamGoals.filter(g => g.status === 'approved').length}</div>
            <div className="stat-label">Целей утверждено</div>
          </div>
        </div>

        {/* Периоды Performance Review команды */}
        {reviewPeriods.length > 0 && (
          <div className="section-card" style={{ marginBottom: '30px' }}>
            <h2 className="section-title">📅 Периоды Performance Review команды</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#999' }}>Сотрудник</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#999' }}>Должность</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Период оценки</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Статус</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewPeriods.map(period => {
                    const startDate = new Date(period.start_date);
                    const endDate = new Date(period.end_date);
                    const today = new Date();
                    const isActive = period.period_status === 'active';
                    const isUpcoming = period.period_status === 'upcoming';
                    const isExpired = period.period_status === 'expired';
                    const isCompleted = period.period_status === 'completed';
                    
                    let statusColor = '#999';
                    let statusText = 'Не начат';
                    let statusEmoji = '⚪';
                    
                    if (isCompleted) {
                      statusColor = '#4CAF50';
                      statusText = 'Завершен';
                      statusEmoji = '✅';
                    } else if (isActive) {
                      statusColor = '#FF6B00';
                      statusText = 'Активен';
                      statusEmoji = '🔥';
                    } else if (isUpcoming) {
                      statusColor = '#2196F3';
                      statusText = 'Ожидает';
                      statusEmoji = '📅';
                    } else if (isExpired) {
                      statusColor = '#f44336';
                      statusText = 'Просрочен';
                      statusEmoji = '⚠️';
                    }

                    return (
                      <tr key={period.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          {period.first_name} {period.last_name}
                        </td>
                        <td style={{ padding: '12px', color: '#ccc' }}>
                          {period.position || 'Сотрудник'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ccc', fontSize: '14px' }}>
                          {period.period_name || `${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ 
                            color: statusColor, 
                            fontWeight: '600',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: `${statusColor}20`,
                            fontSize: '13px'
                          }}>
                            {statusEmoji} {statusText}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {isActive ? (
                            <button 
                              onClick={() => navigate('/manager-evaluation')}
                              style={{
                                padding: '6px 16px',
                                backgroundColor: '#FF6B00',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}
                            >
                              Оценить
                            </button>
                          ) : period.status === 'pending_approval' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => {
                                  const request = pendingPRRequests.find(r => r.user_id === period.user_id && r.period_id === period.id);
                                  if (request) handleManagerPRDecision(request, true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#10b981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                Одобрить
                              </button>
                              <button 
                                onClick={() => {
                                  const request = pendingPRRequests.find(r => r.user_id === period.user_id && r.period_id === period.id);
                                  if (request) handleManagerPRDecision(request, false);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#ef4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                Отклонить
                              </button>
                            </div>
                          ) : (period.period_status === 'not_started' || period.period_status === 'upcoming') && period.status !== 'pending_approval' && period.status !== 'manager_approved' ? (
                            <button 
                              onClick={() => handleRequestEarlyPR(period)}
                              style={{
                                padding: '6px 16px',
                                backgroundColor: 'transparent',
                                color: '#2196F3',
                                border: '1px solid #2196F3',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}
                            >
                              Запросить ранний PR
                            </button>
                          ) : period.status === 'manager_approved' ? (
                            <span style={{ color: '#FFA366', fontSize: '13px' }}>Ожидает одобрения HR</span>
                          ) : (
                            <span style={{ color: '#666', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Управление командой */}
        <div className="section-card" style={{ marginBottom: '30px' }}>
          <h2 className="section-title">Управление командой</h2>
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/team')} style={{ borderLeftColor: '#FF6B00', cursor: 'pointer' }}>
              <div className="action-title">Моя команда</div>
            </div>
            <div className="action-card" onClick={() => handleFilterAndScroll('submitted')} style={{ borderLeftColor: '#FF8533', cursor: 'pointer' }}>
              <div className="action-title">Утверждение целей</div>
            </div>
            <div className="action-card" onClick={() => navigate('/manager-evaluation')} style={{ borderLeftColor: '#FFA366', cursor: 'pointer' }}>
              <div className="action-title">Оценка по целям</div>
            </div>
            <div className="action-card" onClick={() => navigate('/potential-assessment')} style={{ borderLeftColor: '#FFB580', cursor: 'pointer' }}>
              <div className="action-title">Оценка потенциала</div>
            </div>
            <div className="action-card" onClick={() => navigate('/calculation-results')} style={{ borderLeftColor: '#4CAF50', cursor: 'pointer' }}>
              <div className="action-title">Итоги оценки команды</div>
            </div>
          </div>
        </div>

        {/* Личное развитие */}
        <div className="section-card" style={{ marginBottom: '30px' }}>
          <h2 className="section-title">Личное развитие</h2>
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/employee')} style={{ borderLeftColor: '#FF6B00', cursor: 'pointer' }}>
              <div className="action-title">Мои цели</div>
            </div>
            <div className="action-card" onClick={() => navigate('/self-assessment')} style={{ borderLeftColor: '#4CAF50', cursor: 'pointer' }}>
              <div className="action-title">Моя самооценка</div>
            </div>
            <div className="action-card" onClick={() => navigate('/peer-feedback')} style={{ borderLeftColor: '#2196F3', cursor: 'pointer' }}>
              <div className="action-title">Запросить оценку</div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-title">Цели команды на утверждение</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
                    onClick={() => setFilter('submitted')}
                  >
                    На утверждении ({teamGoals.filter(g => g.status === 'submitted').length})
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                  >
                    Утверждено ({teamGoals.filter(g => g.status === 'approved').length})
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilter('rejected')}
                  >
                    Отклонено ({teamGoals.filter(g => g.status === 'rejected').length})
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    Все ({teamGoals.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
              ) : filteredGoals.length > 0 ? (
                <div className="goals-list">
                  {filteredGoals.map(goal => (
                    <div key={goal.id} className="goal-item-manager">
                      <div className="goal-employee-info">
                        <h4>{goal.first_name} {goal.last_name}</h4>
                        <span className="employee-position">{goal.position || 'Сотрудник'}</span>
                      </div>
                      
                      <div className="goal-content">
                        <div className="goal-header">
                          <h3>{goal.title}</h3>
                          <span className={`goal-status ${goal.status === 'submitted' ? 'in-progress' : goal.status === 'approved' ? 'approved' : goal.status === 'rejected' ? 'rejected' : 'planned'}`}>
                            {getStatusLabel(goal.status)}
                          </span>
                        </div>
                        
                        {goal.description && (
                          <p style={{ color: '#999', fontSize: '14px', margin: '8px 0' }}>
                            {goal.description}
                          </p>
                        )}
                        
                        {goal.expected_results && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '4px' }}>
                            <strong style={{ color: '#FF6B00', fontSize: '13px' }}>Ожидаемый результат:</strong>
                            <p style={{ color: '#ccc', fontSize: '13px', margin: '4px 0 0 0' }}>{goal.expected_results}</p>
                          </div>
                        )}
                        
                        {goal.key_tasks && (
                          <div style={{ marginTop: '8px' }}>
                            <strong style={{ color: '#999', fontSize: '13px' }}>Ключевые задачи:</strong>
                            <p style={{ color: '#aaa', fontSize: '13px', margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>{goal.key_tasks}</p>
                          </div>
                        )}
                        
                        {goal.expected_deadline && (
                          <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                            <strong>Срок:</strong> {new Date(goal.expected_deadline).toLocaleDateString('ru-RU')}
                          </p>
                        )}

                        {goal.rejection_comment && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(244,67,54,0.1)', borderLeft: '3px solid #f44336', borderRadius: '4px' }}>
                            <strong style={{ color: '#f44336', fontSize: '13px' }}>Причина отклонения:</strong>
                            <p style={{ color: '#ccc', fontSize: '13px', margin: '4px 0 0 0' }}>{goal.rejection_comment}</p>
                          </div>
                        )}
                        
                        {goal.status === 'submitted' && (
                          <div className="goal-actions" style={{ marginTop: '16px' }}>
                            <button 
                              className="btn-action btn-approve"
                              onClick={() => handleApprove(goal.id)}
                            >
                              Утвердить цель
                            </button>
                            <button 
                              className="btn-action btn-reject"
                              onClick={() => handleRejectClick(goal)}
                            >
                              Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  {filter === 'submitted' ? 'Нет целей на утверждении' : 
                   filter === 'approved' ? 'Нет утвержденных целей' :
                   filter === 'rejected' ? 'Нет отклоненных целей' :
                   'Нет целей от команды'}
                </div>
              )}
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
          </div>
        </div>
      </div>

      {showRejectModal && rejectingGoal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Отклонение цели</h2>
            
            <div style={{ padding: '16px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
                Сотрудник: <strong>{rejectingGoal.first_name} {rejectingGoal.last_name}</strong>
              </p>
              <p style={{ color: '#999', fontSize: '13px' }}>
                Цель: <strong>{rejectingGoal.title}</strong>
              </p>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group">
                <label htmlFor="reject-comment">
                  Причина отклонения <span style={{ color: '#f44336' }}>*</span>
                </label>
                <textarea
                  id="reject-comment"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Укажите, что необходимо исправить или изменить в цели..."
                  rows="6"
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#f44336' }}>
                  Отклонить цель
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingGoal(null);
                    setRejectComment('');
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно: Решение по досрочному началу PR */}
      {showPRDecisionModal && currentPRRequest && (
        <div className="modal-overlay" onClick={() => setShowPRDecisionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {prDecisionType === 'approve' ? 'Одобрить запрос' : 'Отклонить запрос'}
            </h2>
            
            <div style={{ padding: '16px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
                Сотрудник: <strong>{currentPRRequest.employee_name}</strong>
              </p>
              <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
                Период: <strong>{currentPRRequest.period_name}</strong>
              </p>
              {currentPRRequest.early_request_comment && (
                <p style={{ color: '#999', fontSize: '13px', marginTop: '12px' }}>
                  Комментарий сотрудника: <br/>
                  <em style={{ color: '#ccc' }}>"{currentPRRequest.early_request_comment}"</em>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmitPRDecision}>
              <div className="form-group">
                <label htmlFor="pr-decision-comment">
                  {prDecisionType === 'approve' ? 'Комментарий (необязательно)' : 'Причина отклонения'} 
                  {prDecisionType === 'reject' && <span style={{ color: '#f44336' }}> *</span>}
                </label>
                <textarea
                  id="pr-decision-comment"
                  value={prDecisionComment}
                  onChange={(e) => setPrDecisionComment(e.target.value)}
                  placeholder={prDecisionType === 'approve' 
                    ? 'Укажите дополнительный комментарий...' 
                    : 'Укажите, почему запрос отклонен...'
                  }
                  rows="4"
                  required={prDecisionType === 'reject'}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ 
                    backgroundColor: prDecisionType === 'approve' ? '#10b981' : '#ef4444' 
                  }}
                >
                  {prDecisionType === 'approve' ? 'Одобрить и отправить HR' : 'Отклонить запрос'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowPRDecisionModal(false);
                    setCurrentPRRequest(null);
                    setPrDecisionComment('');
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
