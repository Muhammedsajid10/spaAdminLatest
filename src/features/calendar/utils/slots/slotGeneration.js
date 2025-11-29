/**
 * Slot Generation Utilities
 * Pure functions for generating time slots
 */

import { timeToMinutes, minutesToTime, timeToISO } from '../time/timeConversion';

const MAX_BOOKING_END_MINUTES = 23 * 60; // 11:00 PM

/**
 * Generates time slots between start and end times
 * @param {string} startTime - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 * @param {number} interval - Interval in minutes (default: 30)
 * @returns {Array<string>} Array of time slots in "HH:MM" format
 * @example generateTimeSlots("09:00", "17:00", 30) // ["09:00", "09:30", "10:00", ...]
 */
export const generateTimeSlots = (startTime, endTime, interval = 30) => {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  // Handle overnight times
  const actualEnd = end < current ? end + 1440 : end;
  
  while (current < actualEnd) {
    slots.push(minutesToTime(current % 1440));
    current += interval;
  }
  
  return slots;
};

/**
 * Generates time slots from employee shift data
 * @param {Object} employee - Employee object with shift data
 * @param {Date} date - Target date
 * @param {number} serviceDuration - Service duration in minutes
 * @param {number} interval - Slot interval in minutes (default: 30)
 * @returns {Array<Object>} Array of slot objects with startTime, endTime, available
 */
export const generateSlotsFromShift = (employee, date, serviceDuration, interval = 30) => {
  // Import from calendar utilities (existing)
  const { getEmployeeShiftHours } = require('../../../../calendar');
  
  const shifts = getEmployeeShiftHours(employee, date);
  if (!shifts || shifts.length === 0) return [];
  
  const allSlots = [];
  
  shifts.forEach(shift => {
    let startMinutes = timeToMinutes(shift.startTime);
    let endMinutes = timeToMinutes(shift.endTime);
    
    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 1440;
    }
    
    // Generate slots that can fit the service duration
    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += interval) {
      const slotEnd = slotStart + serviceDuration;
      
      // Don't create slots that end after max booking time
      if (slotEnd > MAX_BOOKING_END_MINUTES) {
        break;
      }
      
      const startLabel = minutesToTime(slotStart);
      const endLabel = minutesToTime(slotEnd);
      
      allSlots.push({
        startTime: timeToISO(startLabel, date),
        endTime: timeToISO(endLabel, date),
        label: startLabel,
        available: true,
        source: 'employee-shift',
      });
    }
  });
  
  return allSlots;
};

/**
 * Generates all possible time slots for a day
 * @param {string} startTime - Day start time "HH:MM" (default: "00:00")
 * @param {string} endTime - Day end time "HH:MM" (default: "23:59")
 * @param {number} interval - Interval in minutes (default: 30)
 * @returns {Array<string>} Array of time slots
 */
export const generateDaySlots = (startTime = '00:00', endTime = '23:59', interval = 30) => {
  return generateTimeSlots(startTime, endTime, interval);
};

/**
 * Generates slots for multiple employees
 * @param {Array<Object>} employees - Array of employee objects
 * @param {Date} date - Target date
 * @param {number} serviceDuration - Service duration in minutes
 * @param {number} interval - Slot interval
 * @returns {Object} Map of employeeId to slots array
 */
export const generateSlotsForEmployees = (employees, date, serviceDuration, interval = 30) => {
  const slotsMap = {};
  
  employees.forEach(employee => {
    const employeeId = employee._id || employee.id;
    slotsMap[employeeId] = generateSlotsFromShift(employee, date, serviceDuration, interval);
  });
  
  return slotsMap;
};
