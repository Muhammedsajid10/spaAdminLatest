/**
 * StaffColumn Component
 * Individual staff member column with appointments
 */

import React from 'react';
import { localDateKey, calculateAppointmentHeight, getAppointmentColorByStatus } from '../../../utils/calendar';
import AppointmentCard from '../Shared/AppointmentCard';

const StaffColumn = ({
  employee,
  currentDate,
  timeSlots,
  appointments,
  onTimeSlotClick,
  onAppointmentClick
}) => {
  const dateKey = localDateKey(currentDate);

  const getAppointmentsForDate = () => {
    return Object.entries(appointments)
      .filter(([key]) => key.startsWith(dateKey))
      .map(([key, apt]) => ({
        ...apt,
        key,
        time: key.split('_')[1]
      }));
  };

  const dateAppointments = getAppointmentsForDate();

  const handleTimeSlotClick = (time) => {
    if (onTimeSlotClick) {
      onTimeSlotClick({
        employee,
        date: currentDate,
        time
      });
    }
  };

  return (
    <div className="staff-column">
      {/* Header */}
      <div className="staff-header">
        <div className="staff-avatar">
          {employee.avatar ? (
            <img src={employee.avatar} alt={employee.name} />
          ) : (
            <div className="avatar-placeholder" style={{ backgroundColor: employee.avatarColor || '#ccc' }}>
              {(employee.name || employee.firstName || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="staff-info">
          <div className="staff-name">
            {employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim()}
          </div>
          <div className="staff-position">
            {employee.position || 'Staff'}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="staff-time-slots">
        {timeSlots.map((time, index) => (
          <div
            key={index}
            className="time-slot"
            onClick={() => handleTimeSlotClick(time)}
          >
            {/* Empty slot - click to book */}
          </div>
        ))}

        {/* Appointments overlay */}
        <div className="appointments-overlay">
          {dateAppointments.map((apt) => {
            const height = calculateAppointmentHeight(
              apt.startTime || apt.time,
              apt.endTime,
              80, // timeSlotHeight
              30  // slotInterval
            );

            return (
              <AppointmentCard
                key={apt.key}
                appointment={apt}
                height={height}
                onClick={() => onAppointmentClick && onAppointmentClick(apt)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StaffColumn;
