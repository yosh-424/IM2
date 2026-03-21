import React, { useState, useEffect } from 'react';
import './ProfileSetup.css';

const ProfileSetup = ({ user, onProfileComplete, isEdit }) => {
  const [studentNumber, setStudentNumber] = useState(isEdit && user.studentNumber ? user.studentNumber : '');
  const [selectedCollege, setSelectedCollege] = useState(isEdit && user.collegeId ? user.collegeId : '');
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setColleges(data.data);
        }
      } catch (err) {
        console.error('Failed to load colleges:', err);
      }
    };
    fetchColleges();
  }, []);

  const formatStudentNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as xx-xxxxx-xxx
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '-' + digits.slice(2, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 10);
    return formatted;
  };

  const handleStudentNumberChange = (e) => {
    const formatted = formatStudentNumber(e.target.value);
    setStudentNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const studentNumRegex = /^\d{2}-\d{5}-\d{3}$/;
    if (!studentNumRegex.test(studentNumber)) {
      setError('Student number must be in the format xx-xxxxx-xxx (10 digits)');
      return;
    }

    if (!selectedCollege) {
      setError('Please select your college');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          studentNumber,
          collegeId: selectedCollege,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to complete profile');
        return;
      }

      if (onProfileComplete) {
        onProfileComplete(data.data);
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Profile setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-box">
        <div className="profile-header">
          <h1>{isEdit ? 'Edit Profile' : 'Complete Your Profile'}</h1>
          <p>Welcome, <strong>{user.firstName} {user.lastName}</strong>!</p>
          <p className="profile-email">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="studentNumber">Student Number</label>
            <input
              id="studentNumber"
              type="text"
              value={studentNumber}
              onChange={handleStudentNumberChange}
              placeholder="xx-xxxxx-xxx"
              className="profile-input"
              maxLength={12}
              disabled={loading}
            />
            <p className="input-hint">Format: xx-xxxxx-xxx (e.g., 23-12345-678)</p>
          </div>

          <div className="form-group">
            <label htmlFor="college">College</label>
            <select
              id="college"
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="profile-input"
              disabled={loading}
            >
              <option value="">Select your college...</option>
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="profile-alert profile-alert-error">{error}</div>}

          <button type="submit" className="profile-submit-btn" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
