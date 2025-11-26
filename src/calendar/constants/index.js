/**
 * Calendar Constants
 * Centralized constant definitions for the calendar system
 */

/**
 * Booking flow steps
 */
export const BOOKING_STEPS = {
  SERVICE_SELECTION: 1,
  PROFESSIONAL_SELECTION: 2,
  TIME_SLOT_SELECTION: 3,
  APPOINTMENT_SUMMARY: 4,
  CLIENT_INFORMATION: 5,
  PAYMENT_DETAILS: 6
};

/**
 * Booking status values
 */
export const BOOKING_STATUS = {
  BOOKED: 'booked',
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  STARTED: 'started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  BANK_TRANSFER: 'bank'
};

/**
 * Calendar view types
 */
export const VIEW_TYPES = {
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month'
};

/**
 * Date picker view types
 */
export const DATE_PICKER_VIEWS = {
  DATE: 'date',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
};

/**
 * Time slot configuration
 */
export const TIME_SLOT_CONFIG = {
  INTERVAL_MINUTES: 30,
  SLOT_HEIGHT_PX: 80,
  START_TIME: '00:00',
  END_TIME: '23:59',
  MAX_BOOKING_END_TIME: '23:00'
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  MIN_CLIENT_NAME_LENGTH: 2,
  MAX_CLIENT_NAME_LENGTH: 100,
  MIN_SERVICE_DURATION: 5,
  MAX_SERVICE_DURATION: 480,
  MIN_BOOKING_HOURS_BEFORE: 0,
  MAX_BOOKING_DAYS_AHEAD: 365
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED_CLIENT_NAME: 'Client name is required',
  REQUIRED_SERVICE: 'Please select a service',
  REQUIRED_PROFESSIONAL: 'Please select a professional',
  REQUIRED_TIME_SLOT: 'Please select a time slot',
  TIME_SLOT_CONFLICT: 'This time slot conflicts with an existing booking',
  NO_SHIFT_SCHEDULED: 'Professional has no shift scheduled on this day',
  BOOKING_PAST_CUTOFF: 'Bookings cannot start at or after 23:00',
  SERVICE_NOT_FIT_SHIFT: 'Selected service does not fit in available shift time',
  INVALID_PAYMENT_METHOD: 'Invalid payment method selected',
  GIFT_CARD_NOT_FOUND: 'Gift card not found',
  GIFT_CARD_EXPIRED: 'Gift card has expired',
  GIFT_CARD_INSUFFICIENT: 'Gift card has insufficient balance',
  MEMBERSHIP_NOT_FOUND: 'Membership not found',
  MEMBERSHIP_EXPIRED: 'Membership has expired'
};

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  MODAL_ANIMATION_DURATION: 300,
  TOOLTIP_DELAY: 500,
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE_DELAY: 1000
};

export default {
  BOOKING_STEPS,
  BOOKING_STATUS,
  PAYMENT_METHODS,
  VIEW_TYPES,
  DATE_PICKER_VIEWS,
  TIME_SLOT_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  UI_CONSTANTS
};
