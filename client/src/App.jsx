/**
 * App Component
 * Main React application wrapper with role-based access control
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import VisitorLogs from './components/VisitorLogs/VisitorLogs';
import AdminDashboard from './components/Admin/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'visitor' or 'admin'
  const [loading, setLoading] = useState(true);

  // Check for stored user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedRole = localStorage.getItem('userRole');
    if (storedUser && storedRole) {
      try {
        setUser(JSON.parse(storedUser));
        setUserRole(storedRole);
      } catch (err) {
        console.error('Failed to restore user session:', err);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData, role) => {
    setUser(userData);
    setUserRole(role);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : userRole === 'admin' ? (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout}
        />
      ) : (
        <VisitorLogs 
          user={user} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
