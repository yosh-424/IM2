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

  // Admin management state
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Staff/faculty management state
  const [staffEmails, setStaffEmails] = useState([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllStatistics();
    fetchAdminEmails();
    fetchStaffEmails();
  }, []);

  // Single consolidated search effect with debounce + abort to prevent race conditions
  useEffect(() => {
    const controller = new AbortController();

    const doSearch = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery && searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        if (selectedDate && selectedDate !== 'all' && selectedDate !== '') {
          params.append('date', selectedDate);
        }
        if (selectedCollege && selectedCollege !== 'all' && selectedCollege !== '') {
          params.append('college', selectedCollege);
        }

        const response = await fetch(
          `/api/statistics/search-visitors?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setSearchResults([]);
        }
      }
    };

    const timeoutId = setTimeout(doSearch, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery, selectedDate, selectedCollege]);

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

  const refreshSearchResults = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (selectedDate && selectedDate !== 'all' && selectedDate !== '') {
        params.append('date', selectedDate);
      }
      if (selectedCollege && selectedCollege !== 'all' && selectedCollege !== '') {
        params.append('college', selectedCollege);
      }

      const response = await fetch(`/api/statistics/search-visitors?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
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
        refreshSearchResults();
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
        refreshSearchResults();
      } else {
        alert(`✗ Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Unblock error:', err);
      alert(`✗ Failed to unblock visitor: ${err.message}`);
    }
  };

  const fetchAdminEmails = async () => {
    try {
      const response = await fetch('/api/admin/admin-emails');
      const data = await response.json();
      if (data.success) {
        setAdminEmails(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin emails:', err);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!newAdminEmail.trim()) {
      setAdminError('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/admin/admin-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          addedBy: user?.email || 'admin',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAdminSuccess(data.message);
        setNewAdminEmail('');
        fetchAdminEmails();
      } else {
        setAdminError(data.message);
      }
    } catch (err) {
      setAdminError('Failed to add admin');
      console.error(err);
    }
  };

  const handleRemoveAdmin = async (adminId, adminEmailAddr) => {
    if (!window.confirm(`Are you sure you want to remove ${adminEmailAddr} as admin?`)) {
      return;
    }

    setAdminError('');
    setAdminSuccess('');

    try {
      const response = await fetch(`/api/admin/admin-emails/${adminId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAdminSuccess(data.message);
        fetchAdminEmails();
      } else {
        setAdminError(data.message);
      }
    } catch (err) {
      setAdminError('Failed to remove admin');
      console.error(err);
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

  const fetchStaffEmails = async () => {
    try {
      const response = await fetch('/api/admin/staff-emails');
      const data = await response.json();
      if (data.success) {
        setStaffEmails(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff emails:', err);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    if (!newStaffEmail.trim()) {
      setStaffError('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/admin/staff-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStaffEmail.trim(),
          addedBy: user?.email || 'admin',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStaffSuccess(data.message);
        setNewStaffEmail('');
        fetchStaffEmails();
      } else {
        setStaffError(data.message);
      }
    } catch (err) {
      setStaffError('Failed to add staff/faculty');
      console.error(err);
    }
  };

  const handleRemoveStaff = async (staffId, staffEmailAddr) => {
    if (!window.confirm(`Are you sure you want to remove ${staffEmailAddr} as staff/faculty?`)) {
      return;
    }

    setStaffError('');
    setStaffSuccess('');

    try {
      const response = await fetch(`/api/admin/staff-emails/${staffId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setStaffSuccess(data.message);
        fetchStaffEmails();
      } else {
        setStaffError(data.message);
      }
    } catch (err) {
      setStaffError('Failed to remove staff/faculty');
      console.error(err);
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
            <h1>Admin Dashboard</h1>
            <p>Monitor and manage library visitors</p>
          </div>
          <div className="header-actions">
            <span className="user-info">Admin: {user?.email}</span>
            <button className="btn-logout" onClick={onLogout}>
              Logout
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
            <div className="stat-content">
              <h3>Today</h3>
              <p className="stat-number">{stats.daily}</p>
              <span className="stat-label">Visitors</span>
            </div>
          </div>

          <div className="stat-card stat-card-week">
            <div className="stat-content">
              <h3>This Week</h3>
              <p className="stat-number">{stats.weekly}</p>
              <span className="stat-label">Visitors</span>
            </div>
          </div>

          <div className="stat-card stat-card-month">
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
              placeholder="Search by name, email, student number, college, reason, date..."
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
                  border: '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: selectedDate === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: selectedDate === 'all' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '12px'
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
                    <th>Student Number</th>
                    <th>Full Name</th>
                    <th>College</th>
                    <th>Reason</th>
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result) => (
                    <tr key={result.id} className={result.blocked ? 'blocked-row' : ''}>
                      <td className="email-cell">{result.email}</td>
                      <td className="studentnum-cell">{result.studentNumber || 'N/A'}</td>
                      <td className="name-cell">{result.firstName} {result.lastName}</td>
                      <td className={`college-cell${result.college === 'Staff/Faculty' ? ' staff-faculty' : ''}`}>{result.college}</td>
                      <td className={`reason-cell${result.visitPurpose === 'Staff/Faculty' ? ' staff-faculty' : ''}`}>{result.visitPurpose}</td>
                      <td className="time-cell">
                        {new Date(result.checkInTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
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

      {/* Admin Management Section */}
      <div className="admin-management-section">
        <h2>Admin Management</h2>
        <p className="section-description">Add or remove admin access for NEU email accounts</p>

        {adminError && <div className="admin-alert admin-alert-error">{adminError}</div>}
        {adminSuccess && <div className="admin-alert admin-alert-success">{adminSuccess}</div>}

        <form className="add-admin-form" onSubmit={handleAddAdmin}>
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Enter NEU email (@neu.edu.ph)"
            className="admin-email-input"
          />
          <button type="submit" className="btn-add-admin">
            + Add Admin
          </button>
        </form>

        <div className="admin-list">
          <h3>Current Admins ({adminEmails.length})</h3>
          {adminEmails.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Added By</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminEmails.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.email}</td>
                    <td>{admin.addedBy}</td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-remove-admin"
                        onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                        disabled={adminEmails.length <= 1}
                        title={adminEmails.length <= 1 ? 'Cannot remove the last admin' : 'Remove admin'}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No admin emails configured</p>
          )}
        </div>
      </div>

      {/* Staff/Faculty Management Section */}
      <div className="admin-management-section">
        <h2>Staff/Faculty Management</h2>
        <p className="section-description">Add or remove staff/faculty members — they skip profile setup and visit reason</p>

        {staffError && <div className="admin-alert admin-alert-error">{staffError}</div>}
        {staffSuccess && <div className="admin-alert admin-alert-success">{staffSuccess}</div>}

        <form className="add-admin-form" onSubmit={handleAddStaff}>
          <input
            type="email"
            value={newStaffEmail}
            onChange={(e) => setNewStaffEmail(e.target.value)}
            placeholder="Enter NEU email (@neu.edu.ph)"
            className="admin-email-input"
          />
          <button type="submit" className="btn-add-admin btn-add-staff">
            + Add Staff/Faculty
          </button>
        </form>

        <div className="admin-list">
          <h3>Current Staff/Faculty ({staffEmails.length})</h3>
          {staffEmails.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Added By</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffEmails.map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.email}</td>
                    <td>{staff.addedBy}</td>
                    <td>{new Date(staff.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-remove-admin"
                        onClick={() => handleRemoveStaff(staff.id, staff.email)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No staff/faculty emails configured</p>
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
