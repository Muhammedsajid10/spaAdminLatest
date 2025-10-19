import React from 'react';
import './CalendarHeader.css';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  RotateCcw,
  Plus
} from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';

function CalendarHeader(props) {
  const {
    currentView,
    currentDate,
    calendarDays,
    showDatePicker,
    datePickerView,
    datePickerCurrentMonth,
    datePickerSelectedDate,
    setDatePickerCurrentMonth,
    setDatePickerSelectedDate,
    setShowDatePicker,
    goToDatePickerPreviousMonth,
    goToDatePickerNextMonth,
    goToDatePickerToday,
    handleDatePickerDateSelect,
    showTeamPopup,
    setShowTeamPopup,
    showCalendarPopup,
    setShowCalendarPopup,
    calendarPopupTab,
    setCalendarPopupTab,
    handleRefreshToNow,
    setCurrentView,
    handleAddAppointment,
    goToToday,
    goToPrevious,
    goToNext,
    getDatePickerCalendarDays,
    getWeeksInMonth,
    getMonthsInYear,
    handleWeekSelect,
    handleMonthSelect,
    setSelectedEmployees,
    selectedEmployees,
    employees,
    teamFilter,
    handleTeamFilterChange,
    setTeamSearchQuery,
    teamSearchQuery,
    teamViewMode,
    setTeamViewMode,
    getFilteredAndSearchedEmployees,
    handleEmployeeToggle,
    handleClearSelection,
    setShowTeamPopupLocal
  } = props;

  return (
    <div className="calendar-header__root">
      {/* Left Side Controls */}
      <div className="calendar-header__left">
        {/* Today Button - Only show in Day view */}
        {currentView === 'Day' && (
          <button
            className="calendar-header__btn calendar-header__btn--today"
            onClick={goToToday}
          >
            Today
          </button>
        )}

        {/* Date Navigation */}
        <div className="calendar-header__nav">
          <button className="calendar-header__nav-arrow" onClick={goToPrevious}>
            <ChevronLeft size={16} />
          </button>
          <button
            className="calendar-header__display-button"
            onClick={() => {
              setDatePickerCurrentMonth(currentDate);
              setDatePickerSelectedDate(currentDate);
              setShowDatePicker(!showDatePicker);
            }}
          >
            <span className="calendar-header__display-text">
              {currentView === 'Day' && currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              {currentView === 'Week' && calendarDays.length > 0 &&
                `${calendarDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${calendarDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
              {currentView === 'Month' && currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })}
            </span>
            <CalendarIcon size={14} className="calendar-header__picker-icon" />
          </button>
          <button className="calendar-header__nav-arrow" onClick={goToNext}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Date Picker Popup - keep minimal here; full picker lives in SelectCalendar props */}
        {showDatePicker && (
          <div className="calendar-header__date-picker-backdrop" onClick={() => setShowDatePicker(false)} />
        )}
      </div>

      {/* Right Side Controls (simplified) */}
      <div className="calendar-header__right">
        <div className="calendar-header__view-controls">
          <button
            className="calendar-header__refresh"
            onClick={handleRefreshToNow}
            title="Refresh to current time"
          >
            <RotateCcw size={14} />
          </button>
          <select
            value={currentView}
            onChange={(e) => setCurrentView(e.target.value)}
            className="calendar-header__view-selector"
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </select>
        </div>

        <button
          className="calendar-header__add-btn"
          onClick={handleAddAppointment}
        >
          <h1>Add Appointment</h1>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}


export default CalendarHeader;