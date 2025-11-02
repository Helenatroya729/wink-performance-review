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
    professional_qualities_score: ,
    professional_qualities_comment: '',
    personal_qualities_score: ,
    personal_qualities_comment: '',
    took_more_responsibility: false,
    communicated_transparently: false,
    shared_knowledge: false,
    completed_task: false,
    ready_for_development: '-_years',
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
        professional_qualities_score: ,
        professional_qualities_comment: '',
        personal_qualities_score: ,
        personal_qualities_comment: '',
        took_more_responsibility: false,
        communicated_transparently: false,
        shared_knowledge: false,
        completed_task: false,
        ready_for_development: '-_years',
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
    if (formData.took_more_responsibility) total += ;
    if (formData.communicated_transparently) total += ;
    if (formData.shared_knowledge) total += ;
    if (formData.completed_task) total += ;
    if (formData.is_successor) total += ;
    
    // Готовность к развитию
    if (formData.ready_for_development === '-_years') total += ;
    else if (formData.ready_for_development === '_years') total += ;
    // '_plus_years' = 0
    
    return total;
  };

  const selectedEmployeeData = employees.find(e => e.id === parseInt(selectedEmployee));

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <button 
              onClick={() => navigate('/manager')} 
              className="btn-back"
              style={{ padding: '8px 6px', fontSize: '4px' }}
            >
              ← Назад
            </button>
            <div>
              <h>Оценка потенциала сотрудника</h>
              <p>Детальная оценка по профессиональным и личным качествам, потенциалу и результативности</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          {/* Преамбула */}
          <div style={{ 
            background: 'linear-gradient(5deg, rgba(55, 07, 5, 0.) 0%, rgba(47, 47, 0, 0.) 00%)',
            border: 'px solid var(--wink-orange)',
            borderRadius: '8px',
            padding: '0px',
            marginBottom: '4px'
          }}>
            <h style={{ color: 'var(--wink-orange)', marginTop: 0 }}>Инструкция по заполнению</h>
            <p style={{ margin: 'px 0', lineHeight: '.6' }}>
              Данный раздел необходим для общей оценки потенциала сотрудника.
              <br/>Две шкалы потенциал-результативность.
            </p>
            <p style={{ margin: 'px 0', fontWeight: '600' }}>Он складывается из следующих зон:</p>
            <ul style={{ margin: 'px 0 0 0px', lineHeight: '.8' }}>
              <li><strong>. Результативность</strong>
                <ul style={{ marginTop: '8px' }}>
                  <li>. Профессиональные качества</li>
                  <li>. Личные качества</li>
                </ul>
              </li>
              <li style={{ marginTop: 'px' }}><strong>. Потенциал</strong></li>
              <li style={{ marginTop: '8px' }}><strong>. Стремление развиваться и расти</strong></li>
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Выбор сотрудника и цикла */}
            <div style={{ display: 'grid', gridTemplateColumns: 'fr fr', gap: '0px', marginBottom: 'px' }}>
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
                background: '#aaa',
                borderRadius: '8px',
                padding: '6px',
                marginBottom: 'px',
                border: 'px solid #404040'
              }}>
                <strong style={{ color: 'var(--wink-orange)' }}>Оценка для:</strong> {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
                <br/>
                <span style={{ color: '#999' }}>{selectedEmployeeData.position} • {selectedEmployeeData.email}</span>
              </div>
            )}

            {/* Раздел : Результативность */}
            <div style={{
              background: 'linear-gradient(5deg, #aaa 0%, #fff 00%)',
              borderRadius: 'px',
              padding: '4px',
              marginBottom: '4px',
              border: 'px solid #404040'
            }}>
              <h style={{ color: 'var(--wink-orange)', marginTop: 0 }}>. Результативность</h>
              
              {/* Профессиональные качества */}
              <div className="form-group">
                <label style={{ fontSize: '6px', fontWeight: '600' }}>
                  .. Какие профессиональные качества проявил сотрудник за последний период работы *
                </label>
                <p style={{ color: '#999', fontSize: '4px', margin: '8px 0' }}>
                  Выпадающий список (-5 баллов, вес = ):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '00px fr', gap: 'px', alignItems: 'start' }}>
                  <select
                    value={formData.professional_qualities_score}
                    onChange={(e) => setFormData({...formData, professional_qualities_score: parseInt(e.target.value)})}
                    required
                    style={{ padding: 'px' }}
                  >
                    <option value={}> - Ответственность</option>
                    <option value={}> - Ориентация на результат</option>
                    <option value={}> - Проактивность (исследовал решение глубже, чем ожидалось)</option>
                    <option value={4}>4 - Открытое мышление (нестандартное мышление) - тестировал новые подходы</option>
                    <option value={5}>5 - Командный игрок (объединял команду, вел за собой)</option>
                  </select>
                  <textarea
                    value={formData.professional_qualities_comment}
                    onChange={(e) => setFormData({...formData, professional_qualities_comment: e.target.value})}
                    placeholder="Комментарий (необязательно)"
                    rows={}
                  />
                </div>
              </div>

              {/* Личные качества */}
              <div className="form-group" style={{ marginTop: '4px' }}>
                <label style={{ fontSize: '6px', fontWeight: '600' }}>
                  .. Какие личные качества проявил сотрудник за последний период работы *
                </label>
                <p style={{ color: '#999', fontSize: '4px', margin: '8px 0' }}>
                  Приходилось ли тебе за последние полгода проводить :, на котором нужно было мотивировать сотрудника дополнительно по уже реализуемой задаче (-4 балла, вес = ):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '00px fr', gap: 'px', alignItems: 'start' }}>
                  <select
                    value={formData.personal_qualities_score}
                    onChange={(e) => setFormData({...formData, personal_qualities_score: parseInt(e.target.value)})}
                    required
                    style={{ padding: 'px' }}
                  >
                    <option value={}> - Не боялся брать на себя больше ответственности в задаче</option>
                    <option value={}> - Выстраивал открытую прозрачную и точную коммуникацию с коллегами</option>
                    <option value={}> - Оперативно делился информацией о задаче с коллегами</option>
                    <option value={4}>4 - Выстраивал работу по задаче</option>
                  </select>
                  <textarea
                    value={formData.personal_qualities_comment}
                    onChange={(e) => setFormData({...formData, personal_qualities_comment: e.target.value})}
                    placeholder="Комментарий"
                    rows={}
                  />
                </div>
              </div>

              {/* Итого по результативности */}
              <div style={{
                marginTop: '4px',
                padding: '6px',
                background: '#aaa',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <strong style={{ color: '#4caf50', fontSize: '8px' }}>
                  Результативность: {calculatePerformanceTotal()} баллов
                </strong>
                <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: '4px' }}>
                  (Профессиональные качества + Личные качества)
                </p>
              </div>
            </div>

            {/* Раздел : Потенциал */}
            <div style={{
              background: 'linear-gradient(5deg, #aaa 0%, #fff 00%)',
              borderRadius: 'px',
              padding: '4px',
              marginBottom: '4px',
              border: 'px solid #404040'
            }}>
              <h style={{ color: 'var(--wink-orange)', marginTop: 0 }}>. Потенциал</h>
              
              <p style={{ color: '#999', marginBottom: '0px' }}>
                Вопросы с ответами Да/Нет (каждый вопрос = 0/ балл):
              </p>

              {/* Вопрос . */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 'px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.took_more_responsibility}
                    onChange={(e) => setFormData({...formData, took_more_responsibility: e.target.checked})}
                    style={{ width: '0px', height: '0px' }}
                  />
                  <span>
                    Приходилось ли тебе за последние полгода проводить :, на котором нужно было мотивировать сотрудника дополнительно по уже реализуемой задаче
                  </span>
                </label>
                <p style={{ color: '#666', fontSize: 'px', marginLeft: 'px' }}>Да/Нет (0/ балл)</p>
              </div>

              {/* Вопрос . */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 'px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.communicated_transparently}
                    onChange={(e) => setFormData({...formData, communicated_transparently: e.target.checked})}
                    style={{ width: '0px', height: '0px' }}
                  />
                  <span>
                    Знаешь ли ты о случаях, когда сотрудник не делился дисккоммуникацией с другими коллегами и это негативно сказывалось на результатах
                  </span>
                </label>
                <p style={{ color: '#666', fontSize: 'px', marginLeft: 'px' }}>Да/Нет (0/ балл)</p>
              </div>

              {/* Вопрос . */}
              <div className="form-group">
                <label style={{ fontSize: '6px', fontWeight: '600', marginBottom: 'px', display: 'block' }}>
                  Знаешь ли ты о желании сотрудника развиваться дальше (в каком треке, какие роли интересны)
                </label>
                <div style={{ marginLeft: '6px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="development"
                      value="yes_proactive"
                      checked={formData.shared_knowledge === true}
                      onChange={() => setFormData({...formData, shared_knowledge: true})}
                      style={{ marginRight: '8px' }}
                    />
                    ) Да, хочет развиваться и проактивно себя ведет
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
                    ) Да, хочет развиваться, но сам не может идти по плану развития, нужна помощь менеджера/HR
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
                    ) Не уверен, что есть желание развиваться
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
                <p style={{ color: '#666', fontSize: 'px', marginLeft: '6px', marginTop: '8px' }}>
                  (0- балл)
                </p>
              </div>

              {/* Вопрос .4 */}
              <div className="form-group">
                <label style={{ fontSize: '6px', fontWeight: '600', marginBottom: 'px', display: 'block' }}>
                  Считаешь ли ты сотрудника своим преемником
                </label>
                <div style={{ display: 'flex', gap: '0px', marginLeft: '6px' }}>
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
                <p style={{ color: '#666', fontSize: 'px', marginLeft: '6px', marginTop: '8px' }}>
                  (/0 балл)
                </p>
              </div>

              {/* Вопрос .5 */}
              <div className="form-group">
                <label style={{ fontSize: '6px', fontWeight: '600', marginBottom: 'px', display: 'block' }}>
                  Если да, когда он будет готов
                </label>
                <div style={{ marginLeft: '6px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ready_for_development"
                      value="-_years"
                      checked={formData.ready_for_development === '-_years'}
                      onChange={(e) => setFormData({...formData, ready_for_development: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    ) через - года
                  </label>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ready_for_development"
                      value="_years"
                      checked={formData.ready_for_development === '_years'}
                      onChange={(e) => setFormData({...formData, ready_for_development: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    ) через  года
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ready_for_development"
                      value="_plus_years"
                      checked={formData.ready_for_development === '_plus_years'}
                      onChange={(e) => setFormData({...formData, ready_for_development: e.target.value})}
                      style={{ marginRight: '8px' }}
                    />
                    ) через  и более лет
                  </label>
                </div>
                <p style={{ color: '#666', fontSize: 'px', marginLeft: '6px', marginTop: '8px' }}>
                  - года =  балла,  года =  балл,  и более лет = 0 баллов
                </p>
              </div>

              {/* Итого по потенциалу */}
              <div style={{
                marginTop: '4px',
                padding: '6px',
                background: '#aaa',
                borderRadius: '8px',
                borderLeft: '4px solid #96f'
              }}>
                <strong style={{ color: '#96f', fontSize: '8px' }}>
                  Потенциал: {calculatePotentialTotal()} баллов
                </strong>
                <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: '4px' }}>
                  (Сумма баллов по всем вопросам о потенциале)
                </p>
              </div>
            </div>

            {/* Раздел : Риск ухода */}
            <div style={{
              background: 'linear-gradient(5deg, #aaa 0%, #fff 00%)',
              borderRadius: 'px',
              padding: '4px',
              marginBottom: '4px',
              border: 'px solid #404040'
            }}>
              <h style={{ color: 'var(--wink-orange)', marginTop: 0 }}>. Дополнительная информация</h>
              
              <div className="form-group">
                <label style={{ fontSize: '6px', fontWeight: '600' }}>
                  Как ты оцениваешь степень риска ухода сотрудника, где 0 - нет риска, 0 - высокая степень риска ухода даже в этом году
                </label>
                <p style={{ color: '#999', fontSize: '4px', margin: '8px 0' }}>
                  Шкала от 0 до 0:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="range"
                    min="0"
                    max="0"
                    value={formData.turnover_risk}
                    onChange={(e) => setFormData({...formData, turnover_risk: parseInt(e.target.value)})}
                    style={{ flex:  }}
                  />
                  <div style={{
                    background: '#aaa',
                    padding: '8px 6px',
                    borderRadius: '8px',
                    minWidth: '60px',
                    textAlign: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    color: formData.turnover_risk >= 8 ? '#f446' : 
                           formData.turnover_risk >= 4 ? '#ff9800' : '#4caf50'
                  }}>
                    {formData.turnover_risk}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: 'px', color: '#666' }}>
                  <span>0-: низкий риск ( балла)</span>
                  <span>-5: средний риск ( балла)</span>
                  <span>6-7: повышенный риск ( балл)</span>
                  <span>8-0: высокий риск (0 баллов)</span>
                </div>
              </div>
            </div>

            {/* Итоговый блок */}
            <div style={{
              background: 'linear-gradient(5deg, rgba(55, 07, 5, 0.) 0%, rgba(47, 47, 0, 0.) 00%)',
              borderRadius: 'px',
              padding: '4px',
              marginBottom: '4px',
              border: 'px solid var(--wink-orange)'
            }}>
              <h style={{ color: 'var(--wink-orange)', marginTop: 0 }}>Итоговая оценка</h>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'fr fr', gap: '0px' }}>
                <div style={{
                  background: '#aaa',
                  padding: '0px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#4caf50', fontSize: '6px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {calculatePerformanceTotal()}
                  </div>
                  <div style={{ color: '#999' }}>Результативность</div>
                </div>
                
                <div style={{
                  background: '#aaa',
                  padding: '0px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#96f', fontSize: '6px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {calculatePotentialTotal()}
                  </div>
                  <div style={{ color: '#999' }}>Потенциал</div>
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: 'px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/manager')}
                className="btn-secondary"
                style={{ padding: 'px 4px' }}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedEmployee || !selectedCycle}
                style={{ padding: 'px 4px' }}
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
