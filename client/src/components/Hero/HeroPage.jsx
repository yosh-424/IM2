import React, { useState, useEffect } from 'react';
import './HeroPage.css';

const HeroPage = ({ onEnter, showLogin, children }) => {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Convert to UTC+8
      const utc8 = new Date(now.getTime() + (8 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
      setTime(utc8.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
      setDateStr(utc8.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-container">
      <div className="hero-overlay">
        <div className="hero-clock">
          <div className="clock-time">{time}</div>
          <div className="clock-date">{dateStr}</div>
        </div>

        <div className={`hero-main ${showLogin ? 'hero-main-hidden' : ''}`}>
          <h1 className="hero-welcome">Welcome</h1>
          <p className="hero-title">NEU Library Log</p>
          <p className="hero-subtitle">New Era University Library Visitor Log</p>

          <button className="hero-enter-btn" onClick={onEnter}>
            Enter Library
          </button>
        </div>

        {children && (
          <div className="hero-login-overlay">
            {children}
          </div>
        )}

        <div className={`hero-footer ${showLogin ? 'hero-footer-hidden' : ''}`}>
          <a href="https://neu.edu.ph" target="_blank" rel="noopener noreferrer" className="hero-link">
            neu.edu.ph
          </a>
        </div>
      </div>
    </div>
  );
};

export default HeroPage;
