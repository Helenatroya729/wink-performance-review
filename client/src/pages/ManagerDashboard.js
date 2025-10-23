import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const ManagerDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [teamGoals, setTeamGoals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted'); // submitted, draft, approved, all
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingGoal, setRejectingGoal] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, statsData] = await Promise.all([
        api.goals.getAll(),
        api.dashboard.getStats()
      ]);
      setTeamGoals(goalsData);
      setStats(statsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (goalId) => {
    if (!window.confirm('Утвердить эту цель?')) {
      return;
    }

    try {
      await api.goals.update(goalId, { status: 'approved' });
      alert('Цель утверждена! Сотрудник получит уведомление.');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleRejectClick = (goal) => {
    setRejectingGoal(goal);
    setRejectComment('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectComment.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    try {
      await api.goals.update(rejectingGoal.id, { 
        status: 'rejected',
        rejection_comment: rejectComment 
      });
      alert('Цель отклонена. Сотрудник получит уведомление с комментарием.');
      setShowRejectModal(false);
      setRejectingGoal(null);
      setRejectComment('');
      loadData();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Черновик',
      'submitted': 'На утверждении',
      'approved': 'Утверждено',
      'rejected': 'Отклонено'
    };
    return labels[status] || status;
  };

  const filteredGoals = teamGoals.filter(goal => 
    filter === 'all' ? true : goal.status === filter
  );

  const pendingCount = teamGoals.filter(g => g.status === 'submitted').length;

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Панель руководителя</h1>
          <p>Управление командой и оценка сотрудников</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => navigate('/team')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{stats.team_size || 0}</div>
            <div className="stat-label">Сотрудников в команде</div>
          </div>
          <div className="stat-card clickable" style={{ borderColor: '#FF6B00', cursor: 'pointer' }} onClick={() => setFilter('submitted')}>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Ожидают утверждения</div>
          </div>
          <div className="stat-card clickable" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{stats.team_goals || 0}</div>
            <div className="stat-label">Всего целей команды</div>
          </div>
          <div className="stat-card clickable" onClick={() => setFilter('approved')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{teamGoals.filter(g => g.status === 'approved').length}</div>
            <div className="stat-label">Целей утверждено</div>
          </div>
        </div>

        <div className="quick-actions">
          <div className="action-card clickable" onClick={() => setFilter('submitted')} style={{ borderColor: '#FF6B00', cursor: 'pointer' }}>
            <div className="action-title">Утвердить цели</div>
          </div>
          <div className="action-card clickable" onClick={() => navigate('/manager-evaluation')} style={{ cursor: 'pointer' }}>
            <div className="action-title">Оценить сотрудников</div>
          </div>
          <div className="action-card clickable" onClick={() => navigate('/potential-assessment')} style={{ cursor: 'pointer' }}>
            <div className="action-title">Оценка потенциала</div>
          </div>
          <div className="action-card clickable" onClick={() => navigate('/team')} style={{ cursor: 'pointer' }}>
            <div className="action-title">Моя команда</div>
          </div>
          <div className="action-card clickable" onClick={() => navigate('/self-assessment')} style={{ cursor: 'pointer', borderColor: '#2196f3' }}>
            <div className="action-title">Моя самооценка</div>
          </div>
          <div className="action-card clickable" onClick={() => navigate('/peer-feedback')} style={{ cursor: 'pointer', borderColor: '#2196f3' }}>
            <div className="action-title">Оценка коллег</div>
          </div>
        </div>

        <div className="content-grid">
          <div className="main-content">
            <div className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-title">Цели команды на утверждение</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
                    onClick={() => setFilter('submitted')}
                  >
                    На утверждении ({teamGoals.filter(g => g.status === 'submitted').length})
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                  >
                    Утверждено ({teamGoals.filter(g => g.status === 'approved').length})
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilter('rejected')}
                  >
                    Отклонено ({teamGoals.filter(g => g.status === 'rejected').length})
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    Все ({teamGoals.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
              ) : filteredGoals.length > 0 ? (
                <div className="goals-list">
                  {filteredGoals.map(goal => (
                    <div key={goal.id} className="goal-item-manager">
                      <div className="goal-employee-info">
                        <h4>{goal.first_name} {goal.last_name}</h4>
                        <span className="employee-position">{goal.position || 'Сотрудник'}</span>
                      </div>
                      
                      <div className="goal-content">
                        <div className="goal-header">
                          <h3>{goal.title}</h3>
                          <span className={`goal-status ${goal.status === 'submitted' ? 'in-progress' : goal.status === 'approved' ? 'approved' : goal.status === 'rejected' ? 'rejected' : 'planned'}`}>
                            {getStatusLabel(goal.status)}
                          </span>
                        </div>
                        
                        {goal.description && (
                          <p style={{ color: '#999', fontSize: '14px', margin: '8px 0' }}>
                            {goal.description}
                          </p>
                        )}
                        
                        {goal.expected_results && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '4px' }}>
                            <strong style={{ color: '#FF6B00', fontSize: '13px' }}>Ожидаемый результат:</strong>
                            <p style={{ color: '#ccc', fontSize: '13px', margin: '4px 0 0 0' }}>{goal.expected_results}</p>
                          </div>
                        )}
                        
                        {goal.key_tasks && (
                          <div style={{ marginTop: '8px' }}>
                            <strong style={{ color: '#999', fontSize: '13px' }}>Ключевые задачи:</strong>
                            <p style={{ color: '#aaa', fontSize: '13px', margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>{goal.key_tasks}</p>
                          </div>
                        )}
                        
                        {goal.expected_deadline && (
                          <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                            <strong>Срок:</strong> {new Date(goal.expected_deadline).toLocaleDateString('ru-RU')}
                          </p>
                        )}

                        {goal.rejection_comment && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(244,67,54,0.1)', borderLeft: '3px solid #f44336', borderRadius: '4px' }}>
                            <strong style={{ color: '#f44336', fontSize: '13px' }}>Причина отклонения:</strong>
                            <p style={{ color: '#ccc', fontSize: '13px', margin: '4px 0 0 0' }}>{goal.rejection_comment}</p>
                          </div>
                        )}
                        
                        {goal.status === 'submitted' && (
                          <div className="goal-actions" style={{ marginTop: '16px' }}>
                            <button 
                              className="btn-action btn-approve"
                              onClick={() => handleApprove(goal.id)}
                            >
                              Утвердить цель
                            </button>
                            <button 
                              className="btn-action btn-reject"
                              onClick={() => handleRejectClick(goal)}
                            >
                              Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  {filter === 'submitted' ? 'Нет целей на утверждении' : 
                   filter === 'approved' ? 'Нет утвержденных целей' :
                   filter === 'rejected' ? 'Нет отклоненных целей' :
                   'Нет целей от команды'}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <div className="section-card">
              <h2 className="section-title">Действия требуют внимания</h2>
              <div style={{ padding: '12px 0' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6B00' }}>{pendingCount}</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>Целей на утверждении</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {teamGoals.filter(g => g.status === 'approved').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#999' }}>Целей утверждено</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && rejectingGoal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Отклонение цели</h2>
            
            <div style={{ padding: '16px', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
                Сотрудник: <strong>{rejectingGoal.first_name} {rejectingGoal.last_name}</strong>
              </p>
              <p style={{ color: '#999', fontSize: '13px' }}>
                Цель: <strong>{rejectingGoal.title}</strong>
              </p>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group">
                <label htmlFor="reject-comment">
                  Причина отклонения <span style={{ color: '#f44336' }}>*</span>
                </label>
                <textarea
                  id="reject-comment"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Укажите, что необходимо исправить или изменить в цели..."
                  rows="6"
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#f44336' }}>
                  Отклонить цель
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingGoal(null);
                    setRejectComment('');
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
