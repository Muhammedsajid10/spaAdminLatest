/**
 * useTimeSlots Hook
 * Generates and manages time slots using utilities
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { generateSlotsForEmployees, getAvailableSlots } from '../utils/slots';

/**
 * Custom hook for generating and filtering time slots
 * @param {Date} date - Target date
 * @param {Array<Object>} employees - Array of employees
 * @param {number} serviceDuration - Service duration in minutes
 * @returns {Object} Time slots data
 */
export const useTimeSlots = (date, employees, serviceDuration = 30) => {
  const appointments = useSelector(state => state.appointments?.data || {});
  const sessionAppointments = useSelector(state => state.bookingSession?.appointments || []);

  /**
   * Generate all possible time slots for employees
   */
  const allSlots = useMemo(() => {
    if (!employees || employees.length === 0) return {};
    return generateSlotsForEmployees(employees, date, serviceDuration);
  }, [employees, date, serviceDuration]);

  /**
   * Filter slots by availability
   */
  const availableSlots = useMemo(() => {
    const filtered = {};

    Object.entries(allSlots).forEach(([employeeId, slots]) => {
      const employee = employees.find(emp => 
        (emp._id || emp.id) === employeeId
      );

      filtered[employeeId] = getAvailableSlots(slots, {
        appointments: Object.values(appointments).flat(),
        sessionAppointments,
        employee,
        date,
        employeeId,
        requiredDuration: serviceDuration,
      });
    });

    return filtered;
  }, [allSlots, appointments, sessionAppointments, employees, date, serviceDuration]);

  /**
   * Get slots for specific employee
   * @param {string} employeeId - Employee ID
   * @returns {Array<Object>} Employee's available slots
   */
  const getSlotsForEmployee = (employeeId) => {
    return availableSlots[employeeId] || [];
  };

  /**
   * Check if employee has any available slots
   * @param {string} employeeId - Employee ID
   * @returns {boolean}
   */
  const hasAvailableSlots = (employeeId) => {
    const slots = availableSlots[employeeId] || [];
    return slots.length > 0;
  };

  /**
   * Get total count of available slots across all employees
   */
  const totalAvailableSlots = useMemo(() => {
    return Object.values(availableSlots).reduce((total, slots) => {
      return total + slots.length;
    }, 0);
  }, [availableSlots]);

  return {
    allSlots,
    availableSlots,
    getSlotsForEmployee,
    hasAvailableSlots,
    totalAvailableSlots,
  };
};
