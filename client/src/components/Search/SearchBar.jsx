/**
 * SearchBar Component
 * Unified search input for email, name, and college
 */

import React, { useState, useCallback } from 'react';
import './Search.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounce search function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const performSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();

        if (data.success) {
          setResults(data.data || []);
          setShowResults(true);
          onSearch(data.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [onSearch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    performSearch(value);
  };

  const handleResultClick = (result) => {
    setQuery(`${result.firstName} ${result.lastName}`);
    setShowResults(false);
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by email, name, or college..."
          value={query}
          onChange={handleInputChange}
          className="search-input"
        />
        {isSearching && <span className="search-loader">...</span>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div className="result-id">👤</div>
              <div className="result-content">
                <p className="result-name">
                  {result.firstName} {result.lastName}
                </p>
                <p className="result-email">{result.email}</p>
                <p className="result-college">
                  📚 {result.College?.name || 'N/A'}
                </p>
              </div>
              <div className="result-visits">
                <span>{result.totalVisits} visits</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query && !isSearching && (
        <div className="search-no-results">
          <p>No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
