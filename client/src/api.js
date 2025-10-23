// API клиент для работы с бэкендом
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Получение токена из localStorage
const getToken = () => localStorage.getItem('token');

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
    
    getReceived: () => fetchAPI('/peer-feedback/received')
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

  // Health check
  health: () => fetchAPI('/health')
};

export default api;
