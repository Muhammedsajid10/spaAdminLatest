import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import CalendarDatePicker from './CalendarDatePicker';
import { setShowDatePicker, setDatePickerCurrentMonth, setDatePickerSelectedDate, initializeDatePicker } from '../../store/datePickerSlice';
import { goToToday, goToPrevious, goToNext, setCurrentView, selectCurrentDate, selectCurrentView } from '../../store/datePickerSlice';
import { toggleTeamPopup } from '../../../store/teamPopupSlice';

function CalendarHeader(props) {
  const dispatch = useDispatch();

  // Get date picker state from Redux using new selectors
  const currentDate = useSelector(selectCurrentDate);
  const currentView = useSelector(selectCurrentView);

  // Calculate calendar days for week display
  const getCalendarDays = () => {
    if (currentView === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
      });
    }
    return [];
  };

  const calendarDays = getCalendarDays();

  // Get simplified props - only what's actually needed for header functionality
  const {
    handleRefreshToNow,
    handleAddAppointment
  } = props;

  return (
    <div className="calendar-header__root">
      {/* Left Side Controls */}
      <div className="calendar-header__left">
        {/* Today Button - Only show in Day view */}
        {currentView === 'Day' && (
          <button
            className="calendar-header__btn calendar-header__btn--today"
            onClick={() => dispatch(goToToday())}
          >
            Today
          </button>
        )}

        {/* Date Navigation */}
        <div className="calendar-header__nav">
          <button className="calendar-header__nav-arrow" onClick={() => dispatch(goToPrevious())}>
            <ChevronLeft size={16} />
          </button>
          <button
            className="calendar-header__display-button"
            onClick={() => {
              dispatch(setDatePickerCurrentMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)));
              dispatch(setDatePickerSelectedDate(currentDate));
              dispatch(setShowDatePicker(true));
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
          <button className="calendar-header__nav-arrow" onClick={() => dispatch(goToNext())}>
            <ChevronRight size={16} />
          </button>
        </div>
          <button
            className="calendar-header__team-btn"
            onClick={() => dispatch(toggleTeamPopup())}
            title="Manage team visibility"
          >
            <Users size={14} />
          </button>
      </div>

      {/* Right Side Controls */}
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
            onChange={(e) => dispatch(setCurrentView(e.target.value))}
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