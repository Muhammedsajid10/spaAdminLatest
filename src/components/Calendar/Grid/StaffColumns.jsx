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
  
  console.log('📊 StaffColumns - appointments structure:', safeAppointments);
  console.log('📊 StaffColumns - employees:', employees.map(e => ({ id: e._id || e.id, name: e.user?.firstName })));

  return (
    <div className="staff-columns">
      {employees.map(employee => {
        const employeeId = employee._id || employee.id;
        const empAppointments = safeAppointments[employeeId] || {};
        console.log(`📊 Employee ${employeeId} appointments:`, empAppointments);
        
        return (
          <StaffColumn
            key={employeeId}
            employee={employee}
            currentDate={currentDate}
            timeSlots={timeSlots}
            appointments={empAppointments}
            onTimeSlotClick={onTimeSlotClick}
            onAppointmentClick={onAppointmentClick}
          />
        );
      })}
    </div>
  );
};

export default StaffColumns;
