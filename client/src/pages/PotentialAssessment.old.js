import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const PotentialAssessment = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Форма оценки
  const [formData, setFormData] = useState({
    professional_qualities_score: 3,
    professional_qualities_comment: '',
    personal_qualities_score: 2,
    personal_qualities_comment: '',
    took_more_responsibility: false,
    communicated_transparently: false,
    shared_knowledge: false,
    completed_task: false,
    ready_for_development: '1-2_years',
    is_successor: false,
    turnover_risk: 5
  });

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      const [cyclesData, usersData] = await Promise.all([
        api.cycles.getAll(),
        api.users.getAll()
      ]);
      
      setCycles(cyclesData);
      
      // Фильтруем только сотрудников менеджера
      const teamMembers = usersData.filter(u => u.manager_id === user.id);
      setEmployees(teamMembers);
      
      // Автоматически выбираем активный цикл
      const activeCycle = cyclesData.find(c => c.status === 'active');
      if (activeCycle) {
        setSelectedCycle(activeCycle.id);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee || !selectedCycle) {
      alert('Пожалуйста, выберите сотрудника и цикл оценки');
      return;
    }

    try {
      setLoading(true);
      
      const assessmentData = {
        ...formData,
        employee_id: parseInt(selectedEmployee),
        cycle_id: parseInt(selectedCycle)
      };

      await api.potentialAssessment.submit(assessmentData);
      
      alert('Оценка потенциала успешно сохранена!');
      
      // Сброс формы
      setFormData({
        professional_qualities_score: 3,
        professional_qualities_comment: '',
        personal_qualities_score: 2,
        personal_qualities_comment: '',
        took_more_responsibility: false,
        communicated_transparently: false,
        shared_knowledge: false,
        completed_task: false,
        ready_for_development: '1-2_years',
        is_successor: false,
        turnover_risk: 5
      });
      setSelectedEmployee('');
      
    } catch (error) {
      console.error('Ошибка при сохранении оценки:', error);
      alert('Ошибка при сохранении оценки');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceTotal = () => {
    const prof = formData.professional_qualities_score || 0;
    const pers = formData.personal_qualities_score || 0;
    return prof + pers;
  };

  const calculatePotentialTotal = () => {
    let total = 0;
    if (formData.took_more_responsibility) total += 1;
    if (formData.communicated_transparently) total += 1;
    if (formData.shared_knowledge) total += 1;
    if (formData.completed_task) total += 1;
    if (formData.is_successor) total += 1;
    
    // Готовность к развитию
    if (formData.ready_for_development === '1-2_years') total += 2;
    else if (formData.ready_for_development === '3_years') total += 1;
    // '3_plus_years' = 0
    
    return total;
  };

  const selectedEmployeeData = employees.find(e => e.id === parseInt(selectedEmployee));

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
              <p>Детальная оценка по профессиональным и личным качествам, потенциалу и результативности</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          {/* Преамбула */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)',
            border: '1px solid var(--wink-orange)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: 'var(--wink-orange)', marginTop: 0 }}>Инструкция по заполнению</h3>
            <p style={{ margin: '12px 0', lineHeight: '1.6' }}>
              Данный раздел необходим для общей оценки потенциала сотрудника.
              <br/>Две шкалы потенциал-результативность.
            </p>
            <p style={{ margin: '12px 0', fontWeight: '600' }}>Он складывается из следующих зон:</p>
            <ul style={{ margin: '12px 0 0 20px', lineHeight: '1.8' }}>
              <li><strong>1. Результативность</strong>
                <ul style={{ marginTop: '8px' }}>
                  <li>1. Профессиональные качества</li>
                  <li>2. Личные качества</li>
                </ul>
              </li>
              <li style={{ marginTop: '12px' }}><strong>2. Потенциал</strong></li>
              <li style={{ marginTop: '8px' }}><strong>3. Стремление развиваться и расти</strong></li>
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Выбор сотрудника и цикла */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div className="form-group">
                <label>Сотрудник *</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required
                >
                  <option value="">Выберите сотрудника</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Цикл оценки *</label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  required
                >
                  <option value="">Выберите цикл</option>
                  {cycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name} ({new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEmployeeData && (
              <div style={{
                background: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '32px',
                border: '1px solid #404040'
              }}>
                <strong style={{ color: 'var(--wink-orange)' }}>Оценка для:</strong> {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
                <br/>
                <span style={{ color: '#999' }}>{selectedEmployeeData.position} • {selectedEmployeeData.email}</span>
              </div>
            )}

            {/* Раздел 1: Результативность */}
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #404040'
            }}>
              <h2 style={{ color: 'var(--wink-orange)', marginTop: 0 }}>1. Результативность</h2>
              
              {/* Профессиональные качества */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600' }}>
                  1.1. Какие профессиональные качества проявил сотрудник за последний период работы *
                </label>
                <p style={{ color: '#999', fontSize: '14px', margin: '8px 0' }}>
                  Выпадающий список (1-5 баллов, вес = 1):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'start' }}>
                  <select
                    value={formData.professional_qualities_score}
                    onChange={(e) => setFormData({...formData, professional_qualities_score: parseInt(e.target.value)})}
                    required
                    style={{ padding: '12px' }}
                  >
                    <option value={1}>1 - Ответственность</option>
                    <option value={2}>2 - Ориентация на результат</option>
                    <option value={3}>3 - Проактивность (исследовал решение глубже, чем ожидалось)</option>
                    <option value={4}>4 - Открытое мышление (нестандартное мышление) - тестировал новые подходы</option>
                    <option value={5}>5 - Командный игрок (объединял команду, вел за собой)</option>
                  </select>
                  <textarea
                    value={formData.professional_qualities_comment}
                    onChange={(e) => setFormData({...formData, professional_qualities_comment: e.target.value})}
                    placeholder="Комментарий (необязательно)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Личные качества */}
              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ fontSize: '16px', fontWeight: '600' }}>
                  1.2. Какие личные качества проявил сотрудник за последний период работы *
                </label>
                <p style={{ color: '#999', fontSize: '14px', margin: '8px 0' }}>
                  Приходилось ли тебе за последние полгода проводить 1:1, на котором нужно было мотивировать сотрудника дополнительно по уже реализуемой задаче (1-4 балла, вес = 1):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', alignItems: 'start' }}>
                  <select
                    value={formData.personal_qualities_score}
                    onChange={(e) => setFormData({...formData, personal_qualities_score: parseInt(e.target.value)})}
                    required
                    style={{ padding: '12px' }}
                  >
                    <option value={1}>1 - Не боялся брать на себя больше ответственности в задаче</option>
                    <option value={2}>2 - Выстраивал открытую прозрачную и точную коммуникацию с коллегами</option>
                    <option value={3}>3 - Оперативно делился информацией о задаче с коллегами</option>
                    <option value={4}>4 - Выстраивал работу по задаче</option>
                  </select>
                  <textarea
                    value={formData.personal_qualities_comment}
                    onChange={(e) => setFormData({...formData, personal_qualities_comment: e.target.value})}
                    placeholder="Комментарий"
                    rows={3}
                  />
                </div>
              </div>

              {/* Итого по результативности */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#1a1a1a',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <strong style={{ color: '#4caf50', fontSize: '18px' }}>
                  Результативность: {calculatePerformanceTotal()} баллов
                </strong>
                <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: '14px' }}>
                  (Профессиональные качества + Личные качества)
                </p>
              </div>
            </div>

            {/* Раздел 2: Потенциал */}
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #404040'
            }}>
              <h2 style={{ color: 'var(--wink-orange)', marginTop: 0 }}>2. Потенциал</h2>
              
              <p style={{ color: '#999', marginBottom: '20px' }}>
                Вопросы с ответами Да/Нет (каждый вопрос = 0/1 балл):
              </p>

              {/* Вопрос 3.1 */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.took_more_responsibility}
                    onChange={(e) => setFormData({...formData, took_more_responsibility: e.target.checked})}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>
                    Приходилось ли тебе за последние полгода проводить 1:1, на котором нужно было мотивировать сотрудника дополнительно по уже реализуемой задаче
                  </span>
                </label>
                <p style={{ color: '#666', fontSize: '13px', marginLeft: '32px' }}>Да/Нет (0/1 балл)</p>
              </div>

              {/* Вопрос 3.2 */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.communicated_transparently}
                    onChange={(e) => setFormData({...formData, communicated_transparently: e.target.checked})}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>
                    Знаешь ли ты о случаях, когда сотрудник не делился дисккоммуникацией с другими коллегами и это негативно сказывалось на результатах
                  </span>
                </label>
                <p style={{ color: '#666', fontSize: '13px', marginLeft: '32px' }}>Да/Нет (0/1 балл)</p>
              </div>

              {/* Вопрос 3.3 */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  Знаешь ли ты о желании сотрудника развиваться дальше (в каком треке, какие роли интересны)
                </label>
                <div style={{ marginLeft: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="development"
                      value="yes_proactive"
                      checked={formData.shared_knowledge === true}
                      onChange={() => setFormData({...formData, shared_knowledge: true})}
                      style={{ marginRight: '8px' }}
                    />
                    1) Да, хочет развиваться и проактивно себя ведет
                  </label>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="development"
                      value="yes_needs_help"
                      checked={formData.shared_knowledge === false && formData.completed_task === true}
                      onChange={() => setFormData({...formData, shared_knowledge: false, completed_task: true})}
                      style={{ marginRight: '8px' }}
                    />
                    2) Да, хочет развиваться, но сам не может идти по плану развития, нужна помощь менеджера/HR
                  </label>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="development"
                      value="not_sure"
                      checked={formData.shared_knowledge === false && formData.completed_task === false}
                      onChange={() => setFormData({...formData, shared_knowledge: false, completed_task: false})}
                      style={{ marginRight: '8px' }}
                    />
                    3) Не уверен, что есть желание развиваться
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="development"
                      value="no"
                      checked={formData.shared_knowledge === null}
                      onChange={() => setFormData({...formData, shared_knowledge: null, completed_task: null})}
                      style={{ marginRight: '8px' }}
                    />
                    4) Не хочет
                  </label>
                </div>
                <p style={{ color: '#666', fontSize: '13px', marginLeft: '16px', marginTop: '8px' }}>
                  (0-1 балл)
                </p>
              </div>

              {/* Вопрос 3.4 */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  Считаешь ли ты сотрудника своим преемником
                </label>
                <div style={{ display: 'flex', gap: '20px', marginLeft: '16px' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="successor"
                      checked={formData.is_successor === true}
                      onChange={() => setFormData({...formData, is_successor: true})}
                      style={{ marginRight: '8px' }}
                    />
                    Да/Нет
                  </label>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="successor"
                      checked={formData.is_successor === false}
                      onChange={() => setFormData({...formData, is_successor: false})}
                      style={{ marginRight: '8px' }}
                    />
                    Нет
                  </label>
                </div>
                <p style={{ color: '#666', fontSize: '13px', marginLeft: '16px', marginTop: '8px' }}>
                  (1/0 балл)
                </p>
              </div>

              {/* Вопрос 3.5 */}
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                  Если да, когда он будет готов
                </label>
                <div style={{ marginLeft: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ready_for_development"
                      value="1-2_years"
                      checked={formData.ready_for_development === '1-2_years'}
                      onChange={(e) => setFormData({...formData, ready_for_development: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    1) через 1-2 года
                  </label>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ready_for_development"
                      value="3_years"
                      checked={formData.ready_for_development === '3_years'}
                      onChange={(e) => setFormData({...formData, ready_for_development: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    2) через 3 года
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ready_for_development"
                      value="3_plus_years"
                      checked={formData.ready_for_development === '3_plus_years'}
                      onChange={(e) => setFormData({...formData, ready_for_development: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    3) через 3 и более лет
                  </label>
                </div>
                <p style={{ color: '#666', fontSize: '13px', marginLeft: '16px', marginTop: '8px' }}>
                  1-2 года = 2 балла, 3 года = 1 балл, 3 и более лет = 0 баллов
                </p>
              </div>

              {/* Итого по потенциалу */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#1a1a1a',
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3'
              }}>
                <strong style={{ color: '#2196f3', fontSize: '18px' }}>
                  Потенциал: {calculatePotentialTotal()} баллов
                </strong>
                <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: '14px' }}>
                  (Сумма баллов по всем вопросам о потенциале)
                </p>
              </div>
            </div>

            {/* Раздел 3: Риск ухода */}
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #404040'
            }}>
              <h2 style={{ color: 'var(--wink-orange)', marginTop: 0 }}>3. Дополнительная информация</h2>
              
              <div className="form-group">
                <label style={{ fontSize: '16px', fontWeight: '600' }}>
                  Как ты оцениваешь степень риска ухода сотрудника, где 0 - нет риска, 10 - высокая степень риска ухода даже в этом году
                </label>
                <p style={{ color: '#999', fontSize: '14px', margin: '8px 0' }}>
                  Шкала от 0 до 10:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.turnover_risk}
                    onChange={(e) => setFormData({...formData, turnover_risk: parseInt(e.target.value)})}
                    style={{ flex: 1 }}
                  />
                  <div style={{
                    background: '#1a1a1a',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    minWidth: '60px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: formData.turnover_risk >= 8 ? '#f44336' : 
                           formData.turnover_risk >= 4 ? '#ff9800' : '#4caf50'
                  }}>
                    {formData.turnover_risk}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: '#666' }}>
                  <span>0-2: низкий риск (3 балла)</span>
                  <span>3-5: средний риск (2 балла)</span>
                  <span>6-7: повышенный риск (1 балл)</span>
                  <span>8-10: высокий риск (0 баллов)</span>
                </div>
              </div>
            </div>

            {/* Итоговый блок */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(247, 147, 30, 0.2) 100%)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '2px solid var(--wink-orange)'
            }}>
              <h2 style={{ color: 'var(--wink-orange)', marginTop: 0 }}>Итоговая оценка</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{
                  background: '#1a1a1a',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#4caf50', fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {calculatePerformanceTotal()}
                  </div>
                  <div style={{ color: '#999' }}>Результативность</div>
                </div>
                
                <div style={{
                  background: '#1a1a1a',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#2196f3', fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {calculatePotentialTotal()}
                  </div>
                  <div style={{ color: '#999' }}>Потенциал</div>
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/manager')}
                className="btn-secondary"
                style={{ padding: '12px 24px' }}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedEmployee || !selectedCycle}
                style={{ padding: '12px 24px' }}
              >
                {loading ? 'Сохранение...' : 'Сохранить оценку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PotentialAssessment;
