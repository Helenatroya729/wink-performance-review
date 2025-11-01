import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const EmployeeDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  // const [stats, setStats] = useState(null); // Временно отключено
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [myPeriods, setMyPeriods] = useState([]);
  const [showEarlyRequestModal, setShowEarlyRequestModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [goalsTab, setGoalsTab] = useState('current'); // 'current' или 'completed'
  const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, /* statsData, */ cyclesData, reviewsData, ratingData, periodsData] = await Promise.all([
        api.goals.getAll(),
        // api.dashboard.getStats(), // Временно отключено
        api.cycles.getAll(),
        api.peerFeedback.getPendingReviews(),
        api.employee.getMyRating(),
        api.reviewPeriods.getMy()
      ]);
      setGoals(goalsData);
      // setStats(statsData); // Временно отключено
      setCycles(cyclesData);
      setPendingReviews(reviewsData);
      setRating(ratingData);
      setMyPeriods(periodsData);
      console.log('📊 Загружен рейтинг:', ratingData);
      console.log('📅 Мои периоды (всего ' + periodsData.length + '):', periodsData);
      if (periodsData && periodsData.length > 0) {
        console.log('✅ Первый период - ID:', periodsData[0].id);
        console.log('   - self_assessment_count:', periodsData[0].self_assessment_count);
        console.log('   - peer_reviews_count:', periodsData[0].peer_reviews_count);
        console.log('   - manager_evaluation_completed:', periodsData[0].manager_evaluation_completed);
        console.log('   - Все поля:', periodsData[0]);
      }
      
      // Загружаем рекомендации
      try {
        const recommendationsData = await api.get('/employee/my-recommendations');
        setRecommendations(recommendationsData);
        console.log(' Загружены рекомендации:', recommendationsData);
      } catch (error) {
        console.log('ℹ Рекомендации пока не получены');
      }
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
    cycle_id: 1, // По умолчанию Годовая оценка 2025
    title: '',
    description: '',
    expected_deadline: '',
    expected_results: '',
    key_tasks: ''
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackGoal, setFeedbackGoal] = useState(null);

  const handleCreateGoal = async (e, resubmit = false) => {
    e.preventDefault();
    try {
      // Проверка лимита целей (не более 5 на текущий период)
      const currentGoals = goals.filter(g => g.status !== 'completed');
      if (!editingGoal && currentGoals.length >= 5) {
        alert('Нельзя создать более 5 целей на текущий период. Удалите или завершите существующую цель.');
        return;
      }

      if (editingGoal) {
        // Обновление существующей цели
        const updateData = { ...newGoal };
        
        // Если цель была отклонена и нажата кнопка повторной отправки,
        // меняем статус на 'submitted'
        if (resubmit && editingGoal.status === 'rejected') {
          updateData.status = 'submitted';
        }
        
        await api.goals.update(editingGoal.id, updateData);
        
        if (resubmit && editingGoal.status === 'rejected') {
          alert('Цель успешно отправлена на повторное утверждение!');
        } else {
          alert('Цель успешно обновлена!');
        }
      } else {
        // Создание новой цели
        await api.goals.create(newGoal);
        alert('Цель успешно создана!');
      }
      
      setShowGoalForm(false);
      setEditingGoal(null);
      setNewGoal({
        cycle_id: 1,
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
      alert('Ошибка: ' + error.message);
    }
  };

  // Запрос раннего начала Performance Review
  const handleRequestEarlyPR = async (period) => {
    if (!window.confirm(`Запросить ранний Performance Review для периода "${period.name}"?\n\nЗапрос будет отправлен вашему руководителю на утверждение.`)) {
      return;
    }

    try {
      await api.reviewPeriods.requestEarly(period.id);
      alert('Запрос отправлен! Ожидайте одобрения от руководителя и HR.');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  // Открыть модальное окно с деталями цели
  const handleShowGoalDetails = (goal) => {
    setSelectedGoalDetails(goal);
    setShowGoalDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      not_started: { text: 'Не начат', color: '#9CAAF', bg: '#FF4F6' },
      pending_manager_approval: { text: 'Ожидает руководителя', color: '#F59E0B', bg: '#FEFC7' },
      pending_hr_approval: { text: 'Ожидает HR', color: '#B8F6', bg: '#DBEAFE' },
      rejected_by_manager: { text: 'Отклонен руководителем', color: '#EF4444', bg: '#FEEE' },
      in_progress: { text: 'В процессе', color: '#FF6B00', bg: '#FFF4ED' },
      awaiting_calculation: { text: 'Ожидает калькуляции', color: '#8B5CF6', bg: '#EDE9FE' },
      calculated: { text: 'Рассчитан', color: '#0B98', bg: '#DFAE5' },
      completed: { text: 'Завершен', color: '#059669', bg: '#DFAE5' }
    };
    const badge = statusMap[status] || { text: status, color: '#9CAAF', bg: '#FF4F6' };
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '12px', 
        backgroundColor: badge.bg,
        color: badge.color,
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {badge.text}
      </span>
    );
  };

  const quickActions = [
    { id: 1, title: 'Создать цели', icon: '', color: '#FF6B00', action: () => setShowGoalForm(true) },
    { id: 2, title: 'Самооценка', icon: '', color: '#FF8500', action: () => navigate('/self-assessment') },
    { id: 3, title: 'Запросить оценку', icon: '', color: '#FFA600', action: () => navigate('/peer-feedback') },
    { id: 4, title: 'План развития', icon: '', color: '#FFB580', action: () => navigate('/development-plan') }
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
  
  // Добавляем уведомление о доступности Performance Review
  const inProgressPeriod = myPeriods.find(p => p.status === 'in_progress');
  if (inProgressPeriod) {
    notifications.push({
      id: 3,
      text: `Performance Review активен: ${inProgressPeriod.name}`,
      time: 'Сегодня',
      action: () => navigate('/self-assessment')
    });
  }
  
  // Добавляем уведомление об одобрении запроса
  const approvedPeriod = myPeriods.find(p => p.status === 'in_progress' && p.hr_approved_at);
  if (approvedPeriod && approvedPeriod.hr_approved_at) {
    const approvalDate = new Date(approvedPeriod.hr_approved_at);
    const daysSinceApproval = Math.floor((Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceApproval < 7) { // Показываем только если утверждено менее 7 дней назад
      notifications.push({
        id: 4,
        text: 'Ваш запрос на ранний Performance Review одобрен',
        time: approvalDate.toLocaleDateString('ru-RU'),
        action: () => navigate('/self-assessment')
      });
    }
  }

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
                  backgroundColor: editingGoal.status === 'rejected' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  borderLeft: `4px solid ${editingGoal.status === 'rejected' ? '#dc2626' : '#8b5cf6'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: editingGoal.status === 'rejected' ? '#dc2626' : '#8b5cf6',
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
                    placeholder="Например: Повысить конверсию на 5%"
                  />
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    placeholder="Подробное описание цели..."
                    rows=""
                  />
                </div>

                <div className="form-group">
                  <label>Ожидаемые результаты</label>
                  <textarea
                    value={newGoal.expected_results}
                    onChange={(e) => setNewGoal({...newGoal, expected_results: e.target.value})}
                    placeholder="Что должно быть достигнуто..."
                    rows=""
                  />
                </div>

                <div className="form-group">
                  <label>Ключевые задачи</label>
                  <textarea
                    value={newGoal.key_tasks}
                    onChange={(e) => setNewGoal({...newGoal, key_tasks: e.target.value})}
                    placeholder="Основные шаги для достижения цели..."
                    rows=""
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
                  {editingGoal && editingGoal.status === 'rejected' ? (
                    <>
                      <button 
                        type="button" 
                        className="btn-primary"
                        onClick={(e) => handleCreateGoal(e, true)}
                      >
                        Отправить на утверждение повторно
                      </button>
                      <button 
                        type="submit" 
                        className="btn-secondary"
                        style={{ backgroundColor: '#6b780' }}
                      >
                        Только сохранить изменения
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
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                <div style={{ fontSize: '12px', color: 'var(--wink-light-gray)' }}>Цель</div>
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
                <div style={{ fontSize: '12px', color: 'var(--wink-light-gray)' }}>Комментарий</div>
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
            {/* Индивидуальные периоды оценки */}
            <div className="section-card" style={{ marginBottom: '24px' }}>
              <h2 className="section-title">Мои периоды Performance Review</h2>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
              ) : myPeriods.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {(() => {
                    // Логика выбора одного периода для отображения:
                    // . Если есть период in_progress, awaiting_calculation, calculated или pending - показываем его
                    // . Если есть период not_started - показываем первый (ближайший)
                    // . Если все completed - показываем последний
                    
                    const activePeriod = myPeriods.find(p => 
                      p.status === 'in_progress' || 
                      p.status === 'pending_manager_approval' || 
                      p.status === 'pending_hr_approval' ||
                      p.status === 'rejected_by_manager' ||
                      p.status === 'awaiting_calculation' ||
                      p.status === 'calculated'
                    );
                    
                    const notStartedPeriod = myPeriods.find(p => p.status === 'not_started');
                    
                    // Выбираем период для отображения
                    const periodToShow = activePeriod || notStartedPeriod || myPeriods[myPeriods.length - 1];
                    
                    if (!periodToShow) return null;
                    
                    const period = periodToShow;
                    const isInProgress = period.status === 'in_progress';
                    const canRequestEarly = period.status === 'not_started';
                    const isPending = period.status === 'pending_manager_approval' || period.status === 'pending_hr_approval';
                    const isAwaitingCalc = period.status === 'awaiting_calculation';
                    const isCalculated = period.status === 'calculated';
                    
                    return (
                      <div 
                        key={period.id} 
                        style={{
                          padding: '24px',
                          border: '1px solid #FF6B00',
                          borderRadius: '12px',
                          backgroundColor: '#1E1E1E',
                          borderLeft: `6px solid ${
                            isInProgress ? '#FF6B00' : 
                            isPending ? '#F59E0B' : 
                            isAwaitingCalc ? '#FF6B00' :
                            isCalculated ? '#10B981' :
                            '#FFA500'
                          }`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          color: '#FFFFFF'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF' }}>
                            {period.name}
                          </h3>
                          {getStatusBadge(period.status)}
                        </div>
                        
                        <div style={{ color: '#B0B0B0', fontSize: '14px', marginBottom: '16px' }}>
                          Период: {new Date(period.start_date).toLocaleDateString('ru-RU')} - {new Date(period.end_date).toLocaleDateString('ru-RU')}
                        </div>
                        
                        {/* Статус-специфичные сообщения */}
                        {period.status === 'pending_manager_approval' && period.requested_early_at && (
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              ⏳ Ожидает утверждения руководителя
                            </div>
                            <div style={{ color: '#B0B0B0', fontSize: '12px' }}>
                              Запрос отправлен: {new Date(period.requested_early_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        )}
                        
                        {period.status === 'pending_hr_approval' && (
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              ✓ Руководитель одобрил
                            </div>
                            <div style={{ color: '#B0B0B0', fontSize: '12px' }}>
                              Ожидает утверждения HR
                            </div>
                          </div>
                        )}
                        
                        {isInProgress && (
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: 'rgba(74, 222, 128, 0.1)', 
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ color: '#4ADE80', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                              ✓ Performance Review активен!
                            </div>
                            <div style={{ color: '#B0B0B0', fontSize: '12px', marginBottom: '8px' }}>
                              Прогресс:
                            </div>
                            <div style={{ fontSize: '14px', color: '#E0E0E0', display: 'grid', gap: '4px' }}>
                              <div>
                                {period.self_assessment_completed ? '✓' : '○'} Самооценка 
                                {period.self_assessment_completed && period.self_assessment_completed_at && 
                                  <span style={{ color: '#4ADE80', marginLeft: '8px' }}>
                                    (завершена {new Date(period.self_assessment_completed_at).toLocaleDateString('ru-RU')})
                                  </span>
                                }
                              </div>
                              <div>
                                {period.peer_reviews_count >= 3 ? '✓' : '○'} Peer Review: {period.peer_reviews_count || 0}/3
                                {period.peer_reviews_count >= 3 && 
                                  <span style={{ color: '#4ADE80', marginLeft: '8px' }}>готово</span>
                                }
                              </div>
                              <div>
                                {period.manager_evaluation_completed ? '✓' : '○'} Оценка руководителя
                                {period.manager_evaluation_completed && period.manager_evaluation_completed_at && 
                                  <span style={{ color: '#4ADE80', marginLeft: '8px' }}>
                                    (завершена {new Date(period.manager_evaluation_completed_at).toLocaleDateString('ru-RU')})
                                  </span>
                                }
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Кнопки действий */}
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                          {isInProgress && (
                            <button
                              style={{ 
                                flex: 1,
                                fontSize: '14px', 
                                padding: '12px 20px',
                                backgroundColor: '#FF6B00',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#FF8500'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B00'}
                              onClick={() => navigate('/self-assessment')}
                            >
                              Продолжить Performance Review
                            </button>
                          )}
                          
                          {canRequestEarly && (
                            <button
                              style={{ 
                                flex: 1,
                                fontSize: '14px', 
                                padding: '12px 20px',
                                backgroundColor: '#FF6B00',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#FF85'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B00'}
                              onClick={() => handleRequestEarlyPR(period)}
                            >
                              Запросить ранний PR
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ color: '#999', padding: '20px' }}>
                  Нет назначенных периодов оценки
                </div>
              )}
            </div>

            <div className="section-card">
              <h2 className="section-title">Мои цели на период</h2>
              
              {/* Вкладки */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid #333' }}>
                <button
                  onClick={() => setGoalsTab('current')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: goalsTab === 'current' ? '#FF6B00' : '#999',
                    border: 'none',
                    borderBottom: goalsTab === 'current' ? '3px solid #FF6B00' : '3px solid transparent',
                    cursor: 'pointer',
                    fontWeight: goalsTab === 'current' ? '600' : '400',
                    transition: 'all 0.3s'
                  }}
                >
                  Текущие ({goals.filter(g => g.status !== 'completed').length}/5)
                </button>
                <button
                  onClick={() => setGoalsTab('completed')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: goalsTab === 'completed' ? '#FF6B00' : '#999',
                    border: 'none',
                    borderBottom: goalsTab === 'completed' ? '3px solid #FF6B00' : '3px solid transparent',
                    cursor: 'pointer',
                    fontWeight: goalsTab === 'completed' ? '600' : '400',
                    transition: 'all 0.3s'
                  }}
                >
                  Завершенные ({goals.filter(g => g.status === 'completed').length})
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
              ) : (
                <>
                  <div className="goals-list">
                    {(() => {
                      const filteredGoals = goalsTab === 'current' 
                        ? goals.filter(g => g.status !== 'completed')
                        : goals.filter(g => g.status === 'completed');

                      return filteredGoals.length > 0 ? (
                        filteredGoals.map(goal => (
                          <div 
                            key={goal.id} 
                            className="goal-item"
                            onClick={() => handleShowGoalDetails(goal)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="goal-header">
                              <h3>{goal.title}</h3>
                              <span className={`goal-status ${goal.status === 'submitted' ? 'in-progress' : goal.status === 'approved' ? 'approved' : goal.status === 'completed' ? 'completed' : 'planned'}`}>
                                {getStatusLabel(goal.status)}
                              </span>
                            </div>
                            {goal.description && (
                              <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>
                                {goal.description.length > 100 ? goal.description.substring(0, 100) + '...' : goal.description}
                              </p>
                            )}
                            {goal.expected_deadline && (
                              <p style={{ color: '#888', fontSize: '12px', margin: '4px 0' }}>
                                <strong>Срок:</strong> {new Date(goal.expected_deadline).toLocaleDateString('ru-RU')}
                              </p>
                            )}
                            
                            {goalsTab === 'current' && (
                              <div className="goal-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
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
                                  <span style={{ color: '#4CAF50', fontSize: '14px' }}>
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
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                          {goalsTab === 'current' ? 'Нет текущих целей. Создайте свою первую цель!' : 'Нет завершенных целей'}
                        </div>
                      );
                    })()}
                  </div>
                  {goalsTab === 'current' && goals.filter(g => g.status !== 'completed').length < 5 && (
                    <button className="add-goal-button" onClick={() => setShowGoalForm(true)}>
                      + Добавить новую цель
                    </button>
                  )}
                  {goalsTab === 'current' && goals.filter(g => g.status !== 'completed').length >= 5 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#FF6B00', fontSize: '14px' }}>
                      ⚠ Достигнут лимит: 5 целей на период
                    </div>
                  )}
                </>
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

            <div className="section-card">
              <h2 className="section-title">Мой рейтинг</h2>
              <div className="rating-display">
                {rating ? (
                  <>
                    <div className="rating-score">{rating.score}</div>
                    <div className="rating-label">{rating.label}</div>
                    <div className="rating-trend">
                      {rating.trend > 0 ? '↗' : rating.trend < 0 ? '↘' : '→'} 
                      {' '}{rating.trend} с прошлого периода
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#999', padding: '20px' }}>
                    Нет данных для отображения рейтинга
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с деталями цели */}
      {showGoalDetailsModal && selectedGoalDetails && (
        <div className="modal-overlay" onClick={() => setShowGoalDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Детали цели</h2>
              <button className="modal-close" onClick={() => setShowGoalDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#FF6B00', marginBottom: '10px' }}>{selectedGoalDetails.title}</h3>
                <span className={`goal-status ${selectedGoalDetails.status === 'submitted' ? 'in-progress' : selectedGoalDetails.status === 'approved' ? 'approved' : selectedGoalDetails.status === 'completed' ? 'completed' : 'planned'}`}>
                  {getStatusLabel(selectedGoalDetails.status)}
                </span>
              </div>

              {selectedGoalDetails.description && (
                <div style={{ marginBottom: '5px' }}>
                  <strong style={{ color: '#ccc' }}>Описание:</strong>
                  <p style={{ color: '#999', marginTop: '5px' }}>{selectedGoalDetails.description}</p>
                </div>
              )}

              {selectedGoalDetails.expected_results && (
                <div style={{ marginBottom: '5px' }}>
                  <strong style={{ color: '#ccc' }}>Ожидаемый результат:</strong>
                  <p style={{ color: '#999', marginTop: '5px' }}>{selectedGoalDetails.expected_results}</p>
                </div>
              )}

              {selectedGoalDetails.key_tasks && (
                <div style={{ marginBottom: '5px' }}>
                  <strong style={{ color: '#ccc' }}>Ключевые задачи:</strong>
                  <p style={{ color: '#999', marginTop: '5px' }}>{selectedGoalDetails.key_tasks}</p>
                </div>
              )}

              {selectedGoalDetails.expected_deadline && (
                <div style={{ marginBottom: '5px' }}>
                  <strong style={{ color: '#ccc' }}>Срок выполнения:</strong>
                  <p style={{ color: '#999', marginTop: '5px' }}>
                    {new Date(selectedGoalDetails.expected_deadline).toLocaleDateString('ru-RU', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}

              {selectedGoalDetails.rejection_comment && selectedGoalDetails.status === 'rejected' && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: 'rgba(244,67,54,0.1)', 
                  borderLeft: '4px solid #f44336', 
                  borderRadius: '4px' 
                }}>
                  <strong style={{ color: '#f44336' }}>Причина отклонения:</strong>
                  <p style={{ color: '#ccc', marginTop: '8px' }}>{selectedGoalDetails.rejection_comment}</p>
                </div>
              )}

              {selectedGoalDetails.manager_comment && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: 'rgba(76,175,80,0.1)', 
                  borderLeft: '4px solid #4CAF50', 
                  borderRadius: '4px' 
                }}>
                  <strong style={{ color: '#4CAF50' }}>Комментарий руководителя:</strong>
                  <p style={{ color: '#ccc', marginTop: '8px' }}>{selectedGoalDetails.manager_comment}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowGoalDetailsModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
