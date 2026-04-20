import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getDatePickerCalendarDays, 
  getWeeksInMonth, 
  getMonthsInYear 
} from '@features/booking/helpers/selectCalendarHelpers';

const DatePickerModal = ({ 
  showDatePicker, 
  setShowDatePicker, 
  datePickerView, 
  datePickerCurrentMonth, 
  datePickerSelectedDate, 
  currentDate, 
  goToDatePickerPreviousMonth, 
  goToDatePickerNextMonth, 
  goToDatePickerPreviousYear, 
  goToDatePickerNextYear, 
  goToDatePickerToday, 
  handleDatePickerDateSelect, 
  handleWeekSelect, 
  handleMonthSelect 
}) => {
  if (!showDatePicker) return null;

  return (
    <>
      <div className="date-picker-backdrop" onClick={() => setShowDatePicker(false)} />
      <div className="date-picker-container">
        {/* DATE VIEW (Day View) */}
        {datePickerView === 'date' && (
          <>
            <div className="date-picker-header">
              <button className="date-picker-nav-btn" onClick={goToDatePickerPreviousMonth}>
                <ChevronLeft size={16} />
              </button>
              <div className="date-picker-month-year">
                {datePickerCurrentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </div>
              <button className="date-picker-nav-btn" onClick={goToDatePickerNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="date-picker-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="date-picker-weekday">{day}</div>
              ))}
            </div>
            <div className="date-picker-days">
              {getDatePickerCalendarDays(datePickerCurrentMonth).map((dayObj, index) => {
                const isToday = dayObj.date.toDateString() === new Date().toDateString();
                const isSelected = dayObj.date.toDateString() === datePickerSelectedDate.toDateString();
                const isCurrentView = dayObj.date.toDateString() === currentDate.toDateString();
                return (
                  <button
                    key={index}
                    className={`date-picker-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isCurrentView ? 'current-view' : ''}`}
                    onClick={() => handleDatePickerDateSelect(dayObj.date)}
                  >
                    {dayObj.date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="date-picker-footer">
              <button className="date-picker-today-btn" onClick={goToDatePickerToday}>Today</button>
              <button className="date-picker-close-btn" onClick={() => setShowDatePicker(false)}>Close</button>
            </div>
          </>
        )}

        {/* WEEK VIEW (Week Picker) */}
        {datePickerView === 'week' && (
          <>
            <div className="date-picker-header">
              <button className="date-picker-nav-btn" onClick={goToDatePickerPreviousMonth}>
                <ChevronLeft size={16} />
              </button>
              <div className="date-picker-month-year">
                {datePickerCurrentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} - Week Selection
              </div>
              <button className="date-picker-nav-btn" onClick={goToDatePickerNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="date-picker-weeks">
              {getWeeksInMonth(datePickerCurrentMonth).map((week, index) => {
                const isCurrentWeek = week.isCurrentWeek;
                const isSelectedWeek = week.startDate.toDateString() === currentDate.toDateString() ||
                  (currentDate >= week.startDate && currentDate <= week.endDate);
                return (
                  <button
                    key={index}
                    className={`date-picker-week ${isCurrentWeek ? 'current-week' : ''} ${isSelectedWeek ? 'selected-week' : ''}`}
                    onClick={() => handleWeekSelect(week.startDate)}
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
            <div className="date-picker-footer">
              <button className="date-picker-today-btn" onClick={goToDatePickerToday}>This Week</button>
              <button className="date-picker-close-btn" onClick={() => setShowDatePicker(false)}>Close</button>
            </div>
          </>
        )}

        {/* MONTH VIEW (Month Picker) */}
        {datePickerView === 'month' && (
          <>
            <div className="date-picker-header">
              <button className="date-picker-nav-btn" onClick={goToDatePickerPreviousYear}>
                <ChevronLeft size={16} />
              </button>
              <div className="date-picker-month-year">
                {datePickerCurrentMonth.getFullYear()} - Month Selection
              </div>
              <button className="date-picker-nav-btn" onClick={goToDatePickerNextYear}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="date-picker-months">
              {getMonthsInYear(datePickerCurrentMonth.getFullYear()).map((monthObj) => {
                const isCurrentMonth = monthObj.current;
                const isSelectedMonth = currentDate.getFullYear() === monthObj.year &&
                  currentDate.getMonth() + 1 === monthObj.month;
                return (
                  <button
                    key={monthObj.month}
                    className={`date-picker-month ${isCurrentMonth ? 'current-month' : ''} ${isSelectedMonth ? 'selected-month' : ''}`}
                    onClick={() => handleMonthSelect(monthObj.month - 1, monthObj.year)}
                  >
                    <div className="month-info">
                      <span className="month-name">{monthObj.label}</span>
                      <span className="month-year">{monthObj.year}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="date-picker-footer">
              <button className="date-picker-today-btn" onClick={goToDatePickerToday}>This Month</button>
              <button className="date-picker-close-btn" onClick={() => setShowDatePicker(false)}>Close</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DatePickerModal;
