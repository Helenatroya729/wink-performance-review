// API клиент для работы с бэкендом
const API_URL = process.env.REACT_APP_API_URL || 'https://wink.shine2fine.keenetic.link:5000/api';

// Получение токена из localStorage
const getToken = () => localStorage.getItem('token');

// Получение базового URL
const getBaseUrl = () => API_URL;

// Базовая функция для выполнения запросов
const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  };

  // Добавляем токен если есть
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка сервера');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// API методы
const api = {
  // Универсальные методы
  get: (endpoint) => fetchAPI(endpoint),
  
  post: (endpoint, data) => 
    fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  getBaseUrl: getBaseUrl,
  
  // Аутентификация
  auth: {
    login: (email, password) => 
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    
    me: () => fetchAPI('/auth/me'),
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Пользователи
  users: {
    getAll: () => fetchAPI('/users'),
    
    getById: (id) => fetchAPI(`/users/${id}`),
  },

  // Циклы оценки
  cycles: {
    getAll: () => fetchAPI('/cycles'),
    
    create: (data) => 
      fetchAPI('/cycles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    getById: (id) => fetchAPI(`/cycles/${id}`),
  },

  // Цели
  goals: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchAPI(`/goals${query ? '?' + query : ''}`);
    },
    
    create: (data) =>
      fetchAPI('/goals', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id, data) =>
      fetchAPI(`/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    
    delete: (id) =>
      fetchAPI(`/goals/${id}`, {
        method: 'DELETE'
      })
  },

  // Дашборд статистика
  dashboard: {
    getStats: () => fetchAPI('/dashboard/stats')
  },

  // Рейтинг сотрудника
  employee: {
    getMyRating: () => fetchAPI('/employee/my-rating')
  },

  // Оценка от коллег
  peerFeedback: {
    getColleagues: () => fetchAPI('/peer-feedback/colleagues'),
    
    requestFeedback: (data) =>
      fetchAPI('/peer-feedback/request', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    getMyRequests: () => fetchAPI('/peer-feedback/my-requests'),
    
    getPendingReviews: () => fetchAPI('/peer-feedback/pending-reviews'),
    
    submitFeedback: (data) =>
      fetchAPI('/peer-feedback/submit', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    getReceived: () => fetchAPI('/peer-feedback/received'),
    getByEmployee: (employeeId, periodId) => {
      const url = periodId 
        ? `/peer-feedback/employee/${employeeId}?periodId=${periodId}`
        : `/peer-feedback/employee/${employeeId}`;
      return fetchAPI(url);
    }
  },

  // Оценка менеджера
  managerEvaluation: {
    submit: (data) =>
      fetchAPI('/manager-evaluation/submit', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    getByEmployee: (employeeId, cycleId) => {
      if (cycleId) {
        return fetchAPI(`/manager-evaluation/employee/${employeeId}/cycle/${cycleId}`);
      }
      return fetchAPI(`/manager-evaluation/employee/${employeeId}`);
    }
  },

  // Оценка потенциала сотрудника
  potentialAssessment: {
    submit: (data) =>
      fetchAPI('/potential-assessment/submit', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    getByEmployee: (employeeId) =>
      fetchAPI(`/potential-assessment/employee/${employeeId}`)
  },

  // Performance Review - управление циклом
  performanceReview: {
    // Получить статус PR для сотрудника
    getStatus: (periodId = null) => 
      periodId 
        ? fetchAPI(`/performance-review/status/${periodId}`)
        : fetchAPI('/performance-review/status'),
    
    // Запросить досрочное начало
    requestEarly: (periodId, comment) =>
      fetchAPI(`/performance-review/request-early/${periodId}`, {
        method: 'POST',
        body: JSON.stringify({ comment })
      }),
    
    // Получить список запросов на одобрение (для руководителя/HR)
    getPendingRequests: () => fetchAPI('/performance-review/pending-requests'),
    
    // Решение руководителя
    managerDecision: (statusId, approved, comment) =>
      fetchAPI(`/performance-review/manager-decision/${statusId}`, {
        method: 'POST',
        body: JSON.stringify({ approved, comment })
      }),
    
    // Решение HR
    hrDecision: (statusId, { approved, comment }) =>
      fetchAPI(`/performance-review/hr-decision/${statusId}`, {
        method: 'POST',
        body: JSON.stringify({ approved, comment })
      }),
    
    // Менеджер запрашивает досрочное начало для сотрудника
    managerRequestEarly: (userId, periodId, reason) =>
      fetchAPI('/performance-review/manager-request-early', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, period_id: periodId, reason })
      })
  },

  // Индивидуальные периоды оценки
  employeeReviewPeriods: {
    get: (userId = null) => 
      userId 
        ? fetchAPI(`/employee-review-periods/${userId}`)
        : fetchAPI('/employee-review-periods')
  },

  // Новые endpoints для workflow утверждения
  reviewPeriods: {
    // Получить свои периоды со статусами
    getMy: () => fetchAPI('/review-periods/my'),
    
    // Запросить ранний PR
    requestEarly: (periodId) =>
      fetchAPI(`/review-periods/${periodId}/request-early`, {
        method: 'POST'
      }),
    
    // Утверждение руководителем
    managerApprove: (periodId) =>
      fetchAPI(`/review-periods/${periodId}/manager-approve`, {
        method: 'POST'
      }),
    
    // Отклонение руководителем
    managerReject: (periodId, reason) =>
      fetchAPI(`/review-periods/${periodId}/manager-reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    
    // Утверждение HR
    hrApprove: (periodId) =>
      fetchAPI(`/review-periods/${periodId}/hr-approve`, {
        method: 'POST'
      }),
    
    // Получить периоды для утверждения руководителем
    getPendingManagerApproval: () => fetchAPI('/review-periods/pending-manager-approval'),
    
    // Получить периоды для утверждения HR
    getPendingHRApproval: () => fetchAPI('/review-periods/pending-hr-approval'),
    
    // Завершить самооценку
    completeSelfAssessment: (periodId) =>
      fetchAPI(`/review-periods/${periodId}/complete-self-assessment`, {
        method: 'POST'
      })
  },

  // Health check
  health: () => fetchAPI('/health'),

  // Методы для менеджера
  manager: {
    // Получить детальную информацию о сотруднике
    getEmployeeDetails: (employeeId, cycleId = null) => {
      const query = cycleId ? `?cycleId=${cycleId}` : '';
      return fetchAPI(`/manager/employee/${employeeId}/details${query}`);
    },

    // Получить периоды команды
    getTeamPeriods: () => fetchAPI('/manager/team-employee-periods'),

    // Запросить ранний PR
    requestEarlyReview: (employeeId, reason) =>
      fetchAPI('/manager/request-early-review', {
        method: 'POST',
        body: JSON.stringify({ employeeId, reason })
      })
  }
};

export default api;
