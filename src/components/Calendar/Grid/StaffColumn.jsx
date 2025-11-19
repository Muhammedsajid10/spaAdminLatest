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
  
  console.log(`📅 StaffColumn for ${employee.user?.firstName || 'Unknown'}:`, {
    employeeId: employee._id || employee.id,
    dateKey,
    appointments,
    appointmentKeys: Object.keys(appointments || {})
  });

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

  // Get employee display name
  const getEmployeeName = () => {
    // Check populated user object first (from Employee.populate('user'))
    if (employee.user) {
      const firstName = employee.user.firstName || '';
      const lastName = employee.user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    
    // Fallback to direct fields
    if (employee.name) return employee.name;
    const directFullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    if (directFullName) return directFullName;
    
    return 'Staff';
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = getEmployeeName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate avatar color based on name
  const getAvatarColor = () => {
    const colors = [
      '#ec4899', '#8b5cf6', '#6366f1', '#3b82f6', 
      '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
    ];
    const name = getEmployeeName();
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  return (
    <div className="staff-column">
      {/* Header with Avatar */}
      <div className="staff-header">
        <div 
          className="staff-avatar" 
          style={{ backgroundColor: employee.avatarColor || getAvatarColor() }}
        >
          {employee.avatar ? (
            <img src={employee.avatar} alt={getEmployeeName()} />
          ) : (
            <span>{getInitials()}</span>
          )}
        </div>
        <div className="staff-name">
          {getEmployeeName()}
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
