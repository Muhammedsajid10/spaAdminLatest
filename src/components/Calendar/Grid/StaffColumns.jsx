/**
 * StaffColumns Component
 * Grid columns for each staff member
 */

import React from 'react';
import StaffColumn from './StaffColumn';

const StaffColumns = ({
  employees,
  currentDate,
  timeSlots,
  appointments,
  onTimeSlotClick,
  onAppointmentClick
}) => {
  // Safety check: ensure employees is an array
  if (!Array.isArray(employees)) {
    console.error('StaffColumns: employees is not an array:', employees);
    return <div className="staff-columns">No staff data available</div>;
  }

  // Safety check: ensure appointments is an object
  const safeAppointments = appointments || {};

  return (
    <div className="staff-columns">
      {employees.map(employee => (
        <StaffColumn
          key={employee.id || employee._id}
          employee={employee}
          currentDate={currentDate}
          timeSlots={timeSlots}
          appointments={safeAppointments[employee.id || employee._id] || {}}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
        />
      ))}
    </div>
  );
};

export default StaffColumns;
