/**
 * useBookingSession Hook
 * Manages multiple appointments in a session
 */

import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

/**
 * Custom hook for managing booking session (multiple appointments)
 * @returns {Object} Session state and functions
 */
export const useBookingSession = () => {
  const dispatch = useDispatch();
  const appointments = useSelector(state => state.bookingSession?.appointments || []);
  const currentIndex = useSelector(state => state.bookingSession?.currentIndex || 0);

  /**
   * Add appointment to session
   * @param {Object} appointment - Appointment data
   */
  const addAppointment = useCallback((appointment) => {
    dispatch({
      type: 'bookingSession/addAppointment',
      payload: appointment,
    });
  }, [dispatch]);

  /**
   * Remove appointment from session
   * @param {string} appointmentId - Appointment ID
   */
  const removeAppointment = useCallback((appointmentId) => {
    dispatch({
      type: 'bookingSession/removeAppointment',
      payload: appointmentId,
    });
  }, [dispatch]);

  /**
   * Update appointment in session
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updates - Updated data
   */
  const updateAppointment = useCallback((appointmentId, updates) => {
    dispatch({
      type: 'bookingSession/updateAppointment',
      payload: { appointmentId, updates },
    });
  }, [dispatch]);

  /**
   * Clear entire session
   */
  const clearSession = useCallback(() => {
    dispatch({ type: 'bookingSession/clearSession' });
  }, [dispatch]);

  /**
   * Set current appointment index
   * @param {number} index - Index to set
   */
  const setCurrentIndex = useCallback((index) => {
    dispatch({
      type: 'bookingSession/setCurrentIndex',
      payload: index,
    });
  }, [dispatch]);

  /**
   * Get appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Object|null} Appointment or null
   */
  const getAppointmentById = useCallback((appointmentId) => {
    return appointments.find(apt => apt.id === appointmentId) || null;
  }, [appointments]);

  /**
   * Calculate total price for session
   * @returns {number} Total price
   */
  const calculateTotal = useCallback(() => {
    return appointments.reduce((total, apt) => {
      return total + (apt.service?.price || 0);
    }, 0);
  }, [appointments]);

  /**
   * Calculate total duration for session
   * @returns {number} Total duration in minutes
   */
  const calculateTotalDuration = useCallback(() => {
    return appointments.reduce((total, apt) => {
      return total + (apt.service?.duration || 0);
    }, 0);
  }, [appointments]);

  /**
   * Check if session has appointments
   */
  const hasAppointments = appointments.length > 0;

  /**
   * Get current appointment
   */
  const currentAppointment = appointments[currentIndex] || null;

  /**
   * Check if can add more appointments
   */
  const canAddMore = appointments.length < 10; // Max 10 appointments per session

  return {
    appointments,
    currentIndex,
    currentAppointment,
    hasAppointments,
    canAddMore,
    appointmentCount: appointments.length,
    addAppointment,
    removeAppointment,
    updateAppointment,
    clearSession,
    setCurrentIndex,
    getAppointmentById,
    calculateTotal,
    calculateTotalDuration,
  };
};
