/**
 * Appointment Helper Functions
 * Pure functions for appointment calculations and validations
 */

export const getRandomColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomAppointmentColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getAppointmentColorByStatus = (status, fallback = '#e0e7ff') => {
  if (!status) return fallback;
  const s = status.toLowerCase();
  
  // Define a light palette for appointment cards
  const statusColorMap = {
    booked: '#e0e7ff',        // Light indigo
    pending: '#e0e7ff',       // Light indigo
    confirmed: '#e0f2fe',     // Light sky blue
    arrived: '#cffafe',       // Light cyan
    started: '#fef3c7',       // Light amber
    'in-progress': '#fef3c7', // Light amber
    completed: '#dcfce7',     // Light green
    cancelled: '#fee2e2',     // Light red
    'no-show': '#f3e8ff',     // Light purple
    rescheduled: '#fce7f3'    // Light rose
  };
  
  // Exact match
  if (statusColorMap[s]) return statusColorMap[s];
  
  // Fuzzy match
  if (s.includes('confirm')) return statusColorMap.confirmed;
  if (s.includes('cancel')) return statusColorMap.cancelled;
  if (s.includes('progress') || s.includes('start')) return statusColorMap.started;
  if (s.includes('complete')) return statusColorMap.completed;
  if (s.includes('show')) return statusColorMap['no-show'];
  if (s.includes('book')) return statusColorMap.booked;
  
  return fallback;
};

export const calculateAppointmentHeight = (startTime, endTime, timeSlotHeight = 80, slotInterval = 30) => {
  const parseHM = (t = '00:00') => {
    if (!t) return 0;
    if (t instanceof Date) {
      const d = new Date(t);
      return d.getHours() * 60 + d.getMinutes();
    }
    const parts = String(t).trim().split(':');
    const h = Number(parts[0] || 0);
    const m = Number(parts[1] || 0);
    return h * 60 + m;
  };
  
  if (!startTime) return Math.round(timeSlotHeight);
  const s = parseHM(startTime);
  let e = endTime ? parseHM(endTime) : s + slotInterval;
  if (e <= s) e = s + slotInterval;

  const durationMinutes = Math.max(1, e - s);
  const heightFloat = (durationMinutes / slotInterval) * timeSlotHeight;
  return Math.max(Math.ceil(heightFloat), Math.round(timeSlotHeight));
};

export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  const timeToMinutes = (timeStr) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
  };
  
  const newStart = timeToMinutes(newSlot);
  const newEnd = newStart + newDuration;

  return existingBookings.some(booking => {
    const bookingStart = timeToMinutes(booking.startTime);
    const bookingEnd = timeToMinutes(booking.endTime);
    return (newStart < bookingEnd && newEnd > bookingStart);
  });
};

export const getAccumulatedBookings = (multipleAppointments, currentDate) => {
  return multipleAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === currentDate.toDateString();
    })
    .map(apt => ({
      employeeId: apt.professional._id,
      startTime: apt.timeSlot,
      endTime: addMinutesToTime(apt.timeSlot, apt.service.duration),
      duration: apt.service.duration
    }));
};

// Import timeToMinutes and addMinutesToTime from timeHelpers
import { timeToMinutes as toMins, addMinutesToTime } from './timeHelpers';

export { toMins as timeToMinutes };
