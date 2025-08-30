import React from 'react';
import NoDataState from '../../states/NoData';

const formatTime = (time)=> time || 'Time';

export const WeekDayColumn = ({
  day,
  employees,
  appointments,
  onShowMoreAppointments,
  showBookingTooltipHandler,
  hideBookingTooltip
}) => {
  const dayKey = day.toISOString().split('T')[0];
  const isToday = day.toDateString() === new Date().toDateString();
  const dayAppointments = [];
  employees.forEach(emp => {
    if (appointments[emp.id]) {
      Object.entries(appointments[emp.id]).forEach(([slotKey, appointment]) => {
        if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
          const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
            dayAppointments.push({
              ...appointment,
              time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD',
              slotKey,
              timeSlot: timeFromKey,
              employeeName: emp.name
            });
        }
      });
    }
  });
  return (
    <div key={dayKey} className="week-day-column">
      <div className={`week-day-header ${isToday ? 'is-today' : ''}`}>
        <span className="weekday-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        <span className="day-number">{day.getDate()}</span>
      </div>
      <div className="week-appointments">
        {dayAppointments.length > 0 ? (
          <>
            {dayAppointments.slice(0, 3).map((app, index) => (
              <div key={index}
                className="week-appointment-entry"
                style={{ backgroundColor: app.color }}
                onMouseEnter={(e) => showBookingTooltipHandler(e, {
                  client: app.client,
                  service: app.service,
                  time: app.time,
                  professional: app.employeeName,
                  status: app.status || 'Confirmed',
                  notes: app.notes
                })}
                onMouseLeave={hideBookingTooltip}>
                <span className="appointment-client-name">{app.client}</span>
                <span className="appointment-service-name">{app.service}</span>
                <span className="appointment-time">{app.time}</span>
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <div className="week-more-appointments" onClick={(event) => onShowMoreAppointments(dayAppointments, day, event)}>
                +{dayAppointments.length - 3} more
              </div>
            )}
          </>
        ) : (
          <div className="week-no-appointments">
            <NoDataState />
          </div>
        )}
      </div>
    </div>
  );
};
