/**
 * Calendar Utilities - Central Export
 * Import all utilities from one place
 */

// Time helpers
export {
  formatUTCToLocal,
  generateTimeSlots,
  formatTime,
  addMinutesToTime,
  timeToMinutes,
  minutesToTimeLabel,
  formatTooltipTime
} from './timeHelpers';

// Appointment helpers
export {
  getRandomColor,
  getRandomAppointmentColor,
  getAppointmentColorByStatus,
  calculateAppointmentHeight
} from './appointmentHelpers';

// Shift helpers
export {
  getEmployeeShiftHours,
  generateTimeSlotsFromEmployeeShift,
  getValidTimeSlotsForProfessional,
  getAvailableTimeSlotsWithAccumulatedBookings
} from './shiftHelpers';

// Date helpers
export {
  localDateKey,
  formatDateLocal,
  getDatePickerCalendarDays,
  getWeeksInMonth,
  getMonthsInYear,
  getCalendarDays,
  formatDateForAPI
} from './dateHelpers';

// Validation helpers
export {
  validateBookingData,
  validateServiceSelection,
  validateEmployeeAvailability,
  validateTimeSlot,
  validatePriceEdit
} from './validationHelpers';

// Conflict detection
export {
  // New advanced conflict detection
  detectProfessionalConflict,
  isSlotAvailable,
  formatConflictMessage,
  getAllSessionConflicts,
  // Legacy compatibility functions
  detectTimeConflicts,
  detectEmployeeConflicts,
  isTimeSlotConflicting,
  getAccumulatedBookings
} from './conflictDetection';

// Usage:
// import { generateTimeSlots, calculateAppointmentHeight, getEmployeeShiftHours } from '@/utils/calendar';
