import { getEmployeeShiftHours, hasShiftOnDate, localDateKey, formatDateLocal } from '../../calendar';

const MAX_BOOKING_END_MINUTES = 23 * 60;

export const formatUTCToLocal = (utcString, opts = {}) => {
  if (!utcString) return '';
  const dt = new Date(utcString);
  return dt.toLocaleString(undefined, opts);
};

export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  let currentHour = parseInt(startTime.split(':')[0], 10);
  let currentMinute = parseInt(startTime.split(':')[1], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  const endMinute = parseInt(endTime.split(':')[1], 10);

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

export const formatTime = (time) => time;

export const getRandomColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomAppointmentColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b'];
  return colors[Math.floor(Math.random() * colors.length)];
};

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

export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration = 30, intervalMinutes = 30) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (shifts.length === 0) return [];

  const toMinutes = (timeStr = '00:00') => {
    const [h = '0', m = '0'] = String(timeStr).split(':');
    return (Number(h) || 0) * 60 + (Number(m) || 0);
  };

  const minutesToLabel = (mins = 0) => {
    const normalized = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(normalized / 60)
      .toString()
      .padStart(2, '0');
    const m = (normalized % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const toISOOnDate = (timeLabel) => {
    const [h = '0', m = '0'] = timeLabel.split(':');
    const d = new Date(date);
    d.setHours(Number(h), Number(m), 0, 0);
    return d.toISOString();
  };

  const slots = [];

  shifts.forEach(shift => {
    let startMinutes = toMinutes(shift.startTime);
    let endMinutes = toMinutes(shift.endTime);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const slotEnd = slotStart + serviceDuration;
      if (slotEnd > MAX_BOOKING_END_MINUTES) {
        break;
      }
      const startLabel = minutesToLabel(slotStart);
      const endLabel = minutesToLabel(slotEnd);
      slots.push({
        startTime: toISOOnDate(startLabel),
        endTime: toISOOnDate(endLabel),
        available: true,
        source: 'employee-shift'
      });
    }
  });

  return slots;
};

const toMinutes = (timeStr = '00:00') => {
  const [h = '0', m = '0'] = timeStr.split(':');
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};

export const getValidTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (!shifts.length) return [];
  const intervalMinutes = 10;
  const validSlots = [];
  const dayKey = localDateKey(date);
  const employeeAppointments = appointments?.[employee._id] || appointments?.[employee.id] || {};

  shifts.forEach(shift => {
    const startMinutes = toMinutes(shift.startTime);
    const endMinutes = toMinutes(shift.endTime);

    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const hour = Math.floor(slotStart / 60)
        .toString()
        .padStart(2, '0');
      const minute = (slotStart % 60).toString().padStart(2, '0');
      const slotEnd = slotStart + serviceDuration;
      if (slotEnd > MAX_BOOKING_END_MINUTES) {
        break;
      }
      const slotLabel = `${hour}:${minute}`;
      const slotDate = new Date(date);
      slotDate.setHours(Number(hour), Number(minute), 0, 0);
      const slotEndDate = new Date(slotDate.getTime() + serviceDuration * 60000);
      const overlaps = Object.entries(employeeAppointments).some(([appKey, app]) => {
        if (!appKey.startsWith(`${dayKey}_`)) return false;
        const [_, timeFromKey] = appKey.split('_');
        if (!timeFromKey) return false;
        const [appHour = '0', appMinute = '0'] = timeFromKey.split(':');
        const appStart = new Date(date);
        appStart.setHours(Number(appHour), Number(appMinute), 0, 0);
        const appDuration = app.duration || 30;
        const appEnd = new Date(appStart.getTime() + appDuration * 60000);
        return slotDate < appEnd && slotEndDate > appStart;
      });

      if (!overlaps) {
        validSlots.push({
          startTime: slotDate.toISOString(),
          endTime: slotEndDate.toISOString(),
          label: slotLabel,
          available: true
        });
      }
    }
  });

  return validSlots;
};

export const getAvailableProfessionalsForService = (serviceId, date, employees, appointments, availableServices) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  return employees.filter(emp => {
    if (!hasShiftOnDate(emp, date)) return false;
    const validSlots = getValidTimeSlotsForProfessional(emp, date, service.duration, appointments);
    return validSlots.length > 0;
  });
};

export const addMinutesToTime = (timeStr, minutes) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

export const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  const newStart = timeToMinutes(newSlot);
  const newEnd = newStart + newDuration;

  return existingBookings.some(booking => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);
    return newStart < existingEnd && newEnd > existingStart;
  });
};

