import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import './MonthPicker.css';

const MonthPicker = ({ 
  value, 
  onChange, 
  className = '',
  showPresets = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Preset date ranges
  const presets = [
    {
      label: 'Month to date',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: firstDay.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      }
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      }
    },
    {
      label: 'Last 6 months',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      }
    }
  ];

  const formatDateRange = (dateRange) => {
    if (!dateRange?.start || !dateRange?.end) return 'Select date range';
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const formatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
    };
    
    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
  };

  const handlePresetClick = (preset) => {
    const newRange = preset.getValue();
    onChange(newRange);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setViewDate(newDate);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateInRange = (date) => {
    if (!value?.start || !value?.end || !date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr >= value.start && dateStr <= value.end;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === value?.start || dateStr === value?.end;
  };

  return (
    <div className={`month-picker ${className}`}>
      <Button
        variant="secondary"
        icon={<Calendar />}
        onClick={() => setIsOpen(!isOpen)}
        className="month-picker__trigger"
      >
        {formatDateRange(value)}
      </Button>

      {isOpen && (
        <div className="month-picker__dropdown">
          {showPresets && (
            <div className="month-picker__presets">
              <h4 className="month-picker__presets-title">Quick Select</h4>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  className="month-picker__preset"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="month-picker__calendar">
            <div className="month-picker__header">
              <button
                className="month-picker__nav-btn"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft />
              </button>
              <h3 className="month-picker__month-year">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                className="month-picker__nav-btn"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight />
              </button>
            </div>
            
            <div className="month-picker__weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="month-picker__weekday">{day}</div>
              ))}
            </div>
            
            <div className="month-picker__days">
              {getDaysInMonth(viewDate).map((date, index) => (
                <div
                  key={index}
                  className={`month-picker__day ${
                    date ? 'month-picker__day--clickable' : ''
                  } ${
                    isDateSelected(date) ? 'month-picker__day--selected' : ''
                  } ${
                    isDateInRange(date) ? 'month-picker__day--in-range' : ''
                  }`}
                  onClick={() => {
                    if (date) {
                      // Simple implementation - you can enhance this for range selection
                      const dateStr = date.toISOString().split('T')[0];
                      onChange({ start: dateStr, end: dateStr });
                    }
                  }}
                >
                  {date ? date.getDate() : ''}
                </div>
              ))}
            </div>
          </div>
          
          <div className="month-picker__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;