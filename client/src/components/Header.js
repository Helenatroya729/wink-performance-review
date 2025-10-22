import React from 'react';
import './Header.css';
import WinkLogo from '../assets/wink-logo.svg';

const Header = ({ user, onLogout }) => {
  const getRoleName = (role) => {
    const roles = {
      employee: 'Сотрудник',
      manager: 'Руководитель',
      hr: 'HR',
      admin: 'Администратор'
    };
    return roles[role] || role;
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo-section">
          <img src={WinkLogo} alt="WINK" className="logo-small" />
          <div className="logo-text">
            <span className="logo-title">Performance Review</span>
          </div>
        </div>
        
        <div className="user-section">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{getRoleName(user.role)}</span>
          </div>
          <button onClick={onLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
