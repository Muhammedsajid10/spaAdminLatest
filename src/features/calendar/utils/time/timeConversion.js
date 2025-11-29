/**
 * Time Conversion Utilities
 * Pure functions for converting between time formats
 */

/**
 * Converts time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time in format "HH:MM"
 * @returns {number} Minutes since midnight (0-1439)
 * @example timeToMinutes("14:30") // returns 870
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);
  
  // Validate input
  if (isNaN(hours) || isNaN(minutes)) return 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 0;
  
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in "HH:MM" format
 * @example minutesToTime(870) // returns "14:30"
 */
export const minutesToTime = (minutes) => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '00:00';
  
  // Normalize to 0-1439 range (24 hours)
  const normalized = ((minutes % 1440) + 1440) % 1440;
  
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Converts time string to ISO string on a specific date
 * @param {string} timeStr - Time in "HH:MM" format
 * @param {Date} date - Target date
 * @returns {string} ISO string
 */
export const timeToISO = (timeStr, date) => {
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

/**
 * Extracts time string from ISO string
 * @param {string} isoString - ISO date string
 * @returns {string} Time in "HH:MM" format
 */
export const isoToTime = (isoString) => {
  if (!isoString) return '00:00';
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
