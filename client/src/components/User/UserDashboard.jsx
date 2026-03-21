/**
 * User Dashboard Component
 * Regular user view showing welcome message and visit statistics
 */

import React, { useState, useEffect } from 'react';
import './UserDashboard.css';

const UserDashboard = ({ user, onLogout, onSwitchRole }) => {
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });
  const [fellowVisitors, setFellowVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        fetch('/api/statistics/daily'),
        fetch('/api/statistics/weekly'),
        fetch('/api/statistics/monthly'),
      ]);

      const daily = await dailyRes.json();
      const weekly = await weeklyRes.json();
      const monthly = await monthlyRes.json();

      setStats({
        daily: daily.count || 0,
        weekly: weekly.count || 0,
        monthly: monthly.count || 0,
      });
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-dashboard">
      {/* Header */}
      <header className="user-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📚 NEU Library Visitor System</h1>
            <p>Welcome to NEU Library!</p>
          </div>
          <div className="header-actions">
            <button className="btn-role" onClick={onSwitchRole}>
              👤 Switch to Admin
            </button>
            <button className="btn-logout" onClick={onLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* User Info Card */}
      <div className="user-info-card">
        <div className="user-greeting">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <h2>Hello, {user.firstName}!</h2>
            <p className="user-email">{user.email}</p>
            <p className="user-college">📍 {user.college}</p>
            {user.isEmployee && <span className="badge badge-employee">Staff/Employee</span>}
          </div>
        </div>
        <div className="visit-count">
          <div className="visit-stat">
            <span className="visit-number">{user.totalVisits}</span>
            <span className="visit-label">Total Visits</span>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-icon">✨</div>
          <h3>Welcome to NEU Library!</h3>
          <p>
            Thank you for visiting our library. This system helps us track visitor patterns and improve our services.
          </p>
          <p className="welcome-subtext">
            Your current role: <strong>Regular User</strong>
          </p>
        </div>
      </div>

      {/* Library Statistics */}
      <div className="library-stats-section">
        <h2>Library Activity Today</h2>
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading statistics...</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <p className="stat-label">Today</p>
                <p className="stat-value">{stats.daily}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">This Week</p>
                <p className="stat-value">{stats.weekly}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <p className="stat-label">This Month</p>
                <p className="stat-value">{stats.monthly}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="info-section">
        <h2>About Your Role</h2>
        <div className="info-grid">
          <div className="info-card">
            <h4>📚 As a Regular User</h4>
            <ul>
              <li>✓ Access your visit history</li>
              <li>✓ View library statistics</li>
              <li>✓ Log in and out efficiently</li>
              <li>✓ See your profile information</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>🔑 Admin Access</h4>
            <p>If you have admin privileges, click "Switch to Admin" to access advanced statistics and filtering options.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
