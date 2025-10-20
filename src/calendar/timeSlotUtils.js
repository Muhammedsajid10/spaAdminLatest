import { getEmployeeShiftHours } from './shiftUtils';
import { localDateKey, formatDateLocal } from './dateUtils';

/**
 * Generate time slots based on start and end time with intervals
 */
export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  let currentHour = parseInt(startTime.split(':')[0]);
  let currentMinute = parseInt(startTime.split(':')[1]);
  const endHour = parseInt(endTime.split(':')[0]);
  const endMinute = parseInt(endTime.split(':')[1]);

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const hourFormatted = String(currentHour).padStart(2, '0');
    const minuteFormatted = String(currentMinute).padStart(2, '0');
    slots.push(`${hourFormatted}:${minuteFormatted}`);

    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }
  }
  return slots;
};

/**
 * Convert time string to minutes for calculations
 */
export const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

/**
 * Convert minutes back to time string
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Add minutes to a time string
 */
export const addMinutesToTime = (timeStr, minutes) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

/**
 * Generate time slots based on employee shift hours
 */
export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration = 30, intervalMinutes = 30) => {
  const shifts = getEmployeeShiftHours(employee, date);

  if (shifts.length === 0) {
    return [];
  }

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const minutesToLabel = (mins) => {
    mins = mins % (24 * 60);
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const toISOOnDate = (timeLabel) => {
    const [h, m] = timeLabel.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const slots = [];

  shifts.forEach(shift => {
    let startMinutes = toMinutes(shift.startTime);
    let endMinutes = toMinutes(shift.endTime);

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    // Generate slots for this shift
    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const slotEnd = slotStart + serviceDuration;
      const startLabel = minutesToLabel(slotStart);
      const endLabel = minutesToLabel(slotEnd);

      slots.push({
        startTime: toISOOnDate(startLabel),
        endTime: toISOOnDate(endLabel),
        label: startLabel,
        available: true
      });
    }
  });

  return slots;
};

/**
 * Get valid time slots for a professional considering their shifts and service duration
 */
export const getValidTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (!shifts.length) return [];

  const intervalMinutes = 10;
  const validSlots = [];

  shifts.forEach(shift => {
    const startMinutes = parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1]);
    const endMinutes = parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1]);
    
    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const slotEnd = slotStart + serviceDuration;
      const startLabel = minutesToTime(slotStart);
      const endLabel = minutesToTime(slotEnd);
      
      // Check if this slot conflicts with existing appointments
      const dayKey = localDateKey(date);
      const employeeAppointments = appointments[employee._id] || appointments[employee.id] || {};
      const slotKey = `${dayKey}_${startLabel}`;
      
      if (!employeeAppointments[slotKey]) {
        validSlots.push({
          startTime: (() => {
            const d = new Date(date);
            d.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);
            return d.toISOString();
          })(),
          endTime: (() => {
            const d = new Date(date);
            d.setHours(Math.floor(slotEnd / 60), slotEnd % 60, 0, 0);
            return d.toISOString();
          })(),
          label: startLabel,
          available: true
        });
      }
    }
  });

  return validSlots;
};

/**
 * Filter out booked time slots from available slots
 */
export const filterOutBookedTimeSlots = (timeSlots, employeeId, date, appointments) => {
  const dayKey = localDateKey(date);
  const employeeAppointments = appointments[employeeId] || {};

  // Build concrete appointment ranges for this employee on the target day
  const appointmentRanges = [];
  
  Object.entries(employeeAppointments).forEach(([slotKey, appointment]) => {
    try {
      // Restrict to same day when possible
      if (slotKey && typeof slotKey === 'string' && !slotKey.startsWith(dayKey)) {
        if (!appointment || !appointment.startISO) return;
      }

      let apptStart = appointment?.startISO ? new Date(appointment.startISO) : null;
      let apptEnd = appointment?.endISO ? new Date(appointment.endISO) : null;

      // Fallback: some entries store startTime/endTime as ISO strings
      if ((!apptStart || isNaN(apptStart)) && appointment?.startTime && appointment.startTime.includes('T')) {
        apptStart = new Date(appointment.startTime);
      }
      if ((!apptEnd || isNaN(apptEnd)) && appointment?.endTime && appointment.endTime.includes('T')) {
        apptEnd = new Date(appointment.endTime);
      }

      // Last fallback: parse the slotKey (YYYY-MM-DD_HH:MM)
      if ((!apptStart || isNaN(apptStart)) && slotKey && slotKey.includes('_')) {
        const parts = slotKey.split('_');
        const timePart = parts[1];
        if (parts[0] === dayKey && timePart) {
          const [hh, mm] = timePart.split(':').map(Number);
          const d = new Date(date);
          d.setHours(hh || 0, mm || 0, 0, 0);
          apptStart = d;
        }
      }

      if (apptStart && !isNaN(apptStart)) {
        if (!apptEnd || isNaN(apptEnd)) {
          const duration = appointment?.duration || 30;
          apptEnd = new Date(apptStart.getTime() + duration * 60000);
        }
        appointmentRanges.push({ start: apptStart, end: apptEnd });
      }
    } catch (err) {
      console.warn('Error parsing appointment slot:', slotKey, err);
    }
  });

  // Filter slots by overlap with any appointment ranges
  return timeSlots.filter(slot => {
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);
    
    return !appointmentRanges.some(range => 
      slotStart < range.end && slotEnd > range.start
    );
  });
};

/**
 * Get available time slots considering both regular appointments and accumulated bookings from current session
 */
export const getAvailableTimeSlotsWithAccumulatedBookings = (employee, date, serviceDuration, appointments, multipleAppointments = []) => {
  // First, generate base time slots from employee shift
  let availableSlots = generateTimeSlotsFromEmployeeShift(employee, date, serviceDuration, 30);
  
  if (availableSlots.length === 0) {
    return [];
  }
  
  // Filter out already booked time slots from regular appointments
  availableSlots = filterOutBookedTimeSlots(availableSlots, employee._id, date, appointments);
  
  // Filter out accumulated bookings from current session
  if (multipleAppointments && multipleAppointments.length > 0) {
    const dateKey = formatDateLocal(date);
    const employeeAccumulatedBookings = multipleAppointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return formatDateLocal(aptDate) === dateKey && apt.professional._id === employee._id;
      })
      .map(apt => ({
        startTime: apt.timeSlot,
        endTime: addMinutesToTime(apt.timeSlot, apt.service.duration),
        duration: apt.service.duration
      }));
    
    if (employeeAccumulatedBookings.length > 0) {
      availableSlots = availableSlots.filter(slot => {
        const dt = new Date(slot.startTime);
        const slotTime = `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`;
        
        // Check if this slot conflicts with any accumulated booking
        const slotStart = timeToMinutes(slotTime);
        const slotEnd = slotStart + serviceDuration;
        
        return !employeeAccumulatedBookings.some(booking => {
          const bookingStart = timeToMinutes(booking.startTime);
          const bookingEnd = timeToMinutes(booking.endTime);
          // Check for overlap
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });
      });
    }
  }
  
  return availableSlots;
};