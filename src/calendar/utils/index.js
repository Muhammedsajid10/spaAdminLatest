/**
 * Calendar Utilities - Centralized Export
 * Single source of truth for all calendar utility functions
 */

// Time utilities
export * from './timeUtils';

// Date utilities
export * from './dateUtils';

// Booking conflict detection
export * from './bookingConflicts';

// Availability calculation
export * from './availabilityUtils';

// Display formatters
export * from './formatters';

// Re-export shift utilities from parent
export { 
  hasShiftOnDate, 
  getEmployeeShiftHours 
} from '../shiftUtils';

// Re-export UI utilities from parent
export { 
  getAppointmentColorByStatus 
} from '../uiUtils';
