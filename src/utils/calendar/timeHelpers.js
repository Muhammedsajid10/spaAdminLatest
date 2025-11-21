/**
 * Time and Date Helper Functions for Calendar
 * All pure utility functions for time/date manipulation
 */

export const formatUTCToLocal = (utcString, opts = {}) => {
  if (!utcString) return '';
  const dt = new Date(utcString);
  return dt.toLocaleString(undefined, opts);
};

export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  let currentHour = parseInt(startTime.split(':')[0]);
  let currentMinute = parseInt(startTime.split(':')[1]);
  const endHour = parseInt(endTime.split(':')[0]);
  const endMinute = parseInt(endTime.split(':')[1]);

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const hourFormatted = String(currentHour).padStart(2, '0');
    const minuteFormatted = String(currentMinute).padStart(2, '0');
    slots.push(`${hourFormatted}:${minuteFormatted}`);

    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour++;
    }
  }
  return slots;
};

export const formatTime = (time) => {
  return time; // 24-hour format directly
};

export const addMinutesToTime = (timeStr, minutes) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

export const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

export const minutesToTimeLabel = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const formatTooltipTime = (timeString) => {
  if (!timeString) return '';
  return timeString;
};

/**
 * Calculate the maximum booking time to prevent overnight appointments
 * @param {number} serviceDuration - Service duration in minutes
 * @param {number} maxEndTimeHour - Maximum end time hour (default: 23 for 11 PM)
 * @returns {Object} Object with maxBookingTime string and maxBookingTimeMinutes
 */
export const calculateMaxBookingTime = (serviceDuration, maxEndTimeHour = 23) => {
  const MAX_END_TIME_MINUTES = maxEndTimeHour * 60;
  const maxBookingTimeMinutes = MAX_END_TIME_MINUTES - serviceDuration;
  
  const hours = Math.floor(maxBookingTimeMinutes / 60);
  const minutes = maxBookingTimeMinutes % 60;
  const maxBookingTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  
  return {
    maxBookingTime,
    maxBookingTimeMinutes,
    maxEndTime: `${String(maxEndTimeHour).padStart(2, '0')}:00`
  };
};

/**
 * Check if a time slot would extend past the maximum end time
 * @param {string} timeSlot - Time slot in HH:mm format
 * @param {number} serviceDuration - Service duration in minutes
 * @param {number} maxEndTimeHour - Maximum end time hour (default: 23 for 11 PM)
 * @returns {boolean} True if slot would extend past max time, false otherwise
 */
export const wouldExtendPastMaxTime = (timeSlot, serviceDuration, maxEndTimeHour = 23) => {
  const slotMinutes = timeToMinutes(timeSlot);
  const endMinutes = slotMinutes + serviceDuration;
  const maxMinutes = maxEndTimeHour * 60;
  return endMinutes > maxMinutes;
};
