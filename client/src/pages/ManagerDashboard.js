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
  const [readyForManagerEvaluation, setReadyForManagerEvaluation] = useState([]);
  const [readyForPotentialAssessment, setReadyForPotentialAssessment] = useState([]);
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
      console.log('🔄 Начинаем загрузку данных...');
      
      // Загружаем данные с обработкой ошибок для каждого запроса
      const [goalsData, statsData, reviewsData, periodsData, prRequestsData, managerEvalData, potentialData] = await Promise.all([
        api.goals.getAll().catch(e => { console.warn('Ошибка загрузки целей:', e); return []; }),
        api.dashboard.getStats().catch(e => { console.warn('Ошибка загрузки статистики:', e); return null; }),
        api.peerFeedback.getPendingReviews().catch(e => { console.warn('Ошибка загрузки peer reviews:', e); return []; }),
        api.get('/manager/team-employee-periods').catch(e => { console.warn('Ошибка загрузки периодов:', e); return []; }),
        (api.reviewPeriods && api.reviewPeriods.getPendingManagerApproval ? api.reviewPeriods.getPendingManagerApproval() : Promise.resolve([])).catch(e => { console.warn('Ошибка загрузки PR запросов:', e); return []; }),
        api.get('/manager-evaluation/ready-employees').catch(e => { console.warn('Ошибка загрузки оценок:', e); return []; }),
        api.get('/potential-assessment/ready-employees').catch(e => { console.warn('Ошибка загрузки потенциала:', e); return []; })
      ]);
      console.log('✅ Данные загружены:');
      console.log('  - Цели команды:', goalsData?.length || 0);
      console.log('  - Статистика:', statsData);
      console.log('  - Периоды команды:', periodsData?.length || 0, periodsData);
      console.log('  - Запросы PR:', prRequestsData?.length || 0);
      console.log('  - Готовы к оценке:', managerEvalData?.length || 0);
      console.log('  - Готовы к потенциалу:', potentialData?.length || 0);
      
      setTeamGoals(goalsData);
      setStats(statsData);
      setPendingReviews(reviewsData);
      setReviewPeriods(periodsData);
      setPendingPRRequests(prRequestsData);
      setReadyForManagerEvaluation(managerEvalData);
      setReadyForPotentialAssessment(potentialData);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      console.error('Детали ошибки:', error.response?.data || error.message);
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
      if (prDecisionType === 'approve') {
        await api.reviewPeriods.managerApprove(currentPRRequest.id);
        alert('Запрос одобрен и отправлен HR');
      } else {
        await api.reviewPeriods.managerReject(currentPRRequest.id, prDecisionComment);
        alert('Запрос отклонен');
      }
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
  
  // Подсчитываем статистику из загруженных данных, если API не вернуло stats
  const calculatedStats = {
    team_size: reviewPeriods.length || stats.team_size || 0,
    team_goals: teamGoals.length || stats.team_goals || 0,
    pending_approvals: pendingCount || stats.pending_approvals || 0,
    approved_goals: teamGoals.filter(g => g.status === 'approved').length || stats.approved_goals || 0
  };
  
  // Используем рассчитанную статистику
  const displayStats = {
    ...stats,
    ...calculatedStats
  };

  // Формируем уведомления для руководителя
  const notifications = [];
  
  // Уведомление о запросах на досрочное начало PR
  if (pendingPRRequests.length > 0) {
    const latestRequest = pendingPRRequests[0];
    notifications.push({
      id: 1,
      text: `${latestRequest.first_name} ${latestRequest.last_name} запрашивает досрочное начало Performance Review`,
      time: new Date(latestRequest.requested_early_at).toLocaleDateString('ru-RU'),
      action: () => handleManagerPRDecision(latestRequest, true)
    });
  }
  
  // Уведомление о сотрудниках, готовых к оценке по целям
  if (readyForManagerEvaluation.length > 0) {
    notifications.push({
      id: 2,
      text: `${readyForManagerEvaluation.length} ${readyForManagerEvaluation.length === 1 ? 'сотрудник готов' : 'сотрудников готовы'} к оценке по целям`,
      time: 'Сейчас',
      action: () => navigate('/manager-evaluation')
    });
  }
  
  // Уведомление о сотрудниках, готовых к оценке потенциала
  if (readyForPotentialAssessment.length > 0) {
    notifications.push({
      id: 3,
      text: `${readyForPotentialAssessment.length} ${readyForPotentialAssessment.length === 1 ? 'сотрудник готов' : 'сотрудников готовы'} к оценке потенциала`,
      time: 'Сейчас',
      action: () => navigate('/potential-assessment')
    });
  }
  
  // Уведомление о целях на утверждении
  if (pendingCount > 0) {
    notifications.push({
      id: 4,
      text: `${pendingCount} ${pendingCount === 1 ? 'цель требует' : 'целей требуют'} утверждения`,
      time: 'Сейчас',
      action: () => handleFilterAndScroll('submitted')
    });
  }
  
  // Уведомление о запросах на оценку коллег
  if (pendingReviews.length > 0) {
    const latestReview = pendingReviews[0];
    notifications.push({
      id: 5,
      text: `${latestReview.requester_first_name} ${latestReview.requester_last_name} запрашивает вашу оценку`,
      time: new Date(latestReview.created_at).toLocaleDateString(),
      action: () => navigate('/peer-feedback?tab=pending')
    });
  }

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
            <div className="stat-value">{displayStats.team_size || 0}</div>
            <div className="stat-label">Сотрудников в команде</div>
          </div>
          <div className="stat-card clickable" style={{ borderColor: '#FF6B00', cursor: 'pointer' }} onClick={() => handleFilterAndScroll('submitted')}>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Ожидают утверждения</div>
          </div>
          <div className="stat-card clickable" onClick={() => handleFilterAndScroll('all')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{displayStats.team_goals || 0}</div>
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
            <h2 className="section-title">Периоды Performance Review команды</h2>
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
                  {reviewPeriods.map((period, index) => {
                    console.log('🔍 Period в таблице:', period);
                    
                    const startDate = new Date(period.start_date);
                    // const endDate = new Date(period.end_date); // Не используется
                    
                    // Определяем период по датам для отображения
                    const periodNum = startDate.getMonth() <= 5 ? 1 : 2;
                    const periodName = `Полугодие ${periodNum} - ${startDate.getFullYear()}`;
                    
                    // Определяем статус на основе реального статуса из базы
                    let statusColor = '#999';
                    let statusText = 'Не начат';
                    let statusEmoji = '';
                    
                    console.log('🔍 Статусы сотрудника:', {
                      name: `${period.first_name} ${period.last_name}`,
                      status: period.status,
                      employee_status: period.employee_status,
                      potential_assessment_completed: period.potential_assessment_completed,
                      manager_goals_evaluation_completed: period.manager_goals_evaluation_completed
                    });
                    
                    // Проверяем статус калькуляции сотрудника (приоритет выше всех других)
                    if (period.status === 'awaiting_calculation' || period.employee_status === 'awaiting_calculation') {
                      statusColor = '#FF6B00';
                      statusText = 'Ожидает калькуляции';
                      statusEmoji = '';
                    } else if (period.potential_assessment_completed) {
                      // Все оценки завершены - ждем результатов от HR
                      statusColor = '#4CAF50';
                      statusText = 'Ждём результаты';
                      statusEmoji = '';
                    } else if (period.manager_goals_evaluation_completed) {
                      // Оценка менеджера завершена - ждем оценку потенциала
                      statusColor = '#9333EA';
                      statusText = 'Оценить потенциал';
                      statusEmoji = '';
                    } else if (period.status === 'completed') {
                      statusColor = '#4CAF50';
                      statusText = 'Завершен';
                      statusEmoji = '';
                    } else if (period.status === 'in_progress') {
                      statusColor = '#FF6B00';
                      statusText = 'В процессе';
                      statusEmoji = '';
                    } else if (period.status === 'pending_manager_approval') {
                      statusColor = '#F59E0B';
                      statusText = 'Ожидает руководителя';
                      statusEmoji = '';
                    } else if (period.status === 'pending_hr_approval') {
                      statusColor = '#3B82F6';
                      statusText = 'Ожидает HR';
                      statusEmoji = '';
                    } else if (period.status === 'rejected_by_manager') {
                      statusColor = '#EF4444';
                      statusText = 'Отклонен';
                      statusEmoji = '';
                    } else if (period.status === 'not_started') {
                      statusColor = '#999';
                      statusText = 'Не начат';
                      statusEmoji = '';
                    }

                    return (
                      <tr key={period.id || `period-${period.user_id}-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          {period.first_name} {period.last_name}
                        </td>
                        <td style={{ padding: '12px', color: '#ccc' }}>
                          {period.position || 'Сотрудник'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ccc', fontSize: '14px' }}>
                          {periodName}
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
                            {statusText}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {period.potential_assessment_completed ? (
                            // Все оценки завершены - показываем статус
                            <span style={{ color: '#4CAF50', fontSize: '13px' }}>
                              Завершено
                            </span>
                          ) : period.manager_goals_evaluation_completed ? (
                            // Оценка по целям завершена - показываем кнопку для оценки потенциала
                            <button 
                              onClick={() => navigate(`/potential-assessment/${period.user_id}/${period.id}`)}
                              style={{
                                padding: '6px 16px',
                                backgroundColor: '#9333EA',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}
                            >
                              Оценить потенциал
                            </button>
                          ) : period.status === 'in_progress' && period.self_assessment_completed && period.peer_reviews_count >= 3 ? (
                            <button 
                              onClick={() => navigate(`/manager-evaluation/${period.user_id}/${period.id}`)}
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
                          ) : period.status === 'pending_manager_approval' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => {
                                  const request = pendingPRRequests.find(r => r.id === period.id && r.user_id === period.user_id);
                                  if (request) {
                                    handleManagerPRDecision(request, true);
                                  } else {
                                    console.error('Запрос не найден. Period:', period, 'Requests:', pendingPRRequests);
                                  }
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
                                  const request = pendingPRRequests.find(r => r.id === period.id && r.user_id === period.user_id);
                                  if (request) {
                                    handleManagerPRDecision(request, false);
                                  } else {
                                    console.error('Запрос не найден. Period:', period, 'Requests:', pendingPRRequests);
                                  }
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
                          ) : period.status === 'not_started' ? (
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
                          ) : period.status === 'pending_hr_approval' ? (
                            <span style={{ color: '#3B82F6', fontSize: '13px' }}>Ожидает одобрения HR</span>
                          ) : period.status === 'in_progress' ? (
                            <span style={{ color: '#FFA366', fontSize: '13px' }}>
                              PR в процессе ({period.peer_reviews_count || 0}/3 отзывов)
                            </span>
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
