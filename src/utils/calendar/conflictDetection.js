/**
 * Advanced Conflict Detection Utilities
 * Detects conflicts between appointments in both database and booking session
 * Critical for multi-appointment booking flow
 */

import { timeToMinutes, timeRangesOverlap, formatDateLocal } from './timeUtils';

/**
 * Main conflict detection function
 * Checks if a professional has conflicting appointments at the specified time
 * 
 * @param {string} professionalId - Employee ID
 * @param {Date} date - Appointment date
 * @param {string} timeSlot - Time in "HH:MM" format
 * @param {number} serviceDuration - Duration in minutes
 * @param {Array} appointments - All appointments from Redux (persisted in DB)
 * @param {Array} sessionAppointments - Temporary appointments in current booking session
 * @returns {Object|null} - Conflict object if conflict found, null otherwise
 */
export const detectProfessionalConflict = (
  professionalId,
  date,
  timeSlot,
  serviceDuration,
  appointments = [],
  sessionAppointments = []
) => {
  const dateKey = formatDateLocal(date);
  const newStart = timeToMinutes(timeSlot);
  const newEnd = newStart + serviceDuration;

  // Check against persisted appointments from database
  const dbConflict = appointments.find(apt => {
    if (apt.professionalId !== professionalId) return false;
    if (formatDateLocal(new Date(apt.date)) !== dateKey) return false;

    const aptStart = timeToMinutes(apt.time);
    const aptEnd = aptStart + (apt.duration || 60);

    return timeRangesOverlap(newStart, newEnd, aptStart, aptEnd);
  });

  if (dbConflict) {
    return {
      type: 'database',
      appointment: dbConflict,
      message: `Professional already has appointment at ${dbConflict.time}`,
      professionalId
    };
  }

  // Check against session appointments (not yet persisted)
  const sessionConflict = sessionAppointments.find(apt => {
    if (apt.professionalId !== professionalId) return false;
    if (formatDateLocal(new Date(apt.date)) !== dateKey) return false;

    const aptStart = timeToMinutes(apt.time);
    const aptEnd = aptStart + (apt.duration || 60);

    return timeRangesOverlap(newStart, newEnd, aptStart, aptEnd);
  });

  if (sessionConflict) {
    return {
      type: 'session',
      appointment: sessionConflict,
      message: `Conflicts with ${sessionConflict.serviceName || 'another service'} in current booking`,
      professionalId
    };
  }

  return null;
};

/**
 * Simple time slot conflict check
 * Used for quick validation without detailed conflict info
 */
export const isTimeSlotConflicting = (
  timeSlot,
  duration,
  existingAppointments = []
) => {
  const slotStart = timeToMinutes(timeSlot);
  const slotEnd = slotStart + duration;

  return existingAppointments.some(apt => {
    const aptStart = timeToMinutes(apt.time);
    const aptEnd = aptStart + (apt.duration || 60);
    return timeRangesOverlap(slotStart, slotEnd, aptStart, aptEnd);
  });
};

/**
 * Get all appointments for a professional on a specific date
 * Combines both database and session appointments
 */
export const getAccumulatedBookings = (
  professionalId,
  date,
  appointments = [],
  sessionAppointments = []
) => {
  const dateKey = formatDateLocal(date);

  const dbBookings = appointments.filter(apt =>
    apt.professionalId === professionalId &&
    formatDateLocal(new Date(apt.date)) === dateKey
  );

  const sessionBookings = sessionAppointments.filter(apt =>
    apt.professionalId === professionalId &&
    formatDateLocal(new Date(apt.date)) === dateKey
  );

  return [...dbBookings, ...sessionBookings].sort((a, b) =>
    timeToMinutes(a.time) - timeToMinutes(b.time)
  );
};

/**
 * Check if a time slot is available (wrapper around detectProfessionalConflict)
 * Returns boolean for simple availability check
 */
export const isSlotAvailable = (
  professionalId,
  date,
  timeSlot,
  duration,
  appointments = [],
  sessionAppointments = []
) => {
  const conflict = detectProfessionalConflict(
    professionalId,
    date,
    timeSlot,
    duration,
    appointments,
    sessionAppointments
  );
  return conflict === null;
};

/**
 * Format conflict message for user display
 */
export const formatConflictMessage = (conflict, professionalName = 'Professional') => {
  if (!conflict) return null;

  if (conflict.type === 'database') {
    return `${professionalName} already has an appointment at ${conflict.appointment.time}`;
  }

  if (conflict.type === 'session') {
    return `This time conflicts with ${conflict.appointment.serviceName || 'another service'} already added to your booking`;
  }

  return 'Time slot not available';
};

/**
 * Check all session appointments for conflicts with database
 * Used before final booking confirmation
 */
export const getAllSessionConflicts = (sessionAppointments = [], appointments = []) => {
  const conflicts = [];

  sessionAppointments.forEach((sessionApt, index) => {
    const conflict = detectProfessionalConflict(
      sessionApt.professionalId,
      new Date(sessionApt.date),
      sessionApt.time,
      sessionApt.duration || 60,
      appointments,
      sessionAppointments.filter((_, i) => i !== index) // Exclude current appointment
    );

    if (conflict) {
      conflicts.push({
        ...conflict,
        sessionAppointmentIndex: index,
        sessionAppointment: sessionApt
      });
    }
  });

  return conflicts;
};

/**
 * Legacy compatibility functions (from old implementation)
 * Kept for backward compatibility during migration
 */

export const detectTimeConflicts = (newAppointment, existingAppointments) => {
  const conflicts = [];
  const newStart = timeToMinutes(newAppointment.time);
  const newEnd = newStart + newAppointment.duration;

  for (const existing of existingAppointments) {
    if (existing.employeeId !== newAppointment.employeeId ||
        existing.date !== newAppointment.date) {
      continue;
    }

    const existingStart = timeToMinutes(existing.time);
    const existingEnd = existingStart + existing.duration;

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

  appointments.forEach(apt => {
    if (!groupedByEmployee[apt.employeeId]) {
      groupedByEmployee[apt.employeeId] = [];
    }
    groupedByEmployee[apt.employeeId].push(apt);
  });

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

    employeeAppointments.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

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
