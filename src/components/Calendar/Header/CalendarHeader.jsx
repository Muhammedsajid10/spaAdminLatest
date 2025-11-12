/**
 * CalendarHeader Component
 * Main header with date navigation and view controls
 */

import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import DateDisplay from './DateDisplay';
import ViewSelector from './ViewSelector';
import QuickActions from './QuickActions';

const CalendarHeader = ({
  currentDate,
  currentView,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onViewChange,
  onOpenBooking,
  onToggleDatePicker,
  isToday
}) => {
  return (
    <div className="calendar-header">
      <div className="header-left">
        <DateDisplay 
          currentDate={currentDate}
          currentView={currentView}
        />
      </div>

      <div className="header-center">
        <div className="navigation-controls">
          <button
            className="nav-button"
            onClick={onPreviousWeek}
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            className={`today-button ${isToday ? 'active' : ''}`}
            onClick={onToday}
          >
            Today
          </button>

          <button
            className="nav-button"
            onClick={onNextWeek}
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>

          <button
            className="date-picker-toggle"
            onClick={onToggleDatePicker}
            aria-label="Open date picker"
          >
            <CalendarDays size={20} />
          </button>
        </div>
      </div>

      <div className="header-right">
        <ViewSelector
          currentView={currentView}
          onViewChange={onViewChange}
        />
        
        <QuickActions
          onOpenBooking={onOpenBooking}
        />
      </div>
    </div>
  );
};

export default CalendarHeader;
