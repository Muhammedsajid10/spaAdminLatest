import { timeToMinutes, addMinutesToTime } from './timeSlotUtils';
import { formatDateLocal, localDateKey } from './dateUtils';

// Detect conflicts for professional scheduling
export const detectProfessionalConflict = (professionalId, date, startTime, duration, appointments, multipleAppointments) => {
  if (!professionalId || !startTime || !duration) return null;
  
  const dayKey = localDateKey(date);
  const desiredStart = timeToMinutes(startTime);
  const desiredEnd = desiredStart + duration;

  // 1. Check existing multipleAppointments in the current session
  for (const apt of multipleAppointments) {
    if ((apt.professional?._id === professionalId || apt.professional?.id === professionalId) && formatDateLocal(new Date(apt.date)) === dayKey) {
      const s = timeToMinutes(apt.timeSlot);
      const e = s + apt.duration;
      if (desiredStart < e && desiredEnd > s) {
        return { source: 'session', conflict: apt, start: s, end: e };
      }
    }
  }

  // 2. Check existing persisted appointments structure for that professional
  const profAppointments = appointments?.[professionalId];
  if (profAppointments) {
    for (const key in profAppointments) {
      if (!Object.prototype.hasOwnProperty.call(profAppointments, key)) continue;
      if (!key.startsWith(dayKey + '_')) continue; // only same day
      const existing = profAppointments[key];
      const existingStartTime = existing.startTime || existing.timeSlot || key.split('_')[1];
      if (!existingStartTime) continue;
      const existingStart = timeToMinutes(existingStartTime);
      let existingEnd;
      if (existing.endTime) {
        existingEnd = timeToMinutes(existing.endTime);
      } else if (existing.duration) {
        existingEnd = existingStart + existing.duration;
      } else if (existing.service?.duration) {
        existingEnd = existingStart + existing.service.duration;
      } else {
        existingEnd = existingStart + 30; // fallback 30m
      }
      if (desiredStart < existingEnd && desiredEnd > existingStart) {
        return { source: 'persisted', conflict: existing, start: existingStart, end: existingEnd };
      }
    }
  }
  return null;
};

// Validate booking appointment requirements
export const validateBookingAppointment = (selectedService, selectedProfessional, selectedTimeSlot) => {
  if (!selectedService) {
    return { isValid: false, error: 'Please complete all booking steps: Service selection is required.' };
  }
  
  if (!selectedProfessional) {
    return { isValid: false, error: 'Please complete all booking steps: Professional selection is required.' };
  }
  
  if (!selectedTimeSlot) {
    return { isValid: false, error: 'Please complete all booking steps: Time slot selection is required.' };
  }
  
  return { isValid: true };
};

// Create appointment object for session
export const createAppointmentForSession = ({ selectedService, selectedProfessional, selectedTimeSlot, bookingDefaults, selectedBookingDate, currentDate }) => {
  // Extract time slot preserving the user's selected local time
  const timeSlot = (() => {
    if (selectedTimeSlot?.label) return selectedTimeSlot.label;
    if (selectedTimeSlot?.startTime) {
      const dt = new Date(selectedTimeSlot.startTime);
      return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    }
    return selectedTimeSlot.time || selectedTimeSlot;
  })();

  // Determine the correct booking date
  const finalBookingDate = bookingDefaults?.date || selectedBookingDate || currentDate;

  // Create appointment object
  const appointmentDate = finalBookingDate instanceof Date
    ? formatDateLocal(finalBookingDate)
    : finalBookingDate;

  const appointment = {
    id: `${selectedProfessional._id}_${appointmentDate}_${timeSlot}_${Date.now()}`,
    service: selectedService,
    professional: selectedProfessional,
    timeSlot: timeSlot,
    date: appointmentDate,
    duration: selectedService.duration,
    price: selectedService.price
  };

  return appointment;
};

// Get accumulated bookings for a specific date
export const getAccumulatedBookings = (multipleAppointments, currentDate) => {
  return multipleAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      return formatDateLocal(aptDate) === formatDateLocal(currentDate);
    })
    .map(apt => ({
      employeeId: apt.professional._id,
      startTime: apt.timeSlot,
      endTime: addMinutesToTime(apt.timeSlot, apt.service.duration),
      duration: apt.service.duration
    }));
};

// Get available professionals for a service
export const getAvailableProfessionalsForService = (serviceId, date, employees, appointments, availableServices) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  
  return employees.filter(emp => {
    // Check if employee has shift on this date (would need hasShiftOnDate function)
    // const hasShift = hasShiftOnDate(emp, date);
    // if (!hasShift) return false;
    
    // For now, return all employees
    return true;
  });
};

// Check if time slot is conflicting with existing bookings
export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  const newStart = timeToMinutes(newSlot);
  const newEnd = newStart + newDuration;

  return existingBookings.some(booking => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);

    // Check for overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

// Get available professionals considering accumulated bookings
export const getAvailableProfessionalsWithAccumulatedBookings = (serviceId, date, employees, appointments, availableServices, multipleAppointments) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];

  return employees.filter(emp => {
    // Check if employee has shift on this date
    // const hasShift = hasShiftOnDate(emp, date);
    // if (!hasShift) return false;

    // Get accumulated bookings from current session
    const accumulatedBookings = getAccumulatedBookings(multipleAppointments, date);
    const employeeAccumulatedBookings = accumulatedBookings.filter(booking => booking.employeeId === emp._id);

    // Check if employee has available slots considering accumulated bookings
    // This would need more complex logic to check actual time slot availability
    return true; // Simplified for now
  });
};

// Calculate service end time
export const calculateServiceEndTime = (startTime, duration) => {
  return addMinutesToTime(startTime, duration);
};

// Find next available slot for professional
export const findNextAvailableSlot = (professional, date, duration, appointments) => {
  // This would implement logic to find the next available time slot
  // Simplified implementation for now
  return null;
};

// Get booking conflict details
export const getBookingConflictDetails = (conflict) => {
  if (!conflict) return null;
  
  return {
    type: conflict.source,
    conflictingAppointment: conflict.conflict,
    startTime: conflict.start,
    endTime: conflict.end
  };
};

// Validate professional availability
export const validateProfessionalAvailability = (professional, date, timeSlot, duration) => {
  // This would check if the professional is available at the given time
  // Simplified implementation for now
  return { isAvailable: true };
};

// Check conflicts across multiple appointments
export const checkMultipleAppointmentConflicts = (appointments, newAppointment) => {
  // This would check for conflicts when adding multiple appointments
  // Simplified implementation for now
  return [];
};

// Optimize booking schedule
export const optimizeBookingSchedule = (appointments) => {
  // This would implement logic to optimize the booking schedule
  // Simplified implementation for now
  return appointments;
};

// Calculate total booking duration
export const calculateTotalBookingDuration = (appointments) => {
  return appointments.reduce((total, apt) => total + (apt.service?.duration || apt.duration || 0), 0);
};

// Legacy functions for compatibility
export const detectConflict = (appointmentsForEmployee, startLabel, duration) => {
  const start = timeToMinutes(startLabel); 
  const end = start + duration;
  return appointmentsForEmployee.some(ap => {
    const apStart = timeToMinutes(ap.startTime); 
    const apEnd = apStart + (ap.duration || 30);
    return (start < apEnd && end > apStart);
  });
};

export const buildSessionAccumulated = (sessionAppointments, dateKey) => {
  return sessionAppointments.filter(a => a.dateKey === dateKey).map(a => ({
    startTime: a.timeSlot,
    duration: a.service.duration
  }));
};
