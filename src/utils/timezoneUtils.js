/**
 * Timezone Utilities - Implements "Store UTC, Display Local" pattern
 * 
 * BEST PRACTICE APPROACH:
 * 1. Backend stores everything in UTC (MongoDB Date fields)
 * 2. Frontend converts UTC to IST only for display
 * 3. All data processing uses UTC methods to avoid timezone conversion
 */

/**
 * Formats a UTC datetime string or Date object for display in IST
 * @param {string|Date} utcDateTime - UTC datetime in ISO format or Date object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string in IST
 */
export const formatTimeForDisplay = (utcDateTime, options = {}) => {
  if (!utcDateTime) return '';
  
  const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatTimeForDisplay:', utcDateTime);
    return '';
  }

  const defaultOptions = {
    timeZone: 'Asia/Kolkata', // IST
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return date.toLocaleTimeString('en-IN', defaultOptions);
};

/**
 * Formats a UTC datetime for display as both date and time in IST
 * @param {string|Date} utcDateTime - UTC datetime in ISO format or Date object
 * @returns {Object} Object with date and time strings
 */
export const formatDateTimeForDisplay = (utcDateTime) => {
  if (!utcDateTime) return { date: '', time: '' };
  
  const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatDateTimeForDisplay:', utcDateTime);
    return { date: '', time: '' };
  }

  return {
    date: date.toLocaleDateString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }),
    time: formatTimeForDisplay(date)
  };
};

/**
 * Extracts time components from UTC datetime without timezone conversion
 * Use this for data processing, NOT for display
 * @param {string|Date} utcDateTime - UTC datetime in ISO format or Date object
 * @returns {Object} Object with hours, minutes, and time string
 */
export const extractUTCTime = (utcDateTime) => {
  if (!utcDateTime) return { hours: 0, minutes: 0, timeString: '00:00' };
  
  const date = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to extractUTCTime:', utcDateTime);
    return { hours: 0, minutes: 0, timeString: '00:00' };
  }

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return { hours, minutes, timeString };
};

/**
 * Creates a UTC datetime string from date and time components
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {string} UTC datetime in ISO format
 */
export const createUTCDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    throw new Error('Date and time are required');
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error('Time must be in HH:MM format');
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Validate time values
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time values');
  }

  // Create UTC datetime directly
  const utcDateTime = `${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000Z`;
  
  // Validate the created datetime
  const testDate = new Date(utcDateTime);
  if (isNaN(testDate.getTime())) {
    throw new Error('Failed to create valid UTC datetime');
  }

  return utcDateTime;
};

/**
 * Converts minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time string in HH:MM format
 */
export const minutesToTimeString = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Converts time string to minutes since midnight
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {number} Minutes since midnight
 */
export const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + minutes;
};

/**
 * Gets current time in IST for display purposes
 * @returns {string} Current time in HH:MM format (IST)
 */
export const getCurrentTimeIST = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Debug function to log timezone information
 * @param {string} label - Label for the debug output
 * @param {string|Date} dateTime - DateTime to debug
 */
export const debugTimezone = (label, dateTime) => {
  if (!dateTime) return;
  
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  console.log(`🕐 ${label}:`, {
    original: dateTime,
    iso: date.toISOString(),
    utcTime: extractUTCTime(date).timeString,
    istDisplay: formatTimeForDisplay(date),
    localDisplay: date.toLocaleTimeString()
  });
};
