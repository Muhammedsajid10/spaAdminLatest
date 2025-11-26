/**
 * DayView Component
 * Displays the daily calendar view with time slots and staff columns
 */
import React from 'react';
import { StaffColumn } from '../../../components/StaffColumn';
import { formatTime, hasShiftOnDate, getEmployeeShiftHours } from '../../../utils';
import './DayView.css';

const DayView = ({
  // Data
  currentDate,
  timeSlots,
  displayEmployees,
  mergedAppointments,
  
  // Logic helpers
  isTimeSlotUnavailable,
  
  // Event Handlers
  onTimeSlotClick,
  onShowBookingTooltip,
  onHideBookingTooltip,
  onShowTimeHover,
  onHideTimeHover,
  onSetSelectedBookingForStatus,
  onShowBookingStatusModal
}) => {
  
  return (
    <div className="calendar-grid-container">
      {/* Time Column */}
      <div className="time-column">
        <div className="time-header">Time</div>
        <div className="time-slots">
          {timeSlots.map(slot => (
            <div key={slot} className={`time-slot-label ${slot.endsWith(':00') ? 'hour-start' : 'half-hour'}`}>
              <span className="time-text">{formatTime(slot)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="staff-grid-wrapper">
        {/* Sticky Headers Row - All staff headers in one fixed row */}
        <div className="staff-headers-row">
          {displayEmployees.map(employee => {
            const hasShift = hasShiftOnDate(employee, currentDate);
            const shiftHours = getEmployeeShiftHours(employee, currentDate);
            const hasValidShifts = shiftHours.length > 0;

            return (
              <div key={`header-${employee.id}`} className="staff-header-cell">
                <div className="staff-avatar" style={{
                  backgroundColor: hasShift && hasValidShifts ? employee.avatarColor : '#9ca3af',
                  opacity: hasShift && hasValidShifts ? 1 : 0.5
                }}>
                  {employee.avatar ?
                    <img src={employee.avatar} alt={employee.name} className="avatar-image" style={{ opacity: hasShift && hasValidShifts ? 1 : 0.5 }} /> :
                    employee.name.charAt(0)
                  }
                </div>
                <div className="staff-info">
                  <div className="staff-name" style={{ color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af' }}>{employee.name}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Content - Time slots for each employee */}
        <div
          className={`staff-grid cols-${Math.min(displayEmployees.length || 1, 20)}`}
          style={{
            '--dynamic-employee-count': displayEmployees.length || 1,
            '--dynamic-column-width': displayEmployees.length <= 6
              ? `${100 / (displayEmployees.length || 1)}%`
              : 'var(--staff-column-width)'
          }}
        >
          {displayEmployees.map(employee => (
            <StaffColumn
              key={employee.id}
              employee={employee}
              timeSlots={timeSlots}
              appointments={mergedAppointments}
              currentDate={currentDate}
              isTimeSlotUnavailable={isTimeSlotUnavailable}
              handleTimeSlotClick={onTimeSlotClick}
              showBookingTooltipHandler={onShowBookingTooltip}
              hideBookingTooltip={onHideBookingTooltip}
              showTimeHoverHandler={onShowTimeHover}
              hideTimeHover={onHideTimeHover}
              setSelectedBookingForStatus={onSetSelectedBookingForStatus}
              setShowBookingStatusModal={onShowBookingStatusModal}
              hideHeader={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayView;
