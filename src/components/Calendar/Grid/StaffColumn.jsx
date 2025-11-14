/**
 * StaffColumn Component
 * Individual staff member column with appointments - CSS Grid Layout
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
  // Safety check
  if (!currentDate) {
    return null;
  }

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
        <div className="staff-header-name">
          {employee.name || employee.user?.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Staff'}
        </div>
        <div className="staff-header-role">
          {employee.position || employee.role || 'Staff Member'}
        </div>
      </div>

      {/* Schedule with time slots */}
      <div className="staff-schedule">
        {timeSlots.map((time, index) => (
          <div
            key={index}
            className="time-slot"
            onClick={() => handleTimeSlotClick(time)}
          />
        ))}

        {/* Appointments overlay */}
        {dateAppointments.map((apt) => {
          const height = calculateAppointmentHeight(
            apt.startTime || apt.time,
            apt.endTime,
            60, // timeSlotHeight - matches CSS
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
  );
};

export default StaffColumn;
