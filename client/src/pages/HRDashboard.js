import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const HRDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState([]);
  const [employeeScores, setEmployeeScores] = useState([]);
  const [nineBoxData, setNineBoxData] = useState({});
  const [calculationInstructions, setCalculationInstructions] = useState('Баллы рассчитываются как среднее арифметическое оценок: самооценки, оценки руководителя и оценок коллег.');
  const [summaryText, setSummaryText] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [recommendationText, setRecommendationText] = useState('');
  const [triggers, setTriggers] = useState([
    { word: 'лидерство', recommendation: 'Рекомендуется развитие управленческих компетенций' },
    { word: 'коммуникация', recommendation: 'Рекомендуется тренинг по эффективной коммуникации' },
    { word: 'инициатива', recommendation: 'Рекомендуется включение в кросс-функциональные проекты' }
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Модальное окно для 9-Box ячейки
  const [showNineBoxModal, setShowNineBoxModal] = useState(false);
  const [selectedBoxCategory, setSelectedBoxCategory] = useState('');
  const [selectedBoxEmployees, setSelectedBoxEmployees] = useState([]);
  
  // Фильтры для таблицы
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, in_progress, overdue, not_started
  const [sortBy, setSortBy] = useState('status'); // status, total, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  
  // Для одобрения ранних PR
  const [pendingPRRequests, setPendingPRRequests] = useState([]);
  const [showHRDecisionModal, setShowHRDecisionModal] = useState(false);
  const [currentHRRequest, setCurrentHRRequest] = useState(null);
  const [hrDecisionType, setHrDecisionType] = useState(''); // 'approve' или 'reject'
  const [hrDecisionComment, setHrDecisionComment] = useState('');

  useEffect(() => {
    loadHRData();
  }, []);

  useEffect(() => {
    if (activeTab === 'pr-approvals') {
      loadPendingPRRequests();
    }
  }, [activeTab]);

  const loadHRData = async () => {
    try {
      setLoading(true);
      
      // Загружаем аналитику
      const analyticsData = await api.get('/hr/analytics');
      
      setAnalytics([
        { id: 1, title: 'Общий охват оценки', value: analyticsData.coverage.value, trend: analyticsData.coverage.trend },
        { id: 2, title: 'Средний рейтинг по компании', value: analyticsData.avgRating.value, trend: analyticsData.avgRating.trend },
        { id: 3, title: 'Завершенных оценок', value: analyticsData.completedEvaluations.value, trend: analyticsData.completedEvaluations.trend },
        { id: 4, title: 'Планов развития', value: analyticsData.developmentPlans.value.toString(), trend: analyticsData.developmentPlans.trend }
      ]);

      // Загружаем баллы сотрудников
      console.log('🔍 Загружаем /hr/employee-scores...');
      const employeeScores = await api.get('/hr/employee-scores');
      console.log('✅ Получены данные employee-scores:', employeeScores);
      console.log('📊 Количество сотрудников:', employeeScores.length);
      setEmployeeScores(employeeScores);

      // Загружаем данные 9-Box
      const nineBoxData = await api.get('/hr/nine-box');
      setNineBoxData(nineBoxData);

      setLoading(false);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных HR:', error);
      setLoading(false);
    }
  };

  const handleAddTrigger = () => {
    if (triggerWord.trim() && recommendationText.trim()) {
      setTriggers([...triggers, { word: triggerWord.toLowerCase(), recommendation: recommendationText }]);
      setTriggerWord('');
      setRecommendationText('');
    }
  };

  const handleDeleteTrigger = (index) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };
  
  const loadPendingPRRequests = async () => {
    try {
      const requests = await api.performanceReview.getPendingRequests();
      // Фильтруем только запросы, одобренные менеджером
      const hrPending = requests.filter(r => r.status === 'manager_approved');
      setPendingPRRequests(hrPending);
    } catch (error) {
      console.error('Ошибка загрузки запросов PR:', error);
      alert('Ошибка: ' + error.message);
    }
  };
  
  const handleHRPRDecision = (request, decisionType) => {
    setCurrentHRRequest(request);
    setHrDecisionType(decisionType);
    setHrDecisionComment('');
    setShowHRDecisionModal(true);
  };
  
  const handleSubmitHRDecision = async (e) => {
    e.preventDefault();
    
    if (hrDecisionType === 'reject' && !hrDecisionComment.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    
    try {
      const approved = hrDecisionType === 'approve';
      await api.performanceReview.hrDecision(currentHRRequest.status_id, {
        approved,
        comment: hrDecisionComment
      });
      
      alert(approved 
        ? 'Запрос одобрен! Performance Review начат досрочно, периоды пересчитаны.'
        : 'Запрос отклонен'
      );
      
      setShowHRDecisionModal(false);
      setCurrentHRRequest(null);
      setHrDecisionComment('');
      loadPendingPRRequests();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const loadEmployeeDetails = async (employeeId) => {
    try {
      console.log('🔍 Загружаю детали сотрудника ID:', employeeId);
      setDetailsLoading(true);
      const data = await api.get(`/hr/employee/${employeeId}/details`);
      console.log('✅ Получены детали:', data);
      setEmployeeDetails(data);
      setSelectedEmployee(employeeId);
      setDetailsLoading(false);
    } catch (error) {
      console.error('❌ Ошибка загрузки деталей сотрудника:', error);
      alert('Не удалось загрузить данные сотрудника: ' + (error.response?.data?.error || error.message));
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedEmployee(null);
    setEmployeeDetails(null);
  };

  // Обработчик клика по ячейке матрицы 9-Box
  const handleNineBoxClick = async (performance, potential, categoryName) => {
    try {
      // Загружаем список сотрудников для этой ячейки
      const employees = await api.get(`/hr/nine-box-employees?performance=${performance}&potential=${potential}`);
      setSelectedBoxCategory(categoryName);
      setSelectedBoxEmployees(employees);
      setShowNineBoxModal(true);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников для ячейки 9-Box:', error);
    }
  };

  const closeNineBoxModal = () => {
    setShowNineBoxModal(false);
    setSelectedBoxCategory('');
    setSelectedBoxEmployees([]);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { text: 'Завершено', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.2)' },
      in_progress: { text: 'В процессе', color: '#FFA500', bgColor: 'rgba(255, 165, 0, 0.2)' },
      overdue: { text: 'Просрочено', color: '#FF4444', bgColor: 'rgba(255, 68, 68, 0.2)' },
      not_started: { text: 'Не начато', color: '#999', bgColor: 'rgba(153, 153, 153, 0.2)' }
    };
    const config = statusConfig[status] || statusConfig.not_started;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: config.color,
        backgroundColor: config.bgColor,
        whiteSpace: 'nowrap'
      }}>
        {config.text}
      </span>
    );
  };

  const getFilteredAndSortedEmployees = () => {
    let filtered = employeeScores;
    
    // Фильтрация по статусу
    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => emp.reviewStatus === filterStatus);
    }
    
    // Сортировка
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'status') {
        // Сортировка по статусу: completed -> in_progress -> not_started -> overdue
        const statusOrder = { completed: 1, in_progress: 2, not_started: 3, overdue: 4 };
        const orderA = statusOrder[a.reviewStatus] || 5;
        const orderB = statusOrder[b.reviewStatus] || 5;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      } else if (sortBy === 'total') {
        return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      }
      return 0;
    });
    
    return filtered;
  };

  const salaryRecommendations = [
    { category: 'Высокий результат', count: 45, budget: '15%' },
    { category: 'Средний результат', count: 78, budget: '8%' },
    { category: 'Низкий результат', count: 22, budget: '0%' }
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <Header user={user} onLogout={onLogout} />
        <div className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
            <h2>Загрузка данных...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>HR Панель</h1>
          <p>Аналитика, калькуляция и система рекомендаций</p>
        </div>

        {/* Табы */}
        <div className="section-card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #333' }}>
            <button 
              onClick={() => setActiveTab('overview')} 
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'overview' ? '#FF6B00' : 'transparent', 
                color: activeTab === 'overview' ? '#000' : '#fff', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '16px', 
                fontWeight: '600' 
              }}
            >
              Обзор
            </button>
            <button 
              onClick={() => setActiveTab('calculation')} 
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'calculation' ? '#FF6B00' : 'transparent', 
                color: activeTab === 'calculation' ? '#000' : '#fff', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '16px', 
                fontWeight: '600' 
              }}
            >
              Калькуляция
            </button>
            <button 
              onClick={() => setActiveTab('recommendations')} 
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'recommendations' ? '#FF6B00' : 'transparent', 
                color: activeTab === 'recommendations' ? '#000' : '#fff', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '16px', 
                fontWeight: '600' 
              }}
            >
              Рекомендации
            </button>
            <button 
              onClick={() => setActiveTab('pr-approvals')} 
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'pr-approvals' ? '#FF6B00' : 'transparent', 
                color: activeTab === 'pr-approvals' ? '#000' : '#fff', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '16px', 
                fontWeight: '600',
                position: 'relative'
              }}
            >
              Ранние PR
              {pendingPRRequests.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {pendingPRRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="analytics-grid">
              {analytics.map(item => (
                <div key={item.id} className="analytics-card">
                  <div className="analytics-value">{item.value}</div>
                  <div className="analytics-title">{item.title}</div>
                  <div className="analytics-trend">{item.trend}</div>
                </div>
              ))}
            </div>

            <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <h2 className="section-title">Матрица 9-Box по компании</h2>
              <div className="nine-box-full">
                <div className="nine-box-labels">
                  <div className="y-label">Потенциал</div>
                  <div className="nine-box-matrix">
                    <div className="box-row">
                      <div className="box high-potential clickable-box" onClick={() => handleNineBoxClick(3, 3, 'Высокий потенциал')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Высокий потенциал</div>
                        <div className="box-count">{nineBoxData.high_high || 0} чел.</div>
                      </div>
                      <div className="box high-potential clickable-box" onClick={() => handleNineBoxClick(3, 2, 'Звезды')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Звезды</div>
                        <div className="box-count">{nineBoxData.high_medium || 0} чел.</div>
                      </div>
                      <div className="box high-potential clickable-box" onClick={() => handleNineBoxClick(3, 1, 'Топ-исполнители')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Топ-исполнители</div>
                        <div className="box-count">{nineBoxData.high_low || 0} чел.</div>
                      </div>
                    </div>
                    <div className="box-row">
                      <div className="box medium-potential clickable-box" onClick={() => handleNineBoxClick(2, 3, 'Развивающиеся')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Развивающиеся</div>
                        <div className="box-count">{nineBoxData.medium_high || 0} чел.</div>
                      </div>
                      <div className="box medium-potential clickable-box" onClick={() => handleNineBoxClick(2, 2, 'Ключевые игроки')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Ключевые игроки</div>
                        <div className="box-count">{nineBoxData.medium_medium || 0} чел.</div>
                      </div>
                      <div className="box medium-potential clickable-box" onClick={() => handleNineBoxClick(2, 1, 'Эффективные')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Эффективные</div>
                        <div className="box-count">{nineBoxData.medium_low || 0} чел.</div>
                      </div>
                    </div>
                    <div className="box-row">
                      <div className="box low-potential clickable-box" onClick={() => handleNineBoxClick(1, 3, 'Новички')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Новички</div>
                        <div className="box-count">{nineBoxData.low_high || 0} чел.</div>
                      </div>
                      <div className="box low-potential clickable-box" onClick={() => handleNineBoxClick(1, 2, 'Стабильные')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Стабильные</div>
                        <div className="box-count">{nineBoxData.low_medium || 0} чел.</div>
                      </div>
                      <div className="box low-potential clickable-box" onClick={() => handleNineBoxClick(1, 1, 'Риск')} style={{cursor: 'pointer'}}>
                        <div className="box-title">Риск</div>
                        <div className="box-count">{nineBoxData.low_low || 0} чел.</div>
                      </div>
                    </div>
                  </div>
                  <div className="x-label">Эффективность</div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Рекомендации по Salary Increase</h2>
              <div className="salary-table">
                <table>
                  <thead>
                    <tr>
                      <th>Категория</th>
                      <th>Кол-во сотрудников</th>
                      <th>Рекомендуемый бюджет</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecommendations.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.category}</strong></td>
                        <td>{item.count}</td>
                        <td className="budget-cell">{item.budget}</td>
                        <td>
                          <span className={`status-badge ${item.budget === '0%' ? 'not-recommended' : 'recommended'}`}>
                            {item.budget === '0%' ? 'Не включать' : 'Включить'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Быстрые действия</h2>
              <div className="action-buttons">
                <button className="action-button">Экспорт данных</button>
                <button className="action-button">Создать отчет</button>
                <button className="action-button">Управление калибровками</button>
                <button className="action-button">Отправить напоминания</button>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Прогресс цикла PR</h2>
              <div className="cycle-progress">
                <div className="progress-step completed">
                  <div className="step-number">1</div>
                  <div className="step-text">Постановка целей</div>
                </div>
                <div className="progress-step completed">
                  <div className="step-number">2</div>
                  <div className="step-text">Оценка 360°</div>
                </div>
                <div className="progress-step active">
                  <div className="step-number">3</div>
                  <div className="step-text">Калибровка</div>
                </div>
                <div className="progress-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Финализация</div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">Тренды развития</h2>
              <div className="trends-list">
                <div className="trend-item">
                  <span className="trend-label">Лидерство</span>
                  <span className="trend-value">42%</span>
                </div>
                <div className="trend-item">
                  <span className="trend-label">Технические навыки</span>
                  <span className="trend-value">38%</span>
                </div>
                <div className="trend-item">
                  <span className="trend-label">Коммуникация</span>
                  <span className="trend-value">28%</span>
                </div>
                <div className="trend-item">
                  <span className="trend-label">Управление проектами</span>
                  <span className="trend-value">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'calculation' && (
          <div className="section-card">
            <h2 className="section-title">Калькуляция баллов</h2>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#FF6B00', marginBottom: '10px', fontSize: '18px' }}>Таблица баллов сотрудников</h3>
              
              {/* Фильтры */}
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#2a2a2a', 
                borderRadius: '8px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ color: '#ccc', fontSize: '14px' }}>Статус:</label>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="all">Все</option>
                    <option value="completed">Завершено</option>
                    <option value="in_progress">В процессе</option>
                    <option value="not_started">Не начато</option>
                    <option value="overdue">Просрочено</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ color: '#ccc', fontSize: '14px' }}>Сортировка:</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="status">По статусу</option>
                    <option value="total">По итоговому баллу</option>
                    <option value="name">По имени</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ color: '#ccc', fontSize: '14px' }}>Порядок:</label>
                  <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="asc">По возрастанию</option>
                    <option value="desc">По убыванию</option>
                  </select>
                </div>
                
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ccc', fontSize: '14px' }}>
                    Показано: {getFilteredAndSortedEmployees().length} из {employeeScores.length}
                  </span>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Сотрудник</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Должность</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Статус</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Самооценка</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Оценка руководителя</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Оценка коллег</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#FF6B00', fontWeight: '700' }}>Итого</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAndSortedEmployees().map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '12px' }}>
                          <span 
                            onClick={() => loadEmployeeDetails(emp.id)}
                            style={{ 
                              color: '#FF6B00', 
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#FFA500'}
                            onMouseLeave={(e) => e.target.style.color = '#FF6B00'}
                            title="Нажмите, чтобы посмотреть детали"
                          >
                            {emp.name}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#ccc', fontSize: '14px' }}>
                          {emp.position}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {getStatusBadge(emp.reviewStatus)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>{emp.selfScore}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>{emp.managerScore}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>{emp.peerScore}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#FF6B00', fontWeight: '700', fontSize: '18px' }}>
                          {emp.total.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => navigate(`/calculation-results/${emp.id}`)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#4CAF50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
                            title="Открыть калькуляцию"
                          >
                            Калькуляция
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#FF6B00', marginBottom: '10px', fontSize: '18px' }}>Подсчет баллов</h3>
              <textarea 
                value={calculationInstructions} 
                onChange={(e) => setCalculationInstructions(e.target.value)} 
                style={{ 
                  width: '100%', 
                  minHeight: '100px', 
                  padding: '12px', 
                  backgroundColor: '#2a2a2a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }} 
              />
            </div>

            <div>
              <h3 style={{ color: '#FF6B00', marginBottom: '10px', fontSize: '18px' }}>Подведение итогов</h3>
              <textarea 
                value={summaryText} 
                onChange={(e) => setSummaryText(e.target.value)} 
                placeholder="Введите общие выводы по результатам оценки..." 
                style={{ 
                  width: '100%', 
                  minHeight: '150px', 
                  padding: '12px', 
                  backgroundColor: '#2a2a2a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }} 
              />
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="section-card">
            <h2 className="section-title">Система рекомендаций</h2>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: 'rgba(255,107,0,0.05)', 
              borderRadius: '8px', 
              marginBottom: '30px',
              border: '1px solid rgba(255,107,0,0.2)'
            }}>
              <h3 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '18px' }}>Добавить триггер</h3>
              <p style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>
                Триггеры автоматически добавляют рекомендации на основе ключевых слов в отзывах
              </p>
              <input 
                type="text" 
                value={triggerWord} 
                onChange={(e) => setTriggerWord(e.target.value)} 
                placeholder="Ключевое слово (например: лидерство, коммуникация)" 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  marginBottom: '10px', 
                  backgroundColor: '#2a2a2a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '6px', 
                  color: '#fff',
                  fontSize: '14px'
                }} 
              />
              <textarea 
                value={recommendationText} 
                onChange={(e) => setRecommendationText(e.target.value)} 
                placeholder="Текст рекомендации" 
                style={{ 
                  width: '100%', 
                  minHeight: '80px', 
                  padding: '10px', 
                  marginBottom: '15px', 
                  backgroundColor: '#2a2a2a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '6px', 
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }} 
              />
              <button 
                onClick={handleAddTrigger} 
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#FF6B00', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Добавить триггер
              </button>
            </div>

            <div>
              <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '18px' }}>
                Активные триггеры ({triggers.length})
              </h3>
              {triggers.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
                  Нет активных триггеров. Добавьте первый триггер выше.
                </p>
              ) : (
                triggers.map((trigger, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '16px', 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: '8px', 
                      marginBottom: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span 
                        style={{ 
                          padding: '4px 12px', 
                          backgroundColor: 'rgba(255,107,0,0.2)', 
                          borderRadius: '20px', 
                          color: '#FF6B00', 
                          fontSize: '13px', 
                          fontWeight: '600',
                          display: 'inline-block',
                          marginBottom: '8px'
                        }}
                      >
                        {trigger.word}
                      </span>
                      <p style={{ color: '#ccc', marginTop: '8px', lineHeight: '1.5' }}>
                        {trigger.recommendation}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteTrigger(index)} 
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: 'transparent', 
                        color: '#f44336', 
                        border: '1px solid #f44336', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        marginLeft: '15px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Вкладка: Одобрение ранних PR */}
        {activeTab === 'pr-approvals' && (
          <div className="section-card">
            <h2 className="section-title">Запросы на ранний Performance Review</h2>
            <p style={{ color: 'var(--wink-light-gray)', marginBottom: '20px' }}>
              Запросы от менеджеров и сотрудников, одобренные руководителями. Ваше решение запустит досрочный PR и пересчитает последующие периоды.
            </p>
            
            {pendingPRRequests.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: 'var(--wink-light-gray)',
                background: 'var(--wink-dark-gray)',
                borderRadius: '12px'
              }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>Нет ожидающих запросов</p>
                <p style={{ fontSize: '14px' }}>Все запросы на ранний PR обработаны</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingPRRequests.map(request => (
                  <div key={request.status_id} style={{
                    padding: '24px',
                    background: 'var(--wink-dark-gray)',
                    borderRadius: '12px',
                    borderLeft: '4px solid var(--wink-orange)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--wink-white)', marginBottom: '8px' }}>
                          {request.employee_name}
                        </h3>
                        <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginBottom: '4px' }}>
                          {request.position}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>
                          Период: {request.period_name}
                        </div>
                      </div>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981'
                      }}>
                        Одобрено менеджером
                      </span>
                    </div>
                    
                    {request.employee_comment && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--wink-light-gray)', marginBottom: '6px' }}>
                          Комментарий сотрудника:
                        </div>
                        <div style={{ 
                          padding: '12px', 
                          background: 'var(--wink-gray)', 
                          borderRadius: '8px', 
                          fontSize: '14px', 
                          color: 'var(--wink-white)' 
                        }}>
                          {request.employee_comment}
                        </div>
                      </div>
                    )}
                    
                    {request.manager_approval_comment && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--wink-light-gray)', marginBottom: '6px' }}>
                          Комментарий менеджера:
                        </div>
                        <div style={{ 
                          padding: '12px', 
                          background: 'var(--wink-gray)', 
                          borderRadius: '8px', 
                          fontSize: '14px', 
                          color: 'var(--wink-white)' 
                        }}>
                          {request.manager_approval_comment}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ fontSize: '13px', color: 'var(--wink-light-gray)', marginBottom: '16px' }}>
                      Дата запроса: {new Date(request.requested_date).toLocaleDateString('ru-RU')}
                      {request.manager_approved_date && ` | Одобрено менеджером: ${new Date(request.manager_approved_date).toLocaleDateString('ru-RU')}`}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleHRPRDecision(request, 'approve')}
                        style={{
                          padding: '10px 20px',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ✓ Одобрить и запустить PR
                      </button>
                      <button
                        onClick={() => handleHRPRDecision(request, 'reject')}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '2px solid #ef4444',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ✗ Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно: HR решение по раннему PR */}
      {showHRDecisionModal && currentHRRequest && (
        <div className="modal-overlay" onClick={() => setShowHRDecisionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '20px' }}>
              {hrDecisionType === 'approve' ? 'Одобрить ранний PR' : 'Отклонить запрос'}
            </h2>
            
            <div style={{ 
              padding: '16px', 
              background: 'var(--wink-dark-gray)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              borderLeft: `4px solid ${hrDecisionType === 'approve' ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--wink-white)', marginBottom: '8px' }}>
                {currentHRRequest.employee_name}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)', marginBottom: '4px' }}>
                {currentHRRequest.position}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--wink-light-gray)' }}>
                Период: {currentHRRequest.period_name}
              </div>
            </div>
            
            {hrDecisionType === 'approve' && (
              <div style={{ 
                padding: '12px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600', marginBottom: '8px' }}>
                  ⚠️ Внимание
                </div>
                <div style={{ fontSize: '13px', color: 'var(--wink-light-gray)', lineHeight: '1.5' }}>
                  При одобрении запроса:
                  <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                    <li>Текущий период завершится досрочно (сегодня)</li>
                    <li>Performance Review станет доступен немедленно</li>
                    <li>Все последующие периоды сдвинутся на разницу в днях</li>
                  </ul>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmitHRDecision}>
              <div className="form-group">
                <label>
                  {hrDecisionType === 'approve' ? 'Комментарий (необязательно)' : 'Причина отклонения *'}
                </label>
                <textarea
                  value={hrDecisionComment}
                  onChange={(e) => setHrDecisionComment(e.target.value)}
                  placeholder={hrDecisionType === 'approve' 
                    ? 'Добавьте комментарий, если необходимо...'
                    : 'Укажите причину отклонения запроса...'
                  }
                  rows="4"
                  required={hrDecisionType === 'reject'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--wink-gray)',
                    border: '1px solid var(--wink-medium-gray)',
                    borderRadius: '8px',
                    color: 'var(--wink-white)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{
                    background: hrDecisionType === 'approve' ? '#10b981' : '#ef4444'
                  }}
                >
                  {hrDecisionType === 'approve' ? 'Одобрить' : 'Отклонить'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowHRDecisionModal(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно с деталями сотрудника */}
      {selectedEmployee && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeDetailsModal}
        >
          <div 
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '30px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetailsModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px 10px'
              }}
            >
              ×
            </button>

            {detailsLoading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
                Загрузка...
              </div>
            ) : employeeDetails ? (
              <>
                <h2 style={{ color: '#FF6B00', marginBottom: '25px', fontSize: '26px' }}>
                  {employeeDetails.employee.name}
                </h2>

                {/* Общая информация */}
                <div style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <h3 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '18px' }}>
                    Общая информация
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div>
                      <div style={{ color: '#999', fontSize: '13px' }}>Email:</div>
                      <div style={{ color: '#fff', fontSize: '15px' }}>{employeeDetails.employee.email}</div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '13px' }}>Должность:</div>
                      <div style={{ color: '#fff', fontSize: '15px' }}>{employeeDetails.employee.position}</div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '13px' }}>Итоговый балл:</div>
                      <div style={{ color: '#FF6B00', fontSize: '22px', fontWeight: '700' }}>
                        {employeeDetails.employee.totalScore} / 10
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '13px' }}>Статус оценки:</div>
                      <div style={{ color: '#fff', fontSize: '15px' }}>
                        {employeeDetails.employee.evaluationStatus}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Самооценка */}
                <div style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '15px' 
                }}>
                  <h3 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '18px' }}>
                    Самооценка
                  </h3>
                  {employeeDetails.evaluations.selfAssessment.length > 0 ? (
                    <>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '15px', 
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: 'rgba(255,107,0,0.1)',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <div style={{ color: '#999', fontSize: '13px' }}>Средний балл:</div>
                          <div style={{ color: '#FF6B00', fontSize: '24px', fontWeight: '700' }}>
                            {employeeDetails.employee.selfScore} / 10
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: '13px' }}>Заполнено ответов:</div>
                          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                            {employeeDetails.evaluations.selfAssessment.length}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>
                          Детали самооценки:
                        </h4>
                        {employeeDetails.evaluations.selfAssessment.map((assessment, idx) => (
                          <div 
                            key={idx}
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              padding: '12px 15px',
                              borderRadius: '6px',
                              marginBottom: '10px',
                              borderLeft: '3px solid #FF6B00'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ color: '#ccc', fontSize: '13px', flex: 1 }}>
                                <strong>{assessment.question_text || `Вопрос ${idx + 1}`}</strong>
                              </div>
                              <div style={{ 
                                color: '#FF6B00', 
                                fontSize: '16px', 
                                fontWeight: '700',
                                marginLeft: '15px',
                                minWidth: '60px',
                                textAlign: 'right'
                              }}>
                                {(assessment.answer_score * 2).toFixed(1)} / 10
                              </div>
                            </div>
                            {assessment.answer_text && (
                              <div style={{ 
                                color: '#aaa', 
                                fontSize: '12px', 
                                fontStyle: 'italic',
                                marginTop: '5px',
                                paddingLeft: '10px',
                                borderLeft: '2px solid rgba(255,255,255,0.1)'
                              }}>
                                "{assessment.answer_text}"
                              </div>
                            )}
                            {assessment.task_name && (
                              <div style={{ color: '#888', fontSize: '11px', marginTop: '5px' }}>
                                Задача: {assessment.task_name}
                              </div>
                            )}
                            <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>
                              Дата: {new Date(assessment.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#999', fontStyle: 'italic', padding: '15px', textAlign: 'center' }}>
                      Самооценка не заполнена
                    </div>
                  )}
                </div>

                {/* Оценка руководителя */}
                {employeeDetails.employee.role !== 'manager' && (
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '15px' 
                  }}>
                    <h3 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '18px' }}>
                      Оценка руководителя
                    </h3>
                    {employeeDetails.evaluations.managerEvaluation ? (
                      <div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gap: '15px',
                          marginBottom: '20px',
                          padding: '15px',
                          backgroundColor: 'rgba(255,107,0,0.1)',
                          borderRadius: '6px'
                        }}>
                          <div>
                            <div style={{ color: '#999', fontSize: '13px' }}>Результативность:</div>
                            <div style={{ color: '#FF6B00', fontSize: '24px', fontWeight: '700' }}>
                              {employeeDetails.evaluations.managerEvaluation.performance_total} / 10
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '13px' }}>Проф. качества:</div>
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>
                              {employeeDetails.evaluations.managerEvaluation.professional_qualities_score} / 5
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '13px' }}>Личн. качества:</div>
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>
                              {employeeDetails.evaluations.managerEvaluation.personal_qualities_score} / 4
                            </div>
                          </div>
                        </div>
                        <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                          <strong>Оценил:</strong> {employeeDetails.evaluations.managerEvaluation.manager_name}
                        </div>
                        <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                          <strong>Цикл:</strong> {employeeDetails.evaluations.managerEvaluation.cycle_name}
                        </div>
                        <div style={{ color: '#666', fontSize: '11px' }}>
                          Дата: {new Date(employeeDetails.evaluations.managerEvaluation.created_at).toLocaleDateString('ru-RU')}
                        </div>
                        {employeeDetails.evaluations.managerEvaluation.comments && (
                          <div style={{ 
                            marginTop: '15px',
                            padding: '12px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: '6px',
                            borderLeft: '3px solid #FF6B00'
                          }}>
                            <div style={{ color: '#999', fontSize: '12px', marginBottom: '5px' }}>Комментарий:</div>
                            <div style={{ color: '#ccc', fontSize: '13px', fontStyle: 'italic' }}>
                              "{employeeDetails.evaluations.managerEvaluation.comments}"
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#999', fontStyle: 'italic', padding: '15px', textAlign: 'center' }}>
                        Оценка руководителя не заполнена
                      </div>
                    )}
                  </div>
                )}

                {/* Оценка потенциала */}
                {employeeDetails.evaluations.potentialAssessment && (
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '15px' 
                  }}>
                    <h3 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '18px' }}>
                      Оценка потенциала (9-Box)
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '15px',
                      marginBottom: '15px',
                      padding: '15px',
                      backgroundColor: 'rgba(255,107,0,0.1)',
                      borderRadius: '6px'
                    }}>
                      <div>
                        <div style={{ color: '#999', fontSize: '13px' }}>Потенциал:</div>
                        <div style={{ color: '#FF6B00', fontSize: '24px', fontWeight: '700' }}>
                          {employeeDetails.evaluations.potentialAssessment.potential_score} / 10
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#999', fontSize: '13px' }}>Результативность:</div>
                        <div style={{ color: '#FF6B00', fontSize: '24px', fontWeight: '700' }}>
                          {employeeDetails.evaluations.potentialAssessment.performance_score} / 10
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '12px',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      borderRadius: '6px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ color: '#999', fontSize: '12px', marginBottom: '5px' }}>Позиция в 9-Box матрице:</div>
                      <div style={{ color: '#4CAF50', fontSize: '16px', fontWeight: '600', textTransform: 'capitalize' }}>
                        {employeeDetails.evaluations.potentialAssessment.box_position ? 
                          employeeDetails.evaluations.potentialAssessment.box_position.replace(/_/g, ' ') : 
                          'Не определена'}
                      </div>
                    </div>
                    <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                      <strong>Оценил:</strong> {employeeDetails.evaluations.potentialAssessment.assessor_name || 'Не указан'}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                      <strong>Цикл:</strong> {employeeDetails.evaluations.potentialAssessment.cycle_name}
                    </div>
                    {employeeDetails.evaluations.potentialAssessment.readiness_timeframe && (
                      <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                        <strong>Готовность к продвижению:</strong> {employeeDetails.evaluations.potentialAssessment.readiness_timeframe}
                      </div>
                    )}
                    <div style={{ color: '#666', fontSize: '11px' }}>
                      Дата: {new Date(employeeDetails.evaluations.potentialAssessment.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                )}

                {/* Оценки коллег */}
                <div style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  padding: '20px', 
                  borderRadius: '8px' 
                }}>
                  <h3 style={{ color: '#FF6B00', marginBottom: '15px', fontSize: '18px' }}>
                    Оценки коллег (360°)
                  </h3>
                  {employeeDetails.evaluations.peerReviews.length > 0 ? (
                    <>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '15px',
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: 'rgba(255,107,0,0.1)',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <div style={{ color: '#999', fontSize: '13px' }}>Средний балл:</div>
                          <div style={{ color: '#FF6B00', fontSize: '24px', fontWeight: '700' }}>
                            {employeeDetails.employee.peerScore} / 10
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: '13px' }}>Получено отзывов:</div>
                          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                            {employeeDetails.evaluations.peerReviews.length}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>
                          Детальные отзывы:
                        </h4>
                        {employeeDetails.evaluations.peerReviews.map((review, idx) => (
                          <div 
                            key={idx}
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              padding: '12px 15px',
                              borderRadius: '6px',
                              marginBottom: '10px',
                              borderLeft: '3px solid #4CAF50'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                                  {review.reviewer_name}
                                </div>
                                <div style={{ color: '#ccc', fontSize: '13px' }}>
                                  {review.question_text || `Вопрос ${idx + 1}`}
                                </div>
                              </div>
                              <div style={{ 
                                color: '#FF6B00', 
                                fontSize: '16px', 
                                fontWeight: '700',
                                marginLeft: '15px',
                                minWidth: '60px',
                                textAlign: 'right'
                              }}>
                                {(review.answer_score * 2).toFixed(1)} / 10
                              </div>
                            </div>
                            {review.answer_text && (
                              <div style={{ 
                                color: '#aaa', 
                                fontSize: '12px', 
                                fontStyle: 'italic',
                                marginTop: '8px',
                                paddingLeft: '10px',
                                borderLeft: '2px solid rgba(255,255,255,0.1)'
                              }}>
                                "{review.answer_text}"
                              </div>
                            )}
                            {review.task_name && (
                              <div style={{ color: '#888', fontSize: '11px', marginTop: '5px' }}>
                                Задача: {review.task_name}
                              </div>
                            )}
                            <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>
                              Дата: {new Date(review.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#999', fontStyle: 'italic', padding: '15px', textAlign: 'center' }}>
                      Оценки коллег не получены
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
                Ошибка загрузки данных
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно для отображения сотрудников из ячейки 9-Box */}
      {showNineBoxModal && (
        <div className="modal-overlay" onClick={closeNineBoxModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Категория: {selectedBoxCategory}</h2>
              <button className="close-button" onClick={closeNineBoxModal}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {selectedBoxEmployees.length > 0 ? (
                <div>
                  <p style={{ color: '#ccc', marginBottom: '20px' }}>
                    Всего сотрудников в категории: <strong>{selectedBoxEmployees.length}</strong>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {selectedBoxEmployees.map((emp) => (
                      <div 
                        key={emp.id}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: '15px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.borderColor = '#FF6B00';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                        onClick={() => {
                          closeNineBoxModal();
                          loadEmployeeDetails(emp.id);
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#999' }}>
                            {emp.position || 'Должность не указана'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '3px' }}>
                            Performance: <span style={{ color: '#FF6B00', fontWeight: '600' }}>{emp.performance_level || 'N/A'}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#ccc' }}>
                            Potential: <span style={{ color: '#4CAF50', fontWeight: '600' }}>{emp.potential_level || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p style={{ fontSize: '16px', marginBottom: '10px' }}>😔</p>
                  <p>В этой категории пока нет сотрудников</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
