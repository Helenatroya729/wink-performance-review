import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const PotentialAssessment = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { employeeId, periodId } = useParams(); // Получаем параметры из URL
  const [readyEmployees, setReadyEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Форма оценки с правильной структурой
  const [formData, setFormData] = useState({
    // Профессиональные качества (5 чекбоксов)
    prof_responsibility: false,
    prof_result_oriented: false,
    prof_proactivity: false,
    prof_open_mindset: false,
    prof_team_player: false,
    professional_comment: '',
    
    // Личные качества (4 чекбокса)
    pers_took_responsibility: false,
    pers_transparent_communication: false,
    pers_shared_info: false,
    pers_organized_work: false,
    personal_comment: '',
    
    // Вопросы потенциала
    had_motivation_one_on_one: false,
    knows_miscommunication_cases: false,
    development_desire: 'proactive',
    is_successor: false,
    successor_ready_timing: '1-2_years',
    turnover_risk: 5,
    ole_priority_1: '',
    ole_priority_2: ''
  });

  const loadReadyEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.get('/potential-assessment/ready-employees');
      setReadyEmployees(data);
    } catch (error) {
      console.error('Ошибка загрузки готовых сотрудников:', error);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadyEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Автоматически выбираем сотрудника, если передан в URL
  useEffect(() => {
    if (employeeId && periodId && readyEmployees.length > 0) {
      const employee = readyEmployees.find(
        emp => emp.employee_id === parseInt(employeeId) && emp.period_id === parseInt(periodId)
      );
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [employeeId, periodId, readyEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      alert('Пожалуйста, выберите сотрудника');
      return;
    }

    try {
      setLoading(true);
      
      const assessmentData = {
        ...formData,
        employee_id: selectedEmployee.employee_id,
        cycle_id: selectedEmployee.cycle_id
      };

      const response = await api.potentialAssessment.submit(assessmentData);
      
      alert(`Оценка потенциала успешно сохранена и отправлена!\n\nРезультативность: ${response.performance_raw_score} баллов (оценка: ${response.performance_final_score}★)\nПотенциал: ${response.potential_raw_score} баллов (оценка: ${response.potential_final_score}★)\n\nСтатус сотрудника обновлен на: Ожидает калькуляции`);
      
      // Перенаправляем на главную страницу
      navigate('/manager');
      
    } catch (error) {
      console.error('Ошибка при сохранении оценки:', error);
      alert('Ошибка при сохранении оценки');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceScore = () => {
    let score = 0;
    // Профессиональные качества (позитивные, +1 за каждое)
    if (formData.prof_responsibility) score += 1;
    if (formData.prof_result_oriented) score += 1;
    if (formData.prof_proactivity) score += 1;
    if (formData.prof_open_mindset) score += 1;
    if (formData.prof_team_player) score += 1;
    
    // Дискоммуникация (негативный, +1 если НЕТ проблем = галочка НЕ стоит)
    if (!formData.knows_miscommunication_cases) score += 1;
    
    // ОЛЭ приоритеты
    if (formData.ole_priority_1) score += 1;
    if (formData.ole_priority_2) score += 1;
    
    return score;
  };

  const calculatePotentialScore = () => {
    let score = 0;
    
    // Личные качества (позитивные, +1 если галочка СТОИТ = качество проявлено)
    if (formData.pers_took_responsibility) score += 1;
    if (formData.pers_transparent_communication) score += 1;
    if (formData.pers_shared_info) score += 1;
    if (formData.pers_organized_work) score += 1;
    
    // Мотивация 1:1 (негативный, +1 если НЕ приходилось = галочка НЕ стоит)
    if (!formData.had_motivation_one_on_one) score += 1;
    
    // Желание развиваться
    if (formData.development_desire === 'proactive' || formData.development_desire === 'needs_help') score += 1;
    
    // Преемник
    if (formData.is_successor) score += 1;
    
    // Готовность
    if (formData.successor_ready_timing === '1-2_years') score += 2;
    else if (formData.successor_ready_timing === '3_years') score += 1;
    
    // Риск ухода
    const risk = formData.turnover_risk;
    if (risk <= 2) score += 3;
    else if (risk <= 5) score += 2;
    else if (risk <= 7) score += 1;
    
    return score;
  };

  const getPerformanceFinalScore = (raw) => {
    if (raw >= 8) return 3;
    if (raw >= 5) return 2;
    if (raw >= 4) return 1;
    return 0; // меньше 4 баллов = 0★
  };

  const getPotentialFinalScore = (raw) => {
    if (raw >= 8) return 2; // максимум 2★ (максимум 12 баллов)
    if (raw >= 1) return 1;
    return 0; // 0 баллов = 0★
  };

  const getRiskColor = (risk) => {
    if (risk <= 2) return '#4caf50'; // зеленый
    if (risk <= 5) return '#ff9800'; // оранжевый
    if (risk <= 7) return '#ff9800'; // оранжевый
    return '#f44336'; // красный
  };

  const getRiskLabel = (risk) => {
    if (risk <= 2) return 'Низкий риск (3 балла)';
    if (risk <= 5) return 'Средний риск (2 балла)';
    if (risk <= 7) return 'Повышенный риск (1 балл)';
    return 'Высокий риск (0 баллов)';
  };

  const perfRaw = calculatePerformanceScore();
  const potRaw = calculatePotentialScore();
  const perfFinal = getPerformanceFinalScore(perfRaw);
  const potFinal = getPotentialFinalScore(potRaw);

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button 
              onClick={() => navigate('/manager')} 
              className="btn-back"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              ← Назад
            </button>
            <div>
              <h1>Оценка потенциала сотрудника</h1>
              <p>Детальная оценка по двум шкалам: результативность и потенциал</p>
            </div>
          </div>
        </div>

        {/* Список готовых сотрудников */}
        {!selectedEmployee ? (
          <div className="section-card">
            <h2 className="section-title">Готовые к оценке потенциала</h2>
            
            {loading ? (
              <p style={{ color: 'var(--wink-light-gray)', textAlign: 'center', padding: '40px' }}>Загрузка...</p>
            ) : readyEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--wink-light-gray)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⭐</div>
                <h3 style={{ marginBottom: '12px', color: 'var(--wink-white)' }}>Никто не готов к оценке потенциала</h3>
                <p style={{ marginBottom: '8px' }}>
                  Сотрудник готов к оценке потенциала когда:
                </p>
                <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '16px', lineHeight: '1.8' }}>
                  <li>Период Performance Review в процессе</li>
                  <li>Самооценка завершена</li>
                  <li>Получено минимум 3 отзыва от коллег</li>
                  <li>Оценка по целям завершена руководителем</li>
                </ul>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--wink-light-gray)', marginBottom: '24px' }}>
                  Эти сотрудники прошли оценку по целям и готовы к оценке потенциала
                </p>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {readyEmployees.map((emp) => (
                    <div 
                      key={`${emp.employee_id}-${emp.cycle_id}`}
                      style={{
                        padding: '20px',
                        border: '1px solid var(--wink-medium-gray)',
                        borderRadius: '12px',
                        backgroundColor: 'var(--wink-dark-gray)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setSelectedEmployee(emp)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--wink-orange)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--wink-medium-gray)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ marginBottom: '8px', color: 'var(--wink-white)' }}>
                            {emp.employee_name}
                          </h3>
                          <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginBottom: '4px' }}>
                            {emp.position}
                          </p>
                          <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px' }}>
                            {emp.cycle_name}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--wink-green)', fontSize: '14px', marginBottom: '4px' }}>
                            ✅ Оценка по целям завершена
                          </div>
                          <div style={{ color: 'var(--wink-orange)', fontSize: '14px' }}>
                            ⏳ Ожидает оценки потенциала
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="section-card">
            {/* Преамбула */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)',
              border: '1px solid var(--wink-orange)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: 'var(--wink-orange)', marginTop: 0 }}>📋 Что важно учесть</h3>
              <p style={{ margin: '12px 0', lineHeight: '1.6' }}>
                Данный раздел необходим для общей оценки потенциала сотрудника.
                <br/>Две шкалы: <strong>потенциал-результативность</strong>
              </p>
              <p style={{ margin: '12px 0', fontWeight: '600' }}>Он складывается из следующих зон:</p>
              <ol style={{ margin: '12px 0 0 20px', lineHeight: '1.8' }}>
                <li><strong>Результативность</strong>
                  <ul style={{ marginTop: '8px' }}>
                    <li>Профессиональные качества (5 вопросов)</li>
                    <li>Личные качества (4 вопроса)</li>
                  </ul>
                </li>
                <li style={{ marginTop: '12px' }}><strong>Потенциал</strong> (6 вопросов + приоритеты ОЛЭ)</li>
                <li style={{ marginTop: '8px' }}><strong>Стремление развиваться и расти</strong></li>
              </ol>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Информация о выбранном сотруднике */}
              <div style={{ 
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{selectedEmployee.employee_name}</h3>
                  <p style={{ margin: '0', color: '#666' }}>{selectedEmployee.position}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#888' }}>
                    Цикл: {selectedEmployee.cycle_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setFormData({
                      prof_responsibility: false,
                      prof_result_oriented: false,
                      prof_proactivity: false,
                      prof_open_mindset: false,
                      prof_team_player: false,
                      professional_comment: '',
                      pers_took_responsibility: false,
                      pers_transparent_communication: false,
                      pers_shared_info: false,
                      pers_organized_work: false,
                      personal_comment: '',
                      had_motivation_one_on_one: false,
                      knows_miscommunication_cases: false,
                      development_desire: 'proactive',
                      is_successor: false,
                      successor_ready_timing: '1-2_years',
                      turnover_risk: 5,
                      ole_priority_1: '',
                      ole_priority_2: ''
                    });
                  }}
                  className="btn-secondary"
                >
                  ← Вернуться к списку
                </button>
              </div>

              {/* РАЗДЕЛ 1: РЕЗУЛЬТАТИВНОСТЬ */}
              <div style={{
                background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid #404040'
              }}>
                <h2 style={{ color: 'var(--wink-orange)', marginTop: 0, marginBottom: '24px' }}>
                  1. Результативность (максимум 8 баллов)
                </h2>
              
              {/* Профессиональные качества */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>
                  1.1. Какие профессиональные качества проявил сотрудник за последний период работы
                </h3>
                <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
                  Отметьте все подходящие качества (по 1 баллу за каждое):
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.prof_responsibility}
                      onChange={(e) => setFormData({...formData, prof_responsibility: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ flex: 1 }}>1. Ответственность</span>
                    <span style={{ color: '#4caf50', fontSize: '14px' }}>+1 балл</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.prof_result_oriented}
                      onChange={(e) => setFormData({...formData, prof_result_oriented: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ flex: 1 }}>2. Ориентация на результат</span>
                    <span style={{ color: '#4caf50', fontSize: '14px' }}>+1 балл</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.prof_proactivity}
                      onChange={(e) => setFormData({...formData, prof_proactivity: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ flex: 1 }}>3. Проактивность (исследовал решение глубже, чем ожидалось)</span>
                    <span style={{ color: '#4caf50', fontSize: '14px' }}>+1 балл</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.prof_open_mindset}
                      onChange={(e) => setFormData({...formData, prof_open_mindset: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ flex: 1 }}>4. Открытое мышление (нестандартное мышление) - тестировал новые подходы</span>
                    <span style={{ color: '#4caf50', fontSize: '14px' }}>+1 балл</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.prof_team_player}
                      onChange={(e) => setFormData({...formData, prof_team_player: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ flex: 1 }}>5. Командный игрок (объединял команду, вел за собой)</span>
                    <span style={{ color: '#4caf50', fontSize: '14px' }}>+1 балл</span>
                  </label>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Комментарий к профессиональным качествам (необязательно)</label>
                  <textarea
                    value={formData.professional_comment}
                    onChange={(e) => setFormData({...formData, professional_comment: e.target.value})}
                    placeholder="Дополнительные комментарии..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Вопрос 3.2 - НЕГАТИВНЫЙ (галочка = проблема была = 0 баллов) */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>
                  1.2. Дискоммуникация (вопрос 3.2)
                </h3>
                <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
                  Негативный индикатор - если есть проблема (галочка стоит) = 0 баллов, если нет проблемы = +1 балл
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.knows_miscommunication_cases}
                      onChange={(e) => setFormData({...formData, knows_miscommunication_cases: e.target.checked})}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>
                        Знаешь ли ты о случаях, когда сотрудник не делился дискоммуникацией с другими коллегами и это негативно сказывалось на результатах
                      </span>
                      <span style={{ color: '#666', fontSize: '13px' }}>Негативный: Да = 0 баллов, Нет = +1 балл</span>
                    </div>
                    {!formData.knows_miscommunication_cases && <span style={{ color: '#4caf50', fontSize: '14px' }}>+1</span>}
                    {formData.knows_miscommunication_cases && <span style={{ color: '#f44336', fontSize: '14px' }}>0</span>}
                  </label>
                </div>
              </div>

              {/* ОЛЭ приоритеты (вопросы 3.7 и 3.8) */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>
                  1.3. ОЛЭ приоритеты (вопросы 3.7 и 3.8)
                </h3>
                <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
                  По 1 баллу за каждый заполненный приоритет (максимум 2 балла)
                </p>

                <div className="form-group">
                  <label>3.7. ОЛЭ приоритет 1 (необязательно)</label>
                  <input
                    type="text"
                    value={formData.ole_priority_1}
                    onChange={(e) => setFormData({...formData, ole_priority_1: e.target.value})}
                    placeholder="Первый приоритет ОЛЭ"
                  />
                  {formData.ole_priority_1 && <span style={{ color: '#4caf50', fontSize: '14px', marginTop: '4px', display: 'inline-block' }}>+1 балл</span>}
                </div>

                <div className="form-group">
                  <label>3.8. ОЛЭ приоритет 2 (необязательно)</label>
                  <input
                    type="text"
                    value={formData.ole_priority_2}
                    onChange={(e) => setFormData({...formData, ole_priority_2: e.target.value})}
                    placeholder="Второй приоритет ОЛЭ"
                  />
                  {formData.ole_priority_2 && <span style={{ color: '#4caf50', fontSize: '14px', marginTop: '4px', display: 'inline-block' }}>+1 балл</span>}
                </div>
              </div>
            </div>

            {/* РАЗДЕЛ 2: ПОТЕНЦИАЛ */}
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #404040'
            }}>
              <h2 style={{ color: 'var(--wink-orange)', marginTop: 0, marginBottom: '24px' }}>
                2. Потенциал (максимум 12 баллов)
              </h2>
              
              {/* Вопрос 2: Личные качества - НЕГАТИВНЫЕ (галочка = проблема = 0 баллов) */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>
                  2.1. Какие личные качества проявлял сотрудник за последний период работы
                </h3>
                <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
                  <strong style={{ color: '#f44336' }}>⚠️ НЕГАТИВНЫЕ ИНДИКАТОРЫ:</strong> Если галочка стоит = проблема была = <strong>0 баллов</strong>, если не стоит = нет проблемы = <strong>+1 балл</strong>
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.pers_took_responsibility}
                      onChange={(e) => setFormData({...formData, pers_took_responsibility: e.target.checked})}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>
                        1. Боялся брать на себя больше ответственности в задаче
                      </span>
                      <span style={{ color: '#666', fontSize: '13px' }}>Негативный: Да (проблема была) = 0 баллов, Нет = +1 балл</span>
                    </div>
                    {!formData.pers_took_responsibility && <span style={{ color: '#4caf50', fontSize: '14px' }}>+1</span>}
                    {formData.pers_took_responsibility && <span style={{ color: '#f44336', fontSize: '14px' }}>0</span>}
                  </label>

                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.pers_transparent_communication}
                      onChange={(e) => setFormData({...formData, pers_transparent_communication: e.target.checked})}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>
                        2. НЕ выстраивал открытую прозрачную и точную коммуникацию с коллегами
                      </span>
                      <span style={{ color: '#666', fontSize: '13px' }}>Негативный: Да (проблема была) = 0 баллов, Нет = +1 балл</span>
                    </div>
                    {!formData.pers_transparent_communication && <span style={{ color: '#4caf50', fontSize: '14px' }}>+1</span>}
                    {formData.pers_transparent_communication && <span style={{ color: '#f44336', fontSize: '14px' }}>0</span>}
                  </label>

                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.pers_shared_info}
                      onChange={(e) => setFormData({...formData, pers_shared_info: e.target.checked})}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>
                        3. НЕ делился оперативно информацией о задаче с коллегами
                      </span>
                      <span style={{ color: '#666', fontSize: '13px' }}>Негативный: Да (проблема была) = 0 баллов, Нет = +1 балл</span>
                    </div>
                    {!formData.pers_shared_info && <span style={{ color: '#4caf50', fontSize: '14px' }}>+1</span>}
                    {formData.pers_shared_info && <span style={{ color: '#f44336', fontSize: '14px' }}>0</span>}
                  </label>

                  <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.pers_organized_work}
                      onChange={(e) => setFormData({...formData, pers_organized_work: e.target.checked})}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>
                        4. НЕ выстраивал работу по задаче должным образом
                      </span>
                      <span style={{ color: '#666', fontSize: '13px' }}>Негативный: Да (проблема была) = 0 баллов, Нет = +1 балл</span>
                    </div>
                    {!formData.pers_organized_work && <span style={{ color: '#4caf50', fontSize: '14px' }}>+1</span>}
                    {formData.pers_organized_work && <span style={{ color: '#f44336', fontSize: '14px' }}>0</span>}
                  </label>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Комментарий к личным качествам (необязательно)</label>
                  <textarea
                    value={formData.personal_comment}
                    onChange={(e) => setFormData({...formData, personal_comment: e.target.value})}
                    placeholder="Дополнительные комментарии..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Вопрос 3.1 - НЕГАТИВНЫЙ (галочка = проблема была = 0 баллов) */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#1a1a1a', borderRadius: '6px' }}>
                  <input
                    type="checkbox"
                    checked={formData.had_motivation_one_on_one}
                    onChange={(e) => setFormData({...formData, had_motivation_one_on_one: e.target.checked})}
                    style={{ width: '20px', height: '20px', marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', marginBottom: '4px' }}>
                      <strong>3.1.</strong> Приходилось ли тебе за последние полгода проводить 1:1, на котором нужно было мотивировать сотрудника дополнительно по уже реализуемой задаче
                    </span>
                    <span style={{ color: '#666', fontSize: '13px' }}>Негативный индикатор: Да = 0 баллов, Нет = +1 балл</span>
                  </div>
                  {!formData.had_motivation_one_on_one && <span style={{ color: '#4caf50', fontSize: '14px' }}>+1</span>}
                  {formData.had_motivation_one_on_one && <span style={{ color: '#f44336', fontSize: '14px' }}>0</span>}
                </label>
              </div>

              {/* Вопрос 3.2 - переехал в РЕЗУЛЬТАТИВНОСТЬ */}

              {/* Вопрос 3.3 */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  <strong>3.3.</strong> Знаешь ли ты о желании сотрудника развиваться дальше (в каком треке, какие роли интересны)
                </label>
                <div style={{ marginLeft: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', padding: '10px', background: formData.development_desire === 'proactive' ? '#1a3a1a' : '#1a1a1a', borderRadius: '6px', border: formData.development_desire === 'proactive' ? '1px solid #4caf50' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="development"
                      value="proactive"
                      checked={formData.development_desire === 'proactive'}
                      onChange={() => setFormData({...formData, development_desire: 'proactive'})}
                      style={{ marginRight: '8px' }}
                    />
                    1) Да, хочет развиваться и проактивно себя ведет <span style={{ color: '#4caf50' }}>(+1 балл)</span>
                  </label>
                  <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', padding: '10px', background: formData.development_desire === 'needs_help' ? '#1a3a1a' : '#1a1a1a', borderRadius: '6px', border: formData.development_desire === 'needs_help' ? '1px solid #4caf50' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="development"
                      value="needs_help"
                      checked={formData.development_desire === 'needs_help'}
                      onChange={() => setFormData({...formData, development_desire: 'needs_help'})}
                      style={{ marginRight: '8px' }}
                    />
                    2) Да, хочет развиваться, но сам не может идти по плану развития, нужна помощь менеджера/HR <span style={{ color: '#4caf50' }}>(+1 балл)</span>
                  </label>
                  <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', padding: '10px', background: formData.development_desire === 'not_sure' ? '#3a1a1a' : '#1a1a1a', borderRadius: '6px', border: formData.development_desire === 'not_sure' ? '1px solid #666' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="development"
                      value="not_sure"
                      checked={formData.development_desire === 'not_sure'}
                      onChange={() => setFormData({...formData, development_desire: 'not_sure'})}
                      style={{ marginRight: '8px' }}
                    />
                    3) Не уверен, что есть желание развиваться <span style={{ color: '#999' }}>(0 баллов)</span>
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer', padding: '10px', background: formData.development_desire === 'no' ? '#3a1a1a' : '#1a1a1a', borderRadius: '6px', border: formData.development_desire === 'no' ? '1px solid #666' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="development"
                      value="no"
                      checked={formData.development_desire === 'no'}
                      onChange={() => setFormData({...formData, development_desire: 'no'})}
                      style={{ marginRight: '8px' }}
                    />
                    4) Не хочет <span style={{ color: '#999' }}>(0 баллов)</span>
                  </label>
                </div>
              </div>

              {/* Вопрос 3.4 */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  <strong>3.4.</strong> Считаешь ли ты сотрудника своим преемником
                </label>
                <div style={{ display: 'flex', gap: '20px', marginLeft: '16px' }}>
                  <label style={{ cursor: 'pointer', padding: '10px 20px', background: formData.is_successor ? '#1a3a1a' : '#1a1a1a', borderRadius: '6px', border: formData.is_successor ? '1px solid #4caf50' : '1px solid #404040' }}>
                    <input
                      type="radio"
                      name="successor"
                      checked={formData.is_successor === true}
                      onChange={() => setFormData({...formData, is_successor: true})}
                      style={{ marginRight: '8px' }}
                    />
                    Да <span style={{ color: '#4caf50' }}>(+1 балл)</span>
                  </label>
                  <label style={{ cursor: 'pointer', padding: '10px 20px', background: !formData.is_successor ? '#3a1a1a' : '#1a1a1a', borderRadius: '6px', border: !formData.is_successor ? '1px solid #666' : '1px solid #404040' }}>
                    <input
                      type="radio"
                      name="successor"
                      checked={formData.is_successor === false}
                      onChange={() => setFormData({...formData, is_successor: false})}
                      style={{ marginRight: '8px' }}
                    />
                    Нет <span style={{ color: '#999' }}>(0 баллов)</span>
                  </label>
                </div>
              </div>

              {/* Вопрос 3.5 */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  <strong>3.5.</strong> Если да, когда он будет готов
                </label>
                <div style={{ marginLeft: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', padding: '10px', background: formData.successor_ready_timing === '1-2_years' ? '#1a3a1a' : '#1a1a1a', borderRadius: '6px', border: formData.successor_ready_timing === '1-2_years' ? '1px solid #4caf50' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="ready_timing"
                      value="1-2_years"
                      checked={formData.successor_ready_timing === '1-2_years'}
                      onChange={(e) => setFormData({...formData, successor_ready_timing: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    1) через 1-2 года <span style={{ color: '#4caf50' }}>(+2 балла)</span>
                  </label>
                  <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', padding: '10px', background: formData.successor_ready_timing === '3_years' ? '#1a3a1a' : '#1a1a1a', borderRadius: '6px', border: formData.successor_ready_timing === '3_years' ? '1px solid #4caf50' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="ready_timing"
                      value="3_years"
                      checked={formData.successor_ready_timing === '3_years'}
                      onChange={(e) => setFormData({...formData, successor_ready_timing: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    2) через 3 года <span style={{ color: '#4caf50' }}>(+1 балл)</span>
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer', padding: '10px', background: formData.successor_ready_timing === '3_plus_years' ? '#3a1a1a' : '#1a1a1a', borderRadius: '6px', border: formData.successor_ready_timing === '3_plus_years' ? '1px solid #666' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="ready_timing"
                      value="3_plus_years"
                      checked={formData.successor_ready_timing === '3_plus_years'}
                      onChange={(e) => setFormData({...formData, successor_ready_timing: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    3) через 3 и более лет <span style={{ color: '#999' }}>(0 баллов)</span>
                  </label>
                </div>
              </div>

              {/* Вопрос 3.6 - Риск ухода */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  <strong>3.6.</strong> Как ты оцениваешь степень риска ухода сотрудника, где 0 - нет риска, 10 - высокая степень риска ухода даже в этом году
                </label>
                <div style={{ 
                  padding: '20px', 
                  background: '#1a1a1a', 
                  borderRadius: '8px',
                  border: `2px solid ${getRiskColor(formData.turnover_risk)}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: getRiskColor(formData.turnover_risk), fontSize: '24px', fontWeight: 'bold' }}>
                      {formData.turnover_risk}
                    </span>
                    <span style={{ color: getRiskColor(formData.turnover_risk), fontSize: '16px' }}>
                      {getRiskLabel(formData.turnover_risk)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.turnover_risk}
                    onChange={(e) => setFormData({...formData, turnover_risk: parseInt(e.target.value)})}
                    style={{ 
                      width: '100%',
                      height: '8px',
                      background: `linear-gradient(to right, #4caf50 0%, #4caf50 20%, #ff9800 20%, #ff9800 70%, #f44336 70%, #f44336 100%)`
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    <span>0</span>
                    <span>2</span>
                    <span>5</span>
                    <span>7</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Итого по потенциалу */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: '#1a1a1a',
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#2196f3', fontSize: '20px' }}>
                      Потенциал: {potRaw} / 12 баллов
                    </strong>
                    <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: '14px' }}>
                      Итоговая оценка: {potFinal} {'★'.repeat(potFinal)}{'☆'.repeat(3 - potFinal)}
                      {potFinal === 1 && ' (1-7 баллов)'}
                      {potFinal === 2 && ' (8-12 баллов)'}
                    </p>
                  </div>
                  <div style={{ fontSize: '48px', color: '#2196f3' }}>
                    {potFinal}★
                  </div>
                </div>
              </div>
            </div>

            {/* Итоговая сводка */}
            <div style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '24px',
              color: '#fff'
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>Итоговая оценка</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '12px', 
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>РЕЗУЛЬТАТИВНОСТЬ</div>
                  <div style={{ fontSize: '64px', fontWeight: 'bold', lineHeight: '1' }}>{perfFinal}★</div>
                  <div style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px' }}>{perfRaw} / 8 баллов</div>
                </div>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: '12px', 
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>ПОТЕНЦИАЛ</div>
                  <div style={{ fontSize: '64px', fontWeight: 'bold', lineHeight: '1' }}>{potFinal}★</div>
                  <div style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px' }}>{potRaw} / 12 баллов</div>
                </div>
              </div>
            </div>

            {/* Кнопка отправки */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/manager')}
                style={{
                  padding: '14px 32px',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !selectedEmployee}
                style={{
                  padding: '14px 48px',
                  background: loading ? '#666' : 'linear-gradient(135deg, var(--wink-orange) 0%, #f7931e 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: (loading || !selectedEmployee) ? 0.5 : 1
                }}
              >
                {loading ? 'Отправка...' : 'Сохранить и отправить'}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
};

export default PotentialAssessment;
