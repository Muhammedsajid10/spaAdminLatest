/**
 * Legacy Compatibility Layer
 * Maps old helper function names to new architecture utilities
 * This allows gradual migration without breaking existing code
 */

// Import all utilities from new architecture
import {
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  calculateDuration,
  formatTime12Hour,
  formatTime24Hour,
  formatDuration,
  generateTimeSlots,
  generateSlotsFromShift,
  filterBookedSlots,
  getAvailableSlots,
  detectProfessionalConflict,
  detectSlotConflict,
  doRangesOverlap,
} from './index';

// Re-export with legacy names for backward compatibility
export {
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  calculateDuration,
  generateTimeSlots,
  detectProfessionalConflict,
  detectSlotConflict,
  doRangesOverlap,
};

// Map old names to new functions
export const formatTime = formatTime12Hour;
export const formatUTCToLocal = (utcString) => {
  const date = new Date(utcString);
  return date.toLocaleString();
};

export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  return !!detectSlotConflict(newSlot, newDuration, existingBookings);
};

export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration) => {
  return generateSlotsFromShift(employee, date, serviceDuration);
};

// Helper functions that use the new utilities
export const getValidTimeSlotsForProfessional = (professional, date, duration, appointments) => {
  const slots = generateSlotsFromShift(professional, date, duration);
  const professionalId = professional._id || professional.id;
  return filterBookedSlots(slots, Object.values(appointments).flat(), professionalId);
};

export const getAvailableTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  const slots = generateSlotsFromShift(employee, date, serviceDuration);
  const employeeId = employee._id || employee.id;
  
  return getAvailableSlots(slots, {
    appointments: Object.values(appointments).flat(),
    employee,
    date,
    employeeId,
    requiredDuration: serviceDuration,
  });
};

export const getAvailableProfessionalsForService = (serviceId, date, employees, appointments, services) => {
  // Filter employees who can perform this service
  const service = services.find(s => s._id === serviceId);
  if (!service) return [];
  
  return employees.filter(emp => {
    // Check if employee has this service in their skills/services
    // This logic depends on your data structure
    return true; // Placeholder - implement based on your needs
  });
};

export const getAccumulatedBookings = (multipleAppointments) => {
  // Return appointments grouped by professional
  const accumulated = {};
  multipleAppointments.forEach(apt => {
    const profId = apt.professional?._id || apt.professional?.id;
    if (!accumulated[profId]) {
      accumulated[profId] = [];
    }
    accumulated[profId].push(apt);
  });
  return accumulated;
};

export const getAvailableTimeSlotsWithAccumulatedBookings = (
  professional,
  date,
  duration,
  appointments,
  sessionAppointments
) => {
  const slots = generateSlotsFromShift(professional, date, duration);
  const professionalId = professional._id || professional.id;
  
  return getAvailableSlots(slots, {
    appointments: Object.values(appointments).flat(),
    sessionAppointments,
    employee: professional,
    date,
    employeeId: professionalId,
    requiredDuration: duration,
  });
};

export const getAvailableProfessionalsWithAccumulatedBookings = (
  serviceId,
  date,
  employees,
  appointments,
  services,
  sessionAppointments
) => {
  return getAvailableProfessionalsForService(serviceId, date, employees, appointments, services);
};

// Utility functions for colors and random generation
export const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomAppointmentColor = () => {
  return getRandomColor();
};

export const calculateAppointmentHeight = (duration, slotHeight = 60) => {
  // Assuming 30-minute slots
  return (duration / 30) * slotHeight;
};

// Date picker helpers (these might need custom implementation)
export const getDatePickerCalendarDays = (month, year) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

export const getWeeksInMonth = (month, year) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let currentWeek = [];
  
  // Add empty days for first week
  for (let i = 0; i < firstDay.getDay(); i++) {
    currentWeek.push(null);
  }
  
  // Add all days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    currentWeek.push(new Date(year, month, i));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Add remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

export const getMonthsInYear = (year) => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    name: new Date(year, i).toLocaleString('default', { month: 'long' })
  }));
};
