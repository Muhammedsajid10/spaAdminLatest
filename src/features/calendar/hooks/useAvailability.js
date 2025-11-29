/**
 * useAvailability Hook
 * Checks availability and detects conflicts using utilities
 */

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { detectProfessionalConflict, detectSlotConflict } from '../utils/availability';

/**
 * Custom hook for checking availability and conflicts
 * @returns {Object} Availability checking functions
 */
export const useAvailability = () => {
  const appointments = useSelector(state => state.appointments?.data || {});
  const sessionAppointments = useSelector(state => state.bookingSession?.appointments || []);

  /**
   * Check if a time slot is available for a professional
   * @param {string} professionalId - Professional ID
   * @param {Date} date - Target date
   * @param {string} startTime - Start time "HH:MM"
   * @param {number} duration - Duration in minutes
   * @returns {Object} { available: boolean, conflict: Object|null }
   */
  const checkAvailability = useCallback((professionalId, date, startTime, duration) => {
    const conflict = detectProfessionalConflict(
      professionalId,
      date,
      startTime,
      duration,
      appointments,
      sessionAppointments
    );

    return {
      available: !conflict,
      conflict,
    };
  }, [appointments, sessionAppointments]);

  /**
   * Check if a slot conflicts with existing appointments
   * @param {string} slotTime - Time slot "HH:MM"
   * @param {number} duration - Duration in minutes
   * @param {Array<Object>} existingAppointments - Appointments to check against
   * @returns {Object|null} Conflicting appointment or null
   */
  const checkSlotConflict = useCallback((slotTime, duration, existingAppointments) => {
    return detectSlotConflict(slotTime, duration, existingAppointments);
  }, []);

  /**
   * Get unavailability message for a conflict
   * @param {string} professionalName - Professional's name
   * @param {Object} conflict - Conflict object
   * @returns {string} Human-readable message
   */
  const getUnavailabilityMessage = useCallback((professionalName, conflict) => {
    if (!conflict) return '';

    const { formatTime12Hour } = require('../utils/time');
    const conflictTime = formatTime12Hour(conflict.conflict?.startTime || conflict.conflict?.timeSlot);

    if (conflict.source === 'session') {
      return `${professionalName} is already booked at ${conflictTime} in this session.`;
    }

    return `${professionalName} is already booked at ${conflictTime}.`;
  }, []);

  /**
   * Check if professional is available for entire service duration
   * @param {string} professionalId - Professional ID
   * @param {Date} date - Target date
   * @param {string} startTime - Start time "HH:MM"
   * @param {number} duration - Duration in minutes
   * @returns {boolean}
   */
  const isProfessionalAvailable = useCallback((professionalId, date, startTime, duration) => {
    const { available } = checkAvailability(professionalId, date, startTime, duration);
    return available;
  }, [checkAvailability]);

  return {
    checkAvailability,
    checkSlotConflict,
    getUnavailabilityMessage,
    isProfessionalAvailable,
  };
};
