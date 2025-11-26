/**
 * MonthView Component
 * Displays the monthly calendar view
 */
import React from 'react';
import { localDateKey, formatTime } from '../../../utils';
import './MonthView.css';

const MonthView = ({
  // Data
  currentDate,
  calendarDays,
  displayEmployees,
  mergedAppointments,
  
  // Event Handlers
  onMonthDayClick,
  onSetSelectedBookingForStatus,
  onShowBookingStatusModal,
  onShowBookingTooltip,
  onHideBookingTooltip,
  onShowMoreAppointments
}) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayIndex = startOfMonth.getDay();
  const emptyCellsBefore = Array.from({ length: (firstDayIndex === 0 ? 6 : firstDayIndex - 1) });

  return (
    <div className="month-view-container">
      <div className="month-day-names">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="month-day-name">{day}</div>)}
      </div>
      <div className="month-view-grid">
        {emptyCellsBefore.map((_, index) => <div key={`empty-${index}`} className="month-day-cell empty"></div>)}
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
              className="month-day-cell"
              onClick={() => onMonthDayClick(day)}
              style={{ cursor: 'pointer' }}
              title={`Click to add appointment on ${day.toLocaleDateString()}`}
            >
              <div className="month-day-header">
                <span className="month-day-date">{day.getDate()}</span>
                <span className="month-add-appointment-hint">+</span>
              </div>
              <div className="month-appointments">
                {dayAppointments.length > 0 ? (
                  <>
                    {dayAppointments.slice(0, 3).map((app, index) => (
                      <div key={index}
                        className="month-appointment-entry"
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
                            onSetSelectedBookingForStatus(appointmentDetails);
                            onShowBookingStatusModal(true);
                          }
                        }}
                        onMouseEnter={(e) => onShowBookingTooltip(e, {
                          client: app.client,
                          service: app.service,
                          time: app.time,
                          professional: app.employeeName,
                          status: app.status || 'Confirmed',
                          notes: app.notes
                        })}
                        onMouseLeave={onHideBookingTooltip}>
                        <span className="appointment-client-name">{app.client}</span>
                        <span className="appointment-service-name">{app.service}</span>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div
                        className="month-more-appointments"
                        onClick={(event) => {
                          event.stopPropagation(); // Prevent day click when clicking on "more"
                          onShowMoreAppointments(dayAppointments, day, event);
                        }}
                      >
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </>
                ) : (
                  <div className="month-empty-day">
                    <span className="add-appointment-text">Click to add appointment</span>
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

export default MonthView;
