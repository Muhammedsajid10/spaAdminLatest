/**
 * CalendarHeader Component
 * Professional header matching reference image layout:
 * Today | < > | Date | Team | Settings | Calendar | Refresh | View | Add
 */

import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Settings, RefreshCw, Menu } from 'lucide-react';
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
      {/* Left Section: Today + Navigation + Date */}
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

        <div className="header-date-section">
          <DateDisplay 
            currentDate={currentDate}
            currentView={currentView}
          />
        </div>
      </div>

      {/* Right Section: Team | Settings | Calendar | Refresh | View | Add */}
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
          aria-label="View options"
          title="View options"
        >
          <Menu size={16} />
        </button>
        
        <button
          className="nav-button icon-button"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          className="nav-button date-picker-toggle"
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
          <RefreshCw size={16} />
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
