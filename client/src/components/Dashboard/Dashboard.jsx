/**
 * Dashboard Component
 * Main entry point displaying all statistics and search functionality
 */

import React, { useState, useEffect } from 'react';
import SearchBar from '../Search/SearchBar';
import StatCard from '../Cards/StatCard';
import CollegeCard from '../Cards/CollegeCard';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
  });
  const [collegeStats, setCollegeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes, monthlyRes, collegeRes] = await Promise.all([
        fetch('/api/statistics/daily'),
        fetch('/api/statistics/weekly'),
        fetch('/api/statistics/monthly'),
        fetch('/api/statistics/by-college'),
      ]);

      const daily = await dailyRes.json();
      const weekly = await weeklyRes.json();
      const monthly = await monthlyRes.json();
      const college = await collegeRes.json();

      setStats({
        daily: daily.count || 0,
        weekly: weekly.count || 0,
        monthly: monthly.count || 0,
      });

      setCollegeStats(college.data || []);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (results) => {
    console.log('Search results:', results);
    // Handle search results - can display in modal or expandable section
  };

  if (loading) {
    return <div className="dashboard loading">Loading statistics...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Library Visitor System</h1>
        <p>Track and analyze visitor patterns</p>
      </header>

      <div className="search-section">
        <SearchBar onSearch={handleSearch} />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-container">
        <div className="stats-grid">
          <StatCard 
            title="Today" 
            count={stats.daily} 
            icon="📅"
            period="daily"
          />
          <StatCard 
            title="This Week" 
            count={stats.weekly} 
            icon="📊"
            period="weekly"
          />
          <StatCard 
            title="This Month" 
            count={stats.monthly} 
            icon="📈"
            period="monthly"
          />
        </div>

        <div className="college-section">
          <h2>Visitors by College</h2>
          <div className="college-cards">
            {collegeStats.map((college, index) => (
              <CollegeCard 
                key={index}
                name={college.college}
                count={college.count}
                percentage={college.percentage}
              />
            ))}
          </div>
        </div>
      </div>

      <button className="refresh-button" onClick={fetchStatistics}>
        ↻ Refresh Statistics
      </button>
    </div>
  );
};

export default Dashboard;
