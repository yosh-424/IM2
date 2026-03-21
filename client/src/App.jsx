/**
 * App Component
 * Main React application wrapper with multi-step visitor flow
 */

import React, { useState, useEffect } from 'react';
import HeroPage from './components/Hero/HeroPage';
import Login from './components/Auth/Login';
import ProfileSetup from './components/Auth/ProfileSetup';
import VisitReason from './components/Auth/VisitReason';
import VisitorLogs from './components/VisitorLogs/VisitorLogs';
import AdminDashboard from './components/Admin/AdminDashboard';
import './App.css';

// Pages: hero → login → profile-setup → visit-reason → visitor-logs | admin-dashboard
function App() {
  const [page, setPage] = useState('hero');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedRole = localStorage.getItem('userRole');
    if (storedUser && storedRole) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setUserRole(storedRole);

        if (storedRole === 'admin') {
          setPage('admin-dashboard');
        } else if (parsed.isEmployee) {
          // Returning staff — go to visit reason skip, straight to logs
          setPage('visit-reason');
        } else {
          // Returning visitor — go to visit reason
          setPage('visit-reason');
        }
      } catch (err) {
        console.error('Failed to restore user session:', err);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
      }
    }
    setLoading(false);
  }, []);

  const handleEnterFromHero = () => {
    setShowLogin(true);
  };

  const handleBackToHero = () => {
    setShowLogin(false);
  };

  const handleLoginSuccess = (userData, role) => {
    setUser(userData);
    setUserRole(role);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('userRole', role);

    if (role === 'admin') {
      setPage('admin-dashboard');
    } else if (userData.isEmployee) {
      // Staff/faculty: auto-log and go straight to visitor logs
      autoLogStaff(userData);
    } else if (!userData.profileComplete) {
      setPage('profile-setup');
    } else {
      setPage('visit-reason');
    }
    setShowLogin(false);
  };

  const autoLogStaff = async (staffUser) => {
    try {
      const response = await fetch('/api/auth/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: staffUser.id, visitReason: 'Staff/Faculty' }),
      });
      await response.json();
    } catch (err) {
      console.error('Staff auto-log error:', err);
    }
    setPage('visitor-logs');
  };

  const handleProfileComplete = (updatedUser) => {
    const merged = { ...user, ...updatedUser, profileComplete: true };
    setUser(merged);
    localStorage.setItem('currentUser', JSON.stringify(merged));
    setPage('visit-reason');
  };

  const handleCheckIn = () => {
    setPage('visitor-logs');
  };

  const handleEditProfile = () => {
    setPage('edit-profile');
  };

  const handleEditProfileComplete = (updatedUser) => {
    const merged = { ...user, ...updatedUser, profileComplete: true };
    setUser(merged);
    localStorage.setItem('currentUser', JSON.stringify(merged));
    setPage('visitor-logs');
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    setPage('hero');
    setShowLogin(false);
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
      {page === 'hero' && (
        <HeroPage onEnter={handleEnterFromHero} showLogin={showLogin}>
          {showLogin && (
            <Login onLoginSuccess={handleLoginSuccess} onBack={handleBackToHero} />
          )}
        </HeroPage>
      )}
      {page === 'profile-setup' && user && (
        <ProfileSetup user={user} onProfileComplete={handleProfileComplete} />
      )}
      {page === 'visit-reason' && user && (
        <VisitReason user={user} onCheckIn={handleCheckIn} />
      )}
      {page === 'visitor-logs' && user && (
        <VisitorLogs user={user} onLogout={handleLogout} onEditProfile={handleEditProfile} />
      )}
      {page === 'edit-profile' && user && (
        <ProfileSetup user={user} onProfileComplete={handleEditProfileComplete} isEdit />
      )}
      {page === 'admin-dashboard' && user && (
        <AdminDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
