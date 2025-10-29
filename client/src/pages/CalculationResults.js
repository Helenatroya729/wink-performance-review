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
  
  // Два отдельных блока рекомендаций
  const [employeeRecommendations, setEmployeeRecommendations] = useState({
    achievements: '',
    improvements: '',
    developmentPlan: ''
  });
  const [managerRecommendations, setManagerRecommendations] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

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
      
      // Загружаем детальные данные для AI (все комментарии и оценки)
      try {
        const detailedData = await api.get(`/hr/employee/${empId}/details`);
        data.details = {
          selfAssessment: detailedData.evaluations?.selfAssessment || [],
          managerEvaluation: detailedData.evaluations?.managerEvaluation || null,
          peerReviews: detailedData.evaluations?.peerReviews || [],
          potentialAssessment: detailedData.evaluations?.potentialAssessment || null
        };
        console.log('✅ Загружены детальные данные для AI:', data.details);
      } catch (detailError) {
        console.warn('⚠️ Не удалось загрузить детальные данные:', detailError);
        data.details = {};
      }
      
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

  const sendEmployeeRecommendations = async () => {
    if (!employeeRecommendations.achievements.trim() || 
        !employeeRecommendations.improvements.trim() || 
        !employeeRecommendations.developmentPlan.trim()) {
      alert('Пожалуйста, заполните все поля рекомендаций для сотрудника');
      return;
    }

    try {
      await api.post(`/hr/send-employee-recommendations/${selectedEmployeeId}`, {
        achievements: employeeRecommendations.achievements,
        improvements: employeeRecommendations.improvements,
        developmentPlan: employeeRecommendations.developmentPlan
      });
      alert('Рекомендации успешно отправлены сотруднику!');
    } catch (error) {
      console.error('Ошибка отправки рекомендаций сотруднику:', error);
      alert('Ошибка при отправке рекомендаций');
    }
  };

  const sendManagerRecommendations = async () => {
    if (!managerRecommendations.trim()) {
      alert('Пожалуйста, заполните управленческие рекомендации');
      return;
    }

    try {
      await api.post(`/hr/send-manager-recommendations/${selectedEmployeeId}`, {
        recommendations: managerRecommendations
      });
      alert('Управленческие рекомендации успешно отправлены руководителю!');
    } catch (error) {
      console.error('Ошибка отправки рекомендаций руководителю:', error);
      alert('Ошибка при отправке рекомендаций');
    }
  };

  // Генерация рекомендаций для сотрудника с помощью AI
  const generateEmployeeRecommendationsAI = async () => {
    if (!results) {
      alert('Данные сотрудника еще не загружены');
      return;
    }

    setIsLoadingAI(true);
    try {
      // Подготавливаем детальные данные для отправки в AI микросервис
      const aiRequestData = {
        employee_name: results.employee.name,
        position: results.employee.position || results.employee.role,
        
        // Баллы
        self_score: results.scores.selfScore,
        manager_score: results.scores.managerScore,
        peer_score: results.scores.peerScore,
        total_score: results.scores.totalScore,
        evaluation_status: results.employee.evaluationStatus,
        
        // Детальная самооценка - все ответы и комментарии
        self_assessment: results.details?.selfAssessment || [],
        
        // Оценка руководителя - комментарии и детали
        manager_evaluation: results.details?.managerEvaluation ? {
          performance_total: results.details.managerEvaluation.performance_total,
          professional_qualities_score: results.details.managerEvaluation.professional_qualities_score,
          personal_qualities_score: results.details.managerEvaluation.personal_qualities_score,
          comments: results.details.managerEvaluation.comments,
          manager_name: results.details.managerEvaluation.manager_name
        } : null,
        
        // Все оценки коллег - комментарии от каждого
        peer_reviews: results.details?.peerReviews || [],
        
        // Оценка потенциала (9-Box)
        potential_assessment: results.details?.potentialAssessment || null
      };

      console.log('📤 Отправка ПОЛНЫХ данных в AI микросервис:', aiRequestData);

      // Отправляем запрос в AI микросервис
      const response = await fetch('http://localhost:8000/api/results-and-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequestData)
      });

      if (!response.ok) {
        throw new Error(`AI микросервис вернул ошибку: ${response.status}`);
      }

      const aiResponse = await response.json();
      console.log('✅ Ответ от AI микросервиса:', aiResponse);

      // Парсим ответ и заполняем поля
      setEmployeeRecommendations({
        achievements: aiResponse.achievements || aiResponse.key_achievements || '',
        improvements: aiResponse.improvements || aiResponse.areas_for_improvement || '',
        developmentPlan: aiResponse.development_plan || aiResponse.plan || ''
      });

      alert('✨ Рекомендации успешно сгенерированы с помощью AI!');
    } catch (error) {
      console.error('❌ Ошибка генерации рекомендаций AI:', error);
      alert('Ошибка при генерации рекомендаций AI.\nПроверьте, что AI микросервис запущен на http://localhost:8000\n\nОшибка: ' + error.message);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Генерация управленческих рекомендаций с помощью AI
  const generateManagerRecommendationsAI = async () => {
    if (!results) {
      alert('Данные сотрудника еще не загружены');
      return;
    }

    setIsLoadingAI(true);
    try {
      // Подготавливаем детальные данные для отправки в AI микросервис
      const aiRequestData = {
        employee_name: results.employee.name,
        position: results.employee.position || results.employee.role,
        
        // Баллы
        self_score: results.scores.selfScore,
        manager_score: results.scores.managerScore,
        peer_score: results.scores.peerScore,
        total_score: results.scores.totalScore,
        evaluation_status: results.employee.evaluationStatus,
        
        // Детальная самооценка - все ответы и комментарии
        self_assessment: results.details?.selfAssessment || [],
        
        // Оценка руководителя - комментарии и детали
        manager_evaluation: results.details?.managerEvaluation ? {
          performance_total: results.details.managerEvaluation.performance_total,
          professional_qualities_score: results.details.managerEvaluation.professional_qualities_score,
          personal_qualities_score: results.details.managerEvaluation.personal_qualities_score,
          comments: results.details.managerEvaluation.comments,
          manager_name: results.details.managerEvaluation.manager_name
        } : null,
        
        // Все оценки коллег - комментарии от каждого
        peer_reviews: results.details?.peerReviews || [],
        
        // Оценка потенциала (9-Box)
        potential_assessment: results.details?.potentialAssessment || null
      };

      console.log('📤 Отправка ПОЛНЫХ данных в AI микросервис для управленческих рекомендаций:', aiRequestData);

      // Отправляем запрос в AI микросервис
      const response = await fetch('http://localhost:8000/api/steps-of-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequestData)
      });

      if (!response.ok) {
        throw new Error(`AI микросервис вернул ошибку: ${response.status}`);
      }

      const aiResponse = await response.json();
      console.log('✅ Ответ от AI микросервиса (управленческие рекомендации):', aiResponse);

      // Парсим ответ и заполняем поле
      setManagerRecommendations(aiResponse.recommendations || aiResponse.manager_steps || aiResponse.steps || '');

      alert('✨ Управленческие рекомендации успешно сгенерированы с помощью AI!');
    } catch (error) {
      console.error('❌ Ошибка генерации управленческих рекомендаций AI:', error);
      alert('Ошибка при генерации управленческих рекомендаций AI.\nПроверьте, что AI микросервис запущен на http://localhost:8000\n\nОшибка: ' + error.message);
    } finally {
      setIsLoadingAI(false);
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

        {/* Блок "Рекомендации для сотрудника" */}
        <div className="section-card" style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#FF6B00', margin: 0, fontSize: '20px' }}>
              Рекомендации для сотрудника
            </h2>
            <button
              onClick={generateEmployeeRecommendationsAI}
              disabled={isLoadingAI}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoadingAI ? '#666' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoadingAI ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isLoadingAI ? 0.7 : 1
              }}
            >
              <span>{isLoadingAI ? '⏳' : '🤖'}</span> {isLoadingAI ? 'Генерация...' : 'Помощь ИИ'}
            </button>
          </div>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '14px', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Эти рекомендации будут отправлены сотруднику для его развития и самосовершенствования.
          </p>

          {/* Ключевые достижения */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#fff', 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              Ключевые достижения
            </label>
            <textarea
              value={employeeRecommendations.achievements}
              onChange={(e) => setEmployeeRecommendations({
                ...employeeRecommendations,
                achievements: e.target.value
              })}
              placeholder="Например: Успешно завершил проект X, показал высокие результаты в области Y..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '15px',
                backgroundColor: '#2a2a2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Области для улучшения */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#fff', 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              Области для улучшения
            </label>
            <textarea
              value={employeeRecommendations.improvements}
              onChange={(e) => setEmployeeRecommendations({
                ...employeeRecommendations,
                improvements: e.target.value
              })}
              placeholder="Например: Рекомендуется усилить навыки коммуникации, развить управленческие компетенции..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '15px',
                backgroundColor: '#2a2a2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* План развития */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#fff', 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}>
              План развития
            </label>
            <textarea
              value={employeeRecommendations.developmentPlan}
              onChange={(e) => setEmployeeRecommendations({
                ...employeeRecommendations,
                developmentPlan: e.target.value
              })}
              placeholder="Например: Пройти тренинг по лидерству, участвовать в кросс-функциональных проектах..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '15px',
                backgroundColor: '#2a2a2a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '15px', alignItems: 'center' }}>
            <button
              onClick={sendEmployeeRecommendations}
              style={{
                padding: '12px 32px',
                backgroundColor: '#FF6B00',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#FFA500'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B00'}
            >
              Отправить сотруднику
            </button>
            <span style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '12px', 
              fontStyle: 'italic' 
            }}>
              Рекомендации будут доступны сотруднику в личном кабинете
            </span>
          </div>
        </div>

        {/* Блок "Управленческие рекомендации" */}
        <div className="section-card" style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#FF6B00', margin: 0, fontSize: '20px' }}>
              Управленческие рекомендации для руководителя
            </h2>
            <button
              onClick={generateManagerRecommendationsAI}
              disabled={isLoadingAI}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoadingAI ? '#666' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoadingAI ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isLoadingAI ? 0.7 : 1
              }}
            >
              <span>{isLoadingAI ? '⏳' : '🤖'}</span> {isLoadingAI ? 'Генерация...' : 'Помощь ИИ'}
            </button>
          </div>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '14px', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Эти рекомендации будут отправлены непосредственному руководителю сотрудника для принятия управленческих решений.
          </p>
          <textarea
            value={managerRecommendations}
            onChange={(e) => setManagerRecommendations(e.target.value)}
            placeholder="Например: Рекомендуется рассмотреть повышение, назначить на роль тимлида, включить в кадровый резерв, организовать дополнительное обучение..."
            style={{
              width: '100%',
              minHeight: '180px',
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
              onClick={sendManagerRecommendations}
              style={{
                padding: '12px 32px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              Отправить руководителю
            </button>
            <span style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '12px', 
              fontStyle: 'italic' 
            }}>
              Рекомендации будут доступны руководителю в его дашборде
            </span>
          </div>
        </div>

        {/* Блок "Подведение итогов" (старый блок, оставляем для общих заметок) */}
        <div className="section-card" style={{ marginBottom: '25px' }}>
          <h2 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '20px' }}>
            Общие заметки и выводы
          </h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '14px', 
            marginBottom: '15px',
            lineHeight: '1.5'
          }}>
            {user.role === 'manager' 
              ? 'Напишите ваши выводы как руководителя: итоги работы сотрудника, планы развития, ключевые рекомендации.'
              : 'Общие заметки и выводы по оценке сотрудника (для внутреннего использования).'
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
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              Сохранить заметки
            </button>
            <span style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '12px', 
              fontStyle: 'italic' 
            }}>
              Эти заметки видны только вам
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
