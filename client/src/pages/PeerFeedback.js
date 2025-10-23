import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const PeerFeedback = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('request'); // request, pending
  
  // Для запроса оценки
  const [colleagues, setColleagues] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    reviewer_id: '',
    cycle_id: '',
    message: ''
  });

  // Для оценки коллег
  const [pendingReviews, setPendingReviews] = useState([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    task_direction: [], // ФИО коллег, выбранных для направления задач
    result_achievement_rating: 5, // 0-10
    personal_qualities_comment: '', // свободный ответ
    interaction_quality_rating: 5, // 0-10
    improvement_suggestions: '' // свободный ответ
  });

  // Проверяем URL параметр при загрузке компонента
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['request', 'pending'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'request') {
        const [colleaguesData, cyclesData, requestsData] = await Promise.all([
          api.peerFeedback.getColleagues(),
          api.cycles.getAll(),
          api.peerFeedback.getMyRequests()
        ]);
        setColleagues(colleaguesData);
        setCycles(cyclesData.filter(c => c.status === 'active'));
        setMyRequests(requestsData);
      } else if (activeTab === 'pending') {
        const reviewsData = await api.peerFeedback.getPendingReviews();
        setPendingReviews(reviewsData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.peerFeedback.requestFeedback(requestForm);
      alert('Запрос на оценку отправлен!');
      setShowRequestForm(false);
      setRequestForm({ reviewer_id: '', cycle_id: '', message: '' });
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleStartReview = (review) => {
    setCurrentReview(review);
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.peerFeedback.submitFeedback({
        request_id: currentReview.id,
        ...feedbackForm
      });
      alert('Оценка отправлена! Спасибо за ваш отзыв.');
      setShowFeedbackForm(false);
      setCurrentReview(null);
      setFeedbackForm({
        technical_skills: 3,
        communication: 3,
        teamwork: 3,
        problem_solving: 3,
        initiative: 3,
        strengths: '',
        areas_for_improvement: '',
        additional_comments: ''
      });
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Ожидает ответа',
      'completed': 'Завершено',
      'declined': 'Отклонено'
    };
    return labels[status] || status;
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <button className="btn-back" onClick={() => navigate('/employee')}>
            ← Назад
          </button>
          <h1>Оценка от коллег (360°)</h1>
          <p>Запрашивайте обратную связь и оценивайте коллег</p>
        </div>

        {/* Табы */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          borderBottom: '2px solid var(--wink-gray)'
        }}>
          <button
            onClick={() => setActiveTab('request')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'request' ? '3px solid var(--wink-orange)' : 'none',
              color: activeTab === 'request' ? 'var(--wink-orange)' : 'var(--wink-light-gray)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Запросить оценку
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid var(--wink-orange)' : 'none',
              color: activeTab === 'pending' ? 'var(--wink-orange)' : 'var(--wink-light-gray)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Оценить коллег {pendingReviews.length > 0 && `(${pendingReviews.length})`}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--wink-light-gray)' }}>
            Загрузка...
          </div>
        ) : (
          <>
            {/* Вкладка: Запросить оценку */}
            {activeTab === 'request' && (
              <div className="section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="section-title">Мои запросы на оценку</h2>
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowRequestForm(true)}
                  >
                    + Запросить оценку
                  </button>
                </div>

                {myRequests.length === 0 ? (
                  <p style={{ color: 'var(--wink-light-gray)', textAlign: 'center', padding: '40px' }}>
                    Вы еще не отправляли запросы на оценку
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {myRequests.map(request => (
                      <div key={request.id} style={{
                        padding: '20px',
                        background: 'var(--wink-dark-gray)',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${request.status === 'completed' ? '#10b981' : 'var(--wink-orange)'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--wink-white)' }}>
                              {request.reviewer_first_name} {request.reviewer_last_name}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginTop: '4px' }}>
                              {request.reviewer_position}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: request.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 107, 0, 0.2)',
                            color: request.status === 'completed' ? '#10b981' : 'var(--wink-orange)'
                          }}>
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>
                          Цикл: {request.cycle_name}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginTop: '4px' }}>
                          Отправлено: {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        {request.message && (
                          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--wink-gray)', borderRadius: '8px', fontSize: '14px', color: 'var(--wink-white)' }}>
                            {request.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Вкладка: Оценить коллег */}
            {activeTab === 'pending' && (
              <div className="section-card">
                <h2 className="section-title">Запросы на оценку от коллег</h2>
                
                {pendingReviews.length === 0 ? (
                  <p style={{ color: 'var(--wink-light-gray)', textAlign: 'center', padding: '40px' }}>
                    Нет запросов на оценку
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {pendingReviews.map(review => (
                      <div key={review.id} style={{
                        padding: '20px',
                        background: 'var(--wink-dark-gray)',
                        borderRadius: '12px',
                        borderLeft: '4px solid var(--wink-orange)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--wink-white)' }}>
                              {review.requester_first_name} {review.requester_last_name}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginTop: '4px' }}>
                              {review.requester_position}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginTop: '8px' }}>
                              Цикл: {review.cycle_name}
                            </div>
                            {review.message && (
                              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--wink-gray)', borderRadius: '8px', fontSize: '14px', color: 'var(--wink-white)' }}>
                                {review.message}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn-primary"
                            onClick={() => handleStartReview(review)}
                          >
                            Оценить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Модальное окно: Запрос оценки */}
        {showRequestForm && (
          <div className="modal-overlay" onClick={() => setShowRequestForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Запросить оценку от коллеги</h2>
              <form onSubmit={handleRequestFeedback}>
                <div className="form-group">
                  <label>Коллега *</label>
                  <select
                    required
                    value={requestForm.reviewer_id}
                    onChange={(e) => setRequestForm({...requestForm, reviewer_id: parseInt(e.target.value)})}
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
                    <option value="">Выберите коллегу</option>
                    {colleagues.map(colleague => (
                      <option key={colleague.id} value={colleague.id}>
                        {colleague.first_name} {colleague.last_name} - {colleague.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Цикл оценки *</label>
                  <select
                    required
                    value={requestForm.cycle_id}
                    onChange={(e) => setRequestForm({...requestForm, cycle_id: parseInt(e.target.value)})}
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
                    <option value="">Выберите цикл</option>
                    {cycles.map(cycle => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Сообщение (необязательно)</label>
                  <textarea
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                    placeholder="Напишите, почему вы хотели бы получить оценку от этого коллеги..."
                    rows="3"
                  />
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="btn-primary">
                    Отправить запрос
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowRequestForm(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно: Форма оценки */}
        {showFeedbackForm && currentReview && (
          <div className="modal-overlay" onClick={() => setShowFeedbackForm(false)}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Оценка коллеги: {currentReview.requester_first_name} {currentReview.requester_last_name}</h2>
              <p style={{ color: 'var(--wink-light-gray)', marginBottom: '24px' }}>
                {currentReview.requester_position} • {currentReview.cycle_name}
              </p>

              {/* Преамбула */}
              <div style={{ 
                background: 'var(--wink-dark-gray)', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '24px',
                borderLeft: '4px solid var(--wink-orange)'
              }}>
                <h3 style={{ marginBottom: '12px', color: 'var(--wink-orange)', fontSize: '16px' }}>
                  Шаблон
                </h3>
                <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px', lineHeight: '1.6' }}>
                  Твой коллега выбрал направление задач или задачи, над которыми работал(-а) в течение полугодия, 
                  по результатам выполнения которых просит тебя поделиться своей обратной связью.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback}>
                {/* Вопрос 1: Направление задач */}
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', color: 'var(--wink-white)', fontWeight: '600' }}>
                    Подпись обратной связью по формату:
                  </label>
                  <div style={{ 
                    background: 'var(--wink-dark-gray)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '8px' }}>
                      <strong>Текст вопроса:</strong>
                    </p>
                    <p style={{ color: 'var(--wink-white)', fontSize: '14px', lineHeight: '1.6' }}>
                      Выбери список респондентов, по которым ты можешь дать обратную связь
                    </p>
                    <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '8px', fontStyle: 'italic' }}>
                      ФИО респондентов (множественный выбор)
                    </p>
                  </div>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginBottom: '8px' }}>
                    <em>Далее ФИО появляются последовательно</em><br/>
                    <em>На экран автоматически выводится одна оцениваемая задача</em><br/>
                    <em>"Текст задачи"</em>
                  </p>
                </div>

                {/* Вопрос 1: Достижение результатов */}
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                    1. Насколько удалось сотруднику достичь результатов, которые были запланированы по задаче
                  </label>
                  <div style={{ 
                    background: 'var(--wink-dark-gray)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                      <strong>Ответ:</strong> Шкала от 0 до 10
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>0</span>
                    <span style={{ color: 'var(--wink-orange)', fontSize: '16px', fontWeight: '600' }}>
                      {feedbackForm.result_achievement_rating}
                    </span>
                    <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={feedbackForm.result_achievement_rating}
                    onChange={(e) => setFeedbackForm({...feedbackForm, result_achievement_rating: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--wink-light-gray)'
                  }}>
                    <span>Не достигнуто</span>
                    <span>Полностью достигнуто</span>
                  </div>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '12px' }}>
                    <strong>Балл:</strong> 0-10
                  </p>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '4px', fontStyle: 'italic' }}>
                    Общий балл: {feedbackForm.result_achievement_rating + feedbackForm.interaction_quality_rating} / 20
                  </p>
                </div>

                {/* Вопрос 2: Личные качества */}
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                    2. Прокомментируй, какие личные качества помогли коллеге достичь результата
                  </label>
                  <div style={{ 
                    background: 'var(--wink-dark-gray)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                      <strong>Ответ:</strong> Свободный ответ
                    </p>
                  </div>
                  <textarea
                    required
                    value={feedbackForm.personal_qualities_comment}
                    onChange={(e) => setFeedbackForm({...feedbackForm, personal_qualities_comment: e.target.value})}
                    placeholder="Опишите личные качества коллеги, которые помогли достичь результата..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--wink-medium-gray)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--wink-black)',
                      color: 'var(--wink-white)',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Вопрос 3: Качество взаимодействия */}
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                    3. Оцени качество взаимодействия
                  </label>
                  <div style={{ 
                    background: 'var(--wink-dark-gray)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                      <strong>Ответ:</strong> Шкала от 0 до 10
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>0</span>
                    <span style={{ color: 'var(--wink-orange)', fontSize: '16px', fontWeight: '600' }}>
                      {feedbackForm.interaction_quality_rating}
                    </span>
                    <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={feedbackForm.interaction_quality_rating}
                    onChange={(e) => setFeedbackForm({...feedbackForm, interaction_quality_rating: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--wink-light-gray)'
                  }}>
                    <span>Неудовлетворительно</span>
                    <span>Отлично</span>
                  </div>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '12px' }}>
                    <strong>Балл:</strong> 0-10
                  </p>
                </div>

                {/* Вопрос 4: Области улучшения */}
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                    4. Что сотрудник может улучшить в своей работе по задаче в следующее полугодие
                  </label>
                  <div style={{ 
                    background: 'var(--wink-dark-gray)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                      <strong>Ответ:</strong> Свободный ответ
                    </p>
                  </div>
                  <textarea
                    required
                    value={feedbackForm.improvement_suggestions}
                    onChange={(e) => setFeedbackForm({...feedbackForm, improvement_suggestions: e.target.value})}
                    placeholder="Опишите, что можно улучшить в следующем периоде..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--wink-medium-gray)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--wink-black)',
                      color: 'var(--wink-white)',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="btn-primary">
                    Отправить оценку
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowFeedbackForm(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerFeedback;
