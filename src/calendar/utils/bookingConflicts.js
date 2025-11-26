/**
 * Booking Conflict Detection Utilities
 * Handles conflict detection between appointments, sessions, and professional schedules
 */

import { timeToMinutes, addMinutesToTime } from './timeUtils';
import { localDateKey, formatDateLocal } from './dateUtils';

/**
 * Detect if a professional has a conflict for a given time slot
 * Checks both persisted appointments and current booking session
 * @param {string} professionalId - Professional's ID
 * @param {Date} date - Booking date
 * @param {string} startTime - Start time (HH:MM)
 * @param {number} duration - Duration in minutes
 * @param {object} appointments - Appointments by employee
 * @param {Array} multipleAppointments - Current booking session
 * @returns {object|null} Conflict object or null
 */
export const detectProfessionalConflict = (professionalId, date, startTime, duration, appointments, multipleAppointments) => {
  if (!professionalId || !startTime || !duration) return null;
  const dayKey = localDateKey(date);
  const desiredStart = timeToMinutes(startTime);
  const desiredEnd = desiredStart + duration;

  // Check session conflicts first
  for (const apt of multipleAppointments) {
    const aptDate = new Date(apt.date);
    if (formatDateLocal(aptDate) !== dayKey) continue;
    const aptProfessionalId = apt.professional?._id || apt.professional?.id;
    if (aptProfessionalId !== professionalId) continue;
    const start = timeToMinutes(apt.timeSlot);
    const end = start + apt.duration;
    if (desiredStart < end && desiredEnd > start) {
      return { source: 'session', conflict: apt, start, end };
    }
  }

  // Check persisted appointments
  const profAppointments = appointments?.[professionalId];
  if (profAppointments) {
    for (const key in profAppointments) {
      if (!Object.prototype.hasOwnProperty.call(profAppointments, key)) continue;
      if (!key.startsWith(`${dayKey}_`)) continue;
      const existing = profAppointments[key];
      const existingStartTime = existing.startTime || existing.timeSlot || key.split('_')[1];
      if (!existingStartTime) continue;
      const existingStart = timeToMinutes(existingStartTime);
      let existingEnd;
      if (existing.endTime) {
        existingEnd = timeToMinutes(existing.endTime);
      } else if (existing.duration) {
        existingEnd = existingStart + existing.duration;
      } else if (existing.service?.duration) {
        existingEnd = existingStart + existing.service.duration;
      } else {
        existingEnd = existingStart + 30;
      }
      if (desiredStart < existingEnd && desiredEnd > existingStart) {
        return { source: 'persisted', conflict: existing, start: existingStart, end: existingEnd };
      }
    }
  }

  return null;
};

/**
 * Get accumulated bookings for a specific date from current session
 * @param {Array} multipleAppointments - Current booking session
 * @param {Date} currentDate - Target date
 * @returns {Array} Accumulated bookings
 */
export const getAccumulatedBookings = (multipleAppointments, currentDate) => {
  return multipleAppointments
    .filter(apt => formatDateLocal(new Date(apt.date)) === formatDateLocal(currentDate))
    .map(apt => ({
      employeeId: apt.professional._id,
      startTime: apt.timeSlot,
      endTime: addMinutesToTime(apt.timeSlot, apt.service.duration),
      duration: apt.service.duration
    }));
};

/**
 * Check if a time slot conflicts with existing bookings
 * @param {string} newSlot - New slot time (HH:MM)
 * @param {number} newDuration - Duration in minutes
 * @param {Array} existingBookings - Array of bookings with startTime and endTime
 * @returns {boolean} True if there's a conflict
 */
export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  const newStart = timeToMinutes(newSlot);
  const newEnd = newStart + newDuration;

  return existingBookings.some(booking => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);
    return newStart < existingEnd && newEnd > existingStart;
  });
};

export default {
  detectProfessionalConflict,
  getAccumulatedBookings,
  isTimeSlotConflicting,
};
