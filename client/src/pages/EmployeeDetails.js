import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

function EmployeeDetails() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [goals, setGoals] = useState([]);
  const [peerFeedback, setPeerFeedback] = useState([]);
  const [managerEvaluations, setManagerEvaluations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [managerRecommendations, setManagerRecommendations] = useState([]);
  const [period, setPeriod] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('goals');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, selectedCycle]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем циклы оценки
      const cyclesData = await api.cycles.getAll();
      setCycles(cyclesData);

      // Используем новый эндпоинт для получения всей информации
      const cycleId = selectedCycle !== 'all' ? selectedCycle : null;
      
      // Проверяем что api.manager существует перед вызовом
      if (!api.manager || !api.manager.getEmployeeDetails) {
        console.error('API manager.getEmployeeDetails не доступен');
        setLoading(false);
        return;
      }
      
      const data = await api.manager.getEmployeeDetails(employeeId, cycleId);
      
      setEmployee(data.employee);
      setGoals(data.goals || []);
      setRecommendations(data.recommendations || []);
      setManagerRecommendations(data.managerRecommendations || []);
      setPeriod(data.period);
      setManagerEvaluations(data.evaluations || []);
      setPeerFeedback(data.peerFeedback || []);

    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Удалена неиспользуемая переменная filteredGoals
  // const filteredGoals = selectedCycle === 'all' 
  //   ? goals 
  //   : goals.filter(g => g.cycle_id === parseInt(selectedCycle));

  const getStatusBadge = (status) => {
    const badges = {
      draft: { text: 'Черновик', class: 'status-draft' },
      submitted: { text: 'На утверждении', class: 'status-submitted' },
      approved: { text: 'Утверждено', class: 'status-approved' },
      rejected: { text: 'Отклонено', class: 'status-rejected' },
      in_progress: { text: 'В работе', class: 'status-in-progress' },
      completed: { text: 'Завершено', class: 'status-completed' }
    };
    const badge = badges[status] || { text: status, class: '' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#4caf50';
    if (rating >= 6) return '#2196f3';
    if (rating >= 3) return '#ff9800';
    return '#f44336';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 9) return 'Сверхрезультат';
    if (rating >= 6) return 'Хороший результат';
    if (rating >= 3) return 'Низкий результат';
    return 'Нет результата';
  };

  if (loading) {
    return <div className="dashboard-container">Загрузка...</div>;
  }

  if (!employee) {
    return <div className="dashboard-container">Сотрудник не найден</div>;
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate(-1)}
          className="btn-back"
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: 'var(--wink-orange)',
            border: '2px solid var(--wink-orange)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--wink-orange)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--wink-orange)';
          }}
        >
          ← Назад к команде
        </button>
      </div>

      {/* Карточка с информацией о сотруднике */}
      <div style={{
        background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '30px',
        border: '1px solid #404040',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B00 0%, #F59E0B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '40px',
              fontWeight: 'bold',
              boxShadow: '0 8px 24px rgba(255, 107, 0, 0.4)'
            }}
          >
            {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: 'white',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {employee.first_name} {employee.last_name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ 
                margin: 0, 
                color: '#FF6B00',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {employee.position || 'Позиция не указана'}
              </p>
              <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
                📧 {employee.email}
              </p>
              {employee.department && (
                <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
                  🏢 {employee.department}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #404040',
          textAlign: 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: 'white',
            marginBottom: '8px'
          }}>
            {goals.length}
          </div>
          <div style={{ color: '#999', fontSize: '14px' }}>Всего целей</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #404040',
          borderLeft: '4px solid #4caf50',
          textAlign: 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#4caf50',
            marginBottom: '8px'
          }}>
            {goals.filter(g => g.status === 'approved').length}
          </div>
          <div style={{ color: '#999', fontSize: '14px' }}>Утверждено</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #404040',
          borderLeft: '4px solid #8b5cf6',
          textAlign: 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#8b5cf6',
            marginBottom: '8px'
          }}>
            {goals.filter(g => g.status === 'in_progress').length}
          </div>
          <div style={{ color: '#999', fontSize: '14px' }}>В работе</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #404040',
          borderLeft: '4px solid #FF6B00',
          textAlign: 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#FF6B00',
            marginBottom: '8px'
          }}>
            {goals.filter(g => g.status === 'completed').length}
          </div>
          <div style={{ color: '#999', fontSize: '14px' }}>Завершено</div>
        </div>
      </div>

      {/* Фильтр по циклу и табы */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #404040'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>
            Информация о сотруднике
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ color: '#999', fontSize: '14px' }}>Цикл оценки:</label>
            <select 
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              style={{
                padding: '10px 16px',
                background: '#2a2a2a',
                color: 'white',
                border: '1px solid #404040',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Все циклы</option>
              {cycles.map(cycle => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} ({new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #404040', flexWrap: 'wrap' }}>
          <button 
            className={activeTab === 'goals' ? 'active' : ''}
            onClick={() => setActiveTab('goals')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'goals' ? 'var(--wink-orange)' : 'transparent',
              color: activeTab === 'goals' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'goals' ? '3px solid var(--wink-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            📋 Цели ({goals.length})
          </button>
          <button 
            className={activeTab === 'development' ? 'active' : ''}
            onClick={() => setActiveTab('development')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'development' ? 'var(--wink-orange)' : 'transparent',
              color: activeTab === 'development' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'development' ? '3px solid var(--wink-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            🎯 План развития ({recommendations.length})
          </button>
          <button 
            className={activeTab === 'manager-recommendations' ? 'active' : ''}
            onClick={() => setActiveTab('manager-recommendations')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'manager-recommendations' ? 'var(--wink-orange)' : 'transparent',
              color: activeTab === 'manager-recommendations' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'manager-recommendations' ? '3px solid var(--wink-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            Рекомендации руководителю ({managerRecommendations.length})
          </button>
          <button 
            className={activeTab === 'feedback' ? 'active' : ''}
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'feedback' ? 'var(--wink-orange)' : 'transparent',
              color: activeTab === 'feedback' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'feedback' ? '3px solid var(--wink-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            Peer Feedback ({peerFeedback.length})
          </button>
          <button 
            className={activeTab === 'evaluations' ? 'active' : ''}
            onClick={() => setActiveTab('evaluations')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'evaluations' ? 'var(--wink-orange)' : 'transparent',
              color: activeTab === 'evaluations' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'evaluations' ? '3px solid var(--wink-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            Оценки менеджера ({managerEvaluations.length})
          </button>
        </div>
      </div>

      {/* Контент табов */}
      {activeTab === 'goals' && (
        <div>
          {goals.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '60px',
              textAlign: 'center',
              border: '1px solid #404040'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p style={{ color: '#999', fontSize: '16px' }}>Нет целей для отображения</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {goals.map(goal => (
                <div key={goal.id} style={{
                  background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #404040',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF6B00';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#404040';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '600', flex: 1 }}>
                      {goal.title}
                    </h3>
                    {getStatusBadge(goal.status)}
                  </div>
                  <p style={{ color: '#b0b0b0', margin: '10px 0', lineHeight: '1.6' }}>
                    {goal.description}
                  </p>
                  
                  {goal.key_results && (
                    <div style={{ 
                      marginTop: '16px',
                      padding: '16px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                      borderLeft: '3px solid #FF6B00'
                    }}>
                      <h4 style={{ color: '#FF6B00', fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>
                        Ключевые результаты:
                      </h4>
                      <ul style={{ color: '#b0b0b0', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                        {goal.key_results.split('\n').map((kr, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{kr}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div style={{ 
                    marginTop: '16px', 
                    display: 'flex',
                    gap: '24px',
                    flexWrap: 'wrap',
                    padding: '16px',
                    background: '#1a1a1a',
                    borderRadius: '8px'
                  }}>
                    {goal.deadline && (
                      <div>
                        <span style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          Дедлайн
                        </span>
                        <span style={{ color: '#FF6B00', fontWeight: '600' }}>
                          {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {goal.weight && (
                      <div>
                        <span style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          Вес
                        </span>
                        <span style={{ color: '#FF6B00', fontWeight: '600' }}>
                          {goal.weight}%
                        </span>
                      </div>
                    )}
                  </div>

                  {goal.rejection_comment && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '16px', 
                      background: 'rgba(244, 67, 54, 0.1)',
                      borderLeft: '4px solid #f44336',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#f44336', fontSize: '14px', fontWeight: '600' }}>
                        Комментарий при отклонении:
                      </strong>
                      <p style={{ margin: '8px 0 0 0', color: '#ffcdd2', lineHeight: '1.6' }}>
                        {goal.rejection_comment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          {peerFeedback.length === 0 ? (
            <div className="stat-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#b0b0b0' }}>Нет peer feedback</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {peerFeedback.map(feedback => (
                <div key={feedback.id} className="stat-card" style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>От: </span>
                    <span style={{ color: 'white' }}>
                      {feedback.reviewer_name || 'Анонимно'}
                    </span>
                    <span style={{ color: '#666', fontSize: '12px', marginLeft: '20px' }}>Дата: </span>
                    <span style={{ color: '#b0b0b0' }}>
                      {new Date(feedback.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                      <strong style={{ color: '#FF6B00' }}>Достижение результатов: </strong>
                      <span style={{ color: 'white', fontSize: '18px', marginLeft: '10px' }}>
                        {feedback.result_achievement_rating || 0}/10
                      </span>
                    </div>

                    <div>
                      <strong style={{ color: '#FF6B00' }}>Личные качества:</strong>
                      <p style={{ color: '#b0b0b0', margin: '8px 0 0 0' }}>
                        {feedback.personal_qualities_comment || 'Не указано'}
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: '#FF6B00' }}>Качество взаимодействия: </strong>
                      <span style={{ color: 'white', fontSize: '18px', marginLeft: '10px' }}>
                        {feedback.interaction_quality_rating || 0}/10
                      </span>
                    </div>

                    <div>
                      <strong style={{ color: '#FF6B00' }}>Предложения по улучшению:</strong>
                      <p style={{ color: '#b0b0b0', margin: '8px 0 0 0' }}>
                        {feedback.improvement_suggestions || 'Не указано'}
                      </p>
                    </div>

                    <div style={{ 
                      padding: '12px', 
                      background: '#1a1a1a', 
                      borderRadius: '4px',
                      borderLeft: '3px solid #4caf50'
                    }}>
                      <strong style={{ color: '#4caf50' }}>Общий балл: </strong>
                      <span style={{ color: 'white', fontSize: '20px', marginLeft: '10px' }}>
                        {feedback.total_score || 0}/10
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div>
          {managerEvaluations.length === 0 ? (
            <div className="stat-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#b0b0b0' }}>Нет оценок менеджера</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {managerEvaluations.map(evaluation => {
                const goal = goals.find(g => g.id === evaluation.goal_id);
                return (
                  <div key={evaluation.id} className="stat-card" style={{ padding: '20px' }}>
                    {goal && (
                      <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #404040' }}>
                        <h4 style={{ color: '#FF6B00', margin: '0 0 8px 0' }}>Цель:</h4>
                        <p style={{ color: 'white', margin: 0 }}>{goal.title}</p>
                      </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>Дата оценки: </span>
                      <span style={{ color: '#b0b0b0' }}>
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: '15px' }}>
                      <div>
                        <strong style={{ color: '#FF6B00' }}>Достижение результатов: </strong>
                        <span style={{ color: 'white', fontSize: '18px', marginLeft: '10px' }}>
                          {evaluation.result_achievement_rating}/10
                        </span>
                      </div>

                      <div>
                        <strong style={{ color: '#FF6B00' }}>Личные качества:</strong>
                        <p style={{ color: '#b0b0b0', margin: '8px 0 0 0' }}>
                          {evaluation.personal_qualities_comment}
                        </p>
                      </div>

                      <div>
                        <strong style={{ color: '#FF6B00' }}>Личный вклад:</strong>
                        <p style={{ color: '#b0b0b0', margin: '8px 0 0 0' }}>
                          {evaluation.personal_contribution_comment}
                        </p>
                      </div>

                      <div>
                        <strong style={{ color: '#FF6B00' }}>Качество взаимодействия: </strong>
                        <span style={{ color: 'white', fontSize: '18px', marginLeft: '10px' }}>
                          {evaluation.interaction_quality_rating}/10
                        </span>
                      </div>

                      <div>
                        <strong style={{ color: '#FF6B00' }}>Рекомендации по улучшению:</strong>
                        <p style={{ color: '#b0b0b0', margin: '8px 0 0 0' }}>
                          {evaluation.improvement_suggestions}
                        </p>
                      </div>

                      <div style={{ 
                        padding: '15px', 
                        background: '#1a1a1a', 
                        borderRadius: '8px',
                        borderLeft: `4px solid ${getRatingColor(evaluation.overall_rating)}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: getRatingColor(evaluation.overall_rating) }}>
                              Общий рейтинг:
                            </strong>
                            <span style={{ 
                              color: 'white', 
                              fontSize: '24px', 
                              marginLeft: '15px',
                              fontWeight: 'bold'
                            }}>
                              {evaluation.overall_rating}/10
                            </span>
                          </div>
                          <div style={{ 
                            color: getRatingColor(evaluation.overall_rating),
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {getRatingLabel(evaluation.overall_rating)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Таб: План развития */}
      {activeTab === 'development' && (
        <div>
          {recommendations.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '60px',
              textAlign: 'center',
              border: '1px solid #404040'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p style={{ color: '#999', fontSize: '16px' }}>План развития не найден</p>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                HR еще не составил план развития для этого сотрудника
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {recommendations.map(rec => {
                const isPeriodInProgress = period?.status === 'in_progress';
                const isNotActual = isPeriodInProgress;
                
                return (
                  <div key={rec.id} style={{
                    background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: `2px solid ${isNotActual ? '#f57c00' : '#404040'}`,
                    position: 'relative',
                    opacity: isNotActual ? 0.8 : 1
                  }}>
                    {isNotActual && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(245, 124, 0, 0.2)',
                        border: '1px solid #f57c00',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#ffb74d'
                      }}>
                        ⚠ Не актуально - ожидается новый план
                      </div>
                    )}

                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isNotActual ? '40px' : '0' }}>
                      <h3 style={{ color: '#FF6B00', margin: 0, fontSize: '20px', fontWeight: '700' }}>
                        План развития от HR
                      </h3>
                      {rec.sent_at && (
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {new Date(rec.sent_at).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>

                    {rec.hr_first_name && (
                      <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
                        Подготовил: {rec.hr_first_name} {rec.hr_last_name}
                      </p>
                    )}

                    {rec.achievements && (
                      <div style={{ 
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(76, 175, 80, 0.1)',
                        borderLeft: '4px solid #4caf50',
                        borderRadius: '8px'
                      }}>
                        <h4 style={{ color: '#4caf50', fontSize: '16px', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>✅</span> Достижения
                        </h4>
                        <div style={{ color: '#b0b0b0', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                          {rec.achievements}
                        </div>
                      </div>
                    )}

                    {rec.improvements && (
                      <div style={{ 
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(255, 152, 0, 0.1)',
                        borderLeft: '4px solid #ff9800',
                        borderRadius: '8px'
                      }}>
                        <h4 style={{ color: '#ff9800', fontSize: '16px', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📈</span> Области для улучшения
                        </h4>
                        <div style={{ color: '#b0b0b0', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                          {rec.improvements}
                        </div>
                      </div>
                    )}

                    {rec.development_plan && (
                      <div style={{ 
                        padding: '20px',
                        background: 'rgba(255, 107, 0, 0.1)',
                        borderLeft: '4px solid #FF6B00',
                        borderRadius: '8px'
                      }}>
                        <h4 style={{ color: '#FF6B00', fontSize: '16px', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🎯</span> План развития
                        </h4>
                        <div style={{ color: '#e0e0e0', lineHeight: '1.8', whiteSpace: 'pre-line', fontSize: '15px' }}>
                          {rec.development_plan}
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      marginTop: '20px', 
                      padding: '12px 16px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{rec.is_read ? '✅' : '📬'}</span>
                      <span style={{ color: '#999', fontSize: '14px' }}>
                        {rec.is_read ? 'Сотрудник ознакомлен с планом' : 'Ожидает ознакомления сотрудника'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Таб: Рекомендации руководителю */}
      {activeTab === 'manager-recommendations' && (
        <div>
          {managerRecommendations.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '60px',
              textAlign: 'center',
              border: '1px solid #404040'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👔</div>
              <p style={{ color: '#999', fontSize: '16px' }}>Рекомендации для руководителя не найдены</p>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                HR еще не составил рекомендации по управлению этим сотрудником
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {managerRecommendations.map(rec => {
                const isPeriodInProgress = rec.period_status === 'in_progress';
                const isNotActual = isPeriodInProgress;
                
                return (
                  <div key={rec.id} style={{
                    background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: `2px solid ${isNotActual ? '#f57c00' : '#404040'}`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    opacity: isNotActual ? 0.85 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isNotActual) {
                      e.currentTarget.style.borderColor = '#8b5cf6';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isNotActual) {
                      e.currentTarget.style.borderColor = '#404040';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}>
                    {isNotActual && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(245, 124, 0, 0.2)',
                        border: '1px solid #f57c00',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#ffb74d'
                      }}>
                        ⚠ Не актуально - ожидаются новые рекомендации
                      </div>
                    )}

                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isNotActual ? '40px' : '0' }}>
                      <h3 style={{ color: '#8b5cf6', margin: 0, fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>👔</span>
                        Рекомендации руководителю
                      </h3>
                      {rec.created_at && (
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {new Date(rec.created_at).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>

                    <div style={{ 
                      padding: '20px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderLeft: '4px solid #8b5cf6',
                      borderRadius: '8px',
                      marginTop: '16px'
                    }}>
                      <h4 style={{ color: '#8b5cf6', fontSize: '16px', marginBottom: '12px', fontWeight: '600' }}>
                        Как эффективно управлять сотрудником:
                      </h4>
                      <div style={{ color: '#e0e0e0', lineHeight: '1.8', whiteSpace: 'pre-line', fontSize: '15px' }}>
                        {rec.recommendation_text}
                      </div>
                    </div>

                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                      border: '1px solid #404040'
                    }}>
                      <p style={{ color: '#999', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                        <strong style={{ color: '#8b5cf6' }}>Конфиденциально:</strong> Эти рекомендации составлены HR специально для руководителя 
                        и содержат информацию о том, как лучше взаимодействовать с сотрудником, 
                        мотивировать его и развивать его потенциал.
                      </p>
                    </div>

                    {rec.sent_at && (
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '12px 16px',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '20px' }}>{rec.is_read ? '✅' : '📬'}</span>
                        <span style={{ color: '#999', fontSize: '14px' }}>
                          {rec.is_read ? 'Руководитель ознакомлен' : 'Ожидает ознакомления руководителя'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeeDetails;
