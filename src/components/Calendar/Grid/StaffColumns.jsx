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
  return (
    <div className="staff-columns">
      {employees.map(employee => (
        <StaffColumn
          key={employee.id || employee._id}
          employee={employee}
          currentDate={currentDate}
          timeSlots={timeSlots}
          appointments={appointments[employee.id || employee._id] || {}}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
        />
      ))}
    </div>
  );
};

export default StaffColumns;
