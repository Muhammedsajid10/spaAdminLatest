import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setShowDatePicker,
  setDatePickerView,
  goToDatePickerPreviousMonth,
  goToDatePickerNextMonth,
  goToDatePickerToday,
  handleDatePickerDateSelect,
  handleWeekSelect,
  handleMonthSelect,
  selectDatePickerState,
  selectCalendarDays,
  selectWeeksInMonth,
  selectMonthsInYear,
  selectCurrentDate,
  selectShowDatePicker,
  selectDatePickerCurrentMonth,
  selectDatePickerSelectedDate,
  selectDatePickerView
} from '../../store/datePickerSlice';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarDatePicker.css';

const CalendarDatePicker = () => {
  const dispatch = useDispatch();
  
  // Use individual selectors that return Date objects
  const showDatePicker = useSelector(selectShowDatePicker);
  const datePickerView = useSelector(selectDatePickerView);
  const datePickerCurrentMonth = useSelector(selectDatePickerCurrentMonth);
  const datePickerSelectedDate = useSelector(selectDatePickerSelectedDate);
  const currentDate = useSelector(selectCurrentDate);
  
  // Use selectors for computed data
  const calendarDays = useSelector(selectCalendarDays);
  const weeksInMonth = useSelector(selectWeeksInMonth);
  const monthsInYear = useSelector(selectMonthsInYear);

  if (!showDatePicker) return null;

  const handleClose = () => {
    dispatch(setShowDatePicker(false));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <div className="calendar-date-picker-backdrop" onClick={handleBackdropClick} />
      <div className="calendar-date-picker-container">
        {/* View Switcher */}
        <div className="calendar-date-picker-view-switcher">
          <button
            className={`calendar-date-picker-view-btn ${datePickerView === 'date' ? 'active' : ''}`}
            onClick={() => dispatch(setDatePickerView('date'))}
          >
            Day
          </button>
          <button
            className={`calendar-date-picker-view-btn ${datePickerView === 'week' ? 'active' : ''}`}
            onClick={() => dispatch(setDatePickerView('week'))}
          >
            Week
          </button>
          <button
            className={`calendar-date-picker-view-btn ${datePickerView === 'month' ? 'active' : ''}`}
            onClick={() => dispatch(setDatePickerView('month'))}
          >
            Month
          </button>
        </div>

        {/* DATE VIEW (Day View) */}
        {datePickerView === 'date' && (
          <>
            <div className="calendar-date-picker-header">
              <button
                className="calendar-date-picker-nav-btn"
                onClick={() => dispatch(goToDatePickerPreviousMonth())}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="calendar-date-picker-month-year">
                {datePickerCurrentMonth.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>
              <button
                className="calendar-date-picker-nav-btn"
                onClick={() => dispatch(goToDatePickerNextMonth())}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="calendar-date-picker-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="calendar-date-picker-weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-date-picker-days">
              {calendarDays.map((dayObj, index) => {
                const isToday = dayObj.isToday;
                const isSelected = dayObj.date.toDateString() === datePickerSelectedDate.toDateString();
                const isCurrentView = dayObj.date.toDateString() === currentDate.toDateString();

                return (
                  <button
                    key={index}
                    className={`calendar-date-picker-day ${!dayObj.isCurrentMonth ? 'other-month' : ''
                      } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''
                      } ${isCurrentView ? 'current-view' : ''}`}
                    onClick={() => dispatch(handleDatePickerDateSelect(dayObj.date))}
                  >
                    {dayObj.day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* WEEK VIEW (Week Picker) */}
        {datePickerView === 'week' && (
          <>
            <div className="calendar-date-picker-header">
              <button
                className="calendar-date-picker-nav-btn"
                onClick={() => dispatch(goToDatePickerPreviousMonth())}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="calendar-date-picker-month-year">
                {datePickerCurrentMonth.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })} - Week Selection
              </div>
              <button
                className="calendar-date-picker-nav-btn"
                onClick={() => dispatch(goToDatePickerNextMonth())}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="calendar-date-picker-weeks">
              {weeksInMonth.map((week, index) => {
                const isCurrentWeek = week.isCurrentWeek;
                const isSelectedWeek = week.startDate.toDateString() === currentDate.toDateString() ||
                  (currentDate >= week.startDate && currentDate <= week.endDate);

                return (
                  <button
                    key={index}
                    className={`calendar-date-picker-week ${isCurrentWeek ? 'current-week' : ''} ${isSelectedWeek ? 'selected-week' : ''}`}
                    onClick={() => dispatch(handleWeekSelect(week.startDate))}
                  >
                    <div className="week-info">
                      <span className="week-number">Week {week.weekNumber}</span>
                      <span className="week-range">
                        {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                        {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* MONTH VIEW (Month Picker) */}
        {datePickerView === 'month' && (
          <>
            <div className="calendar-date-picker-header">
              <button
                className="calendar-date-picker-nav-btn"
                onClick={() => dispatch(goToDatePickerPreviousMonth())}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="calendar-date-picker-month-year">
                {datePickerCurrentMonth.getFullYear()} - Month Selection
              </div>
              <button
                className="calendar-date-picker-nav-btn"
                onClick={() => dispatch(goToDatePickerNextMonth())}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="calendar-date-picker-months">
              {monthsInYear.map((monthObj) => {
                const isCurrentMonth = monthObj.isCurrentMonth;
                const isSelectedMonth = currentDate.getFullYear() === monthObj.year &&
                  currentDate.getMonth() === monthObj.month;

                return (
                  <button
                    key={monthObj.month}
                    className={`calendar-date-picker-month ${isCurrentMonth ? 'current-month' : ''} ${isSelectedMonth ? 'selected-month' : ''}`}
                    onClick={() => dispatch(handleMonthSelect({ month: monthObj.month, year: monthObj.year }))}
                  >
                    <div className="month-info">
                      <span className="month-name">{monthObj.name}</span>
                      <span className="month-year">{monthObj.year}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="calendar-date-picker-footer">
          <button
            className="calendar-date-picker-today-btn"
            onClick={() => dispatch(goToDatePickerToday())}
          >
            {datePickerView === 'date' ? 'Today' : datePickerView === 'week' ? 'This Week' : 'This Month'}
          </button>
          <button
            className="calendar-date-picker-close-btn"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default CalendarDatePicker;
