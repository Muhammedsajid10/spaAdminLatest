/**
 * useCalendar Hook
 * Main orchestration hook that combines all calendar hooks
 */

import { useDateNavigation } from './useDateNavigation';
import { useViewMode } from './useViewMode';
import { useEmployeeFilter } from './useEmployeeFilter';
import { useTimeSlots } from './useTimeSlots';
import { useAvailability } from './useAvailability';
import { useBookingFlow } from './useBookingFlow';
import { useBookingSession } from './useBookingSession';

/**
 * Main calendar hook that orchestrates all calendar functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Complete calendar state and functions
 */
export const useCalendar = (options = {}) => {
  const { serviceDuration = 30 } = options;

  // Date navigation
  const dateNav = useDateNavigation();

  // View mode
  const viewMode = useViewMode();

  // Employee filtering
  const employeeFilter = useEmployeeFilter();

  // Time slots
  const timeSlots = useTimeSlots(
    dateNav.currentDate,
    employeeFilter.selectedEmployees,
    serviceDuration
  );

  // Availability checking
  const availability = useAvailability();

  // Booking flow
  const bookingFlow = useBookingFlow();

  // Booking session
  const bookingSession = useBookingSession();

  /**
   * Handle time slot click
   * @param {Object} params - { employeeId, time, date }
   */
  const handleTimeSlotClick = ({ employeeId, time, date }) => {
    const employee = employeeFilter.employees.find(emp => 
      (emp._id || emp.id) === employeeId
    );

    bookingFlow.openModal({
      professional: employee,
      timeSlot: time,
      date: date || dateNav.currentDate,
    });
  };

  /**
   * Handle appointment click
   * @param {Object} appointment - Appointment object
   */
  const handleAppointmentClick = (appointment) => {
    // Open appointment details/edit modal
    console.log('Appointment clicked:', appointment);
  };

  return {
    // Date navigation
    ...dateNav,

    // View mode
    ...viewMode,

    // Employee filter
    ...employeeFilter,

    // Time slots
    ...timeSlots,

    // Availability
    ...availability,

    // Booking flow
    bookingFlow,

    // Booking session
    bookingSession,

    // Event handlers
    handleTimeSlotClick,
    handleAppointmentClick,
  };
};
