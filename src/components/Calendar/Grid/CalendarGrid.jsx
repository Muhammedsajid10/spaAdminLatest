/**
 * CalendarGrid Component
 * Main calendar grid displaying time slots and appointments
 */

import React from 'react';
import TimeColumn from './TimeColumn';
import StaffColumns from './StaffColumns';
import GridOverlay from './GridOverlay';

const CalendarGrid = ({
  employees,
  currentDate,
  timeSlots,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
  selectedStaff,
  teamFilter
}) => {
  // Safety check
  if (!currentDate || !timeSlots) {
    return (
      <div className="calendar-grid-empty">
        <p>Loading calendar...</p>
      </div>
    );
  }

  // Filter employees based on selection
  const displayEmployees = React.useMemo(() => {
    if (selectedStaff) {
      return employees.filter(emp => emp.id === selectedStaff || emp._id === selectedStaff);
    }
    if (teamFilter && teamFilter.length > 0) {
      return employees.filter(emp => teamFilter.includes(emp.id || emp._id));
    }
    return employees;
  }, [employees, selectedStaff, teamFilter]);

  if (displayEmployees.length === 0) {
    return (
      <div className="calendar-grid-empty">
        <p>No employees to display. Please adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="calendar-grid-container">
      <div className="calendar-grid">
        <TimeColumn timeSlots={timeSlots} />
        
        <StaffColumns
          employees={displayEmployees}
          currentDate={currentDate}
          timeSlots={timeSlots}
          appointments={appointments}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
        />
        
        <GridOverlay />
      </div>
    </div>
  );
};

export default CalendarGrid;
