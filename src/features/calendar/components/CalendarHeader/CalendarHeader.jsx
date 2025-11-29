import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  RotateCcw,
  Check,
  Calendar as CalendarIcon
} from 'lucide-react';
import styles from './CalendarHeader.module.css';

const CalendarHeader = ({
  currentView,
  currentDate,
  calendarDays,
  goToToday,
  goToPrevious,
  goToNext,
  showDatePicker,
  setShowDatePicker,
  datePickerView,
  setDatePickerView,
  datePickerCurrentMonth,
  setDatePickerCurrentMonth,
  setDatePickerSelectedDate,
  datePickerSelectedDate,
  goToDatePickerPreviousMonth,
  goToDatePickerNextMonth,
  goToDatePickerPreviousYear,
  goToDatePickerNextYear,
  goToDatePickerToday,
  handleDatePickerDateSelect,
  handleWeekSelect,
  handleMonthSelect,
  getDatePickerCalendarDays,
  getWeeksInMonth,
  getMonthsInYear,
  showTeamPopup,
  setShowTeamPopup,
  teamFilter,
  handleTeamFilterChange,
  handleClearSelection,
  getFilteredAndSearchedEmployees,
  selectedEmployees,
  hasShiftOnDate,
  handleEmployeeToggle,
  showCalendarPopup,
  setShowCalendarPopup,
  calendarPopupTab,
  setCalendarPopupTab,
  getAppointmentsForDateRange,
  handleRefreshToNow,
  handleViewChange,
  handleAddNewAppointment
}) => {
  return (
    <div className={styles.header}>
      {/* Left Side Controls */}
      <div className={styles.leftControls}>
        {/* Today Button - Only show in Day view */}
        {currentView === 'Day' && (
          <button
            className={`${styles.btn} ${styles.todayBtn}`}
            onClick={goToToday}
          >
            Today
          </button>
        )}

        {/* Date Navigation */}
        <div className={styles.dateNav}>
          <button className={styles.navArrowBtn} onClick={goToPrevious}>
            <ChevronLeft size={16} />
          </button>
          <button
            className={styles.btn}
            style={{ border: 'none', background: 'transparent' }}
            onClick={() => {
              setDatePickerCurrentMonth(currentDate);
              setDatePickerSelectedDate(currentDate);

              if (currentView === 'Week') {
                setDatePickerView('week');
              } else if (currentView === 'Month') {
                setDatePickerView('month');
              } else {
                setDatePickerView('date');
              }

              setShowDatePicker(!showDatePicker);
            }}
          >
            <span className={styles.dateText}>
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
            <CalendarIcon size={14} />
          </button>
          <button className={styles.navArrowBtn} onClick={goToNext}>
            <ChevronRight size={16} />
          </button>

          {/* Date Picker Popup */}
          {showDatePicker && (
            <>
              <div className={styles.datePickerBackdrop} onClick={() => setShowDatePicker(false)} />
              <div className={styles.datePickerContainer}>

                {/* DATE VIEW (Day View) */}
                {datePickerView === 'date' && (
                  <>
                    <div className={styles.datePickerHeader}>
                      <button
                        className={styles.datePickerNavBtn}
                        onClick={goToDatePickerPreviousMonth}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className={styles.datePickerMonthYear}>
                        {datePickerCurrentMonth.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </div>
                      <button
                        className={styles.datePickerNavBtn}
                        onClick={goToDatePickerNextMonth}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className={styles.datePickerWeekdays}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className={styles.datePickerWeekday}>
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className={styles.datePickerDays}>
                      {getDatePickerCalendarDays(datePickerCurrentMonth).map((dayObj, index) => {
                        const isToday = dayObj.date.toDateString() === new Date().toDateString();
                        const isSelected = dayObj.date.toDateString() === datePickerSelectedDate.toDateString();
                        const isCurrentView = dayObj.date.toDateString() === currentDate.toDateString();

                        return (
                          <button
                            key={index}
                            className={`${styles.datePickerDay} ${!dayObj.isCurrentMonth ? styles.otherMonth : ''
                              } ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''
                              }`}
                            onClick={() => handleDatePickerDateSelect(dayObj.date)}
                          >
                            {dayObj.date.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.datePickerFooter}>
                      <button
                        className={styles.datePickerTodayBtn}
                        onClick={goToDatePickerToday}
                      >
                        Today
                      </button>
                      <button
                        className={styles.datePickerCloseBtn}
                        onClick={() => setShowDatePicker(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}

                {/* WEEK VIEW (Week Picker) */}
                {datePickerView === 'week' && (
                  <>
                    <div className={styles.datePickerHeader}>
                      <button
                        className={styles.datePickerNavBtn}
                        onClick={goToDatePickerPreviousMonth}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className={styles.datePickerMonthYear}>
                        {datePickerCurrentMonth.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })} - Week Selection
                      </div>
                      <button
                        className={styles.datePickerNavBtn}
                        onClick={goToDatePickerNextMonth}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className={styles.datePickerWeeks}>
                      {getWeeksInMonth(datePickerCurrentMonth).map((week, index) => {
                        const isCurrentWeek = week.isCurrentWeek;
                        const isSelectedWeek = week.startDate.toDateString() === currentDate.toDateString() ||
                          (currentDate >= week.startDate && currentDate <= week.endDate);

                        return (
                          <button
                            key={index}
                            className={`${styles.datePickerWeek} ${isCurrentWeek ? styles.currentWeek : ''} ${isSelectedWeek ? styles.selectedWeek : ''}`}
                            onClick={() => handleWeekSelect(week.startDate)}
                          >
                            <div className={styles.weekInfo}>
                              <span className={styles.weekNumber}>Week {week.weekNumber}</span>
                              <span className={styles.weekRange}>
                                {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                                {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.datePickerFooter}>
                      <button
                        className={styles.datePickerTodayBtn}
                        onClick={goToDatePickerToday}
                      >
                        This Week
                      </button>
                      <button
                        className={styles.datePickerCloseBtn}
                        onClick={() => setShowDatePicker(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}

                {/* MONTH VIEW (Month Picker) */}
                {datePickerView === 'month' && (
                  <>
                    <div className={styles.datePickerHeader}>
                      <button
                        className={styles.datePickerNavBtn}
                        onClick={goToDatePickerPreviousYear}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className={styles.datePickerMonthYear}>
                        {datePickerCurrentMonth.getFullYear()} - Month Selection
                      </div>
                      <button
                        className={styles.datePickerNavBtn}
                        onClick={goToDatePickerNextYear}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className={styles.datePickerMonths}>
                      {getMonthsInYear(datePickerCurrentMonth.getFullYear()).map((monthObj) => {
                        const isCurrentMonth = monthObj.current;
                        const isSelectedMonth = currentDate.getFullYear() === monthObj.year &&
                          currentDate.getMonth() + 1 === monthObj.month;

                        return (
                          <button
                            key={monthObj.month}
                            className={`${styles.datePickerMonth} ${isCurrentMonth ? styles.currentMonth : ''} ${isSelectedMonth ? styles.selectedMonth : ''}`}
                            onClick={() => handleMonthSelect(monthObj.month - 1, monthObj.year)}
                          >
                            <div className={styles.monthInfo}>
                              <span className={styles.monthName}>{monthObj.label}</span>
                              <span className={styles.monthYear}>{monthObj.year}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.datePickerFooter}>
                      <button
                        className={styles.datePickerTodayBtn}
                        onClick={goToDatePickerToday}
                      >
                        This Month
                      </button>
                      <button
                        className={styles.datePickerCloseBtn}
                        onClick={() => setShowDatePicker(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}

              </div>
            </>
          )}
        </div>

        {/* Team Icon with Popup */}
        <div className={styles.teamControl}>
          <button
            className={`${styles.btn} ${styles.iconBtn}`}
            onClick={() => setShowTeamPopup(!showTeamPopup)}
          >
            <Users size={16} />
          </button>

          {showTeamPopup && (
            <>
              <div className={styles.popupBackdrop} onClick={() => setShowTeamPopup(false)} />
              <div className={styles.teamPopup}>
                {/* Header with Multiple team members title */}
                <div className={styles.teamPopupHeader}>
                  <div className={styles.teamFilterOptions} style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className={`${styles.teamFilterBtn} ${teamFilter === 'scheduled' ? styles.active : ''}`}
                      onClick={() => handleTeamFilterChange('scheduled')}
                    >
                      <span>Scheduled</span>
                    </button>
                    <button
                      className={`${styles.teamFilterBtn} ${teamFilter === 'all' ? styles.active : ''}`}
                      onClick={() => handleTeamFilterChange('all')}
                    >
                      <span>All</span>
                    </button>
                  </div>
                </div>

                {/* Team members section */}
                <div className={styles.teamPopupContent}>
                  <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>Team members</h3>
                    <button className={styles.clearSelectionBtn} onClick={handleClearSelection}>
                      Clear all
                    </button>
                  </div>


                  <div>
                    {getFilteredAndSearchedEmployees().map(employee => {
                      const isSelected = selectedEmployees.has(employee.id);
                      // const hasShift = hasShiftOnDate(employee, currentDate); // Unused in display but logic is there

                      return (
                        <div
                          key={employee.id}
                          className={`${styles.employeeItem} ${isSelected ? styles.selected : ''}`}
                          onClick={() => handleEmployeeToggle(employee.id)}
                        >
                          <div className={styles.employeeInfo}>
                            <div className={styles.employeeCheckbox}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                              />
                              <div className={styles.checkmark}>
                                {isSelected && (
                                  <Check size={14} strokeWidth={3} />
                                )}
                              </div>
                            </div>

                            <div
                              className={styles.employeeAvatar}
                              style={{ backgroundColor: employee.avatarColor || '#6366f1' }}
                            >
                              {employee.avatar ?
                                <img src={employee.avatar} alt={employee.name} className={styles.avatarImg} /> :
                                (employee.name ? employee.name.substring(0, 2).toUpperCase() : 'EM')
                              }
                            </div>

                            <span className={styles.employeeName}>{employee.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {getFilteredAndSearchedEmployees().length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                      <p>No team members found</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side Controls */}
      <div className={styles.rightControls}>
        {/* Calendar Icon with Popup */}
        <div className={styles.calendarControl}>
          <button
            className={`${styles.btn} ${styles.iconBtn}`}
            onClick={() => setShowCalendarPopup(!showCalendarPopup)}
          >
            <Calendar size={16} />
          </button>

          {showCalendarPopup && (
            <>
              <div className={styles.popupBackdrop} onClick={() => setShowCalendarPopup(false)} />
              <div className={styles.calendarPopup}>
                <div className={styles.calendarPopupTabs}>
                  <button
                    className={`${styles.popupTab} ${calendarPopupTab === 'confirmed' ? styles.active : ''}`}
                    onClick={() => setCalendarPopupTab('confirmed')}
                  >
                    Confirmed
                  </button>
                  <button
                    className={`${styles.popupTab} ${calendarPopupTab === 'started' ? styles.active : ''}`}
                    onClick={() => setCalendarPopupTab('started')}
                  >
                    Started
                  </button>
                  <button
                    className={`${styles.popupTab} ${calendarPopupTab === 'completed' ? styles.active : ''}`}
                    onClick={() => setCalendarPopupTab('completed')}
                  >
                    Completed
                  </button>
                </div>

                <div className={styles.calendarPopupContent}>
                  {getAppointmentsForDateRange().length > 0 ? (
                    getAppointmentsForDateRange().map((appointment, index) => (
                      <div key={index} className={styles.appointmentPopupItem}>
                        <div
                          className={styles.appointmentColorDot}
                          style={{ backgroundColor: appointment.color }}
                        />
                        <div className={styles.appointmentPopupDetails}>
                          <div className={styles.appointmentPopupClient}>{appointment.client}</div>
                          <div className={styles.appointmentPopupService}>{appointment.service}</div>
                          <div className={styles.appointmentPopupMeta}>
                            {appointment.employeeName} • {appointment.timeSlot}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noAppointmentsMessage}>
                      No {calendarPopupTab} appointments for this period
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* View Controls with Refresh */}
        <div className={styles.viewControls}>
          <button
            className={styles.refreshBtn}
            onClick={handleRefreshToNow}
            title="Refresh to current time"
          >
            <RotateCcw size={14} />
          </button>
          <select
            value={currentView}
            onChange={(e) => handleViewChange(e.target.value)}
            className={styles.viewSelector}
          >
            <option value="Day">Day View</option>
            <option value="Week">Week View</option>
            <option value="Month">Month View</option>
          </select>
        </div>

        {/* Add Appointment Button */}
        <button
          className={styles.addBtn}
          onClick={handleAddNewAppointment}
        >
          <h1>Add</h1>
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
