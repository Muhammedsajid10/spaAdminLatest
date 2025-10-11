import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './DropDown.css';

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
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
      // Handle multiple selection
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValues);
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };

  const getSelectedDisplay = () => {
    if (renderSelected) {
      return renderSelected(value);
    }
    
    if (multiple && Array.isArray(value)) {
      return value.length > 0 ? `${value.length} selected` : placeholder;
    }
    
    return value?.label || placeholder;
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      {/* Fixed: Remove nested button, use div instead */}
      <div
        className={`dropdown__trigger ${disabled ? 'dropdown__trigger--disabled' : ''}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle();
          }
        }}
      >
        <span className="dropdown__selected">
          {getSelectedDisplay()}
        </span>
        <ChevronDown 
          className={`dropdown__icon ${isOpen ? 'dropdown__icon--open' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="dropdown__menu">
          {searchable && (
            <div className="dropdown__search">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dropdown__search-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="dropdown__options">
            {filteredOptions.length === 0 ? (
              <div className="dropdown__no-options">No options available</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value || index}
                  className={`dropdown__option ${
                    (multiple && Array.isArray(value) && value.includes(option.value)) ||
                    (!multiple && value?.value === option.value)
                      ? 'dropdown__option--selected'
                      : ''
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  {renderOption ? renderOption(option) : option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;