import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api';
import './Dashboard.css';

const TeamPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.error('User is not defined!');
        return;
      }
      
      const users = await api.users.getAll();
      
      let team;
      if (user.role === 'manager') {
        // Для менеджера показываем только его команду (исключая самого себя)
        team = users.filter(u => u.manager_id === user.id && u.id !== user.id);
      } else {
        // Для HR и admin показываем всех сотрудников и менеджеров
        team = users.filter(u => u.role === 'employee' || u.role === 'manager');
      }
      
      setTeamMembers(team);
    } catch (error) {
      console.error('Ошибка загрузки команды:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'employee': 'Сотрудник',
      'manager': 'Руководитель'
    };
    return labels[role] || role;
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button 
              onClick={() => navigate(user.role === 'manager' ? '/manager' : `/${user.role}`)} 
              className="btn-back"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              ← Назад
            </button>
            <div>
              <h1>{user.role === 'manager' ? 'Моя команда' : 'Команда'}</h1>
              <p>{user.role === 'manager' ? 'Список сотрудников вашей команды' : 'Список всех сотрудников и руководителей'}</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>
          ) : teamMembers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--wink-light-gray)' }}>
              {user.role === 'manager' ? 'У вас пока нет сотрудников в команде' : 'Нет данных о сотрудниках'}
            </div>
          ) : (
            <div className="team-grid">
              {teamMembers.map(member => (
                <div 
                  key={member.id} 
                  className="team-member-card"
                  onClick={() => navigate(`/employee/${member.id}`)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 107, 53, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="member-avatar">
                    {member.first_name?.[0]}{member.last_name?.[0]}
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="member-position">
                      {member.position || getRoleLabel(member.role)}
                    </p>
                    <p className="member-email">{member.email}</p>
                    <span className={`member-role-badge ${member.role}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
