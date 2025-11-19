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
          // Calculate position based on time
          const calculateTopPosition = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            // 60px per 30-minute slot = 2px per minute
            return (totalMinutes / 30) * 60;
          };

          const top = calculateTopPosition(apt.startTime || apt.time);
          const height = calculateAppointmentHeight(
            apt.startTime || apt.time,
            apt.endTime,
            60, // timeSlotHeight - matches CSS
            30  // slotInterval
          );

          console.log('📍 Positioning appointment:', {
            time: apt.startTime || apt.time,
            top: `${top}px`,
            height: `${height}px`,
            service: apt.serviceName
          });

          return (
            <div
              key={apt.key}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: '6px',
                right: '6px',
                zIndex: 5
              }}
            >
              <AppointmentCard
                appointment={apt}
                height={height}
                onClick={() => onAppointmentClick && onAppointmentClick(apt)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffColumn;
