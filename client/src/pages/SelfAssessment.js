import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const SelfAssessment = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // const [existingAssessment, setExistingAssessment] = useState(null); // Временно не используется
  
  const [assessment, setAssessment] = useState({
    goal_assessments: {}, // { goal_id: { achieved: true/false, comment: '' } }
    // Вопрос 1: Достижения (свободный ответ)
    achievement_description: '',
    // Вопрос 2: Личный вклад (свободный ответ)
    personal_contribution: '',
    // Вопрос 3: Что заберу с собой (свободный ответ)
    takeaways: '',
    // Вопрос 4: Что буду делать по-другому (свободный ответ)
    improvements: '',
    // Вопрос 5: Оценка взаимодействия с коллегами (шкала 0-10)
    team_interaction_rating: 5,
    // Вопрос 6: Оценка удовлетворенности выполнением задачи (шкала 0-10)
    task_satisfaction_rating: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cyclesData, goalsData] = await Promise.all([
        api.cycles.getAll(),
        api.goals.getAll()
      ]);
      
      // Показываем только активные циклы (когда руководитель открыл период оценки)
      const activeCycles = cyclesData.filter(c => c.status === 'active');
      setCycles(activeCycles);
      setGoals(goalsData);
      
      // TODO: Загрузить существующую самооценку, если есть
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = (cycle) => {
    const cycleGoals = goals.filter(g => g.cycle_id === cycle.id && g.status === 'approved');
    
    // Инициализируем оценки для каждой цели
    const goalAssessments = {};
    cycleGoals.forEach(goal => {
      goalAssessments[goal.id] = {
        achieved: false,
        comment: ''
      };
    });
    
    setSelectedCycle(cycle);
    setShowForm(true);
    setAssessment({
      goal_assessments: goalAssessments,
      achievement_description: '',
      personal_contribution: '',
      takeaways: '',
      improvements: '',
      team_interaction_rating: 5,
      task_satisfaction_rating: 5
    });
  };

  const handleGoalAssessmentChange = (goalId, field, value) => {
    setAssessment(prev => ({
      ...prev,
      goal_assessments: {
        ...prev.goal_assessments,
        [goalId]: {
          ...prev.goal_assessments[goalId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!assessment.achievement_description.trim()) {
      alert('Опишите результаты, которых вам удалось достичь');
      return;
    }

    if (!assessment.personal_contribution.trim()) {
      alert('Опишите ваш личный вклад в получение результата');
      return;
    }

    try {
      // TODO: Создать API эндпоинт для сохранения самооценки
      console.log('Самооценка за период:', {
        cycle_id: selectedCycle.id,
        user_id: user.id,
        ...assessment
      });
      
      alert('Самооценка успешно сохранена!');
      setShowForm(false);
      setSelectedCycle(null);
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="btn-back"
              onClick={() => navigate('/employee')}
            >
              ← Назад
            </button>
            <div>
              <h1 style={{ margin: 0 }}>Самооценка</h1>
              <p style={{ margin: '4px 0 0 0' }}>Оцените свой прогресс в достижении целей</p>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="main-content full-width">
            <div className="section-card">
              <h2 className="section-title">Активные периоды оценки</h2>
              <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
                Заполните самооценку за период, когда руководитель открыл оценку
              </p>
              
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
              ) : cycles.length > 0 ? (
                <div className="goals-list">
                  {cycles.map(cycle => {
                    const cycleGoals = goals.filter(g => g.cycle_id === cycle.id && g.status === 'approved');
                    return (
                      <div key={cycle.id} className="goal-item">
                        <div className="goal-header">
                          <h3>{cycle.name}</h3>
                          <span className="goal-status" style={{ 
                            backgroundColor: cycle.status === 'active' ? '#4CAF50' : '#999' 
                          }}>
                            {cycle.status === 'active' ? 'Активный' : cycle.status === 'completed' ? 'Завершен' : 'Запланирован'}
                          </span>
                        </div>
                        
                        <div style={{ marginTop: '12px', color: '#999', fontSize: '13px' }}>
                          <p>
                            <strong>Период:</strong> {new Date(cycle.start_date).toLocaleDateString('ru-RU')} - {new Date(cycle.end_date).toLocaleDateString('ru-RU')}
                          </p>
                          <p style={{ marginTop: '4px' }}>
                            <strong>Утвержденных целей:</strong> {cycleGoals.length}
                          </p>
                        </div>
                        
                        {cycleGoals.length > 0 && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(255,107,0,0.05)', borderRadius: '6px' }}>
                            <strong style={{ color: '#FF6B00', fontSize: '13px' }}>Ваши цели в этом периоде:</strong>
                            <ul style={{ margin: '8px 0 0 20px', padding: 0, color: '#ccc', fontSize: '13px' }}>
                              {cycleGoals.slice(0, 3).map(g => (
                                <li key={g.id} style={{ marginTop: '4px' }}>{g.title}</li>
                              ))}
                              {cycleGoals.length > 3 && (
                                <li style={{ marginTop: '4px', color: '#999' }}>
                                  и еще {cycleGoals.length - 3}...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button 
                            className="btn-action btn-primary-small"
                            onClick={() => handleStartAssessment(cycle)}
                            disabled={cycleGoals.length === 0}
                          >
                            Заполнить самооценку
                          </button>
                          {cycleGoals.length === 0 && (
                            <span style={{ fontSize: '13px', color: '#999' }}>
                              Нет утвержденных целей для оценки
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                    Нет активных периодов оценки
                  </p>
                  <p style={{ fontSize: '14px' }}>
                    Самооценку можно заполнить только когда руководитель откроет период оценки
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && selectedCycle && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Самооценка за период</h2>
            
            <div style={{ padding: '12px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 4px 0', color: '#FF6B00' }}>{selectedCycle.name}</h3>
              <p style={{ margin: 0, color: '#999', fontSize: '13px' }}>
                {new Date(selectedCycle.start_date).toLocaleDateString('ru-RU')} - {new Date(selectedCycle.end_date).toLocaleDateString('ru-RU')}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Раздел 1: Оценка по каждой цели */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--wink-orange)', fontSize: '16px', marginBottom: '16px' }}>
                  1. Оценка достижения целей
                </h3>
                
                {goals.filter(g => g.cycle_id === selectedCycle.id && g.status === 'approved').map((goal, index) => (
                  <div key={goal.id} style={{ 
                    marginBottom: '20px', 
                    padding: '16px', 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    borderRadius: '8px',
                    border: '1px solid var(--wink-medium-gray)'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: 'var(--wink-white)', fontSize: '14px' }}>
                        Цель {index + 1}: {goal.title}
                      </strong>
                      {goal.description && (
                        <p style={{ color: '#999', fontSize: '13px', margin: '4px 0 0 0' }}>
                          {goal.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', color: '#ccc' }}>
                        Статус выполнения <span style={{ color: '#FF6B00' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`goal-${goal.id}-achieved`}
                            checked={assessment.goal_assessments[goal.id]?.achieved === true}
                            onChange={() => handleGoalAssessmentChange(goal.id, 'achieved', true)}
                            required
                          />
                          <span style={{ color: '#4CAF50', fontSize: '14px' }}>Выполнена</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`goal-${goal.id}-achieved`}
                            checked={assessment.goal_assessments[goal.id]?.achieved === false}
                            onChange={() => handleGoalAssessmentChange(goal.id, 'achieved', false)}
                            required
                          />
                          <span style={{ color: '#f44336', fontSize: '14px' }}>Не выполнена</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor={`goal-comment-${goal.id}`} style={{ fontSize: '13px', color: '#ccc' }}>
                        Комментарий о выполнении
                      </label>
                      <textarea
                        id={`goal-comment-${goal.id}`}
                        value={assessment.goal_assessments[goal.id]?.comment || ''}
                        onChange={(e) => handleGoalAssessmentChange(goal.id, 'comment', e.target.value)}
                        placeholder="Опишите что было сделано, какие результаты достигнуты..."
                        rows="2"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Раздел 2: Вопросы для самооценки */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--wink-orange)', fontSize: '16px', marginBottom: '16px' }}>
                  2. Самооценка и рефлексия
                </h3>
                
                <div className="form-group">
                  <label>
                    Вписав, используя шаблон, каких результатов удалось достичь <span style={{ color: '#FF6B00' }}>*</span>
                  </label>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px', fontStyle: 'italic' }}>
                    Пример: выявил возможность оптимизации количества кликов при оформлении подписки и после реализации улучшения рост по оплате подписки составил +1%
                  </div>
                  <textarea
                    value={assessment.achievement_description}
                    onChange={(e) => setAssessment({...assessment, achievement_description: e.target.value})}
                    placeholder="Опишите конкретные результаты с метриками..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Какой личный вклад ты сделал в полученный результат <span style={{ color: '#FF6B00' }}>*</span>
                  </label>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px', fontStyle: 'italic' }}>
                    Пример: благодаря созданной документации команда находила решения в 1,5 раза быстрее
                  </div>
                  <textarea
                    value={assessment.personal_contribution}
                    onChange={(e) => setAssessment({...assessment, personal_contribution: e.target.value})}
                    placeholder="Опишите ваш личный вклад и влияние на результат..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Что ты забираешь с собой по результатам выполнения этой задачи
                  </label>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px', fontStyle: 'italic' }}>
                    Например: прокачался в микросервисах, хочу это развивать дальше
                  </div>
                  <textarea
                    value={assessment.takeaways}
                    onChange={(e) => setAssessment({...assessment, takeaways: e.target.value})}
                    placeholder="Какие навыки приобрели, что хотите развивать..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Что в следующий раз будешь делать по-другому
                  </label>
                  <textarea
                    value={assessment.improvements}
                    onChange={(e) => setAssessment({...assessment, improvements: e.target.value})}
                    placeholder="Что бы вы улучшили или сделали иначе в следующий раз..."
                    rows="3"
                  />
                </div>
              </div>

              {/* Раздел 3: Оценки по шкале */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--wink-orange)', fontSize: '16px', marginBottom: '16px' }}>
                  3. Оценка работы
                </h3>
                
                <div className="form-group">
                  <label>
                    Как ты оцениваешь качество своего взаимодействия с коллегами, командой по данной задаче <span style={{ color: '#FF6B00' }}>*</span>
                  </label>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>
                    Шкала от 0 до 10
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={assessment.team_interaction_rating}
                      onChange={(e) => setAssessment({...assessment, team_interaction_rating: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#999' }}>0 (Низкое)</span>
                      <span style={{ fontSize: '18px', color: '#FF6B00', fontWeight: 'bold' }}>
                        {assessment.team_interaction_rating}
                      </span>
                      <span style={{ fontSize: '12px', color: '#999' }}>10 (Отличное)</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Как ты оцениваешь общую удовлетворенность своим выполнением данной задачи <span style={{ color: '#FF6B00' }}>*</span>
                  </label>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>
                    Шкала от 0 до 10
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={assessment.task_satisfaction_rating}
                      onChange={(e) => setAssessment({...assessment, task_satisfaction_rating: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#999' }}>0 (Низкая)</span>
                      <span style={{ fontSize: '18px', color: '#FF6B00', fontWeight: 'bold' }}>
                        {assessment.task_satisfaction_rating}
                      </span>
                      <span style={{ fontSize: '12px', color: '#999' }}>10 (Высокая)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Сохранить самооценку
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedCycle(null);
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

export default SelfAssessment;
