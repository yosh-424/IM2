/**
 * Visitor Logs Component
 * Display list of visitors who have checked in
 */

import React, { useState, useEffect } from 'react';
import './VisitorLogs.css';

const VisitorLogs = ({ user, onLogout }) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchVisitors();
  }, [filterDate]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch visit logs for the selected date
      const response = await fetch(`/api/visit-logs?date=${filterDate}`);
      const data = await response.json();

      if (data.success) {
        setVisitors(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch visitor logs');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="visitor-logs-container">
      {/* Header */}
      <header className="logs-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📚 NEU Library</h1>
            <p>Welcome to the NEU Library!</p>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* User Info */}
      <div className="user-info-bar">
        <div className="user-info">
          <span className="info-label">Logged in as:</span>
          <span className="user-email">{user.email}</span>
        </div>
        <div className="checkin-info">
          <span className="info-label">Reason for visit:</span>
          <span className="visit-reason">{user.visitReason}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-container">
          <label htmlFor="date-filter">📅 Filter by Date:</label>
          <input
            id="date-filter"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      {/* Visitor Logs */}
      <div className="logs-content">
        <h2>Visitor Check-In Logs</h2>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading visitor logs...</div>
        ) : visitors.length === 0 ? (
          <div className="no-data">
            <p>No visitors recorded for {filterDate}</p>
          </div>
        ) : (
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>College</th>
                  <th>Check-In Time</th>
                  <th>Reason for Visit</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td className="email-cell">{visitor.email}</td>
                    <td className="name-cell">
                      {visitor.firstName} {visitor.lastName}
                    </td>
                    <td className="college-cell">{visitor.college}</td>
                    <td className="time-cell">
                      {formatTime(visitor.checkInTime)}
                    </td>
                    <td className="reason-cell">{visitor.visitPurpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="logs-footer">
          <p className="total-visitors">
            Total visitors today: <strong>{visitors.length}</strong>
          </p>
          <button className="btn-refresh" onClick={fetchVisitors}>
            ↻ Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorLogs;
