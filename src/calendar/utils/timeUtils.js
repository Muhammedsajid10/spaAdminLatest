/**
 * Consolidated Time Utilities
 * Central source of truth for all time-related operations
 */

/**
 * Convert HH:MM time string to total minutes
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Total minutes since midnight
 */
export const timeToMinutes = (timeStr = '00:00') => {
  const [h = '0', m = '0'] = String(timeStr).split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

// Alias for backward compatibility
export const toMinutes = timeToMinutes;

/**
 * Convert minutes to HH:MM format
 * @param {number} mins - Total minutes
 * @returns {string} Time in HH:MM format
 */
export const minutesToTime = (mins = 0) => {
  const normalized = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Alias for backward compatibility
export const minutesToLabel = minutesToTime;

/**
 * Add minutes to a time string
 * @param {string} timeStr - Time in HH:MM format
 * @param {number} minutes - Minutes to add
 * @returns {string} New time in HH:MM format
 */
export const addMinutesToTime = (timeStr, minutes) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

// Alias for backward compatibility
export const addMinutesLabel = (hhmm, add) => addMinutesToTime(hhmm, add);

/**
 * Check if two time ranges overlap
 * @param {number} aStart - Start time in minutes
 * @param {number} aEnd - End time in minutes
 * @param {number} bStart - Start time in minutes
 * @param {number} bEnd - End time in minutes
 * @returns {boolean} True if ranges overlap
 */
export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

/**
 * Generate array of time slots between start and end
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {number} intervalMinutes - Interval between slots (default 30)
 * @returns {string[]} Array of time strings
 */
export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  let currentHour = parseInt(startTime.split(':')[0], 10);
  let currentMinute = parseInt(startTime.split(':')[1], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  const endMinute = parseInt(endTime.split(':')[1], 10);

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const hourFormatted = String(currentHour).padStart(2, '0');
    const minuteFormatted = String(currentMinute).padStart(2, '0');
    slots.push(`${hourFormatted}:${minuteFormatted}`);

    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }
  }
  return slots;
};

// Alias for backward compatibility
export const generateRangeSlots = (startLabel, endLabel, interval = 30) => 
  generateTimeSlots(startLabel, endLabel, interval);

/**
 * Format time for display (passthrough for now, can be enhanced later)
 * @param {string} time - Time string
 * @returns {string} Formatted time
 */
export const formatTime = (time) => time;

/**
 * Convert ISO date string to HH:MM time on a specific date
 * @param {Date} date - Target date
 * @param {string} timeLabel - Time in HH:MM format
 * @returns {string} ISO string
 */
export const timeToISOOnDate = (date, timeLabel) => {
  const [h = '0', m = '0'] = timeLabel.split(':');
  const d = new Date(date);
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
};

export default {
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  rangesOverlap,
  generateTimeSlots,
  formatTime,
  timeToISOOnDate,
  // Aliases
  toMinutes: timeToMinutes,
  minutesToLabel: minutesToTime,
  addMinutesLabel,
  generateRangeSlots,
};
