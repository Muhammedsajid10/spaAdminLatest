/**
 * Conflict Detection Functions
 * Functions for detecting and resolving booking conflicts
 */

import { timeToMinutes, addMinutesToTime } from './timeHelpers';

export const detectTimeConflicts = (newAppointment, existingAppointments) => {
  const conflicts = [];
  const newStart = timeToMinutes(newAppointment.time);
  const newEnd = newStart + newAppointment.duration;

  for (const existing of existingAppointments) {
    // Skip if different employee or different date
    if (existing.employeeId !== newAppointment.employeeId || 
        existing.date !== newAppointment.date) {
      continue;
    }

    const existingStart = timeToMinutes(existing.time);
    const existingEnd = existingStart + existing.duration;

    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      conflicts.push({
        type: 'time_overlap',
        appointment: existing,
        message: `Conflicts with ${existing.serviceName} at ${existing.time}`
      });
    }
  }

  return conflicts;
};

export const detectEmployeeConflicts = (appointments, employees) => {
  const conflicts = [];
  const groupedByEmployee = {};

  // Group appointments by employee
  appointments.forEach(apt => {
    if (!groupedByEmployee[apt.employeeId]) {
      groupedByEmployee[apt.employeeId] = [];
    }
    groupedByEmployee[apt.employeeId].push(apt);
  });

  // Check each employee's appointments for conflicts
  Object.entries(groupedByEmployee).forEach(([employeeId, employeeAppointments]) => {
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee) {
      conflicts.push({
        type: 'employee_not_found',
        employeeId,
        message: `Employee ${employeeId} not found`
      });
      return;
    }

    // Sort appointments by time
    employeeAppointments.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    // Check for overlaps
    for (let i = 0; i < employeeAppointments.length - 1; i++) {
      const current = employeeAppointments[i];
      const next = employeeAppointments[i + 1];

      const currentEnd = timeToMinutes(current.time) + current.duration;
      const nextStart = timeToMinutes(next.time);

      if (currentEnd > nextStart) {
        conflicts.push({
          type: 'employee_double_booking',
          employee: employee.name,
          appointments: [current, next],
          message: `${employee.name} is double-booked between ${current.time} and ${next.time}`
        });
      }
    }
  });

  return conflicts;
};

export const detectCapacityConflicts = (appointments, maxCapacity = 10) => {
  const conflicts = [];
  const timeSlots = {};

  // Group by date and time
  appointments.forEach(apt => {
    const key = `${apt.date}_${apt.time}`;
    if (!timeSlots[key]) {
      timeSlots[key] = [];
    }
    timeSlots[key].push(apt);
  });

  // Check capacity
  Object.entries(timeSlots).forEach(([key, slots]) => {
    if (slots.length > maxCapacity) {
      const [date, time] = key.split('_');
      conflicts.push({
        type: 'capacity_exceeded',
        date,
        time,
        count: slots.length,
        maxCapacity,
        message: `Too many appointments at ${time} on ${date} (${slots.length}/${maxCapacity})`
      });
    }
  });

  return conflicts;
};

export const resolveConflicts = (conflicts) => {
  const resolutions = [];

  conflicts.forEach(conflict => {
    switch (conflict.type) {
      case 'time_overlap':
        resolutions.push({
          conflictId: conflict.appointment.id,
          suggestion: 'Move appointment to next available slot',
          action: 'reschedule'
        });
        break;

      case 'employee_double_booking':
        resolutions.push({
          conflictId: conflict.appointments[0].id,
          suggestion: 'Assign to different employee or change time',
          action: 'reassign_or_reschedule'
        });
        break;

      case 'capacity_exceeded':
        resolutions.push({
          date: conflict.date,
          time: conflict.time,
          suggestion: 'Move some appointments to different times',
          action: 'redistribute'
        });
        break;

      default:
        resolutions.push({
          suggestion: 'Manual review required',
          action: 'manual'
        });
    }
  });

  return resolutions;
};

export const findNextAvailableSlot = (preferredTime, duration, employeeId, existingAppointments, date) => {
  const startMinutes = timeToMinutes(preferredTime);
  const businessStartMinutes = timeToMinutes('09:00');
  const businessEndMinutes = timeToMinutes('18:00');

  // Try slots every 15 minutes
  for (let minutes = startMinutes; minutes + duration <= businessEndMinutes; minutes += 15) {
    const testTime = addMinutesToTime('00:00', minutes);
    
    const testAppointment = {
      time: testTime,
      duration,
      employeeId,
      date
    };

    const conflicts = detectTimeConflicts(testAppointment, existingAppointments);
    
    if (conflicts.length === 0) {
      return testTime;
    }
  }

  return null; // No available slot found
};
