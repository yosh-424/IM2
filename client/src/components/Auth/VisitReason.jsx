import React, { useState } from 'react';
import './VisitReason.css';

const REASONS = ['Study', 'Use of Computer', 'Lounge', 'Reading'];

const VisitReason = ({ user, onCheckIn }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const reason = selectedReason === 'Others' ? otherReason.trim() : selectedReason;
    if (!reason) {
      setError('Please select or specify a reason for your visit');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, visitReason: reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to log in');
        return;
      }

      if (onCheckIn) {
        onCheckIn(data.data);
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visit-reason-container">
      <div className="visit-reason-box">
        <div className="visit-header">
          <h1>Reason for Visit</h1>
          <p>Hi, <strong>{user.firstName}</strong>! What brings you to the library today?</p>
        </div>

        <form onSubmit={handleSubmit} className="visit-form">
          <div className="reason-options">
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className={`reason-card ${selectedReason === reason ? 'selected' : ''}`}
                onClick={() => setSelectedReason(reason)}
                disabled={loading}
              >
                <span className="reason-icon">
                  {reason === 'Study' && '📖'}
                  {reason === 'Use of Computer' && '💻'}
                  {reason === 'Lounge' && '🛋️'}
                  {reason === 'Reading' && '📕'}
                </span>
                <span className="reason-label">{reason}</span>
              </button>
            ))}
            <button
              type="button"
              className={`reason-card ${selectedReason === 'Others' ? 'selected' : ''}`}
              onClick={() => setSelectedReason('Others')}
              disabled={loading}
            >
              <span className="reason-icon">✏️</span>
              <span className="reason-label">Others</span>
            </button>
          </div>

          {selectedReason === 'Others' && (
            <div className="other-input-wrapper">
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Please specify your reason..."
                className="other-input"
                maxLength={100}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="visit-alert visit-alert-error">{error}</div>}

          <button type="submit" className="visit-submit-btn" disabled={loading || !selectedReason}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitReason;
