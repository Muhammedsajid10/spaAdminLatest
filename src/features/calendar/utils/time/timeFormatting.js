/**
 * Time Formatting Utilities
 * Pure functions for displaying time in various formats
 */

/**
 * Formats time for display (12-hour format with AM/PM)
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Formats time for display (24-hour format)
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatTime24Hour = (timeStr) => {
  if (!timeStr) return '';
  return timeStr;
};

/**
 * Formats time range
 * @param {string} startTime - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 * @param {boolean} use12Hour - Use 12-hour format
 * @returns {string} Formatted range (e.g., "2:30 PM - 4:00 PM")
 */
export const formatTimeRange = (startTime, endTime, use12Hour = true) => {
  const formatter = use12Hour ? formatTime12Hour : formatTime24Hour;
  return `${formatter(startTime)} - ${formatter(endTime)}`;
};

/**
 * Formats duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "1h 30m", "45m")
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
};
