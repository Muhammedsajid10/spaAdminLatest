/**
 * Example: How to Use the Refactored Calendar Utilities
 * 
 * This file demonstrates how to import and use the extracted utilities
 * in your new smaller components.
 */

// ===== TIME HELPERS =====
import {
  formatUTCToLocal,
  generateTimeSlots,
  formatTime,
  addMinutesToTime,
  timeToMinutes,
  minutesToTimeLabel,
  formatTooltipTime
} from '../utils/calendar/timeHelpers';

// Example usage:
const slots = generateTimeSlots('09:00', '17:00', 30);
const formattedTime = formatUTCToLocal('2025-11-12T14:30:00Z', { hour: '2-digit', minute: '2-digit' });
const newTime = addMinutesToTime('14:30', 60); // '15:30'
const minutes = timeToMinutes('14:30'); // 870


// ===== APPOINTMENT HELPERS =====
import {
  getRandomColor,
  getRandomAppointmentColor,
  calculateAppointmentHeight,
  isTimeSlotConflicting,
  getAccumulatedBookings
} from '../utils/calendar/appointmentHelpers';

// Example usage:
const appointmentColor = getRandomAppointmentColor();
const height = calculateAppointmentHeight('09:00', '10:30', 80, 30);
const hasConflict = isTimeSlotConflicting('14:00', 60, existingBookings);


// ===== SHIFT HELPERS =====
import {
  generateTimeSlotsFromEmployeeShift,
  getValidTimeSlotsForProfessional,
  getAvailableTimeSlotsWithAccumulatedBookings
} from '../utils/calendar/shiftHelpers';

// Example usage:
const employeeSlots = generateTimeSlotsFromEmployeeShift(employee, date, 30, 30);
const validSlots = getValidTimeSlotsForProfessional(employee, date, 60, appointments);
const availableSlots = getAvailableTimeSlotsWithAccumulatedBookings(
  employee, 
  date, 
  serviceDuration, 
  appointments, 
  multipleAppointments
);


// ===== IN A COMPONENT =====
/*
import React from 'react';
import { generateTimeSlots, addMinutesToTime } from '@/utils/calendar/timeHelpers';
import { calculateAppointmentHeight } from '@/utils/calendar/appointmentHelpers';

const MyCalendarComponent = () => {
  const slots = generateTimeSlots('09:00', '17:00', 30);
  
  return (
    <div>
      {slots.map(slot => (
        <div key={slot} style={{ height: calculateAppointmentHeight(slot, addMinutesToTime(slot, 30)) }}>
          {slot}
        </div>
      ))}
    </div>
  );
};
*/


// ===== BENEFITS =====
/*
✅ Clean imports - know exactly what you're using
✅ Small files - easy to understand and maintain
✅ Reusable - use same utilities across multiple components
✅ Testable - can unit test each utility function
✅ Type-safe - can add TypeScript types easily
✅ Tree-shakeable - only bundle what you use
*/
