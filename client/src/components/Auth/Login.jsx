/**
 * Login Component
 * Authentication page with Google Sign-In for students and admins
 */

import React, { useState, useEffect, useCallback } from 'react';
import './Login.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = ({ onLoginSuccess, onBack }) => {
  const [loginMode, setLoginMode] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleResponse = useCallback(async (response) => {
    const credential = response.credential;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (loginMode === 'user') {
        const res = await fetch('/api/auth/user-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Login failed');
          setLoading(false);
          return;
        }

        setSuccess(data.message);
        if (onLoginSuccess) {
          onLoginSuccess(data.data, data.data.role || 'visitor');
        }
      } else {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Admin login failed');
          setLoading(false);
          return;
        }

        setSuccess(data.message);
        if (onLoginSuccess) {
          onLoginSuccess(data.data, data.data.role || 'admin');
        }
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }, [loginMode, onLoginSuccess]);

  useEffect(() => {
    globalThis.__handleGoogleResponse = handleGoogleResponse;

    const initializeGoogle = () => {
      if (globalThis.google?.accounts?.id) {
        globalThis.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => globalThis.__handleGoogleResponse(response),
          auto_select: false,
        });

        const buttonContainer = document.getElementById('google-signin-btn');
        if (buttonContainer) {
          buttonContainer.innerHTML = '';
          globalThis.google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      }
    };

    if (globalThis.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (globalThis.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loginMode, handleGoogleResponse]);

  return (
    <div className="login-container">
      <div className="login-box">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        )}

        <div className="login-header">
          <h1>NEU Library Log</h1>
          <p>Sign in to continue</p>
        </div>

        <div className="mode-toggle">
          <button
            className={`toggle-btn ${loginMode === 'user' ? 'active' : ''}`}
            onClick={() => { setLoginMode('user'); setError(''); setSuccess(''); }}
          >
            Student/Staff Login
          </button>
          <button
            className={`toggle-btn ${loginMode === 'admin' ? 'active' : ''}`}
            onClick={() => { setLoginMode('admin'); setError(''); setSuccess(''); }}
          >
            Admin Login
          </button>
        </div>

        <div className="login-form">
          {loginMode === 'user' && (
            <p className="login-info">Sign in with your NEU institutional email (@neu.edu.ph)</p>
          )}
          {loginMode === 'admin' && (
            <p className="login-info">Sign in with your authorized admin account</p>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="google-signin-wrapper">
            <div id="google-signin-btn" className="google-btn-container"></div>
          </div>

          {loading && <div className="loading-text">Signing in...</div>}
        </div>
      </div>
    </div>
  );
};

export default Login;
