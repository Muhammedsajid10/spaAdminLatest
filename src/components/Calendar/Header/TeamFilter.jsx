/**
 * TeamFilter Component
 * Dropdown to filter employees by checking/unchecking them
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const TeamFilter = ({ employees, selectedEmployeeIds, onToggleEmployee, onSelectAll, onDeselectAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getEmployeeName = (employee) => {
    if (employee.name) return employee.name;
    if (employee.user?.name) return employee.user.name;
    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    return fullName || 'Staff';
  };

  const allSelected = selectedEmployeeIds.length === employees.length;
  const someSelected = selectedEmployeeIds.length > 0 && selectedEmployeeIds.length < employees.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="team-filter" ref={dropdownRef}>
      <button
        className="team-filter-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filter team"
        aria-expanded={isOpen}
      >
        <span className="team-filter-label">
          {allSelected ? 'All team' : `${selectedEmployeeIds.length} selected`}
        </span>
        <ChevronDown 
          size={14} 
          className={`dropdown-icon ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="team-filter-dropdown">
          {/* Select All / Deselect All */}
          <div className="team-filter-header">
            <button
              className="team-filter-action"
              onClick={handleToggleAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Employee List */}
          <div className="team-filter-list">
            {employees.map((employee) => {
              const isSelected = selectedEmployeeIds.includes(employee._id || employee.id);
              return (
                <label
                  key={employee._id || employee.id}
                  className="team-filter-item"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleEmployee(employee._id || employee.id)}
                    className="team-filter-checkbox"
                  />
                  <span className="team-filter-checkmark">
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path 
                          d="M13 4L6 11L3 8" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="team-filter-name">
                    {getEmployeeName(employee)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFilter;
