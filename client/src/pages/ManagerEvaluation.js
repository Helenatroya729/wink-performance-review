import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const ManagerEvaluation = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [employeeGoals, setEmployeeGoals] = useState([]);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  
  const [evaluationForm, setEvaluationForm] = useState({
    goal_id: '',
    employee_id: '',
    cycle_id: '',
    result_achievement_rating: 5, // 0-10
    personal_qualities_comment: '', // свободный ответ
    personal_contribution_comment: '', // свободный ответ
    interaction_quality_rating: 5, // 0-10
    improvement_suggestions: '', // свободный ответ
    overall_rating: 5 // 0-10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, cyclesData] = await Promise.all([
        api.users.getAll(),
        api.cycles.getAll()
      ]);
      
      // Фильтруем только сотрудников из команды менеджера
      const teamMembers = usersData.filter(u => u.manager_id === user.id);
      setEmployees(teamMembers);
      setCycles(cyclesData.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    if (selectedCycle) {
      await loadEmployeeGoals(employee.id, selectedCycle);
    }
  };

  const handleCycleSelect = async (cycleId) => {
    setSelectedCycle(cycleId);
    if (selectedEmployee) {
      await loadEmployeeGoals(selectedEmployee.id, cycleId);
    }
  };

  const loadEmployeeGoals = async (employeeId, cycleId) => {
    try {
      const goalsData = await api.goals.getAll();
      const filtered = goalsData.filter(
        g => g.user_id === employeeId && g.cycle_id === parseInt(cycleId) && g.status === 'approved'
      );
      setEmployeeGoals(filtered);
    } catch (error) {
      console.error('Ошибка загрузки целей:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const handleStartEvaluation = (goal) => {
    setCurrentGoal(goal);
    setEvaluationForm({
      goal_id: goal.id,
      employee_id: selectedEmployee.id,
      cycle_id: parseInt(selectedCycle),
      result_achievement_rating: 5,
      personal_qualities_comment: '',
      personal_contribution_comment: '',
      interaction_quality_rating: 5,
      improvement_suggestions: '',
      overall_rating: 5
    });
    setShowEvaluationForm(true);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    try {
      await api.managerEvaluation.submit(evaluationForm);
      alert('Оценка успешно отправлена!');
      setShowEvaluationForm(false);
      setEvaluationForm({
        goal_id: '',
        employee_id: '',
        cycle_id: '',
        result_achievement_rating: 5,
        personal_qualities_comment: '',
        personal_contribution_comment: '',
        interaction_quality_rating: 5,
        improvement_suggestions: '',
        overall_rating: 5
      });
      // Перезагружаем список целей
      await loadEmployeeGoals(selectedEmployee.id, selectedCycle);
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
          <h1>Оценка сотрудников</h1>
          <button className="btn-secondary" onClick={() => navigate('/manager-dashboard')}>
            ← Назад к панели
          </button>
        </div>

        {/* Выбор сотрудника и цикла */}
        {!showEvaluationForm && (
          <div className="section-card">
            <h2 className="section-title">Выберите сотрудника и цикл оценки</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)', fontWeight: '600' }}>
                  Сотрудник
                </label>
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find(em => em.id === parseInt(e.target.value));
                    handleEmployeeSelect(emp);
                  }}
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
                  <option value="">Выберите сотрудника</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--wink-white)', fontWeight: '600' }}>
                  Цикл оценки
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => handleCycleSelect(e.target.value)}
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
            </div>

            {/* Список целей сотрудника */}
            {selectedEmployee && selectedCycle && (
              <>
                <h3 style={{ marginTop: '32px', marginBottom: '16px', color: 'var(--wink-white)' }}>
                  Цели сотрудника: {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                
                {employeeGoals.length === 0 ? (
                  <p style={{ color: 'var(--wink-light-gray)', textAlign: 'center', padding: '40px' }}>
                    У сотрудника нет утверждённых целей в этом цикле
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {employeeGoals.map(goal => (
                      <div key={goal.id} style={{
                        padding: '20px',
                        background: 'var(--wink-dark-gray)',
                        borderRadius: '12px',
                        borderLeft: '4px solid var(--wink-orange)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--wink-white)' }}>
                              {goal.title}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginTop: '8px' }}>
                              {goal.description}
                            </div>
                          </div>
                          <button
                            className="btn-primary"
                            onClick={() => handleStartEvaluation(goal)}
                          >
                            Оценить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Форма оценки */}
        {showEvaluationForm && currentGoal && (
          <div className="section-card">
            <h2 className="section-title">
              Оценка сотрудника: {selectedEmployee.first_name} {selectedEmployee.last_name}
            </h2>
            <p style={{ color: 'var(--wink-light-gray)', marginBottom: '24px' }}>
              {selectedEmployee.position} • Цикл: {cycles.find(c => c.id === parseInt(selectedCycle))?.name}
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

            {/* Отображение задачи */}
            <div style={{
              background: 'var(--wink-dark-gray)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: 'var(--wink-white)', marginBottom: '8px' }}>Оцениваемая задача:</h4>
              <p style={{ color: 'var(--wink-white)', fontSize: '16px', fontWeight: '600' }}>{currentGoal.title}</p>
              <p style={{ color: 'var(--wink-light-gray)', fontSize: '14px', marginTop: '8px' }}>{currentGoal.description}</p>
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
