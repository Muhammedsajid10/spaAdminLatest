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

  console.log('🔍 getEmployeeShiftHours:', {
    employee: employee?.name || employee?.user?.firstName,
    dayName,
    schedule
  });

  if (!schedule) {
    return [];
  }

  const blocks = [];

  // Parse shifts string (e.g., "09:00-13:00,14:00-18:00")
  if (schedule.shifts && typeof schedule.shifts === 'string') {
    console.log('📋 Parsing shifts string:', schedule.shifts);
    schedule.shifts.split(',').forEach(segment => {
      const trimmed = segment.trim();
      if (trimmed) {
        const parts = trimmed.split('-');
        if (parts.length === 2) {
          const startTime = parts[0].trim();
          const endTime = parts[1].trim();
          if (startTime && endTime) {
            blocks.push({ start: startTime, end: endTime });
            console.log('  ✅ Added block:', { start: startTime, end: endTime });
          }
        }
      }
    });
  }

  // Fallback to startTime/endTime
  if (blocks.length === 0 && schedule.startTime && schedule.endTime) {
    console.log('📋 Using startTime/endTime:', schedule.startTime, '-', schedule.endTime);
    blocks.push({ start: schedule.startTime, end: schedule.endTime });
  }

  // Fallback to shiftsData array
  if (blocks.length === 0 && Array.isArray(schedule.shiftsData)) {
    console.log('📋 Using shiftsData array:', schedule.shiftsData);
    schedule.shiftsData.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        blocks.push({ start: shift.startTime, end: shift.endTime });
        console.log('  ✅ Added block from shiftsData:', { start: shift.startTime, end: shift.endTime });
      }
    });
  }

  console.log('✅ Total shift blocks:', blocks);
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

  console.log('🔍 generateTimeSlotsFromEmployeeShift called:', {
    employee: employee?.name || employee?.user?.firstName,
    shiftBlocks,
    serviceDuration,
    intervalMinutes
  });

  if (shiftBlocks.length === 0) {
    console.log('⚠️ No shift blocks returned');
    return [];
  }

  // BOOKING TIME CUTOFF: Calculate maximum booking time to prevent overnight appointments
  // Services must end by 23:00 (1380 minutes from midnight)
  const MAX_END_TIME_MINUTES = 23 * 60; // 23:00 = 1380 minutes
  const maxBookingTimeMinutes = MAX_END_TIME_MINUTES - serviceDuration;
  
  console.log('🕐 Booking cutoff calculation:', {
    serviceDuration,
    maxEndTime: '23:00',
    maxEndTimeMinutes: MAX_END_TIME_MINUTES,
    maxBookingTimeMinutes,
    maxBookingTime: `${Math.floor(maxBookingTimeMinutes / 60).toString().padStart(2, '0')}:${(maxBookingTimeMinutes % 60).toString().padStart(2, '0')}`
  });

  const slots = [];

  shiftBlocks.forEach(block => {
    console.log('🔍 Processing shift block:', block);
    let currentTime = block.start;
    const blockEndMinutes = timeToMinutes(block.end);

    // Generate slots within this shift block
    while (true) {
      const currentMinutes = timeToMinutes(currentTime);
      const slotEndMinutes = currentMinutes + serviceDuration;
      
      // Check if there's enough time for the service before block ends
      // AND ensure service doesn't extend past 23:00 (prevents overnight bookings)
      if (currentMinutes + serviceDuration <= blockEndMinutes && slotEndMinutes <= MAX_END_TIME_MINUTES) {
        slots.push(currentTime);
        currentTime = addMinutesToTime(currentTime, intervalMinutes);
      } else {
        // Log why slot was rejected
        if (slotEndMinutes > MAX_END_TIME_MINUTES) {
          console.log(`⏰ Slot ${currentTime} rejected: would extend to ${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}, past 23:00 cutoff`);
        }
        break;
      }
    }
  });

  console.log('✅ Generated slots from shift blocks:', slots.length, 'slots', slots.slice(0, 5));
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
