/**
 * Availability Calculation Utilities
 * Handles professional and time slot availability based on shifts and bookings
 */

import { timeToMinutes, minutesToTime, timeToISOOnDate } from './timeUtils';
import { localDateKey, getDayName } from './dateUtils';
import { hasShiftOnDate, getEmployeeShiftHours } from '../shiftUtils';
import { isTimeSlotConflicting, getAccumulatedBookings } from './bookingConflicts';

// Maximum booking end time (23:00 = 23 * 60 minutes)
const MAX_BOOKING_END_MINUTES = 23 * 60;

/**
 * Generate time slots from employee shifts
 * @param {object} employee - Employee object
 * @param {Date} date - Target date
 * @param {number} serviceDuration - Service duration in minutes (default 30)
 * @param {number} intervalMinutes - Slot interval (default 30)
 * @returns {Array} Array of time slot objects
 */
export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration = 30, intervalMinutes = 30) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (shifts.length === 0) return [];

  const slots = [];

  shifts.forEach(shift => {
    let startMinutes = timeToMinutes(shift.startTime);
    let endMinutes = timeToMinutes(shift.endTime);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const slotEnd = slotStart + serviceDuration;
      if (slotEnd > MAX_BOOKING_END_MINUTES) {
        break;
      }
      const startLabel = minutesToTime(slotStart);
      const endLabel = minutesToTime(slotEnd);
      slots.push({
        startTime: timeToISOOnDate(date, startLabel),
        endTime: timeToISOOnDate(date, endLabel),
        available: true,
        source: 'employee-shift'
      });
    }
  });

  return slots;
};

/**
 * Get valid time slots for a professional (excluding booked times)
 * @param {object} employee - Employee object
 * @param {Date} date - Target date
 * @param {number} serviceDuration - Service duration
 * @param {object} appointments - Appointments by employee
 * @returns {Array} Valid time slots
 */
export const getValidTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (!shifts.length) return [];
  const intervalMinutes = 10;
  const validSlots = [];
  const dayKey = localDateKey(date);
  const employeeAppointments = appointments?.[employee._id] || appointments?.[employee.id] || {};

  shifts.forEach(shift => {
    const startMinutes = timeToMinutes(shift.startTime);
    const endMinutes = timeToMinutes(shift.endTime);

    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const hour = Math.floor(slotStart / 60).toString().padStart(2, '0');
      const minute = (slotStart % 60).toString().padStart(2, '0');
      const slotEnd = slotStart + serviceDuration;
      if (slotEnd > MAX_BOOKING_END_MINUTES) {
        break;
      }
      const slotLabel = `${hour}:${minute}`;
      const slotDate = new Date(date);
      slotDate.setHours(Number(hour), Number(minute), 0, 0);
      const slotEndDate = new Date(slotDate.getTime() + serviceDuration * 60000);
      const overlaps = Object.entries(employeeAppointments).some(([appKey, app]) => {
        if (!appKey.startsWith(`${dayKey}_`)) return false;
        const [_, timeFromKey] = appKey.split('_');
        if (!timeFromKey) return false;
        const [appHour = '0', appMinute = '0'] = timeFromKey.split(':');
        const appStart = new Date(date);
        appStart.setHours(Number(appHour), Number(appMinute), 0, 0);
        const appDuration = app.duration || 30;
        const appEnd = new Date(appStart.getTime() + appDuration * 60000);
        return slotDate < appEnd && slotEndDate > appStart;
      });

      if (!overlaps) {
        validSlots.push({
          startTime: slotDate.toISOString(),
          endTime: slotEndDate.toISOString(),
          label: slotLabel,
          available: true
        });
      }
    }
  });

  return validSlots;
};

/**
 * Get available professionals for a service on a date
 * @param {string} serviceId - Service ID
 * @param {Date} date - Target date
 * @param {Array} employees - All employees
 * @param {object} appointments - Appointments by employee
 * @param {Array} availableServices - Available services
 * @returns {Array} Available professionals
 */
export const getAvailableProfessionalsForService = (serviceId, date, employees, appointments, availableServices) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  return employees.filter(emp => {
    if (!hasShiftOnDate(emp, date)) return false;
    const validSlots = getValidTimeSlotsForProfessional(emp, date, service.duration, appointments);
    return validSlots.length > 0;
  });
};

/**
 * Get available time slots considering accumulated bookings in session
 * @param {object} employee - Employee object
 * @param {Date} date - Target date
 * @param {number} serviceDuration - Service duration
 * @param {object} appointments - Appointments by employee
 * @param {Array} multipleAppointments - Current booking session
 * @returns {Array} Available time slots
 */
export const getAvailableTimeSlotsWithAccumulatedBookings = (employee, date, serviceDuration, appointments, multipleAppointments) => {
  const baseSlots = getValidTimeSlotsForProfessional(employee, date, serviceDuration, appointments);
  const accumulatedBookings = getAccumulatedBookings(multipleAppointments, date);
  const employeeAccumulatedBookings = accumulatedBookings.filter(booking => booking.employeeId === employee._id);
  return baseSlots.filter(slot => {
    const slotTime = slot.startTime ? new Date(slot.startTime).toTimeString().substring(0, 5) : slot;
    return !isTimeSlotConflicting(slotTime, serviceDuration, employeeAccumulatedBookings);
  });
};

/**
 * Get available professionals considering accumulated bookings
 * @param {string} serviceId - Service ID
 * @param {Date} date - Target date
 * @param {Array} employees - All employees
 * @param {object} appointments - Appointments by employee
 * @param {Array} availableServices - Available services
 * @param {Array} multipleAppointments - Current booking session
 * @returns {Array} Available professionals
 */
export const getAvailableProfessionalsWithAccumulatedBookings = (
  serviceId,
  date,
  employees,
  appointments,
  availableServices,
  multipleAppointments
) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  return employees.filter(emp => {
    if (!hasShiftOnDate(emp, date)) return false;
    const baseSlots = getAvailableTimeSlotsWithAccumulatedBookings(emp, date, service.duration, appointments, multipleAppointments);
    return baseSlots.length > 0;
  });
};

// Alias for backward compatibility
export const getAvailableTimeSlotsForProfessional = getValidTimeSlotsForProfessional;

export default {
  generateTimeSlotsFromEmployeeShift,
  getValidTimeSlotsForProfessional,
  getAvailableProfessionalsForService,
  getAvailableTimeSlotsWithAccumulatedBookings,
  getAvailableProfessionalsWithAccumulatedBookings,
  getAvailableTimeSlotsForProfessional,
};
