/**
 * Shift-Based Scheduling Utilities
 * 
 * These utilities handle employee shift management and time slot generation
 * based on employee work schedules.
 */

import { timeToMinutes, addMinutesToTime } from './timeUtils';

/**
 * Gets the day name from a date object
 * @param {Date} date - The date object
 * @returns {string} Day name (e.g., "monday", "tuesday") - lowercase to match backend
 */
export const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Checks if an employee has a shift on a specific date
 * @param {Object} employee - Employee object with workSchedule
 * @param {Date} date - Date to check
 * @returns {boolean} True if employee has shift, false otherwise
 */
export const hasShiftOnDate = (employee, date) => {
  if (!employee || !employee.workSchedule) {
    console.log('⚠️ hasShiftOnDate: No employee or workSchedule', {
      hasEmployee: !!employee,
      hasWorkSchedule: !!employee?.workSchedule,
      employeeId: employee?._id || employee?.id,
      employeeName: employee?.user?.firstName || employee?.firstName || employee?.name
    });
    // Return true if no workSchedule - assume available (fallback to business hours)
    return true;
  }

  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];

  console.log('🔍 hasShiftOnDate check:', {
    employeeName: employee.user?.firstName || employee.firstName || employee.name,
    employeeId: employee._id || employee.id,
    dayName,
    date: date.toISOString(),
    hasSchedule: !!schedule,
    scheduleKeys: schedule ? Object.keys(schedule) : [],
    workScheduleKeys: Object.keys(employee.workSchedule),
    schedule: schedule ? JSON.stringify(schedule) : 'null'
  });

  if (!schedule) {
    console.log('⚠️ No schedule found for day', dayName, '- assuming available');
    // Return true if no schedule for this day - assume available (fallback to business hours)
    return true;
  }

  // Check if schedule has any valid shift data
  const hasShifts = schedule.shifts && schedule.shifts.trim().length > 0;
  const hasStartEnd = schedule.startTime && schedule.endTime;
  const hasShiftsData = Array.isArray(schedule.shiftsData) && schedule.shiftsData.length > 0;
  // Check if schedule has isWorking flag
  const isWorking = schedule.isWorking === true || schedule.isWorking === undefined; // Default to true if not specified

  const result = (hasShifts || hasStartEnd || hasShiftsData) && isWorking;
  
  console.log('✅ Shift validation result:', {
    employeeName: employee.user?.firstName || employee.firstName || employee.name,
    hasShifts,
    hasStartEnd,
    hasShiftsData,
    isWorking,
    result
  });

  return result;
};

/**
 * Gets employee shift hours for a specific date
 * @param {Object} employee - Employee object with workSchedule
 * @param {Date} date - Date to get shift hours for
 * @returns {Array} Array of shift blocks with start and end times
 */
export const getEmployeeShiftHours = (employee, date) => {
  if (!employee || !employee.workSchedule) {
    return [];
  }

  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];

  if (!schedule) {
    return [];
  }

  const blocks = [];

  // Parse shifts string (e.g., "09:00-13:00,14:00-18:00")
  if (schedule.shifts && typeof schedule.shifts === 'string') {
    schedule.shifts.split(',').forEach(segment => {
      const trimmed = segment.trim();
      if (trimmed) {
        const parts = trimmed.split('-');
        if (parts.length === 2) {
          const startTime = parts[0].trim();
          const endTime = parts[1].trim();
          if (startTime && endTime) {
            blocks.push({ start: startTime, end: endTime });
          }
        }
      }
    });
  }

  // Fallback to startTime/endTime
  if (blocks.length === 0 && schedule.startTime && schedule.endTime) {
    blocks.push({ start: schedule.startTime, end: schedule.endTime });
  }

  // Fallback to shiftsData array
  if (blocks.length === 0 && Array.isArray(schedule.shiftsData)) {
    schedule.shiftsData.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        blocks.push({ start: shift.startTime, end: shift.endTime });
      }
    });
  }

  return blocks;
};

/**
 * Generates time slots based on employee shift hours
 * @param {Object} employee - Employee object with workSchedule
 * @param {Date} date - Date to generate slots for
 * @param {number} serviceDuration - Service duration in minutes
 * @param {number} intervalMinutes - Interval between slots in minutes (default: 30)
 * @returns {Array} Array of time slot strings (e.g., ["09:00", "09:30", ...])
 */
export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration, intervalMinutes = 30) => {
  const shiftBlocks = getEmployeeShiftHours(employee, date);

  if (shiftBlocks.length === 0) {
    return [];
  }

  const slots = [];

  shiftBlocks.forEach(block => {
    let currentTime = block.start;
    const blockEndMinutes = timeToMinutes(block.end);

    // Generate slots within this shift block
    while (true) {
      const currentMinutes = timeToMinutes(currentTime);
      
      // Check if there's enough time for the service before block ends
      if (currentMinutes + serviceDuration <= blockEndMinutes) {
        slots.push(currentTime);
        currentTime = addMinutesToTime(currentTime, intervalMinutes);
      } else {
        break;
      }
    }
  });

  return slots;
};

/**
 * Validates if a specific time slot fits within employee shift hours
 * @param {Object} employee - Employee object with workSchedule
 * @param {Date} date - Date to check
 * @param {string} timeSlot - Time slot (e.g., "14:30")
 * @param {number} serviceDuration - Service duration in minutes
 * @returns {boolean} True if slot fits within shift, false otherwise
 */
export const isTimeSlotWithinShift = (employee, date, timeSlot, serviceDuration) => {
  const shiftBlocks = getEmployeeShiftHours(employee, date);

  if (shiftBlocks.length === 0) {
    return false;
  }

  const slotStartMinutes = timeToMinutes(timeSlot);
  const slotEndMinutes = slotStartMinutes + serviceDuration;

  // Check if slot fits in any shift block
  return shiftBlocks.some(block => {
    const blockStartMinutes = timeToMinutes(block.start);
    const blockEndMinutes = timeToMinutes(block.end);
    
    return slotStartMinutes >= blockStartMinutes && slotEndMinutes <= blockEndMinutes;
  });
};

/**
 * Gets all professionals who have shifts on a specific date
 * @param {Array} professionals - Array of professional objects
 * @param {Date} date - Date to check
 * @returns {Array} Array of professionals with shifts on the date
 */
export const getProfessionalsWithShifts = (professionals, date) => {
  return professionals.filter(prof => hasShiftOnDate(prof, date));
};

/**
 * Gets formatted shift hours string for display
 * @param {Object} employee - Employee object with workSchedule
 * @param {Date} date - Date to get shift hours for
 * @returns {string} Formatted shift hours (e.g., "9:00 AM - 6:00 PM")
 */
export const getFormattedShiftHours = (employee, date) => {
  const shiftBlocks = getEmployeeShiftHours(employee, date);

  if (shiftBlocks.length === 0) {
    return 'No shift';
  }

  if (shiftBlocks.length === 1) {
    return `${formatTimeAMPM(shiftBlocks[0].start)} - ${formatTimeAMPM(shiftBlocks[0].end)}`;
  }

  return shiftBlocks
    .map(block => `${formatTimeAMPM(block.start)} - ${formatTimeAMPM(block.end)}`)
    .join(', ');
};

/**
 * Formats time in 12-hour format with AM/PM
 * @param {string} time - Time string (e.g., "14:30")
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
const formatTimeAMPM = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};
