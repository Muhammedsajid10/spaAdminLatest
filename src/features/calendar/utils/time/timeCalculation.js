/**
 * Time Calculation Utilities
 * Pure functions for time arithmetic
 */

import { timeToMinutes, minutesToTime } from './timeConversion';

/**
 * Adds minutes to a time string
 * @param {string} timeStr - Time in "HH:MM" format
 * @param {number} minutesToAdd - Minutes to add (can be negative)
 * @returns {string} New time in "HH:MM" format
 * @example addMinutesToTime("14:30", 45) // returns "15:15"
 */
export const addMinutesToTime = (timeStr, minutesToAdd) => {
  const currentMinutes = timeToMinutes(timeStr);
  const newMinutes = currentMinutes + minutesToAdd;
  return minutesToTime(newMinutes);
};

/**
 * Calculates duration between two times in minutes
 * @param {string} startTime - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 * @returns {number} Duration in minutes
 * @example calculateDuration("14:30", "16:00") // returns 90
 */
export const calculateDuration = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  
  // Handle overnight times
  if (end < start) {
    end += 1440; // Add 24 hours
  }
  
  return end - start;
};

/**
 * Checks if a time is between start and end times
 * @param {string} time - Time to check "HH:MM"
 * @param {string} startTime - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 * @returns {boolean} True if time is in range
 */
export const isTimeBetween = (time, startTime, endTime) => {
  const t = timeToMinutes(time);
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  
  // Handle overnight range
  if (end < start) {
    return t >= start || t < end;
  }
  
  return t >= start && t < end;
};

/**
 * Rounds time to nearest interval
 * @param {string} timeStr - Time in "HH:MM" format
 * @param {number} interval - Interval in minutes (e.g., 15, 30)
 * @returns {string} Rounded time in "HH:MM" format
 * @example roundToInterval("14:37", 15) // returns "14:45"
 */
export const roundToInterval = (timeStr, interval = 30) => {
  const minutes = timeToMinutes(timeStr);
  const rounded = Math.round(minutes / interval) * interval;
  return minutesToTime(rounded);
};
