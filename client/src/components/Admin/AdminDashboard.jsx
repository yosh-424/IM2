/**
 * Enhanced Admin Dashboard
 * Displays comprehensive visitor statistics with college breakdown and visitor management
 */

import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [period, setPeriod] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });

  const [collegeStats, setCollegeStats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [allColleges, setAllColleges] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllStatistics();
  }, []);

  useEffect(() => {
    // Always load today's data on component mount
    searchVisitors();
  }, []);

  useEffect(() => {
    // Search whenever search query or college filter changes
    searchVisitors();
  }, [searchQuery, selectedCollege]);

  useEffect(() => {
    // Load data whenever date changes
    searchVisitors();
  }, [selectedDate]);

  const fetchAllStatistics = async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes, monthlyRes, topCollegesRes, collegesRes] = await Promise.all([
        fetch('/api/statistics/daily'),
        fetch('/api/statistics/weekly'),
        fetch('/api/statistics/monthly'),
        fetch(`/api/statistics/top-colleges/${period}`),
        fetch('/api/colleges'),
      ]);

      const daily = await dailyRes.json();
      const weekly = await weeklyRes.json();
      const monthly = await monthlyRes.json();
      const topColleges = await topCollegesRes.json();
      const collegesData = await collegesRes.json();

      setStats({
        daily: daily.count || 0,
        weekly: weekly.count || 0,
        monthly: monthly.count || 0,
      });

      setCollegeStats(topColleges.data || []);
      setAllColleges(collegesData.data || []);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchVisitors = async () => {
    try {
      const params = new URLSearchParams();

      // Add search term if present
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      // Add date if not "all" or empty
      if (selectedDate && selectedDate !== 'all' && selectedDate !== '') {
        params.append('date', selectedDate);
      }

      // Add college if not "all" or empty
      if (selectedCollege && selectedCollege !== 'all' && selectedCollege !== '') {
        params.append('college', selectedCollege);
      }

      const apiUrl = `/api/statistics/search-visitors?${params.toString()}`;
      console.log('Admin Search - URL:', apiUrl);
      console.log('Admin Search - Filters:', { search: searchQuery, date: selectedDate, college: selectedCollege });

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        console.log('Admin Search - Results:', data.data.length, 'records found');
        setSearchResults(data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  const handleBlockVisitor = async (visitorId, email) => {
    const reason = window.prompt(`Enter reason for blocking ${email}:`, 'Suspicious activity');
    if (reason === null) return;

    try {
      const response = await fetch('/api/admin/visitors/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, reason: reason || 'Blocked by admin' }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✓ Visitor ${email} has been blocked`);
        searchVisitors();
      } else {
        alert(`✗ Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Block error:', err);
      alert(`✗ Failed to block visitor: ${err.message}`);
    }
  };

  const handleUnblockVisitor = async (visitorId, email) => {
    try {
      const response = await fetch('/api/admin/visitors/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✓ Visitor ${email} has been unblocked`);
        searchVisitors();
      } else {
        alert(`✗ Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Unblock error:', err);
      alert(`✗ Failed to unblock visitor: ${err.message}`);
    }
  };

  const handlePeriodChange = async (newPeriod) => {
    setPeriod(newPeriod);
    try {
      const response = await fetch(`/api/statistics/top-colleges/${newPeriod}`);
      const data = await response.json();
      setCollegeStats(data.data || []);
    } catch (err) {
      console.error('Period change error:', err);
    }
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="header-title">
            <h1>👑 Admin Dashboard</h1>
            <p>Monitor and manage library visitors</p>
          </div>
          <div className="header-actions">
            <span className="user-info">Admin: {user?.email}</span>
            <button className="btn-logout" onClick={onLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-cards-section">
        <h2>Visitor Statistics</h2>
        <div className="stats-cards-container">
          <div className="stat-card stat-card-day">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Today</h3>
              <p className="stat-number">{stats.daily}</p>
              <span className="stat-label">Visitors</span>
            </div>
          </div>

          <div className="stat-card stat-card-week">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>This Week</h3>
              <p className="stat-number">{stats.weekly}</p>
              <span className="stat-label">Visitors</span>
            </div>
          </div>

          <div className="stat-card stat-card-month">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>This Month</h3>
              <p className="stat-number">{stats.monthly}</p>
              <span className="stat-label">Visitors</span>
            </div>
          </div>
        </div>
      </div>

      {/* College Statistics */}
      <div className="college-stats-section">
        <div className="college-header">
          <h2>Visitors by College</h2>
          <div className="period-buttons">
            <button
              className={`period-btn ${period === 'daily' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('daily')}
            >
              Daily
            </button>
            <button
              className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('weekly')}
            >
              Weekly
            </button>
            <button
              className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="college-cards-container">
          {collegeStats.length > 0 ? (
            collegeStats.map((college, index) => (
              <div key={index} className="college-card">
                <div className="college-code">{college.college}</div>
                <div className="college-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Visits</span>
                    <span className="stat-value">{college.visitCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unique Visitors</span>
                    <span className="stat-value">{college.uniqueVisitors}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No visitor data available</div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <h2>Search & Filter Visitors</h2>
        <div className="search-filters">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Date:</label>
            <div className="date-filter-wrapper" style={{ display: 'flex', gap: '5px' }}>
              <input
                type="date"
                value={selectedDate === 'all' ? '' : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
                disabled={selectedDate === 'all'}
              />
              <button 
                className={`all-dates-btn ${selectedDate === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedDate(selectedDate === 'all' ? new Date().toISOString().split('T')[0] : 'all')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: selectedDate === 'all' ? '#007bff' : '#f8f9fa',
                  color: selectedDate === 'all' ? 'white' : 'black',
                  cursor: 'pointer'
                }}
              >
                {selectedDate === 'all' ? 'Show Selected' : 'Show All Dates'}
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>College:</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="college-select"
            >
              <option value="all">All Colleges</option>
              {allColleges.map(college => (
                <option key={college.code} value={college.code}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Results */}
        <div className="search-results">
          <h3>Visitor Results ({searchResults.length})</h3>
          {searchResults.length > 0 ? (
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>College</th>
                    <th>Check-in Time</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result) => (
                    <tr key={result.id} className={result.blocked ? 'blocked-row' : ''}>
                      <td className="email-cell">{result.email}</td>
                      <td>{result.firstName} {result.lastName}</td>
                      <td>{result.college}</td>
                      <td>
                        {new Date(result.checkInTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td>{result.visitPurpose}</td>
                      <td>
                        <div className="action-buttons">
                          {result.blocked ? (
                            <button
                              className="btn-unblock"
                              onClick={() => handleUnblockVisitor(result.id, result.email)}
                              title="Unblock visitor"
                            >
                              ✓ Unblock
                            </button>
                          ) : (
                            <button
                              className="btn-block"
                              onClick={() => handleBlockVisitor(result.id, result.email)}
                              title="Block visitor"
                            >
                              ✕ Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-search">
              <p>No visitors found for the selected date and filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="admin-actions">
        <button className="refresh-button" onClick={fetchAllStatistics}>
          ↻ Refresh Statistics
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
