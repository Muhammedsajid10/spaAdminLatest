/**
 * ViewSelector Component
 * Dropdown to select calendar view (Day/Week/Month)
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ViewSelector = ({ currentView, onViewChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const views = [
    { value: 'Day', label: 'Day' },
    { value: 'Week', label: 'Week' },
    { value: 'Month', label: 'Month' }
  ];

  const displayLabel = label || currentView;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewSelect = (view) => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <div className="view-selector" ref={dropdownRef}>
      <button
        className="view-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select view"
        aria-expanded={isOpen}
      >
        <span className="view-selector-label">{displayLabel}</span>
        <ChevronDown 
          size={14} 
          className={`view-selector-icon ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="view-selector-dropdown">
          {views.map((view) => (
            <button
              key={view.value}
              className={`view-option ${currentView === view.value ? 'active' : ''}`}
              onClick={() => handleViewSelect(view.value)}
            >
              <span>{view.label}</span>
              {currentView === view.value && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewSelector;
