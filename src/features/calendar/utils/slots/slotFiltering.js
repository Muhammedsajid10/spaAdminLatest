/**
 * Slot Filtering Utilities
 * Pure functions for filtering available time slots
 */

import { timeToMinutes } from '../time/timeConversion';
import { calculateDuration } from '../time/timeCalculation';

/**
 * Filters out booked time slots
 * @param {Array<Object>} slots - Array of slot objects
 * @param {Array<Object>} appointments - Array of appointments
 * @param {string} employeeId - Employee ID to filter for
 * @returns {Array<Object>} Filtered slots
 */
export const filterBookedSlots = (slots, appointments, employeeId) => {
  if (!appointments || appointments.length === 0) return slots;
  
  const employeeAppointments = appointments.filter(apt => 
    (apt.professional?._id === employeeId || apt.professional?.id === employeeId)
  );
  
  return slots.filter(slot => {
    const slotStart = timeToMinutes(slot.label || slot.startTime);
    const slotEnd = slotStart + (slot.duration || 30);
    
    // Check if slot overlaps with any appointment
    const hasOverlap = employeeAppointments.some(apt => {
      const aptStart = timeToMinutes(apt.startTime || apt.timeSlot);
      const aptDuration = apt.duration || apt.service?.duration || 30;
      const aptEnd = aptStart + aptDuration;
      
      // Check for overlap
      return slotStart < aptEnd && slotEnd > aptStart;
    });
    
    return !hasOverlap;
  });
};

/**
 * Filters slots by employee shift hours
 * @param {Array<Object>} slots - Array of slot objects
 * @param {Object} employee - Employee object
 * @param {Date} date - Target date
 * @returns {Array<Object>} Filtered slots
 */
export const filterByShiftHours = (slots, employee, date) => {
  const { hasShiftOnDate, getEmployeeShiftHours } = require('../../../../calendar');
  
  if (!hasShiftOnDate(employee, date)) {
    return [];
  }
  
  const shifts = getEmployeeShiftHours(employee, date);
  
  return slots.filter(slot => {
    const slotTime = slot.label || slot.startTime;
    const slotMinutes = timeToMinutes(slotTime);
    
    // Check if slot falls within any shift
    return shifts.some(shift => {
      const shiftStart = timeToMinutes(shift.startTime);
      let shiftEnd = timeToMinutes(shift.endTime);
      
      // Handle overnight shifts
      if (shiftEnd <= shiftStart) {
        shiftEnd += 1440;
      }
      
      return slotMinutes >= shiftStart && slotMinutes < shiftEnd;
    });
  });
};

/**
 * Filters slots by minimum duration availability
 * @param {Array<Object>} slots - Array of slot objects
 * @param {number} requiredDuration - Required duration in minutes
 * @returns {Array<Object>} Filtered slots
 */
export const filterByDuration = (slots, requiredDuration) => {
  return slots.filter(slot => {
    const slotDuration = slot.duration || calculateDuration(slot.startTime, slot.endTime);
    return slotDuration >= requiredDuration;
  });
};

/**
 * Filters slots that conflict with session appointments
 * @param {Array<Object>} slots - Array of slot objects
 * @param {Array<Object>} sessionAppointments - Appointments in current session
 * @param {string} employeeId - Employee ID
 * @returns {Array<Object>} Filtered slots
 */
export const filterSessionConflicts = (slots, sessionAppointments, employeeId) => {
  if (!sessionAppointments || sessionAppointments.length === 0) return slots;
  
  const employeeSessionAppts = sessionAppointments.filter(apt =>
    (apt.professional?._id === employeeId || apt.professional?.id === employeeId)
  );
  
  return slots.filter(slot => {
    const slotStart = timeToMinutes(slot.label || slot.startTime);
    const slotEnd = slotStart + (slot.duration || 30);
    
    const hasConflict = employeeSessionAppts.some(apt => {
      const aptStart = timeToMinutes(apt.timeSlot);
      const aptEnd = aptStart + apt.duration;
      
      return slotStart < aptEnd && slotEnd > aptStart;
    });
    
    return !hasConflict;
  });
};

/**
 * Combines all filters to get available slots
 * @param {Array<Object>} slots - Array of slot objects
 * @param {Object} options - Filter options
 * @returns {Array<Object>} Available slots
 */
export const getAvailableSlots = (slots, options = {}) => {
  const {
    appointments = [],
    sessionAppointments = [],
    employee,
    date,
    employeeId,
    requiredDuration,
  } = options;
  
  let filtered = [...slots];
  
  // Apply filters in sequence
  if (employee && date) {
    filtered = filterByShiftHours(filtered, employee, date);
  }
  
  if (appointments.length > 0 && employeeId) {
    filtered = filterBookedSlots(filtered, appointments, employeeId);
  }
  
  if (sessionAppointments.length > 0 && employeeId) {
    filtered = filterSessionConflicts(filtered, sessionAppointments, employeeId);
  }
  
  if (requiredDuration) {
    filtered = filterByDuration(filtered, requiredDuration);
  }
  
  return filtered;
};
