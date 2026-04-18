import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ChevronLeft, ChevronRight, Users, Calendar, RotateCcw, Plus, Check, Calendar as CalendarIcon 
} from 'lucide-react';
import DatePickerModal from './DatePickerModal';
import { 
  setCurrentDateISO, 
  setCurrentView, 
  setDatePickerShow, 
  setDatePickerView, 
  setDatePickerMonth, 
  setDatePickerSelected,
  setTeamFilter,
  setShowTeamPopup,
  setShowCalendarPopup,
  setCalendarPopupTab,
  toggleEmployeeSelection,
  setEmployeeSelection
} from '../store/calendarSlice';
import { 
  formatDateLocal, 
  hasShiftOnDate, 
  getDatePickerCalendarDays, 
  getWeeksInMonth, 
  getMonthsInYear 
} from '../Clientsidepage/helpers/selectCalendarHelpers';

const CalendarHeader = ({ 
  goToToday, 
  goToPrevious, 
  goToNext, 
  handleRefreshToNow, 
  handleAddAppointment, 
  calendarDays,
  employees,
  getFilteredAndSearchedEmployees,
  getAppointmentsForDateRange
}) => {
  const dispatch = useDispatch();
  const { 
    currentDateISO, 
    currentView, 
    datePicker,
    filters
  } = useSelector(state => state.calendar);

  const currentDate = new Date(currentDateISO);
  const { show: showDatePicker, view: datePickerView, currentMonthISO, selectedDateISO } = datePicker;
  const datePickerCurrentMonth = new Date(currentMonthISO);
  const datePickerSelectedDate = new Date(selectedDateISO);

  const { teamFilter, showTeamPopup, showCalendarPopup, calendarPopupTab, selectedEmployeeIds } = filters;
  const selectedEmployees = new Set(selectedEmployeeIds);

  const handleDatePickerDateSelect = (date) => {
    dispatch(setCurrentDateISO(date.toISOString()));
    dispatch(setDatePickerShow(false));
  };

  const handleWeekSelect = (startDate) => {
    dispatch(setCurrentDateISO(startDate.toISOString()));
    dispatch(setDatePickerShow(false));
  };

  const handleMonthSelect = (month, year) => {
    const newDate = new Date(year, month, 1);
    dispatch(setCurrentDateISO(newDate.toISOString()));
    dispatch(setDatePickerShow(false));
  };

  const goToDatePickerPreviousMonth = () => {
    const d = new Date(datePickerCurrentMonth);
    d.setMonth(d.getMonth() - 1);
    dispatch(setDatePickerMonth(d.toISOString()));
  };

  const goToDatePickerNextMonth = () => {
    const d = new Date(datePickerCurrentMonth);
    d.setMonth(d.getMonth() + 1);
    dispatch(setDatePickerMonth(d.toISOString()));
  };

  const goToDatePickerPreviousYear = () => {
    const d = new Date(datePickerCurrentMonth);
    d.setFullYear(d.getFullYear() - 1);
    dispatch(setDatePickerMonth(d.toISOString()));
  };

  const goToDatePickerNextYear = () => {
    const d = new Date(datePickerCurrentMonth);
    d.setFullYear(d.getFullYear() + 1);
    dispatch(setDatePickerMonth(d.toISOString()));
  };

  const goToDatePickerToday = () => {
    const today = new Date();
    dispatch(setDatePickerMonth(today.toISOString()));
    dispatch(setDatePickerSelected(today.toISOString()));
    if (datePickerView === 'date') {
      dispatch(setCurrentDateISO(today.toISOString()));
      dispatch(setDatePickerShow(false));
    }
  };

  const handleTeamFilterChange = (filter) => {
    dispatch(setTeamFilter(filter));
  };

  const handleEmployeeToggle = (id) => {
    dispatch(toggleEmployeeSelection(id));
  };

  const handleClearSelection = () => {
    dispatch(setEmployeeSelection([]));
  };

  return (
    <div className="scheduler-header-redesigned">
      {/* Left Side Controls */}
      <div className="header-left-controls">
        {currentView === 'Day' && (
          <button className="header-btn today-btn" onClick={goToToday}>Today</button>
        )}

        <div className="date-navigation">
          <button className="nav-arrow-btn" onClick={goToPrevious}><ChevronLeft size={16} /></button>
          <button
            className="date-display-button"
            onClick={() => {
              dispatch(setDatePickerMonth(currentDate.toISOString()));
              dispatch(setDatePickerSelected(currentDate.toISOString()));
              if (currentView === 'Week') dispatch(setDatePickerView('week'));
              else if (currentView === 'Month') dispatch(setDatePickerView('month'));
              else dispatch(setDatePickerView('date'));
              dispatch(setDatePickerShow(!showDatePicker));
            }}
          >
            <span className="date-display-text">
              {currentView === 'Day' && currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {currentView === 'Week' && calendarDays.length > 0 &&
                `${calendarDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${calendarDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
              {currentView === 'Month' && currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
            <CalendarIcon size={14} className="date-picker-icon" />
          </button>
          <button className="nav-arrow-btn" onClick={goToNext}><ChevronRight size={16} /></button>

          <DatePickerModal 
            showDatePicker={showDatePicker}
            setShowDatePicker={(val) => dispatch(setDatePickerShow(val))}
            datePickerView={datePickerView}
            datePickerCurrentMonth={datePickerCurrentMonth}
            datePickerSelectedDate={datePickerSelectedDate}
            currentDate={currentDate}
            goToDatePickerPreviousMonth={goToDatePickerPreviousMonth}
            goToDatePickerNextMonth={goToDatePickerNextMonth}
            goToDatePickerPreviousYear={goToDatePickerPreviousYear}
            goToDatePickerNextYear={goToDatePickerNextYear}
            goToDatePickerToday={goToDatePickerToday}
            handleDatePickerDateSelect={handleDatePickerDateSelect}
            handleWeekSelect={handleWeekSelect}
            handleMonthSelect={handleMonthSelect}
          />
        </div>

        <div className="team-control-container">
          <button className="header-btn team-icon-btn" onClick={() => dispatch(setShowTeamPopup(!showTeamPopup))}>
            <Users size={16} />
          </button>

          {showTeamPopup && (
            <>
              <div className="popup-backdrop" onClick={() => dispatch(setShowTeamPopup(false))} />
              <div className="team-popup-enhanced">
                <div className="team-filter-options">
                  <button className={`team-filter-option ${teamFilter === 'scheduled' ? 'active' : ''}`} onClick={() => handleTeamFilterChange('scheduled')}>
                    <Users size={18} /><span>Scheduled team</span>
                  </button>
                  <button className={`team-filter-option ${teamFilter === 'all' ? 'active' : ''}`} onClick={() => handleTeamFilterChange('all')}>
                    <Users size={18} /><span>All team</span>
                  </button>
                </div>
                <div className="team-members-container">
                  <div className="team-members-header-section">
                    <h3 className="team-members-title">Team members</h3>
                    <button className="clear-all-link" onClick={handleClearSelection}>Clear all</button>
                  </div>
                  <div className="team-members-list-simple">
                    {getFilteredAndSearchedEmployees().map(employee => {
                      const isSelected = selectedEmployees.has(employee.id);
                      return (
                        <div key={employee.id} className={`team-member-item ${isSelected ? 'selected' : ''}`} onClick={() => handleEmployeeToggle(employee.id)}>
                          <div className="member-checkbox-left">
                            <div className={`checkbox-square ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                          </div>
                          <div className="member-avatar-circle" style={{ backgroundColor: employee.avatarColor }}>
                            {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="member-name-text">{employee.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="header-right-controls">
        <div className="calendar-control-container">
          <button className="header-btn calendar-icon-btn" onClick={() => dispatch(setShowCalendarPopup(!showCalendarPopup))}>
            <Calendar size={16} />
          </button>

          {showCalendarPopup && (
            <>
              <div className="popup-backdrop" onClick={() => dispatch(setShowCalendarPopup(false))} />
              <div className="calendar-popup">
                <div className="calendar-popup-tabs">
                  {['confirmed', 'started', 'completed'].map(tab => (
                    <button key={tab} className={`popup-tab ${calendarPopupTab === tab ? 'active' : ''}`} onClick={() => dispatch(setCalendarPopupTab(tab))}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="calendar-popup-content">
                  {getAppointmentsForDateRange().length > 0 ? (
                    getAppointmentsForDateRange().map((appointment, index) => (
                      <div key={index} className="appointment-popup-item">
                        <div className="appointment-color-dot" style={{ backgroundColor: appointment.color }} />
                        <div className="appointment-popup-details">
                          <div className="appointment-popup-client">{appointment.client}</div>
                          <div className="appointment-popup-service">{appointment.service}</div>
                          <div className="appointment-popup-meta">{appointment.employeeName} • {appointment.timeSlot}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-appointments-message">No {calendarPopupTab} appointments for this period</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="view-controls">
          <button className="refresh-btn" onClick={handleRefreshToNow} title="Refresh to current time"><RotateCcw size={14} /></button>
          <select value={currentView} onChange={(e) => dispatch(setCurrentView(e.target.value))} className="view-selector">
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </select>
        </div>

        <button className="add-appointment-btn" onClick={handleAddAppointment}>
          <h1>Add</h1><Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
