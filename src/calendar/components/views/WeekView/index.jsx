/**
 * WeekView Component
 * Displays the weekly calendar view with staff rows and daily columns
 */
import React from 'react';
import { formatTime, formatDateLocal, hasShiftOnDate } from '../../../utils';
import './WeekView.css';

const WeekView = ({
  // Data
  calendarDays,
  displayEmployees,
  mergedAppointments,
  employees, // Full list needed for booking defaults lookup
  
  // Event Handlers
  onTimeSlotClick,
  onShowBookingTooltip,
  onHideBookingTooltip,
  onSetSelectedBookingForStatus,
  onShowBookingStatusModal,
  
  // Booking Initiation Handlers
  onInitiateBooking
}) => {
  
  return (
    <div className="week-view-container">
      {/* Week Day Headers */}
      <div className="week-headers-row">
        <div className="week-staff-header-cell">Staff</div>
        {calendarDays.map(day => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={day.toISOString()} className={`week-day-header-cell ${isToday ? 'is-today' : ''}`}>
              <div className="week-day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="week-day-number">{day.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Employee Rows with Daily Appointments */}
      {displayEmployees.map(employee => (
        <div key={employee.id} className="week-employee-row">
          <div className="week-staff-cell">
            <div className="staff-avatar" style={{ backgroundColor: employee.avatarColor }}>
              {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.charAt(0)}
            </div>
            <div className="staff-info">
              <div className="staff-name">{employee.name}</div>
              <div className="staff-position">{employee.position}</div>
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
              <div key={`${employee.id}-${dayKey}`} className={`week-day-cell ${!hasShift ? 'no-shift' : ''}`}>
                {!hasShift ? (
                  <div className="week-no-shift">
                    <span className="no-shift-text">No shift today</span>
                  </div>
                ) : dayAppointments.length > 0 ? (
                  <div className="week-appointments-container">
                    {dayAppointments.slice(0, 3).map((app, index) => (
                      <div
                        key={index}
                        className="week-appointment-block"
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
                              serviceEntryId: app.serviceEntryId // Include serviceEntryId for per-service operations
                            };
                            onSetSelectedBookingForStatus(appointmentDetails);
                            onShowBookingStatusModal(true);
                          } else if (app.timeSlot) {
                            // Fallback to regular time slot click
                            onTimeSlotClick(employee.id, app.timeSlot, day);
                          } else {
                            // No time slot info, show general appointment booking
                            const staff = employees.find(emp => emp.id === employee.id);
                            if (staff) {
                              onInitiateBooking(staff, day);
                            }
                          }
                        }}
                        onMouseEnter={(e) => onShowBookingTooltip(e, {
                          client: app.client,
                          service: app.service,
                          status: app.status,
                          time: app.time,
                          duration: app.duration,
                          notes: app.notes,
                          price: app.price
                        })}
                        onMouseLeave={onHideBookingTooltip}
                      >
                        <span className="week-app-time">{app.time}</span>
                        <span className="week-app-client">{app.client}</span>
                      </div>
                    ))}
                    
                    {/* Add button even with existing appointments */}
                    <div 
                      className="week-add-appointment-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const staff = employees.find(emp => emp.id === employee.id);
                        if (staff) {
                          onInitiateBooking(staff, day);
                        }
                      }}
                      title={`Add another appointment with ${employee.name}`}
                    >
                      <span className="add-appointment-icon">+</span>
                    </div>

                    {dayAppointments.length > 3 && (
                      <div className="week-more-appointments">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="week-empty-slot"
                    onClick={() => {
                      const staff = employees.find(emp => emp.id === employee.id);
                      if (staff) {
                        onInitiateBooking(staff, day);
                      }
                    }}
                  >
                    <span className="add-icon">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeekView;
