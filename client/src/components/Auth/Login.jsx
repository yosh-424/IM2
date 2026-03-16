/**
 * Login Component
 * Authentication page with separate flows for users and admins
 */

import React, { useState, useEffect } from 'react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [visitReason, setVisitReason] = useState('Study');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setColleges(data.data);
          if (data.data.length > 0) {
            setSelectedCollege(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load colleges:', err);
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  const validateEmail = (emailValue) => {
    const neu_regex = /.+@neu\.edu\.ph$/i;
    return neu_regex.test(emailValue);
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('You must enter your NEU institutional email (@neu.edu.ph)');
      return;
    }

    if (!visitReason.trim()) {
      setError('Please enter a reason for visiting');
      return;
    }

    if (!selectedCollege) {
      setError('Please select a college');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          visitReason: visitReason.trim(),
          collegeId: selectedCollege,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      setSuccess(data.message);
      setEmail('');
      setVisitReason('Study');

      if (onLoginSuccess) {
        onLoginSuccess(data.data, data.data.role || 'visitor');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('You must enter your NEU institutional email (@neu.edu.ph)');
      return;
    }

    if (!adminPassword) {
      setError('Please enter the admin password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Admin login failed');
        return;
      }

      setSuccess(data.message);
      setEmail('');
      setAdminPassword('');

      if (onLoginSuccess) {
        onLoginSuccess(data.data, data.data.role || 'admin');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>📚 NEU Library</h1>
          <p>Visitor Management System</p>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`toggle-btn ${loginMode === 'user' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('user');
              setError('');
              setSuccess('');
              setEmail('');
              setAdminPassword('');
            }}
          >
            👤 Visitor Login
          </button>
          <button
            className={`toggle-btn ${loginMode === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('admin');
              setError('');
              setSuccess('');
              setEmail('');
              setAdminPassword('');
            }}
          >
            👑 Admin Login
          </button>
        </div>

        {/* User Login Form */}
        {loginMode === 'user' && (
          <form onSubmit={handleUserLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">NEU Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@neu.edu.ph"
                className="login-input"
                disabled={loading}
              />
              <p className="email-hint">Must be a NEU institutional email (@neu.edu.ph)</p>
            </div>

            <div className="form-group">
              <label htmlFor="visitReason">Reason for Visiting</label>
              <input
                id="visitReason"
                type="text"
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                placeholder="e.g., Study, Research, Group Project"
                className="login-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="college">College/Unit</label>
              <select
                id="college"
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="login-input"
                disabled={loading || collegesLoading}
              >
                <option value="">Select a college...</option>
                {colleges.map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        )}

        {/* Admin Login Form */}
        {loginMode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="admin-email">NEU Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@neu.edu.ph"
                className="login-input"
                disabled={loading}
              />
              <p className="email-hint">Must be a NEU institutional email (@neu.edu.ph)</p>
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Admin Password</label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="login-input"
                disabled={loading}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Admin Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
