/**
 * Display Formatting Utilities
 * Handles display formatting for UI elements
 */

/**
 * Get random color from predefined palette
 * @returns {string} Hex color code
 */
export const getRandomColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get random appointment color from predefined palette
 * @returns {string} Hex color code
 */
export const getRandomAppointmentColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Calculate appointment height for visual display
 * @param {string} startTime - Start time
 * @param {string} endTime - End time  
 * @param {number} timeSlotHeight - Height of each slot in pixels (default 80)
 * @param {number} slotInterval - Interval in minutes (default 30)
 * @returns {number} Height in pixels
 */
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

/**
 * Get appointment color by status
 * @param {string} status - Appointment status
 * @returns {string} Hex color code
 */
export const getAppointmentColorByStatus = (status) => {
  const statusColors = {
    'booked': '#3b82f6',      // Blue
    'confirmed': '#10b981',   // Green
    'arrived': '#f59e0b',     // Amber
    'started': '#8b5cf6',     // Purple
    'in-progress': '#8b5cf6', // Purple
    'completed': '#6b7280',   // Gray
    'cancelled': '#ef4444',   // Red
    'no-show': '#f97316'      // Orange
  };
  return statusColors[status] || '#3b82f6';
};

export default {
  getRandomColor,
  getRandomAppointmentColor,
  calculateAppointmentHeight,
  getAppointmentColorByStatus,
};
