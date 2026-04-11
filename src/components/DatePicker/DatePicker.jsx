import React, { useState, useEffect, useRef } from 'react';
import './DatePicker.css';

const DatePicker = ({ selectedDate, onChange, placeholder = "Select date..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const datePickerRef = useRef(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add the actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDateClick = (date) => {
    onChange(date);
    setIsOpen(false);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="datepicker-container" ref={datePickerRef}>
      <div 
        className="datepicker-input-container"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          className="datepicker-input"
          placeholder={placeholder}
          value={selectedDate ? formatDate(selectedDate) : ''}
          readOnly
        />
        <svg 
          className="datepicker-calendar-icon"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>

      {isOpen && (
        <div className="datepicker-modal">
          <div className="datepicker-header">
            <button 
              className="datepicker-nav-btn" 
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="datepicker-current-month">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button 
              className="datepicker-nav-btn" 
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="datepicker-weekdays">
            {daysOfWeek.map(day => (
              <div key={day} className="datepicker-weekday">{day}</div>
            ))}
          </div>

          <div className="datepicker-days">
            {getDaysInMonth(currentMonth).map((date, index) => (
              <div
                key={index}
                className={`datepicker-day ${!date ? 'empty' : ''} ${
                  isToday(date) ? 'today' : ''
                } ${isSelected(date) ? 'selected' : ''}`}
                onClick={() => date && handleDateClick(date)}
              >
                {date?.getDate()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;