export const getAccumulatedBookings = (multipleAppointments, currentDate) => {
  return multipleAppointments
    .filter(apt => formatDateLocal(new Date(apt.date)) === formatDateLocal(currentDate))
    .map(apt => ({
      employeeId: apt.professional._id,
      startTime: apt.timeSlot,
      endTime: addMinutesToTime(apt.timeSlot, apt.service.duration),
      duration: apt.service.duration
    }));
};

export const detectProfessionalConflict = (professionalId, date, startTime, duration, appointments, multipleAppointments) => {
  if (!professionalId || !startTime || !duration) return null;
  const dayKey = localDateKey(date);
  const desiredStart = timeToMinutes(startTime);
  const desiredEnd = desiredStart + duration;

  for (const apt of multipleAppointments) {
    const aptDate = new Date(apt.date);
    if (formatDateLocal(aptDate) !== dayKey) continue;
    const aptProfessionalId = apt.professional?._id || apt.professional?.id;
    if (aptProfessionalId !== professionalId) continue;
    const start = timeToMinutes(apt.timeSlot);
    const end = start + apt.duration;
    if (desiredStart < end && desiredEnd > start) {
      return { source: 'session', conflict: apt, start, end };
    }
  }

  const profAppointments = appointments?.[professionalId];
  if (profAppointments) {
    for (const key in profAppointments) {
      if (!Object.prototype.hasOwnProperty.call(profAppointments, key)) continue;
      if (!key.startsWith(`${dayKey}_`)) continue;
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
        existingEnd = existingStart + 30;
      }
      if (desiredStart < existingEnd && desiredEnd > existingStart) {
        return { source: 'persisted', conflict: existing, start: existingStart, end: existingEnd };
      }
    }
  }

  return null;
};

export const getAvailableTimeSlotsWithAccumulatedBookings = (employee, date, serviceDuration, appointments, multipleAppointments) => {
  const baseSlots = getValidTimeSlotsForProfessional(employee, date, serviceDuration, appointments);
  const accumulatedBookings = getAccumulatedBookings(multipleAppointments, date);
  const employeeAccumulatedBookings = accumulatedBookings.filter(booking => booking.employeeId === employee._id);
  return baseSlots.filter(slot => {
    const slotTime = slot.startTime ? new Date(slot.startTime).toTimeString().substring(0, 5) : slot;
    return !isTimeSlotConflicting(slotTime, serviceDuration, employeeAccumulatedBookings);
  });
};

export const getAvailableProfessionalsWithAccumulatedBookings = (
  serviceId,
  date,
  employees,
  appointments,
  availableServices,
  multipleAppointments
) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  return employees.filter(emp => {
    if (!hasShiftOnDate(emp, date)) return false;
    const baseSlots = getAvailableTimeSlotsWithAccumulatedBookings(emp, date, service.duration, appointments, multipleAppointments);
    return baseSlots.length > 0;
  });
};

export const getAvailableTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) =>
  getValidTimeSlotsForProfessional(employee, date, serviceDuration, appointments);

export const getDatePickerCalendarDays = (month) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startPadding = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((totalDays + startPadding) / 7) * 7;
  const endPadding = totalCells - (totalDays + startPadding);
  const days = [];
  const today = new Date();

  for (let i = startPadding; i > 0; i--) {
    const d = new Date(year, monthIndex, 1 - i);
    days.push({ date: d, currentMonth: false, today: formatDateLocal(d) === formatDateLocal(today), label: d.getDate() });
  }

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    days.push({ date: d, currentMonth: true, today: formatDateLocal(d) === formatDateLocal(today), label: d.getDate() });
  }

  for (let i = 1; i <= endPadding; i++) {
    const d = new Date(year, monthIndex + 1, i);
    days.push({ date: d, currentMonth: false, today: formatDateLocal(d) === formatDateLocal(today), label: d.getDate() });
  }

  return days;
};

export const getWeeksInMonth = (date) => {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const weeks = [];
  const current = new Date(firstDay);
  const dayOfWeek = (firstDay.getDay() + 6) % 7;
  current.setDate(firstDay.getDate() - dayOfWeek);

  while (current <= lastDay) {
    const weekEnd = new Date(current);
    weekEnd.setDate(current.getDate() + 6);
    weeks.push({ startDate: new Date(current), endDate: weekEnd, weekNumber: weeks.length + 1, isCurrentWeek: formatDateLocal(new Date()) >= formatDateLocal(current) && formatDateLocal(new Date()) <= formatDateLocal(weekEnd) });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

export const getMonthsInYear = (year) => {
  const months = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  for (let i = 0; i < 12; i++) {
    const date = new Date(year, i, 1);
    months.push({
      month: i + 1,
      year,
      label: date.toLocaleString(undefined, { month: 'long' }),
      current: year === currentYear && i === currentMonth
    });
  }
  return months;
};
