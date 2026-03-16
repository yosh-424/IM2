/**
 * CollegeCard Component
 * Displays visitors per college with percentage breakdown
 */

import React from 'react';
import './Cards.css';

const CollegeCard = ({ name, count, percentage }) => {
  return (
    <div className="college-card">
      <div className="college-header">
        <h4 className="college-name">{name}</h4>
        <span className="college-count">{count}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="college-percentage">{percentage}% of total</p>
    </div>
  );
};

export default CollegeCard;
