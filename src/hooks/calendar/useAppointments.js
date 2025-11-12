/**
 * useAppointments Hook
 * Manages appointments data and filtering logic
 */

import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAppointments } from '../../store/appointmentsSlice';
import { fetchCalendarThunk } from '../../store/thunks';
import { localDateKey, getAccumulatedBookings } from '../../utils/calendar';

export const useAppointments = (currentDate) => {
  const dispatch = useDispatch();
  
  // Redux state
  const appointments = useSelector(state => state.appointments.appointments);
  const multipleAppointments = useSelector(state => state.bookingSession.multipleAppointments);
  const employees = useSelector(state => state.employees.employees);

  // Fetch appointments for current date
  useEffect(() => {
    if (currentDate) {
      dispatch(fetchCalendarThunk(currentDate));
    }
  }, [currentDate, dispatch]);

  // Get appointments for specific employee and date
  const getEmployeeAppointments = useCallback((employeeId, date) => {
    const dateKey = localDateKey(date);
    const employeeAppts = appointments[employeeId] || {};
    
    return Object.entries(employeeAppts)
      .filter(([key]) => key.startsWith(dateKey))
      .map(([key, appointment]) => ({
        ...appointment,
        key,
        time: key.split('_')[1]
      }));
  }, [appointments]);

  // Get all appointments for a specific date
  const getDateAppointments = useCallback((date) => {
    const dateKey = localDateKey(date);
    const result = [];

    Object.entries(appointments).forEach(([employeeId, employeeAppts]) => {
      Object.entries(employeeAppts).forEach(([key, appointment]) => {
        if (key.startsWith(dateKey)) {
          result.push({
            ...appointment,
            employeeId,
            key,
            time: key.split('_')[1]
          });
        }
      });
    });

    return result;
  }, [appointments]);

  // Get appointments filtered by team
  const getTeamAppointments = useCallback((teamMemberIds, date) => {
    const dateKey = localDateKey(date);
    const result = [];

    teamMemberIds.forEach(employeeId => {
      const employeeAppts = appointments[employeeId] || {};
      Object.entries(employeeAppts).forEach(([key, appointment]) => {
        if (key.startsWith(dateKey)) {
          result.push({
            ...appointment,
            employeeId,
            key,
            time: key.split('_')[1]
          });
        }
      });
    });

    return result;
  }, [appointments]);

  // Check if time slot has conflict
  const hasConflict = useCallback((employeeId, date, time, duration) => {
    const employeeAppts = getEmployeeAppointments(employeeId, date);
    const timeInMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const endTimeInMinutes = timeInMinutes + duration;

    return employeeAppts.some(apt => {
      const aptTime = apt.time.split(':');
      const aptStartMinutes = parseInt(aptTime[0]) * 60 + parseInt(aptTime[1]);
      const aptEndMinutes = aptStartMinutes + (apt.duration || 30);

      return (
        (timeInMinutes >= aptStartMinutes && timeInMinutes < aptEndMinutes) ||
        (endTimeInMinutes > aptStartMinutes && endTimeInMinutes <= aptEndMinutes) ||
        (timeInMinutes <= aptStartMinutes && endTimeInMinutes >= aptEndMinutes)
      );
    });
  }, [getEmployeeAppointments]);

  // Get accumulated bookings including session appointments
  const getAccumulatedBookingsWithSession = useCallback((date) => {
    return getAccumulatedBookings(multipleAppointments, date);
  }, [multipleAppointments]);

  // Count appointments by status
  const countAppointmentsByStatus = useCallback((date) => {
    const dateAppts = getDateAppointments(date);
    return dateAppts.reduce((acc, apt) => {
      const status = apt.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [getDateAppointments]);

  // Get total appointments count for date
  const getTotalAppointmentsCount = useCallback((date) => {
    return getDateAppointments(date).length;
  }, [getDateAppointments]);

  // Update appointments in Redux
  const updateAppointments = useCallback((newAppointments) => {
    dispatch(setAppointments(newAppointments));
  }, [dispatch]);

  // Add single appointment
  const addAppointment = useCallback((employeeId, dateTimeKey, appointment) => {
    const updated = {
      ...appointments,
      [employeeId]: {
        ...(appointments[employeeId] || {}),
        [dateTimeKey]: appointment
      }
    };
    dispatch(setAppointments(updated));
  }, [appointments, dispatch]);

  // Remove single appointment
  const removeAppointment = useCallback((employeeId, dateTimeKey) => {
    const employeeAppts = { ...(appointments[employeeId] || {}) };
    delete employeeAppts[dateTimeKey];
    
    const updated = {
      ...appointments,
      [employeeId]: employeeAppts
    };
    dispatch(setAppointments(updated));
  }, [appointments, dispatch]);

  return {
    // State
    appointments,
    employees,

    // Getters
    getEmployeeAppointments,
    getDateAppointments,
    getTeamAppointments,
    getAccumulatedBookingsWithSession,
    countAppointmentsByStatus,
    getTotalAppointmentsCount,

    // Checkers
    hasConflict,

    // Actions
    updateAppointments,
    addAppointment,
    removeAppointment
  };
};
