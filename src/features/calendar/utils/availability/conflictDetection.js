/**
 * Conflict Detection Utilities
 * Pure functions for detecting booking conflicts
 */

import { timeToMinutes } from '../time/timeConversion';

/**
 * Checks if two time ranges overlap
 * @param {Object} range1 - { start: "HH:MM", end: "HH:MM" }
 * @param {Object} range2 - { start: "HH:MM", end: "HH:MM" }
 * @returns {boolean} True if ranges overlap
 */
export const doRangesOverlap = (range1, range2) => {
  const start1 = timeToMinutes(range1.start);
  const end1 = timeToMinutes(range1.end);
  const start2 = timeToMinutes(range2.start);
  const end2 = timeToMinutes(range2.end);

  return start1 < end2 && end1 > start2;
};

/**
 * Detects if a time slot conflicts with existing appointments
 * @param {string} slotTime - Time slot to check "HH:MM"
 * @param {number} duration - Service duration in minutes
 * @param {Array<Object>} appointments - Existing appointments
 * @returns {Object|null} Conflicting appointment or null
 */
export const detectSlotConflict = (slotTime, duration, appointments) => {
  if (!appointments || appointments.length === 0) return null;
  
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + duration;

  return appointments.find(apt => {
    const aptStart = timeToMinutes(apt.startTime || apt.timeSlot);
    const aptDuration = apt.duration || apt.service?.duration || 30;
    const aptEnd = aptStart + aptDuration;
    
    return slotStart < aptEnd && slotEnd > aptStart;
  }) || null;
};

/**
 * Detects professional conflicts across persisted and session appointments
 * @param {string} professionalId - Professional ID
 * @param {Date} date - Target date
 * @param {string} startTime - Start time "HH:MM"
 * @param {number} duration - Duration in minutes
 * @param {Object} appointments - Persisted appointments map
 * @param {Array<Object>} sessionAppointments - Session appointments array
 * @returns {Object|null} Conflict details or null
 */
export const detectProfessionalConflict = (
  professionalId,
  date,
  startTime,
  duration,
  appointments,
  sessionAppointments = []
) => {
  if (!professionalId || !startTime || !duration) return null;
  
  const { formatDateLocal, localDateKey } = require('../../../../calendar');
  const dayKey = localDateKey(date);
  const desiredStart = timeToMinutes(startTime);
  const desiredEnd = desiredStart + duration;

  // Check session appointments first
  for (const apt of sessionAppointments) {
    const aptDate = new Date(apt.date);
    if (formatDateLocal(aptDate) !== dayKey) continue;
    
    const aptProfessionalId = apt.professional?._id || apt.professional?.id;
    if (aptProfessionalId !== professionalId) continue;
    
    const start = timeToMinutes(apt.timeSlot);
    const end = start + apt.duration;
    
    if (desiredStart < end && desiredEnd > start) {
      return {
        source: 'session',
        conflict: apt,
        start,
        end,
      };
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
        return {
          source: 'persisted',
          conflict: existing,
          start: existingStart,
          end: existingEnd,
        };
      }
    }
  }

  return null;
};

/**
 * Checks if a time slot is conflicting with a list of bookings
 * @param {string} newSlot - New slot time "HH:MM"
 * @param {number} newDuration - New slot duration
 * @param {Array<Object>} existingBookings - Existing bookings
 * @returns {boolean} True if conflicting
 */
export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  if (!existingBookings || existingBookings.length === 0) return false;
  
  const newStart = timeToMinutes(newSlot);
  const newEnd = newStart + newDuration;

  return existingBookings.some(booking => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);
    return newStart < existingEnd && newEnd > existingStart;
  });
};

/**
 * Gets all conflicts for a proposed appointment
 * @param {Object} proposedAppointment - Proposed appointment details
 * @param {Array<Object>} existingAppointments - Existing appointments
 * @returns {Array<Object>} Array of conflicts
 */
export const getAllConflicts = (proposedAppointment, existingAppointments) => {
  const conflicts = [];
  const proposedStart = timeToMinutes(proposedAppointment.startTime);
  const proposedEnd = proposedStart + proposedAppointment.duration;

  existingAppointments.forEach(apt => {
    const aptStart = timeToMinutes(apt.startTime || apt.timeSlot);
    const aptEnd = aptStart + (apt.duration || 30);
    
    if (proposedStart < aptEnd && proposedEnd > aptStart) {
      conflicts.push(apt);
    }
  });

  return conflicts;
};
