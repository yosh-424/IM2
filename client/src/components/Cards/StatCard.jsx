/**
 * StatCard Component
 * Displays a single statistic (daily/weekly/monthly)
 */

import React from 'react';
import './Cards.css';

const StatCard = ({ title, count, icon, period }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-count">{count}</p>
        <span className="stat-label">Visitors</span>
      </div>
      <div className="stat-period">{period}</div>
    </div>
  );
};

export default StatCard;
