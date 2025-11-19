/**
 * DateDisplay Component
 * Displays current date range based on view
 */

import React from 'react';
import { formatDateLocal } from '../../../utils/calendar';

const DateDisplay = ({ currentDate, currentView }) => {
  const getDateRangeText = () => {
    // Safety check: return early if currentDate is undefined
    if (!currentDate) {
      return 'Loading...';
    }
    
    const date = new Date(currentDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    if (currentView === 'Day') {
      // Format: Thu 13 Nov
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      return `${dayName} ${day} ${month}`;
    }
    
    if (currentView === 'Week') {
      const startOfWeek = new Date(date);
      const dayOfWeek = date.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(date.getDate() + diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
      const year = endOfWeek.getFullYear();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`;
      } else {
        return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
      }
    }
    
    if (currentView === 'Month') {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long'
      });
    }
    
    return formatDateLocal(date);
  };

  return (
    <div className="date-display">
      <h2 className="date-range-text">{getDateRangeText()}</h2>
    </div>
  );
};

export default DateDisplay;
