import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const DevelopmentPlan = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [activeTab, setActiveTab] = useState('plan'); // achievements, improvements, plan - открываем сразу план развития
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/employee/my-recommendations');
      setRecommendations(data);
      
      if (data.length > 0) {
        setSelectedRecommendation(data[0]);
        loadTasks(data[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций:', error);
      setLoading(false);
    }
  };

  const loadTasks = async (recommendationId) => {
    try {
      // Загружаем задачи для этой рекомендации (пока моковые данные)
      setTasks([
        { id: 1, text: 'Пройти курс по лидерству', completed: false, dueDate: '2025-12-01' },
        { id: 2, text: 'Участвовать в кросс-функциональном проекте', completed: true, dueDate: '2025-11-15' },
      ]);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        dueDate: null
      };
      setTasks([...tasks, task]);
      setNewTask('');
      setShowAddTask(false);
    }
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const markAsRead = async (recommendationId) => {
    try {
      await api.post(`/recommendations/mark-read/${recommendationId}`, { type: 'employee' });
      setRecommendations(recommendations.map(rec => 
        rec.id === recommendationId ? { ...rec, is_read: true } : rec
      ));
    } catch (error) {
      console.error('Ошибка отметки прочитанного:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Header user={user} onLogout={onLogout} />
        <div className="dashboard-content" style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ color: '#fff', fontSize: '18px' }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="dashboard">
        <Header user={user} onLogout={onLogout} />
        <div className="dashboard-content">
          <button
            onClick={() => navigate('/employee-dashboard')}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Назад в дашборд
          </button>
          
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '2px dashed rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ color: '#fff', marginBottom: '15px' }}>Пока нет рекомендаций</h2>
            <p style={{ color: '#999', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
              HR отправит вам персонализированные рекомендации по развитию после завершения оценки
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rec = selectedRecommendation;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/employee-dashboard')}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            backgroundColor: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#666'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#555'}
        >
          ← Назад в дашборд
        </button>

        {/* Заголовок страницы */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#FF6B00', fontSize: '32px', marginBottom: '10px' }}>
            Мой план развития
          </h1>
          <p style={{ color: '#999', fontSize: '16px' }}>
            Персонализированные рекомендации от HR для вашего профессионального роста
          </p>
        </div>

        {/* Статистика */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <div style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '5px' }}>
              Задач выполнено
            </div>
            <div style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>
              {completedTasks} / {tasks.length}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(33, 150, 243, 0.3)'
          }}>
            <div style={{ color: '#2196F3', fontSize: '14px', marginBottom: '5px' }}>
              Прогресс
            </div>
            <div style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>
              {progress.toFixed(0)}%
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 107, 0, 0.1)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 107, 0, 0.3)'
          }}>
            <div style={{ color: '#FF6B00', fontSize: '14px', marginBottom: '5px' }}>
              Рекомендаций получено
            </div>
            <div style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>
              {recommendations.length}
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Список рекомендаций */}
          <div>
            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '18px' }}>
              История рекомендаций
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  onClick={() => {
                    setSelectedRecommendation(recommendation);
                    loadTasks(recommendation.id);
                    if (!recommendation.is_read) {
                      markAsRead(recommendation.id);
                    }
                  }}
                  style={{
                    padding: '15px',
                    backgroundColor: selectedRecommendation?.id === recommendation.id 
                      ? 'rgba(255, 107, 0, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: selectedRecommendation?.id === recommendation.id
                      ? '2px solid #FF6B00'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRecommendation?.id !== recommendation.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRecommendation?.id !== recommendation.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {new Date(recommendation.sent_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    {!recommendation.is_read && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#FF6B00',
                        color: '#000',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: '#999', 
                    fontSize: '12px'
                  }}>
                    От: {recommendation.hr_name || 'HR отдел'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Детали выбранной рекомендации */}
          <div>
            {rec && (
              <>
                {/* Вкладки */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  marginBottom: '20px',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {[
                    { id: 'achievements', label: 'Достижения', color: '#4CAF50' },
                    { id: 'improvements', label: 'Области улучшения', color: '#2196F3' },
                    { id: 'plan', label: 'План развития', color: '#FF6B00' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        color: activeTab === tab.id ? tab.color : '#999',
                        border: 'none',
                        borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: activeTab === tab.id ? '600' : '400',
                        transition: 'all 0.2s',
                        marginBottom: '-2px'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Контент вкладок */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '25px',
                  borderRadius: '12px',
                  minHeight: '300px'
                }}>
                  {activeTab === 'achievements' && (
                    <div>
                      <h3 style={{ 
                        color: '#4CAF50', 
                        marginBottom: '15px',
                        fontSize: '20px'
                      }}>
                        Ваши достижения
                      </h3>
                      <div style={{
                        color: '#ccc',
                        fontSize: '15px',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {rec.achievements}
                      </div>
                    </div>
                  )}

                  {activeTab === 'improvements' && (
                    <div>
                      <h3 style={{ 
                        color: '#2196F3', 
                        marginBottom: '15px',
                        fontSize: '20px'
                      }}>
                        Области для улучшения
                      </h3>
                      <div style={{
                        color: '#ccc',
                        fontSize: '15px',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {rec.improvements}
                      </div>
                    </div>
                  )}

                  {activeTab === 'plan' && (
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <h3 style={{ 
                          color: '#FF6B00', 
                          margin: 0,
                          fontSize: '20px'
                        }}>
                          План развития
                        </h3>
                        <button
                          onClick={() => setShowAddTask(true)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          + Добавить задачу
                        </button>
                      </div>

                      {/* Рекомендации HR */}
                      <div style={{
                        padding: '15px',
                        backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        borderLeft: '4px solid #FF6B00'
                      }}>
                        <div style={{ 
                          color: '#FF6B00', 
                          fontSize: '13px',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          Рекомендации от HR:
                        </div>
                        <div style={{
                          color: '#ccc',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {rec.development_plan}
                        </div>
                      </div>

                      {/* Форма добавления задачи */}
                      {showAddTask && (
                        <div style={{
                          padding: '15px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          marginBottom: '15px'
                        }}>
                          <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Введите описание задачи..."
                            style={{
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#2a2a2a',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '14px',
                              marginBottom: '10px'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTask();
                              }
                            }}
                          />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={handleAddTask}
                              style={{
                                padding: '8px 20px',
                                backgroundColor: '#4CAF50',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                            >
                              Добавить
                            </button>
                            <button
                              onClick={() => {
                                setShowAddTask(false);
                                setNewTask('');
                              }}
                              style={{
                                padding: '8px 20px',
                                backgroundColor: 'transparent',
                                color: '#999',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Список задач */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {tasks.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#999',
                            fontSize: '14px'
                          }}>
                            Пока нет задач. Добавьте первую задачу для отслеживания прогресса!
                          </div>
                        ) : (
                          tasks.map(task => (
                            <div
                              key={task.id}
                              style={{
                                padding: '15px',
                                backgroundColor: task.completed 
                                  ? 'rgba(76, 175, 80, 0.1)' 
                                  : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: task.completed
                                  ? '1px solid rgba(76, 175, 80, 0.3)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTaskComplete(task.id)}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer'
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  color: task.completed ? '#999' : '#fff',
                                  fontSize: '14px',
                                  textDecoration: task.completed ? 'line-through' : 'none'
                                }}>
                                  {task.text}
                                </div>
                                {task.dueDate && (
                                  <div style={{
                                    color: '#666',
                                    fontSize: '12px',
                                    marginTop: '5px'
                                  }}>
                                    Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteTask(task.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: 'transparent',
                                  color: '#f44336',
                                  border: '1px solid #f44336',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Удалить
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Прогресс-бар */}
                      {tasks.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                          }}>
                            <span style={{ color: '#999', fontSize: '13px' }}>
                              Общий прогресс
                            </span>
                            <span style={{ color: '#4CAF50', fontSize: '13px', fontWeight: '600' }}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              backgroundColor: '#4CAF50',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentPlan;
