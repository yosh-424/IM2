/**
 * API Service
 * Centralized API calls and utilities
 */

const API_BASE_URL = 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
};

// Visitor API
export const visitorAPI = {
  getAll: (page = 1, limit = 10) =>
    apiCall(`/visitors?page=${page}&limit=${limit}`),
  getById: (id) =>
    apiCall(`/visitors/${id}`),
  create: (data) =>
    apiCall('/visitors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiCall(`/visitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiCall(`/visitors/${id}`, { method: 'DELETE' }),
  checkIn: (id) =>
    apiCall(`/visitors/${id}/check-in`, { method: 'POST' }),
  checkOut: (id) =>
    apiCall(`/visitors/${id}/check-out`, { method: 'POST' }),
};

// Statistics API
export const statisticsAPI = {
  getDaily: () =>
    apiCall('/statistics/daily'),
  getWeekly: () =>
    apiCall('/statistics/weekly'),
  getMonthly: () =>
    apiCall('/statistics/monthly'),
  getByCollege: () =>
    apiCall('/statistics/by-college'),
  getByCollegeDaily: () =>
    apiCall('/statistics/by-college/daily'),
  getByCollegeWeekly: () =>
    apiCall('/statistics/by-college/weekly'),
  getByCollegeMonthly: () =>
    apiCall('/statistics/by-college/monthly'),
};

// Search API
export const searchAPI = {
  search: (query) =>
    apiCall(`/search?query=${encodeURIComponent(query)}`),
  searchByEmail: (email) =>
    apiCall(`/search/email/${email}`),
  searchByName: (name) =>
    apiCall(`/search/name/${encodeURIComponent(name)}`),
  searchByCollege: (college) =>
    apiCall(`/search/college/${encodeURIComponent(college)}`),
};

export default apiCall;
