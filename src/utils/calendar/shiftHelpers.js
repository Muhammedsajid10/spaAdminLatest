/**
 * Shift and Employee Schedule Helpers
 * Functions for managing employee shifts and availability
 */

import { getEmployeeShiftHours } from '../../calendar'; // Import from existing calendar utils
import { timeToMinutes, minutesToTimeLabel, addMinutesToTime } from './timeHelpers';

export { getEmployeeShiftHours }; // Re-export

export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration = 30, intervalMinutes = 30) => {
  const shifts = getEmployeeShiftHours(employee, date);

  if (shifts.length === 0) {
    return [];
  }

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const toISOOnDate = (timeLabel) => {
    const [h, m] = timeLabel.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const slots = [];

  shifts.forEach(shift => {
    const shiftStartMins = toMinutes(shift.startTime);
    const shiftEndMins = toMinutes(shift.endTime);

    for (let slotStart = shiftStartMins; slotStart + serviceDuration <= shiftEndMins; slotStart += intervalMinutes) {
      const slotEnd = slotStart + serviceDuration;
      const startLabel = minutesToTimeLabel(slotStart);
      const endLabel = minutesToTimeLabel(slotEnd);

      slots.push({
        startTime: toISOOnDate(startLabel),
        endTime: toISOOnDate(endLabel),
        startLabel,
        endLabel,
        available: true
      });
    }
  });

  return slots;
};

export const getValidTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (!shifts.length) return [];

  const intervalMinutes = 10;
  const validSlots = [];

  shifts.forEach(shift => {
    const startMinutes = parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1]);
    const endMinutes = parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1]);

    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const hour = Math.floor(slotStart / 60).toString().padStart(2, '0');
      const minute = (slotStart % 60).toString().padStart(2, '0');
      const timeSlot = `${hour}:${minute}`;
      const slotDate = new Date(date);
      slotDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
      const slotStartDate = slotDate;
      const slotEndDate = new Date(slotStartDate.getTime() + serviceDuration * 60000);

      const employeeAppointments = appointments?.[employee._id] || appointments?.[employee.id] || {};
      const overlaps = Object.entries(employeeAppointments).some(([appKey, app]) => {
        if (!appKey.includes('_')) return false;
        const timeFromKey = appKey.split('_')[1];
        if (!timeFromKey) return false;
        const [appHour, appMinute] = timeFromKey.split(':').map(Number);
        const appStart = new Date(date);
        appStart.setHours(appHour, appMinute, 0, 0);
        const appEnd = new Date(appStart.getTime() + (app.duration || 30) * 60000);
        const slotEndDate = new Date(slotStartDate.getTime() + serviceDuration * 60000);

        return (slotStartDate < appEnd && slotEndDate > appStart);
      });

      if (!overlaps) {
        validSlots.push({
          startTime: slotStartDate.toISOString(),
          endTime: slotEndDate.toISOString(),
          available: true
        });
      }
    }
  });

  return validSlots;
};

export const getAvailableTimeSlotsWithAccumulatedBookings = (employee, date, serviceDuration, appointments, multipleAppointments) => {
  const baseSlots = getValidTimeSlotsForProfessional(employee, date, serviceDuration, appointments);
  const accumulatedBookings = getAccumulatedBookings(multipleAppointments, date);
  const employeeAccumulatedBookings = accumulatedBookings.filter(booking => booking.employeeId === employee._id);

  return baseSlots.filter(slot => {
    const slotTime = new Date(slot.startTime).toTimeString().substring(0, 5);
    return !isTimeSlotConflicting(slotTime, serviceDuration, employeeAccumulatedBookings);
  });
};

// Import from appointmentHelpers
import { isTimeSlotConflicting, getAccumulatedBookings } from './appointmentHelpers';
