import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const ManagerEvaluation = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { employeeId, periodId } = useParams();
  const [loading, setLoading] = useState(true);
  const [readyEmployees, setReadyEmployees] = useState([]); // сотрудники готовые к оценке
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [peerReviews, setPeerReviews] = useState([]);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [autoMode, setAutoMode] = useState(false); // если true — автооценка по ссылке
  const [evaluationSent, setEvaluationSent] = useState(false); // для блокировки кнопки
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selfAssessment, setSelfAssessment] = useState(null); // для хранения самооценки
  
  const [evaluationForm, setEvaluationForm] = useState({
    goal_id: '',
    employee_id: '',
    cycle_id: '',
    result_achievement_rating: 5, // 0-10
    personal_qualities_comment: '', // свободный ответ
    personal_contribution_comment: '', // свободный ответ
    interaction_quality_rating: 5, // 0-10
    improvement_suggestions: '', // свободный ответ
    overall_rating: 5, // 0-10
    feedback_summary: '' // агрегирующая обратная связь
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // Получаем только сотрудников, готовых к оценке
      const readyData = await api.get('/manager-evaluation/ready-employees');
      setReadyEmployees(readyData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Если есть параметры employeeId и periodId — автоустановка режима
  useEffect(() => {
    if (employeeId && periodId) {
      setAutoMode(true);
      (async () => {
        setLoading(true);
        try {
          // Получаем сотрудников готовых к оценке
          const readyData = await api.get('/manager-evaluation/ready-employees');
          setReadyEmployees(readyData);
          
          const emp = readyData.find(e => e.user_id === parseInt(employeeId) && e.period_id === parseInt(periodId));
          if (emp) {
            setSelectedEmployee(emp);
            await handleEmployeeSelect(emp);
          }
          setShowEvaluationForm(false);
        } catch (e) {
          console.error('Ошибка:', e);
          setSelectedEmployee(null);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [employeeId, periodId]);

  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    
    // Загружаем оценки от коллег для выбранного сотрудника
    try {
      const reviews = await api.peerFeedback.getByEmployee(employee.user_id, employee.period_id);
      setPeerReviews(reviews);
    } catch (err) {
      console.warn('Не удалось загрузить оценки от коллег для сотрудника:', err.message);
      setPeerReviews([]);
    }

    // Загружаем самооценку сотрудника
    try {
      const selfAssessments = await api.get(`/self-assessment/employee/${employee.user_id}?periodId=${employee.period_id}`);
      if (Array.isArray(selfAssessments) && selfAssessments.length > 0) {
        setSelfAssessment(selfAssessments); // Сохраняем весь массив
      } else {
        setSelfAssessment(null);
      }
    } catch (err) {
      setSelfAssessment(null);
    }
  };

  const handleStartEvaluation = () => {
    // Начать оценку сотрудника
    setEvaluationForm({
      goal_id: null, // Не используем goal_id, устарело
      employee_id: selectedEmployee.user_id,
      cycle_id: selectedEmployee.cycle_id,
      period_id: selectedEmployee.period_id, // Добавляем period_id
      result_achievement_rating: 5,
      personal_qualities_comment: '',
      personal_contribution_comment: '',
      interaction_quality_rating: 5,
      improvement_suggestions: '',
      overall_rating: 5
    });
    setShowEvaluationForm(true);
  };

  const handleGenerateAISummary = async () => {
    if (!evaluationForm.personal_qualities_comment && !evaluationForm.personal_contribution_comment && !evaluationForm.improvement_suggestions) {
      alert('Пожалуйста, заполните хотя бы одно поле с комментариями перед генерацией резюме');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Формируем данные оценки
      const evaluationData = {
        result_achievement_rating: evaluationForm.result_achievement_rating,
        personal_qualities_comment: evaluationForm.personal_qualities_comment,
        personal_contribution_comment: evaluationForm.personal_contribution_comment,
        interaction_quality_rating: evaluationForm.interaction_quality_rating,
        improvement_suggestions: evaluationForm.improvement_suggestions,
        overall_rating: evaluationForm.overall_rating
      };

      // Анонимизируем отзывы коллег (убираем имена, оставляем только должность и текст)
      const anonymizedPeerReviews = (peerReviews || []).map((r, index) => ({
        author: `Коллега ${index + 1}`,
        position: r.reviewer_position || 'Не указана',
        personal_qualities: r.personal_qualities_comment || '',
        improvement_suggestions: r.improvement_suggestions || '',
        result_achievement_rating: r.result_achievement_rating || 0,
        interaction_quality_rating: r.interaction_quality_rating || 0
      }));

      // Собираем самооценку в текст
      const selfAssessmentText = Array.isArray(selfAssessment) 
        ? selfAssessment.map((item, idx) => `Вопрос ${idx + 1}: ${item.answer_text || ''}`).join('\n')
        : (selfAssessment?.answer_text || '');

      const requestBody = {
        employee_name: selectedEmployee.first_name + ' ' + selectedEmployee.last_name,
        goals: [evaluationData], // используем evaluationData вместо goals
        peer_reviews_general: anonymizedPeerReviews,
        manager_comments: evaluationForm.personal_contribution_comment || '',
        self_assessment: selfAssessmentText
      };

      // Логируем для отладки (можно убрать в продакшене)
      console.log('Отправка к ИИ сервису:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:8000/api/manager-summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Ошибка при обращении к ИИ сервису');
      }

      const data = await response.json();
      
      // Обновляем поле feedback_summary сгенерированным резюме
      setEvaluationForm({
        ...evaluationForm,
        feedback_summary: data.summary || data.feedback_summary || 'Не удалось сгенерировать резюме'
      });

    } catch (error) {
      console.error('Ошибка генерации резюме:', error);
      alert('Ошибка при генерации резюме с помощью ИИ: ' + error.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    try {
      await api.managerEvaluation.submit(evaluationForm);
      alert('Оценка успешно отправлена!');
      setShowEvaluationForm(false);
      setEvaluationSent(true); // блокируем повторную отправку
      setEvaluationForm({
        goal_id: '',
        employee_id: '',
        cycle_id: '',
        result_achievement_rating: 5,
        personal_qualities_comment: '',
        personal_contribution_comment: '',
        interaction_quality_rating: 5,
        improvement_suggestions: '',
        overall_rating: 5,
        feedback_summary: ''
      });
      
      // Перезагружаем список готовых сотрудников
      await loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const getOverallRatingLabel = (rating) => {
    if (rating >= 0 && rating <= 2) return 'Нет результата';
    if (rating >= 3 && rating <= 5) return 'Низкий результат';
    if (rating >= 6 && rating <= 8) return 'Хороший результат';
    if (rating >= 9 && rating <= 10) return 'Сверхрезультат';
    return '';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Header user={user} onLogout={onLogout} />
        <div className="dashboard-content">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Готовые к оценке</h1>
          <button className="btn-secondary" onClick={() => navigate('/manager-dashboard')}>
            ← Назад к панели
          </button>
        </div>

        {/* Список сотрудников готовых к оценке */}
        {!showEvaluationForm && (
          <div className="section-card">
            <h2 className="section-title">Сотрудники готовые к оценке</h2>
            
            {readyEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--wink-light-gray)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
                <h3 style={{ marginBottom: '12px', color: 'var(--wink-white)' }}>Никто не готов к оценке</h3>
                <p style={{ marginBottom: '8px' }}>
                  Сотрудник готов к оценке когда:
                </p>
                <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '16px', lineHeight: '1.8' }}>
                  <li>Период Performance Review в статусе "В процессе"</li>
                  <li>Самооценка завершена</li>
                  <li>Получено минимум 3 отзыва от коллег</li>
                </ul>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--wink-light-gray)', marginBottom: '24px' }}>
                  Эти сотрудники прошли самооценку и получили обратную связь от коллег
                </p>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {readyEmployees.map(emp => {
                    const startDate = new Date(emp.start_date);
                    // const endDate = new Date(emp.end_date); // Не используется
                    const periodNum = startDate.getMonth() <= 5 ? 1 : 2;
                    const periodName = `Полугодие ${periodNum} - ${startDate.getFullYear()}`;
                    
                    return (
                      <div key={`${emp.user_id}-${emp.period_id}`} style={{
                        padding: '20px',
                        border: '1px solid var(--wink-medium-gray)',
                        borderRadius: '12px',
                        backgroundColor: 'var(--wink-dark-gray)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleEmployeeSelect(emp)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--wink-orange)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--wink-medium-gray)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ marginBottom: '8px', color: 'var(--wink-white)' }}>
                              {emp.first_name} {emp.last_name}
                            </h3>
                            <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '4px' }}>
                              {emp.position}
                            </p>
                            <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                              {periodName}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--wink-green)', fontSize: '14px', marginBottom: '4px' }}>
                              ✅ Самооценка завершена
                            </div>
                            <div style={{ color: 'var(--wink-green)', fontSize: '14px' }}>
                              ✅ {emp.peer_reviews_count} отзывов получено
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            
            {/* Информация о сотруднике и кнопка начала оценки */}
            {selectedEmployee && (
              <>
                <div style={{ 
                  marginTop: '32px', 
                  padding: '24px', 
                  background: 'var(--wink-dark-gray)', 
                  borderRadius: '12px',
                  border: '1px solid var(--wink-medium-gray)'
                }}>
                  <h3 style={{ marginBottom: '16px', color: 'var(--wink-white)' }}>
                    Готово к оценке: {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '4px' }}>Должность</div>
                      <div style={{ color: 'var(--wink-white)', fontSize: '16px' }}>{selectedEmployee.position}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '4px' }}>Период</div>
                      <div style={{ color: 'var(--wink-white)', fontSize: '16px' }}>
                        {(() => {
                          const startDate = new Date(selectedEmployee.start_date);
                          const periodNum = startDate.getMonth() <= 5 ? 1 : 2;
                          return `Полугодие ${periodNum} - ${startDate.getFullYear()}`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '4px' }}>Самооценка</div>
                      <div style={{ color: 'var(--wink-green)', fontSize: '16px' }}>✅ Завершена</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '4px' }}>Отзывы коллег</div>
                      <div style={{ color: 'var(--wink-green)', fontSize: '16px' }}>✅ {selectedEmployee.peer_reviews_count} получено</div>
                    </div>
                  </div>
                  
                  {(!autoMode || !evaluationSent) && (
                    <button
                      className="btn-primary"
                      onClick={() => handleStartEvaluation()}
                      disabled={autoMode && evaluationSent}
                      style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                    >
                      Начать оценку сотрудника
                    </button>
                  )}
                  
                  {autoMode && evaluationSent && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#4CAF50', 
                      fontWeight: 600, 
                      padding: '16px',
                      background: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '8px'
                    }}>
                      ✅ Оценка успешно отправлена
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Форма оценки */}
        {showEvaluationForm && (
          <div className="section-card">
            <h2 className="section-title">
              Оценка сотрудника: {selectedEmployee.first_name} {selectedEmployee.last_name}
            </h2>
            <p style={{ color: 'var(--wink-light-gray)', marginBottom: '24px' }}>
              {selectedEmployee.position}
            </p>

            {/* Блок: Самооценка сотрудника */}
            {selfAssessment && Array.isArray(selfAssessment) && selfAssessment.length > 0 && (
              <div style={{
                background: 'var(--wink-dark-gray)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '18px',
                borderLeft: '4px solid var(--wink-blue)'
              }}>
                <h3 style={{ color: 'var(--wink-blue)', fontSize: '15px', marginBottom: '12px' }}>Самооценка сотрудника</h3>
                {selfAssessment.map((item, idx) => (
                  <div key={item.id || idx} style={{ 
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: idx < selfAssessment.length - 1 ? '1px solid var(--wink-medium-gray)' : 'none'
                  }}>
                    <div style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginBottom: '4px' }}>
                      Вопрос {item.question_id}
                    </div>
                    <div style={{ color: 'var(--wink-white)', fontSize: '14px' }}>
                      {item.answer_text || 'Нет ответа'}
                    </div>
                    {item.answer_score !== null && (
                      <div style={{ color: 'var(--wink-orange)', fontSize: '13px', marginTop: '4px' }}>
                        Оценка: {item.answer_score}/10
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Блок: Оценки коллег */}
            {peerReviews && peerReviews.length > 0 && (
              <div style={{
                background: 'var(--wink-dark-gray)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '18px',
                borderLeft: '4px solid var(--wink-green)'
              }}>
                <h3 style={{ color: 'var(--wink-green)', fontSize: '15px', marginBottom: '12px' }}>Оценки коллег</h3>
                {peerReviews.map((r, idx) => (
                  <div key={r.id || idx} style={{ 
                    marginBottom: '12px', 
                    paddingBottom: '12px', 
                    borderBottom: idx < peerReviews.length - 1 ? '1px solid var(--wink-medium-gray)' : 'none' 
                  }}>
                    <div style={{ color: 'var(--wink-light-gray)', fontWeight: 600, marginBottom: '6px' }}>
                      Коллега {idx + 1}: {r.reviewer_first_name} {r.reviewer_last_name}
                    </div>
                    <div style={{ color: 'var(--wink-white)', fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Личные качества:</strong> {r.personal_qualities_comment || 'Нет комментария'}
                    </div>
                    <div style={{ color: 'var(--wink-white)', fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Рекомендации:</strong> {r.improvement_suggestions || 'Нет рекомендаций'}
                    </div>
                    <div style={{ color: 'var(--wink-white)', fontSize: '14px' }}>
                      <strong>Оценки:</strong> Достижение результатов: {r.result_achievement_rating}/10, 
                      Взаимодействие: {r.interaction_quality_rating}/10
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Преамбула */}
            <div style={{ 
              background: 'var(--wink-dark-gray)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '24px',
              borderLeft: '4px solid var(--wink-orange)'
            }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--wink-orange)', fontSize: '16px' }}>
                Во вложении отчет с ответами
              </h3>
              <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px', lineHeight: '1.6' }}>
                Твой сотрудник работал(-а) над задачей в течение полугодия, по результатам выполнения которой респонденты делились обратной связью.
              </p>
              <ol style={{ color: 'var(--wink-light-gray)', fontSize: '14px', lineHeight: '1.6', marginTop: '12px', paddingLeft: '20px' }}>
                <li>Ознакомься с обратной связью от респондентов</li>
                <li>Сформируй общую обратную связь, которая содержит в себе ОС респондентов и твою личную обратную связь</li>
                <li>Поделись обратной связью с коллегой в формат:</li>
              </ol>
            </div>

            {/* Информация о периоде */}
            <div style={{
              background: 'var(--wink-dark-gray)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: 'var(--wink-white)', marginBottom: '8px' }}>Оценка за период:</h4>
              <p style={{ color: 'var(--wink-white)', fontSize: '16px', fontWeight: '600' }}>
                {(() => {
                  const startDate = new Date(selectedEmployee.start_date);
                  const periodNum = startDate.getMonth() <= 5 ? 1 : 2;
                  return `Полугодие ${periodNum} - ${startDate.getFullYear()}`;
                })()}
              </p>
            </div>

            <form onSubmit={handleSubmitEvaluation}>
              {/* Вопрос 1: ФИО сотрудника и текстовое поле */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                  1. ФИО сотрудника, которого оцениваешь
                </label>
                <input
                  type="text"
                  value={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--wink-medium-gray)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--wink-gray)',
                    color: 'var(--wink-white)',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                />
                <div style={{ 
                  background: 'var(--wink-dark-gray)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                    <strong>Текстовое поле с ФИО сотрудника, по которому работа(-а) в течение полугодия, по результатам выполнения которой просят поделиться обратной связью.</strong>
                  </p>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '8px', fontStyle: 'italic' }}>
                    На экран автоматически выводится одна оцениваемая задача<br/>
                    "Текст задачи"
                  </p>
                </div>
              </div>

              {/* Вопрос 2: Достижение результатов */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                  2. Насколько удалось сотруднику достичь результатов, которые были запланированы по задаче
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
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '4px' }}>
                    <strong>Балл:</strong> 0-10
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>0</span>
                  <span style={{ color: 'var(--wink-orange)', fontSize: '16px', fontWeight: '600' }}>
                    {evaluationForm.result_achievement_rating}
                  </span>
                  <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaluationForm.result_achievement_rating}
                  onChange={(e) => setEvaluationForm({...evaluationForm, result_achievement_rating: parseInt(e.target.value)})}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Вопрос 3: Личные качества */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                  3. Прокомментируй, какие личные качества помогли сотруднику достичь результата
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
                  value={evaluationForm.personal_qualities_comment}
                  onChange={(e) => setEvaluationForm({...evaluationForm, personal_qualities_comment: e.target.value})}
                  placeholder="Опишите личные качества сотрудника..."
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

              {/* Вопрос 4: Личный вклад */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                  4. Какой личный вклад можешь выделить в результатах сотрудника
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
                  value={evaluationForm.personal_contribution_comment}
                  onChange={(e) => setEvaluationForm({...evaluationForm, personal_contribution_comment: e.target.value})}
                  placeholder="Опишите личный вклад сотрудника..."
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

              {/* Вопрос 5: Качество взаимодействия */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                  5. Оцени качество взаимодействия по общей оценке коллег
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
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '4px' }}>
                    <strong>Балл:</strong> 0-10
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>0</span>
                  <span style={{ color: 'var(--wink-orange)', fontSize: '16px', fontWeight: '600' }}>
                    {evaluationForm.interaction_quality_rating}
                  </span>
                  <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaluationForm.interaction_quality_rating}
                  onChange={(e) => setEvaluationForm({...evaluationForm, interaction_quality_rating: parseInt(e.target.value)})}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Вопрос 6: Рекомендации по улучшению */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)' }}>
                  6. "Что ты порекомендуешь улучшить сотруднику в следующем цикле"
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
                  value={evaluationForm.improvement_suggestions}
                  onChange={(e) => setEvaluationForm({...evaluationForm, improvement_suggestions: e.target.value})}
                  placeholder="Опишите рекомендации по улучшению..."
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

              {/* Общий рейтинг */}
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)', fontSize: '16px', fontWeight: '600' }}>
                  Какой общий рейтинг ты можешь выделить для сотрудника
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
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '4px' }}>
                    <strong>Балл:</strong> 0-10
                  </p>
                  <p style={{ color: 'var(--wink-light-gray)', fontSize: '13px', marginTop: '8px' }}>
                    <strong>Общий балл:</strong><br/>
                    0-2 - нет результата<br/>
                    3-5 - низкий результат<br/>
                    6-8 - хороший результат<br/>
                    9-10 - сверхрезультат
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>0</span>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: 'var(--wink-orange)', fontSize: '18px', fontWeight: '600' }}>
                      {evaluationForm.overall_rating}
                    </span>
                    <div style={{ color: 'var(--wink-orange)', fontSize: '14px', marginTop: '4px' }}>
                      {getOverallRatingLabel(evaluationForm.overall_rating)}
                    </div>
                  </div>
                  <span style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaluationForm.overall_rating}
                  onChange={(e) => setEvaluationForm({...evaluationForm, overall_rating: parseInt(e.target.value)})}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Агрегирующая обратная связь */}
              <div className="form-group" style={{ 
                marginTop: '40px', 
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: 'rgba(255, 107, 0, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--wink-orange)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ 
                    display: 'block', 
                    color: 'var(--wink-orange)', 
                    fontSize: '18px', 
                    fontWeight: '700'
                  }}>
                    Общая обратная связь (итоговое резюме)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAISummary}
                    disabled={isGeneratingAI}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isGeneratingAI ? '#666' : 'var(--wink-orange)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isGeneratingAI ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isGeneratingAI ? 0.7 : 1
                    }}
                  >
                    <span>{isGeneratingAI ? '⏳' : '🤖'}</span> {isGeneratingAI ? 'Генерация...' : 'Помощь ИИ'}
                  </button>
                </div>
                <p style={{ 
                  color: 'var(--wink-light-gray)', 
                  fontSize: '14px', 
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  Напишите общее резюме вашей оценки: сильные стороны сотрудника, области для развития, 
                  ключевые рекомендации и общее впечатление от работы в этом периоде.
                </p>
                <textarea
                  value={evaluationForm.feedback_summary}
                  onChange={(e) => setEvaluationForm({...evaluationForm, feedback_summary: e.target.value})}
                  placeholder="Например: Сотрудник продемонстрировал высокие результаты в достижении целей, особенно выделяется... Рекомендую обратить внимание на развитие..."
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid var(--wink-orange)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--wink-black)',
                    color: 'var(--wink-white)',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.6'
                  }}
                />
                <p style={{ 
                  color: 'var(--wink-light-gray)', 
                  fontSize: '12px', 
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  💡 В будущем вы сможете использовать ИИ для генерации резюме на основе ваших ответов
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="submit" className="btn-primary">
                  Отправить оценку
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowEvaluationForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerEvaluation;
