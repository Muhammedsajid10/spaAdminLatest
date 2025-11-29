import React from 'react';
import {
  hasShiftOnDate,
  getEmployeeShiftHours,
  formatDateLocal,
  localDateKey
} from '../../../../calendar'; // Adjust path as needed
import { formatTime } from '../../../../calendar/timeUtils';
import { StaffColumn } from '../../../../calendar/components/StaffColumn';
import Loading from '../../../../states/Loading.jsx';
import Error500Page from '../../../../states/ErrorPage';
import NoDataState from '../../../../states/NoData';
import styles from './CalendarGrid.module.css';

const CalendarGrid = ({
  loading,
  error,
  employees,
  appointments = {},
  currentView,
  currentDate,
  timeSlots,
  displayEmployees,
  calendarDays,
  mergedAppointments,
  isTimeSlotUnavailable,
  handleTimeSlotClick,
  showBookingTooltipHandler,
  hideBookingTooltip,
  showTimeHoverHandler,
  hideTimeHover,
  setSelectedBookingForStatus,
  setShowBookingStatusModal,
  setBookingDefaults,
  setSelectedBookingDate,
  setIsNewAppointment,
  setShowAddBookingModal,
  setShowServiceCatalog,
  handleMonthDayClick,
  handleShowMoreAppointments
}) => {

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayIndex = startOfMonth.getDay();
    const emptyCellsBefore = Array.from({ length: (firstDayIndex === 0 ? 6 : firstDayIndex - 1) });

    return (
      <div className={styles.monthViewContainer}>
        <div className={styles.monthDayNames}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className={styles.monthDayName}>{day}</div>)}
        </div>
        <div className={styles.monthViewGrid}>
          {emptyCellsBefore.map((_, index) => <div key={`empty-${index}`} className={`${styles.monthDayCell} ${styles.empty}`}></div>)}
          {calendarDays.map(day => {
            const dayKey = localDateKey(day);
            const dayAppointments = [];

            // Get appointments for this day from all employees
            displayEmployees.forEach(emp => {
              if (mergedAppointments[emp.id]) {
                Object.entries(mergedAppointments[emp.id]).forEach(([slotKey, appointment]) => {
                  // Check if the appointment is for this day
                  if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
                    // Extract time from slot key (format: YYYY-MM-DD_HH:MM)
                    const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
                    dayAppointments.push({
                      ...appointment,
                      employeeName: emp.name,
                      employeeAvatar: emp.avatar,
                      employeeId: emp.id,
                      time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD'
                    });
                  }
                });
              }
            });

            return (
              <div
                key={dayKey}
                className={styles.monthDayCell}
                onClick={() => handleMonthDayClick(day)}
                title={`Click to add appointment on ${day.toLocaleDateString()}`}
              >
                <div className={styles.monthDayHeader}>
                  <span className={styles.monthDayDate}>{day.getDate()}</span>
                  <span className={styles.monthAddAppointmentHint}>+</span>
                </div>
                <div className={styles.monthAppointments}>
                  {dayAppointments.length > 0 ? (
                    <>
                      {dayAppointments.slice(0, 3).map((app, index) => (
                        <div key={index}
                          className={styles.monthAppointmentEntry}
                          style={{ backgroundColor: app.color }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent day click when clicking on appointment
                            if (app.bookingId) {
                              // Show booking status for existing appointment
                              const appointmentDetails = {
                                ...app,
                                employeeId: app.employeeId,
                                employeeName: app.employeeName,
                                slotTime: app.time,
                                date: dayKey,
                                slotKey: `${dayKey}_${app.time}`,
                                serviceEntryId: app.serviceEntryId // Include serviceEntryId for per-service operations
                              };
                              setSelectedBookingForStatus(appointmentDetails);
                              setShowBookingStatusModal(true);
                            }
                          }}
                          onMouseEnter={(e) => showBookingTooltipHandler(e, {
                            client: app.client,
                            service: app.service,
                            time: app.time,
                            professional: app.employeeName,
                            status: app.status || 'Confirmed',
                            notes: app.notes
                          })}
                          onMouseLeave={hideBookingTooltip}>
                          <span className={styles.appointmentClientName}>{app.client}</span>
                          <span className={styles.appointmentServiceName}>{app.service}</span>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div
                          className={styles.monthMoreAppointments}
                          onClick={(event) => {
                            event.stopPropagation(); // Prevent day click when clicking on "more"
                            handleShowMoreAppointments(dayAppointments, day, event);
                          }}
                        >
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.monthEmptyDay}>
                      <span className={styles.addAppointmentText}>Click to add appointment</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingMessage}>
          <Loading />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.errorOverlay}>
        <Error500Page />
      </div>
    );
  }
  if (employees.length === 0 && Object.keys(appointments).length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateContent}>
          <NoDataState />
        </div>
      </div>
    );
  }

  if (currentView === 'Month') {
    return renderMonthView();
  }

  return (
    <div className={styles.calendarGridContainer}>
      {currentView === 'Day' && (
        <div className={styles.timeColumn}>
          <div className={styles.timeHeader}>Time</div>
          <div className={styles.timeSlots}>
            {timeSlots.map(slot => (
              <div key={slot} className={`${styles.timeSlotLabel} ${slot.endsWith(':00') ? styles.hourStart : styles.halfHour}`}>
                <span className={styles.timeText}>{formatTime(slot)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.staffGridWrapper}>
        {/* Sticky Headers Row - All staff headers in one fixed row */}
        {currentView === 'Day' && (
          <div className={styles.staffHeadersRow}>
            {displayEmployees.map(employee => {
              const hasShift = hasShiftOnDate(employee, currentDate);
              const shiftHours = getEmployeeShiftHours(employee, currentDate);
              const hasValidShifts = shiftHours.length > 0;

              return (
                <div key={`header-${employee.id}`} className={styles.staffHeaderCell}>
                  <div className={styles.staffAvatar} style={{
                    backgroundColor: hasShift && hasValidShifts ? employee.avatarColor : '#9ca3af',
                    opacity: hasShift && hasValidShifts ? 1 : 0.5
                  }}>
                    {employee.avatar ?
                      <img src={employee.avatar} alt={employee.name} className={styles.avatarImage} style={{ opacity: hasShift && hasValidShifts ? 1 : 0.5 }} /> :
                      (employee.name ? employee.name.charAt(0) : 'E')
                    }
                  </div>
                  <div className={styles.staffInfo}>
                    <div className={styles.staffName} style={{ color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af' }}>{employee.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable Content - Time slots for each employee */}
        <div
          className={styles.staffGrid}
          style={{
            '--dynamic-column-width': displayEmployees.length <= 6
              ? `${100 / (displayEmployees.length || 1)}%`
              : '200px' // Fixed width for scrolling
          }}
        >
          {currentView === 'Day' && displayEmployees.map(employee => (
            <StaffColumn
              key={employee.id}
              employee={employee}
              timeSlots={timeSlots}
              appointments={mergedAppointments}
              currentDate={currentDate}
              isTimeSlotUnavailable={isTimeSlotUnavailable}
              handleTimeSlotClick={handleTimeSlotClick}
              showBookingTooltipHandler={showBookingTooltipHandler}
              hideBookingTooltip={hideBookingTooltip}
              showTimeHoverHandler={showTimeHoverHandler}
              hideTimeHover={hideTimeHover}
              setSelectedBookingForStatus={setSelectedBookingForStatus}
              setShowBookingStatusModal={setShowBookingStatusModal}
              hideHeader={true}
            />
          ))}
          {currentView === 'Week' && (
            <div className={styles.weekViewContainer}>
              {/* Week Day Headers */}
              <div className={styles.weekHeadersRow}>
                <div className={styles.weekStaffHeaderCell}>Staff</div>
                {calendarDays.map(day => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={day.toISOString()} className={`${styles.weekDayHeaderCell} ${isToday ? styles.isToday : ''}`}>
                      <div className={styles.weekDayName}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={styles.weekDayNumber}>{day.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Employee Rows with Daily Appointments */}
              {displayEmployees.map(employee => (
                <div key={employee.id} className={styles.weekEmployeeRow}>
                  <div className={styles.weekStaffCell}>
                    <div className={styles.staffAvatar} style={{ backgroundColor: employee.avatarColor }}>
                      {employee.avatar ? <img src={employee.avatar} alt={employee.name} className={styles.avatarImage} /> : (employee.name ? employee.name.charAt(0) : 'E')}
                    </div>
                    <div className={styles.staffInfo}>
                      <div className={styles.staffName}>{employee.name}</div>
                      <div className={styles.staffPosition}>{employee.position}</div>
                    </div>
                  </div>

                  {/* Daily appointment cells for this employee */}
                  {calendarDays.map(day => {
                    const dayKey = formatDateLocal(day); // Use same format as session appointments
                    const hasShift = hasShiftOnDate(employee, day);

                    // Get appointments for this employee on this day
                    const dayAppointments = [];
                    if (mergedAppointments[employee.id]) {
                      Object.entries(mergedAppointments[employee.id]).forEach(([slotKey, appointment]) => {
                        if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
                          const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
                          dayAppointments.push({
                            ...appointment,
                            time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD',
                            slotKey,
                            timeSlot: timeFromKey,

                          });
                        }
                      });
                    }

                    return (
                      <div key={`${employee.id}-${dayKey}`} className={`${styles.weekDayCell} ${!hasShift ? styles.noShift : ''}`}>
                        {!hasShift ? (
                          <div className={styles.weekNoShift}>
                            <span>No shift</span>
                          </div>
                        ) : dayAppointments.length > 0 ? (
                          <div className={styles.weekAppointmentsContainer}>
                            {dayAppointments.slice(0, 3).map((app, index) => (
                              <div
                                key={index}
                                className={styles.weekAppointmentBlock}
                                style={{ backgroundColor: app.color }}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent event bubbling
                                  
                                  if (app.timeSlot && app.bookingId) {
                                    // Show booking status for existing appointment
                                    const appointmentDetails = {
                                      ...app,
                                      employeeId: employee.id,
                                      employeeName: employee.name,
                                      slotTime: app.timeSlot,
                                      date: dayKey,
                                      slotKey: app.slotKey,
                                      serviceEntryId: app.serviceEntryId 
                                    };
                                    setSelectedBookingForStatus(appointmentDetails);
                                    setShowBookingStatusModal(true);
                                  } else if (app.timeSlot) {
                                    // Fallback to regular time slot click
                                    handleTimeSlotClick(employee.id, app.timeSlot, day);
                                  } else {
                                    // No time slot info, show general appointment booking
                                    const staff = employees.find(emp => emp.id === employee.id);
                                    if (staff) {
                                      setBookingDefaults({
                                        professional: {
                                          _id: staff._id || staff.id,
                                          id: staff.id,
                                          user: {
                                            firstName: staff.name.split(' ')[0],
                                            lastName: staff.name.split(' ')[1] || ''
                                          },
                                          name: staff.name,
                                          position: staff.position,
                                          ...staff
                                        },
                                        date: day,
                                        isDirectEmployeeSelection: true
                                      });
                                      setSelectedBookingDate(day);
                                      setIsNewAppointment(true);
                                      setShowAddBookingModal(true);
                                      setShowServiceCatalog(true);
                                    }
                                  }
                                }}
                                onMouseEnter={(e) => showBookingTooltipHandler(e, {
                                  client: app.client,
                                  service: app.service,
                                  time: app.time,
                                  professional: employee.name,
                                  status: app.status || 'Confirmed',
                                  notes: app.notes
                                })}
                                onMouseLeave={hideBookingTooltip}
                              >
                                <div className={styles.appointmentClient}>{app.client}</div>
                                <div className={styles.appointmentService}>{app.service}</div>
                              </div>
                            ))}

                            {/* Add appointment button for days with existing appointments */}
                            <div
                              className={styles.weekAddAppointmentBtn}
                              onClick={hasShift ? (e) => {
                                e.stopPropagation(); // Prevent event bubbling
                                
                                // Show service selection for this employee and day
                                const staff = employees.find(emp => emp.id === employee.id);
                                if (staff) {
                                  setBookingDefaults({
                                    professional: {
                                      _id: staff._id || staff.id,
                                      id: staff.id,
                                      user: {
                                        firstName: staff.name.split(' ')[0],
                                        lastName: staff.name.split(' ')[1] || ''
                                      },
                                      name: staff.name,
                                      position: staff.position,
                                      ...staff
                                    },
                                    date: day,
                                    isDirectEmployeeSelection: true // Flag for skipping professional selection
                                  });
                                  setSelectedBookingDate(day);
                                  setIsNewAppointment(true);
                                  setShowAddBookingModal(true);
                                  setShowServiceCatalog(true); // Show service selection first
                                }
                              }
                                : undefined}
                              style={{ cursor: hasShift ? 'pointer' : 'not-allowed' }}
                              title={hasShift ? `Add another appointment with ${employee.name}` : 'No shift scheduled'}
                            >
                              <span className={styles.addAppointmentIcon}>+</span>
                            </div>

                            {dayAppointments.length > 3 && (
                              <div className={styles.moreAppointments}>
                                +{dayAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          // Empty day cell with shift - clickable to add appointment
                          <div
                            className={styles.weekEmptyCell}
                            style={{ height: '100%', cursor: hasShift ? 'pointer' : 'not-allowed' }}
                            onClick={hasShift ? () => {
                              const staff = employees.find(emp => emp.id === employee.id);
                              if (staff) {
                                setBookingDefaults({
                                  professional: {
                                    _id: staff._id || staff.id,
                                    id: staff.id,
                                    user: {
                                      firstName: staff.name.split(' ')[0],
                                      lastName: staff.name.split(' ')[1] || ''
                                    },
                                    name: staff.name,
                                    position: staff.position,
                                    ...staff
                                  },
                                  date: day,
                                  isDirectEmployeeSelection: true
                                });
                                setSelectedBookingDate(day);
                                setIsNewAppointment(true);
                                setShowAddBookingModal(true);
                                setShowServiceCatalog(true);
                              }
                            } : undefined}
                          >
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
