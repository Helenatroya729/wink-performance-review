import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const CalculationResults = ({ user, onLogout }) => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [calculationInstructions, setCalculationInstructions] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || '');

  useEffect(() => {
    if (user.role === 'hr' || user.role === 'admin' || user.role === 'manager') {
      loadEmployees();
    }
  }, []);

  const loadEmployees = async () => {
    try {
      let data;
      if (user.role === 'manager') {
        // Для менеджера загружаем только его команду
        const allUsers = await api.users.getAll();
        const teamMembers = allUsers.filter(u => u.manager_id === user.id);
        data = teamMembers;
      } else {
        // Для HR/Admin загружаем всех
        data = await api.get('/hr/employee-scores');
      }
      
      setEmployees(data);
      if (data.length > 0) {
        const empId = employeeId || data[0].id.toString();
        setSelectedEmployeeId(empId);
        // Загружаем результаты сразу для первого сотрудника
        await loadCalculationResults(empId);
      }
    } catch (error) {
      console.error('Ошибка загрузки списка сотрудников:', error);
      setLoading(false);
    }
  };

  const loadCalculationResults = async (empId) => {
    try {
      setLoading(true);
      
      // Загружаем результаты оценки для выбранного сотрудника
      const data = await api.get(`/employee/calculation-results/${empId}`);
      setResults(data);
      
      // Загружаем инструкции (если они есть)
      setCalculationInstructions(data.instructions || 'Итоговый балл рассчитывается как среднее арифметическое из всех полученных оценок: самооценки, оценки руководителя и оценок коллег.');
      
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
      setLoading(false);
    }
  };

  const saveSummary = async () => {
    try {
      await api.post(`/employee/save-summary/${user.id}`, {
        summaryText: summaryText
      });
      alert('Итоги сохранены успешно!');
    } catch (error) {
      console.error('Ошибка сохранения итогов:', error);
      alert('Ошибка при сохранении');
    }
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(user.role === 'manager' ? '/manager-dashboard' : '/hr-dashboard')}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            backgroundColor: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#666'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#555'}
        >
          ← Назад к {user.role === 'manager' ? 'панели менеджера' : 'HR Dashboard'}
        </button>

        <h1 style={{ color: '#FF6B00', marginBottom: '30px', fontSize: '32px' }}>
          Калькуляция результатов Performance Review
        </h1>

        {/* Выбор сотрудника для HR и менеджеров */}
        {(user.role === 'hr' || user.role === 'admin' || user.role === 'manager') && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <label style={{ color: '#fff', fontSize: '16px', marginBottom: '10px', display: 'block' }}>
              {user.role === 'manager' ? 'Выберите сотрудника из вашей команды:' : 'Выберите сотрудника:'}
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedEmployeeId(newId);
                loadCalculationResults(newId);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                fontSize: '15px'
              }}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.position} {emp.total ? `(Балл: ${emp.total.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
            Загрузка результатов...
          </div>
        ) : !results ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
            Результаты оценки пока недоступны
          </div>
        ) : (
          <>

        {/* Итоговый балл - большой и заметный */}
        <div style={{
          backgroundColor: 'rgba(255,107,0,0.15)',
          padding: '40px',
          borderRadius: '12px',
          marginBottom: '30px',
          textAlign: 'center',
          border: '2px solid #FF6B00'
        }}>
          <div style={{ color: '#fff', fontSize: '18px', marginBottom: '15px' }}>
            Ваш итоговый балл
          </div>
          <div style={{ color: '#FF6B00', fontSize: '72px', fontWeight: '700', marginBottom: '10px' }}>
            {(results.totalScore || 0).toFixed(2)}
          </div>
          <div style={{ color: '#ccc', fontSize: '24px' }}>
            из 10 баллов
          </div>
          <div style={{ 
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: results.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 165, 0, 0.2)',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <span style={{ 
              color: results.status === 'completed' ? '#4CAF50' : '#FFA500',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {results.status === 'completed' ? 'Оценка завершена' : 'Оценка в процессе'}
            </span>
          </div>
        </div>

        {/* Суммирование баллов из функционала 2 */}
        <div className="section-card" style={{ marginBottom: '25px' }}>
          <h2 style={{ color: '#FF6B00', marginBottom: '20px', fontSize: '22px' }}>
            Суммирование общих баллов
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '25px'
          }}>
            {/* Самооценка */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                Самооценка
              </div>
              <div style={{ color: '#FF6B00', fontSize: '32px', fontWeight: '700' }}>
                {(results.selfScore || 0).toFixed(2)}
              </div>
              <div style={{ color: '#ccc', fontSize: '13px', marginTop: '5px' }}>
                {results.selfAssessmentCount} {results.selfAssessmentCount === 1 ? 'ответ' : 'ответов'}
              </div>
            </div>

            {/* Оценка руководителя */}
            {results.role !== 'manager' && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                  Оценка руководителя
                </div>
                <div style={{ color: '#FF6B00', fontSize: '32px', fontWeight: '700' }}>
                  {(results.managerScore && results.managerScore > 0) ? results.managerScore.toFixed(2) : '—'}
                </div>
                <div style={{ color: '#ccc', fontSize: '13px', marginTop: '5px' }}>
                  {results.managerScore > 0 ? 'Заполнено' : 'Не заполнено'}
                </div>
              </div>
            )}

            {/* Оценки коллег */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                Оценки коллег (360°)
              </div>
              <div style={{ color: '#FF6B00', fontSize: '32px', fontWeight: '700' }}>
                {(results.peerScore && results.peerScore > 0) ? results.peerScore.toFixed(2) : '—'}
              </div>
              <div style={{ color: '#ccc', fontSize: '13px', marginTop: '5px' }}>
                {results.peerReviewsCount} {results.peerReviewsCount === 1 ? 'отзыв' : 'отзывов'}
              </div>
            </div>
          </div>

          {/* Формула расчета */}
          <div style={{
            backgroundColor: 'rgba(255,107,0,0.08)',
            padding: '15px 20px',
            borderRadius: '8px',
            borderLeft: '4px solid #FF6B00'
          }}>
            <div style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
              Формула расчета итогового балла:
            </div>
            <div style={{ color: '#fff', fontSize: '15px', fontFamily: 'monospace' }}>
              ({(results.selfScore && results.selfScore > 0) ? results.selfScore.toFixed(2) : '0'} 
              {(results.managerScore && results.managerScore > 0 && results.role !== 'manager') ? ` + ${results.managerScore.toFixed(2)}` : ''} 
              {(results.peerScore && results.peerScore > 0) ? ` + ${results.peerScore.toFixed(2)}` : ''}) / {results.evaluationsCount || 1} = {(results.totalScore || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Блок инструкций "Подсчет баллов" */}
        <div className="section-card" style={{ marginBottom: '25px' }}>
          <h2 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '20px' }}>
            Подсчет баллов
          </h2>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ 
              color: '#ccc', 
              fontSize: '15px', 
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {calculationInstructions}
            </div>
          </div>
        </div>

        {/* Блок "Подведение итогов" */}
        <div className="section-card" style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#FF6B00', margin: 0, fontSize: '20px' }}>
              Подведение итогов
            </h2>
            <button
              onClick={() => alert('Функция генерации итогов с помощью ИИ будет доступна в следующей версии.\n\nИИ проанализирует все оценки и сгенерирует персонализированное резюме с рекомендациями по развитию.')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🤖</span> Помощь ИИ
            </button>
          </div>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '14px', 
            marginBottom: '15px',
            lineHeight: '1.5'
          }}>
            {user.role === 'manager' 
              ? 'Напишите ваши выводы как руководителя: итоги работы сотрудника, планы развития, ключевые рекомендации.'
              : 'Напишите итоговое резюме: планы развития, ключевые достижения и области для улучшения.'
            }
          </p>
          <textarea
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="Например: Сотрудник показал отличные результаты в области... Рекомендуется усилить навыки... План развития на следующий период..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '15px',
              backgroundColor: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '15px', alignItems: 'center' }}>
            <button
              onClick={saveSummary}
              style={{
                padding: '12px 32px',
                backgroundColor: '#FF6B00',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#FFA500'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B00'}
            >
              Сохранить итоги
            </button>
            <span style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '12px', 
              fontStyle: 'italic' 
            }}>
              💡 В будущем ИИ поможет сгенерировать итоги автоматически
            </span>
          </div>
        </div>

        {/* Детальная информация по оценкам */}
        <div className="section-card">
          <h2 style={{ color: '#FF6B00', marginBottom: '20px', fontSize: '20px' }}>
            Детальная информация по оценкам
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px' 
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#ccc', fontSize: '15px' }}>Период оценки:</span>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                {results.cycleName || 'Первое полугодие 2025'}
              </span>
            </div>
            
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#ccc', fontSize: '15px' }}>Заполнено оценок:</span>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                {results.evaluationsCount} из {results.role === 'manager' ? '2' : '3'}
              </span>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#ccc', fontSize: '15px' }}>Дата последнего обновления:</span>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                {results.lastUpdated ? new Date(results.lastUpdated).toLocaleDateString('ru-RU') : '—'}
              </span>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default CalculationResults;
