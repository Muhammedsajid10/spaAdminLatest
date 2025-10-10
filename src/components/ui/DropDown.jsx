import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './Dropdown.css';

const Dropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  searchable = false,
  multiple = false,
  className = '',
  renderOption = null,
  renderSelected = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Filter options based on search
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.some(v => v.value === option.value);
      
      if (isSelected) {
        onChange(currentValues.filter(v => v.value !== option.value));
      } else {
        onChange([...currentValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) return value[0].label;
      return `${value.length} selected`;
    }
    
    return value?.label || placeholder;
  };

  const isOptionSelected = (option) => {
    if (multiple && Array.isArray(value)) {
      return value.some(v => v.value === option.value);
    }
    return value?.value === option.value;
  };

  return (
    <div 
      className={`dropdown ${disabled ? 'dropdown--disabled' : ''} ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`dropdown__trigger ${isOpen ? 'dropdown__trigger--open' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="dropdown__value">
          {renderSelected ? renderSelected(value) : getDisplayValue()}
        </span>
        <ChevronDown 
          className={`dropdown__chevron ${isOpen ? 'dropdown__chevron--rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="dropdown__menu">
          {searchable && (
            <div className="dropdown__search">
              <input
                type="text"
                className="dropdown__search-input"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}
          
          <div className="dropdown__options">
            {filteredOptions.length === 0 ? (
              <div className="dropdown__option dropdown__option--empty">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`dropdown__option ${
                    isOptionSelected(option) ? 'dropdown__option--selected' : ''
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  <span className="dropdown__option-content">
                    {renderOption ? renderOption(option) : option.label}
                  </span>
                  {isOptionSelected(option) && (
                    <Check className="dropdown__check-icon" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;