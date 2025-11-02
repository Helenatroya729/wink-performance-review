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
  const [notifications, setNotifications] = useState([]);
  const [showHRDecisionModal, setShowHRDecisionModal] = useState(false);
  const [currentHRRequest, setCurrentHRRequest] = useState(null);
  const [hrDecisionType, setHrDecisionType] = useState(''); // 'approve' или 'reject'
  const [hrDecisionComment, setHrDecisionComment] = useState('');

  // Модальные окна для быстрых действий
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPeriodsModal, setShowPeriodsModal] = useState(false);
  const [showTeamManagementModal, setShowTeamManagementModal] = useState(false);
  
  // Данные для модальных окон
  const [reportType, setReportType] = useState('employee'); // employee, department, company
  const [selectedReportEmployee, setSelectedReportEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [exportType, setExportType] = useState('employee');
  const [selectedExportEmployee, setSelectedExportEmployee] = useState('');
  const [allPeriods, setAllPeriods] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [newManagerId, setNewManagerId] = useState('');
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    loadHRData();
    loadPendingPRRequests();
    loadTriggers(); // Загружаем триггеры из БД
    loadDepartments();
    loadManagers();
  }, []);

  useEffect(() => {
    if (activeTab === 'pr-approvals') {
      loadPendingPRRequests();
    }
  }, [activeTab]);

  // Загрузка триггеров из базы данных
  const loadTriggers = async () => {
    try {
      const triggersData = await api.get('/hr/triggers');
      console.log('✅ Загружены триггеры:', triggersData);
      setTriggers(triggersData);
    } catch (error) {
      console.error('❌ Ошибка загрузки триггеров:', error);
      // Оставляем стандартные триггеры из state
    }
  };

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

      // Загружаем список периодов/статусов для HR и объединяем с баллами
      console.log('🔍 Загружаем /hr/calculations...');
      const calcList = await api.get('/hr/calculations');
      console.log('✅ Получены данные calcList:', calcList.length);

      // Создаем мапу по employee_id -> period info (берем первый период если несколько)
      const periodMap = {};
      calcList.forEach(p => {
        if (!periodMap[p.employee_id]) periodMap[p.employee_id] = p;
      });

      const merged = employeeScores.map(es => ({
        ...es,
        periodInfo: periodMap[es.id] || null,
        // Используем can_calculate из employee-scores, если есть, иначе из periodMap
        can_calculate: es.can_calculate !== undefined ? es.can_calculate : ((periodMap[es.id] && periodMap[es.id].can_calculate) || false),
        period_id: es.period_id || (periodMap[es.id] ? periodMap[es.id].period_id : null),
        period_status: es.reviewStatus || (periodMap[es.id] ? periodMap[es.id].status : null),
        // Используем статус из periodMap если есть, иначе оставляем оригинальный
        reviewStatus: (periodMap[es.id] && periodMap[es.id].status) || es.reviewStatus || 'not_started'
      }));

      console.log('📊 Merged employee data:');
      merged.forEach(emp => {
        console.log(`  ${emp.name}: can_calculate=${emp.can_calculate}, period_id=${emp.period_id}, status=${emp.reviewStatus}`);
      });

      setEmployeeScores(merged);

      // Загружаем данные 9-Box
      const nineBoxData = await api.get('/hr/nine-box');
      setNineBoxData(nineBoxData);

      // Загружаем уведомления HR (только непрочитанные)
      try {
        const notifs = await api.get('/notifications');
        // Фильтруем только непрочитанные и преобразуем в формат для UI
        const uiNotifs = notifs
          .filter(n => !n.is_read)
          .map(n => ({
            id: n.id,
            text: n.title + ' — ' + (n.message || ''),
            time: new Date(n.created_at).toLocaleString('ru-RU'),
            action: () => setActiveTab('calculation')
          }));
        setNotifications(uiNotifs);
      } catch (e) {
        console.warn('Не удалось загрузить уведомления:', e.message || e);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных HR:', error);
      setLoading(false);
    }
  };

  const handleAddTrigger = async () => {
    if (triggerWord.trim() && recommendationText.trim()) {
      try {
        const newTrigger = await api.post('/hr/triggers', {
          word: triggerWord.toLowerCase(),
          recommendation: recommendationText
        });
        setTriggers([...triggers, newTrigger]);
        setTriggerWord('');
        setRecommendationText('');
        alert('✅ Триггер успешно добавлен!');
      } catch (error) {
        console.error('❌ Ошибка добавления триггера:', error);
        alert(error.response?.data?.error || 'Ошибка при добавлении триггера');
      }
    }
  };

  const handleDeleteTrigger = async (triggerId, index) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот триггер?')) {
      return;
    }

    try {
      await api.delete(`/hr/triggers/${triggerId}`);
      setTriggers(triggers.filter((_, i) => i !== index));
      alert('✅ Триггер успешно удален!');
    } catch (error) {
      console.error('❌ Ошибка удаления триггера:', error);
      alert(error.response?.data?.error || 'Ошибка при удалении триггера');
    }
  };

  // Загрузка дополнительных данных
  const loadDepartments = async () => {
    try {
      const depts = await api.get('/hr/departments');
      setDepartments(depts);
    } catch (error) {
      console.error('Ошибка загрузки отделов:', error);
    }
  };

  const loadManagers = async () => {
    try {
      const mgrs = await api.get('/hr/managers');
      setManagers(mgrs);
    } catch (error) {
      console.error('Ошибка загрузки менеджеров:', error);
    }
  };

  const loadAllPeriods = async () => {
    try {
      const periods = await api.get('/hr/all-periods');
      setAllPeriods(periods);
    } catch (error) {
      console.error('Ошибка загрузки периодов:', error);
    }
  };

  // Обработчики быстрых действий
  const handleOpenReportModal = () => {
    setReportType('employee');
    setSelectedReportEmployee('');
    setSelectedDepartment('');
    setShowReportModal(true);
  };

  const handleOpenExportModal = () => {
    // Функция в разработке
    setNotifications([{
      show: true,
      message: '⚠️ Функция выгрузки таблицы находится в разработке',
      type: 'warning'
    }]);
  };

  const handleOpenPeriodsModal = async () => {
    await loadAllPeriods();
    setShowPeriodsModal(true);
  };

  const handleOpenTeamManagementModal = async () => {
    try {
      const members = await api.get('/hr/all-employees');
      setTeamMembers(members);
      setShowTeamManagementModal(true);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      let url = '/hr/generate-report?type=' + reportType;
      
      if (reportType === 'employee' && selectedReportEmployee) {
        url += '&employeeId=' + selectedReportEmployee;
      } else if (reportType === 'department' && selectedDepartment) {
        url += '&department=' + encodeURIComponent(selectedDepartment);
      }

      // Получаем PDF как blob
      const response = await fetch(api.getBaseUrl() + url, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      if (!response.ok) throw new Error('Ошибка генерации отчета');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `report_${reportType}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setShowReportModal(false);
      alert('Отчет успешно создан!');
    } catch (error) {
      console.error('Ошибка создания отчета:', error);
      alert('Ошибка создания отчета: ' + error.message);
    }
  };

  const handleExportData = async () => {
    try {
      let url = '/hr/export-data?type=' + exportType;
      
      if (exportType === 'employee' && selectedExportEmployee) {
        url += '&employeeId=' + selectedExportEmployee;
      } else if (exportType === 'department' && selectedDepartment) {
        url += '&department=' + encodeURIComponent(selectedDepartment);
      }

      // Получаем Excel как blob
      const response = await fetch(api.getBaseUrl() + url, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      if (!response.ok) throw new Error('Ошибка экспорта данных');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `export_${exportType}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setShowExportModal(false);
      alert('✅ Данные успешно экспортированы!');
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      alert('Ошибка экспорта данных: ' + error.message);
    }
  };

  const handleChangeManager = async () => {
    if (!selectedTeamMember || !newManagerId) {
      alert('Выберите сотрудника и нового руководителя');
      return;
    }

    if (selectedTeamMember === newManagerId) {
      alert('Сотрудник не может быть руководителем самого себя');
      return;
    }

    try {
      await api.post('/hr/change-manager', {
        employeeId: selectedTeamMember,
        newManagerId: newManagerId
      });

      alert('✅ Руководитель успешно изменен!');
      setShowTeamManagementModal(false);
      setSelectedTeamMember('');
      setNewManagerId('');
    } catch (error) {
      console.error('Ошибка изменения руководителя:', error);
      alert('Ошибка: ' + error.message);
    }
  };
  
  const loadPendingPRRequests = async () => {
    try {
      const requests = await api.get('/review-periods/pending-hr-approval');
      console.log(' Запросы ожидающие HR:', requests);
      setPendingPRRequests(requests);
      
      // Создаем уведомления из запросов
      const notifs = requests.map((req, idx) => ({
        id: `pr-${idx}`,
        text: `${req.first_name} ${req.last_name} ожидает утверждения Performance Review`,
        time: new Date(req.requested_early_at).toLocaleDateString('ru-RU'),
        action: () => setActiveTab('pr-approvals')
      }));
      setNotifications(notifs);
    } catch (error) {
      console.error('Ошибка загрузки запросов PR:', error);
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
      const periodId = currentHRRequest.id; // Используем id периода
      
      if (hrDecisionType === 'approve') {
        await api.post(`/review-periods/${periodId}/hr-approve`);
        alert('Запрос одобрен! Performance Review начат досрочно.');
      } else {
        await api.post(`/review-periods/${periodId}/hr-reject`, {
          reason: hrDecisionComment
        });
        alert('Запрос отклонен');
      }
      
      setShowHRDecisionModal(false);
      setCurrentHRRequest(null);
      setHrDecisionComment('');
      loadPendingPRRequests();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  // Функция для определения позиции в 9-Box матрице
  const get9BoxPosition = (potentialScore, performanceScore) => {
    if (!potentialScore || !performanceScore) return 'Не определена';
    
    const potential = parseInt(potentialScore);
    const performance = parseInt(performanceScore);
    
    // Логика определения позиции:
    // 1-3 = Низкий, 4-6 = Средний, 7-10 = Высокий
    let potentialLevel = potential <= 3 ? 'low' : potential <= 6 ? 'medium' : 'high';
    let performanceLevel = performance <= 3 ? 'low' : performance <= 6 ? 'medium' : 'high';
    
    const positions = {
      'low_low': 'Низкий потенциал, Низкая результативность',
      'low_medium': 'Низкий потенциал, Средняя результативность',
      'low_high': 'Низкий потенциал, Высокая результативность',
      'medium_low': 'Средний потенциал, Низкая результативность',
      'medium_medium': 'Средний потенциал, Средняя результативность',
      'medium_high': 'Средний потенциал, Высокая результативность',
      'high_low': 'Высокий потенциал, Низкая результативность',
      'high_medium': 'Высокий потенциал, Средняя результативность',
      'high_high': 'Высокий потенциал, Высокая результативность'
    };
    
    return positions[`${potentialLevel}_${performanceLevel}`] || 'Не определена';
  };

  const loadEmployeeDetails = async (employeeId) => {
    try {
      console.log(' Загружаю детали сотрудника ID:', employeeId);
      setDetailsLoading(true);
      const data = await api.get(`/hr/employee/${employeeId}/details`);
      console.log(' Получены детали:', data);
      setEmployeeDetails(data);
      setSelectedEmployee(employeeId);
      setDetailsLoading(false);
    } catch (error) {
      console.error(' Ошибка загрузки деталей сотрудника:', error);
      alert('Не удалось загрузить данные сотрудника: ' + (error.response?.data?.error || error.message));
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedEmployee(null);
    setEmployeeDetails(null);
  };

  // Обработчик клика по ячейке матрицы 9-Box
  const handleNineBoxClick = async (potential, performance, categoryName) => {
    try {
      console.log(`🔍 Клик на ячейку: potential=${potential}, performance=${performance}, category="${categoryName}"`);
      // Загружаем список сотрудников для этой ячейки
      const employees = await api.get(`/hr/nine-box-employees?performance=${performance}&potential=${potential}`);
      console.log(`✅ Загружено сотрудников: ${employees.length}`);
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
      awaiting_calculation: { text: 'Ожидает калькуляции', color: '#FF6B00', bgColor: 'rgba(255, 107, 0, 0.2)' },
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

        {/* Уведомления */}
        {notifications.length > 0 && (
          <div className="section-card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--wink-orange)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--wink-orange)' }}>
               Требуют внимания ({notifications.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 107, 0, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={notif.action}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 0, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 107, 0, 0.1)'}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{notif.text}</div>
                    <div style={{ fontSize: '13px', color: '#999' }}>{notif.time}</div>
                  </div>
                  <button
                    style={{
                      padding: '8px 16px',
                      background: 'var(--wink-orange)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Перейти →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                </div>
                <div className="x-label">Эффективность</div>
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Быстрые действия</h2>
              <div className="action-buttons">
                <button 
                  className="action-button" 
                  onClick={handleOpenReportModal}
                  style={{ position: 'relative' }}
                >
                  Создать отчет
                </button>
                <button 
                  className="action-button" 
                  onClick={handleOpenExportModal}
                  style={{ position: 'relative' }}
                >
                  Выгрузка таблицы
                </button>
                <button 
                  className="action-button" 
                  onClick={handleOpenPeriodsModal}
                  style={{ position: 'relative' }}
                >
                  Просмотр периодов PR
                </button>
                <button 
                  className="action-button" 
                  onClick={() => setActiveTab('pr-approvals')}
                  style={{ position: 'relative' }}
                >
                  Ранние PR
                  {pendingPRRequests.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#ff4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {pendingPRRequests.length}
                    </span>
                  )}
                </button>
                <button 
                  className="action-button" 
                  onClick={handleOpenTeamManagementModal}
                  style={{ position: 'relative' }}
                >
                  Управление командами
                </button>
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
                    <option value="awaiting_calculation">Ожидает калькуляции</option>
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
                      <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Оценка потенциала</th>
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
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>{emp.potentialScore || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#FF6B00', fontWeight: '700', fontSize: '18px' }}>
                          {emp.total.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {/* Кнопка калькуляции: активна когда оценка завершена или хотя бы началась */}
                            <button
                              onClick={() => {
                                if (!emp.period_id) return alert('Не найден период для калькуляции');
                                navigate(`/calculation-results/${emp.id}?periodId=${emp.period_id}`);
                              }}
                              disabled={emp.reviewStatus === 'not_started'}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: emp.reviewStatus === 'not_started' ? '#666' : 
                                  (emp.reviewStatus === 'awaiting_calculation' ? '#FF6B00' : '#4CAF50'),
                                color: emp.reviewStatus === 'not_started' ? '#999' : '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: emp.reviewStatus === 'not_started' ? 'not-allowed' : 'pointer',
                                opacity: emp.reviewStatus === 'not_started' ? 0.6 : 1
                              }}
                              title={emp.reviewStatus === 'not_started' 
                                ? 'Калькуляция будет доступна после начала оценки' 
                                : (emp.reviewStatus === 'completed' ? 'Просмотр калькуляции' : 'Провести калькуляцию результатов')
                              }
                            >
                              {emp.reviewStatus === 'awaiting_calculation' 
                                ? 'Провести калькуляцию' 
                                : 'Калькуляция'}
                            </button>
                          </div>
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
                    key={trigger.id || index} 
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
                      onClick={() => handleDeleteTrigger(trigger.id, index)} 
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
                  Внимание
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
                            {parseFloat(employeeDetails.employee.selfScore) || 0} / 10
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
                                {assessment.answer_score ? (assessment.answer_score * 2).toFixed(1) : 0} / 10
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
                              {employeeDetails.evaluations.managerEvaluation.performance_total || 0} / 10
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '13px' }}>Проф. качества:</div>
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>
                              {employeeDetails.evaluations.managerEvaluation.professional_qualities_score || 0} / 5
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#999', fontSize: '13px' }}>Личн. качества:</div>
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>
                              {employeeDetails.evaluations.managerEvaluation.personal_qualities_score || 0} / 4
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
                          {employeeDetails.evaluations.potentialAssessment.potential_final_score || 0} / 10
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#999', fontSize: '13px' }}>Результативность:</div>
                        <div style={{ color: '#FF6B00', fontSize: '24px', fontWeight: '700' }}>
                          {employeeDetails.evaluations.potentialAssessment.performance_final_score || 0} / 10
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
                      <div style={{ color: '#4CAF50', fontSize: '16px', fontWeight: '600' }}>
                        {get9BoxPosition(
                          employeeDetails.evaluations.potentialAssessment.potential_final_score,
                          employeeDetails.evaluations.potentialAssessment.performance_final_score
                        )}
                      </div>
                    </div>
                    <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                      <strong>Оценил:</strong> {employeeDetails.evaluations.potentialAssessment.assessor_name || 'Не указан'}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                      <strong>Цикл:</strong> {employeeDetails.evaluations.potentialAssessment.cycle_name}
                    </div>
                    {employeeDetails.evaluations.potentialAssessment.successor_ready_timing && (
                      <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '8px' }}>
                        <strong>Готовность к продвижению:</strong> {employeeDetails.evaluations.potentialAssessment.successor_ready_timing}
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
                            {parseFloat(employeeDetails.employee.peerScore) || 0} / 10
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
                                {review.answer_score ? (review.answer_score * 2).toFixed(1) : 0} / 10
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
                            Эффективность: <span style={{ color: '#FF6B00', fontWeight: '600' }}>
                              {emp.performance_level_text || 'N/A'} ({emp.performance_score || 0})
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#ccc' }}>
                            Потенциал: <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                              {emp.potential_level_text || 'N/A'} ({emp.potential_score_value || 0})
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>В этой категории пока нет сотрудников</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания отчета */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2> Создать отчет</h2>
              <button className="close-button" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                  Тип отчета:
                </label>
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                >
                  <option value="employee">По сотруднику</option>
                  <option value="department">По отделу</option>
                  <option value="company">По всей компании</option>
                </select>
              </div>

              {reportType === 'employee' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                    Выберите сотрудника:
                  </label>
                  <select 
                    value={selectedReportEmployee} 
                    onChange={(e) => setSelectedReportEmployee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">-- Выберите сотрудника --</option>
                    {employeeScores.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reportType === 'department' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                    Выберите отдел:
                  </label>
                  <select 
                    value={selectedDepartment} 
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">-- Выберите отдел --</option>
                    {departments.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginTop: '20px', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                Отчет будет содержать: оценки эффективности, потенциал, цели, планы развития, 
                рекомендации и peer feedback за текущий цикл.
              </div>

              <button 
                className="action-button"
                onClick={handleGenerateReport}
                style={{ 
                  width: '100%', 
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: '#FF6B00',
                  color: 'white'
                }}
              >
                Создать отчет PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно экспорта данных */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2> Выгрузка таблицы</h2>
              <button className="close-button" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                  Тип выгрузки:
                </label>
                <select 
                  value={exportType} 
                  onChange={(e) => setExportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                >
                  <option value="employee">По сотруднику</option>
                  <option value="department">По отделу</option>
                  <option value="company">По всей компании</option>
                </select>
              </div>

              {exportType === 'employee' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                    Выберите сотрудника:
                  </label>
                  <select 
                    value={selectedExportEmployee} 
                    onChange={(e) => setSelectedExportEmployee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">-- Выберите сотрудника --</option>
                    {employeeScores.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {exportType === 'department' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                    Выберите отдел:
                  </label>
                  <select 
                    value={selectedDepartment} 
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">-- Выберите отдел --</option>
                    {departments.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginTop: '20px', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                Данные будут выгружены в формате Excel (.xlsx) со всеми деталями оценок и метриками.
              </div>

              <button 
                className="action-button"
                onClick={handleExportData}
                style={{ 
                  width: '100%', 
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: '#FF6B00',
                  color: 'white'
                }}
              >
                Экспортировать Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра периодов PR */}
      {showPeriodsModal && (
        <div className="modal-overlay" onClick={() => setShowPeriodsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Периоды Performance Review команды</h2>
              <button className="close-button" onClick={() => setShowPeriodsModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              {allPeriods.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#ccc' }}>Сотрудник</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#ccc' }}>Должность</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>Период</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>Статус</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>Прогресс</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPeriods.map((period, idx) => (
                      <tr 
                        key={idx}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px', color: '#fff' }}>
                          {period.first_name} {period.last_name}
                        </td>
                        <td style={{ padding: '12px', color: '#aaa', fontSize: '13px' }}>
                          {period.position}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#aaa' }}>
                          {new Date(period.start_date).toLocaleDateString('ru-RU')} - 
                          {new Date(period.end_date).toLocaleDateString('ru-RU')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: 
                              period.status === 'completed' ? 'rgba(76,175,80,0.2)' :
                              period.status === 'in_progress' ? 'rgba(255,193,7,0.2)' :
                              period.status === 'overdue' ? 'rgba(244,67,54,0.2)' :
                              'rgba(158,158,158,0.2)',
                            color: 
                              period.status === 'completed' ? '#4CAF50' :
                              period.status === 'in_progress' ? '#FFC107' :
                              period.status === 'overdue' ? '#F44336' :
                              '#9E9E9E'
                          }}>
                            {period.status === 'completed' ? 'Завершен' :
                             period.status === 'in_progress' ? 'В процессе' :
                             period.status === 'overdue' ? 'Просрочен' :
                             'Не начат'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#aaa' }}>
                          {period.self_completed ? '' : ''} Самооценка<br/>
                          {period.manager_completed ? '' : ''} Оценка руководителя<br/>
                          {period.peer_completed ? '' : ''} Peer Review
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Нет данных о периодах PR
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления командами */}
      {showTeamManagementModal && (
        <div className="modal-overlay" onClick={() => setShowTeamManagementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Управление командами</h2>
              <button className="close-button" onClick={() => setShowTeamManagementModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <h3 style={{ color: '#FF6B00', marginBottom: '15px' }}>Изменить руководителя</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                  Выберите сотрудника:
                </label>
                <select 
                  value={selectedTeamMember} 
                  onChange={(e) => setSelectedTeamMember(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">-- Выберите сотрудника --</option>
                  {teamMembers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                      {emp.manager_name ? ` (текущий: ${emp.manager_name})` : ' (нет руководителя)'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                  Новый руководитель:
                </label>
                <select 
                  value={newManagerId} 
                  onChange={(e) => setNewManagerId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">-- Выберите руководителя --</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.first_name} {mgr.last_name} - {mgr.position}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '20px', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                Изменение руководителя повлияет на процессы оценки и иерархию команды.
              </div>

              <button 
                className="action-button"
                onClick={handleChangeManager}
                style={{ 
                  width: '100%', 
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: '#FF6B00',
                  color: 'white'
                }}
              >
                Изменить руководителя
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
