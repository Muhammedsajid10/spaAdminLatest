/**
 * CalendarHeader Component
 * Professional header with date navigation and view controls
 */

import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import DateDisplay from './DateDisplay';
import ViewSelector from './ViewSelector';
import QuickActions from './QuickActions';
import TeamFilter from './TeamFilter';

const CalendarHeader = ({
  currentDate,
  currentView,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onViewChange,
  onOpenBooking,
  onToggleDatePicker,
  isToday,
  employees,
  selectedEmployeeIds,
  onToggleEmployee,
  onSelectAllEmployees,
  onDeselectAllEmployees
}) => {
  return (
    <div className="calendar-header">
      {/* Left: Today + Navigation */}
      <div className="header-left">
        <button
          className="nav-button today-button"
          onClick={onToday}
          aria-label="Go to today"
        >
          Today
        </button>

        <div className="navigation-controls">
          <button
            className="nav-button nav-prev"
            onClick={onPreviousWeek}
            aria-label="Previous"
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            className="nav-button nav-next"
            onClick={onNextWeek}
            aria-label="Next"
            title="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Center: Date Display */}
      <div className="header-center">
        <DateDisplay 
          currentDate={currentDate}
          currentView={currentView}
        />
      </div>

      {/* Right: Team Dropdown, Settings, Calendar, Refresh, View Selector, Add Button */}
      <div className="header-right">
        <TeamFilter
          employees={employees || []}
          selectedEmployeeIds={selectedEmployeeIds || []}
          onToggleEmployee={onToggleEmployee}
          onSelectAll={onSelectAllEmployees}
          onDeselectAll={onDeselectAllEmployees}
        />
        
        <button
          className="nav-button icon-button"
          aria-label="Settings"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </button>

        <button
          className="nav-button icon-button"
          onClick={onToggleDatePicker}
          aria-label="Open calendar"
          title="Select date"
        >
          <CalendarDays size={16} />
        </button>

        <button
          className="nav-button icon-button"
          aria-label="Refresh"
          title="Refresh"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>

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
