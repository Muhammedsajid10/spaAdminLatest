/**
 * Time Utility Functions
 * 
 * Helper functions for time manipulation and formatting
 */

/**
 * Converts time string to minutes since midnight
 * @param {string} timeStr - Time string in format "HH:MM" (e.g., "14:30")
 * @returns {number} Minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }

  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    return 0;
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
};

/**
 * Adds minutes to a time string
 * @param {string} timeStr - Time string in format "HH:MM"
 * @param {number} minutesToAdd - Minutes to add
 * @returns {string} New time string in format "HH:MM"
 */
export const addMinutesToTime = (timeStr, minutesToAdd) => {
  const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Formats a time string for display
 * @param {string} timeStr - Time string in format "HH:MM"
 * @param {boolean} use24Hour - Use 24-hour format (default: false)
 * @returns {string} Formatted time string
 */
export const formatTime = (timeStr, use24Hour = false) => {
  if (!timeStr) return '';

  const [hours, minutes] = timeStr.split(':').map(Number);

  if (use24Hour) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Formats a date to YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const localDateKey = (date) => {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Formats a date to YYYY-MM-DD format (alias for localDateKey)
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateLocal = (date) => {
  return localDateKey(date);
};

/**
 * Formats a date for API calls
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (date) => {
  return localDateKey(date);
};

/**
 * Calculates appointment height based on duration
 * @param {number} duration - Duration in minutes
 * @param {number} slotHeight - Height of one time slot in pixels (default: 20)
 * @param {number} slotDuration - Duration of one time slot in minutes (default: 30)
 * @returns {number} Height in pixels
 */
export const calculateAppointmentHeight = (duration, slotHeight = 20, slotDuration = 30) => {
  return (duration / slotDuration) * slotHeight;
};

/**
 * Checks if two time ranges overlap
 * @param {number} start1 - Start time in minutes
 * @param {number} end1 - End time in minutes
 * @param {number} start2 - Start time in minutes
 * @param {number} end2 - End time in minutes
 * @returns {boolean} True if ranges overlap
 */
export const timeRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

/**
 * Parses a time slot key to extract date and time
 * @param {string} slotKey - Slot key in format "YYYY-MM-DD_HH:MM"
 * @returns {Object} Object with date and time properties
 */
export const parseSlotKey = (slotKey) => {
  if (!slotKey || !slotKey.includes('_')) {
    return { date: null, time: null };
  }

  const [datePart, timePart] = slotKey.split('_');
  return { date: datePart, time: timePart };
};

/**
 * Creates a slot key from date and time
 * @param {string|Date} date - Date string (YYYY-MM-DD) or Date object
 * @param {string} time - Time string (HH:MM)
 * @returns {string} Slot key in format "YYYY-MM-DD_HH:MM"
 */
export const createSlotKey = (date, time) => {
  const dateStr = typeof date === 'string' ? date : localDateKey(date);
  return `${dateStr}_${time}`;
};
