import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SelfAssessment from './pages/SelfAssessment';
import PeerFeedback from './pages/PeerFeedback';
import TeamPage from './pages/TeamPage';
import ManagerEvaluation from './pages/ManagerEvaluation';
import EmployeeDetails from './pages/EmployeeDetails';
import PotentialAssessment from './pages/PotentialAssessment';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверяем, есть ли сохраненный пользователь
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Защищенный роут
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to={`/${user.role}`} replace /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/self-assessment" element={
            <ProtectedRoute allowedRoles={['employee', 'manager']}>
              <SelfAssessment user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/peer-feedback" element={
            <ProtectedRoute allowedRoles={['employee', 'manager']}>
              <PeerFeedback user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/team" element={
            <ProtectedRoute allowedRoles={['manager', 'hr', 'admin']}>
              <TeamPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/employee/:employeeId" element={
            <ProtectedRoute allowedRoles={['manager', 'hr', 'admin']}>
              <EmployeeDetails user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/manager-evaluation" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerEvaluation user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/potential-assessment" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <PotentialAssessment user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['hr']}>
              <HRDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
