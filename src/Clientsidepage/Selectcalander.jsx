import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';
import './Selectcalander.css';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Plus,
  Calendar,
  RotateCcw,
  User,
  Check,
  X
} from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import Error500Page from '../states/ErrorPage';
import NoDataState from '../states/NoData';
import Loading from '../states/Loading';


// --- API ENDPOINTS ---
const BOOKING_API_URL = `${Base_url}/bookings`;
const SERVICES_API_URL = `${Base_url}/services`;
const EMPLOYEES_API_URL = `${Base_url}/employees`;
const CLIENTS_API_URL = `${Base_url}/clients`;

// --- HELPER FUNCTIONS ---
const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
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

const formatTime = (time) => {
  // Return 24-hour format directly
  return time;
};
const formatDateLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// IMPORTANT: Use local date (not UTC ISO) for calendar day keys to avoid off-by-one issues
// Caused by toISOString() converting to UTC (shifts date backwards/forwards depending on timezone)
const localDateKey = (date) => formatDateLocal(date instanceof Date ? date : new Date(date));

const getRandomColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomAppointmentColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Utility function to calculate appointment height based on actual duration
const calculateAppointmentHeight = (startTime, endTime, timeSlotHeight = 80, slotInterval = 30) => {
  const parseHM = (t = '00:00') => {
    if (!t) return 0;
    // Accept "HH:MM", "H:MM", ISO datetime, Date string
    if (t.includes('T') || t.includes('-') || t.endsWith('Z')) {
      const d = new Date(t);
      return d.getHours() * 60 + d.getMinutes();
    }
    const parts = String(t).trim().split(':');
    const h = Number(parts[0] || 0);
    const m = Number(parts[1] || 0);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  if (!startTime) return Math.round(timeSlotHeight);
  const s = parseHM(startTime);
  let e = endTime ? parseHM(endTime) : s + slotInterval;
  if (e <= s) e = s + slotInterval; // at least one interval

  const durationMinutes = Math.max(1, e - s);
  const heightFloat = (durationMinutes / slotInterval) * timeSlotHeight;
  // use ceil to avoid too-small heights and ensure minimum one slot
  return Math.max(Math.ceil(heightFloat), Math.round(timeSlotHeight));
};

// Utility function to get appointment color based on status
const getAppointmentColorByStatus = (status, defaultColor) => {
  if (!status) return defaultColor;

  const statusLower = status.toLowerCase();

  if (statusLower.includes('confirmed') || statusLower.includes('confirm')) {
    return '#f59e0b'; // Professional yellow for confirmed
  } else if (statusLower.includes('completed') || statusLower.includes('complete')) {
    return '#6b7280'; // Professional grey for completed
  } else {
    return defaultColor; // Keep existing color for other statuses
  }
};

// Helper function to check if an employee has a shift on a specific day
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};
const parseShiftsFromSchedule = (schedule) => {
  if (!schedule) return [];

  const pad = (n) => String(n).padStart(2, '0');
  const normalizeHM = (h, m = 0) => `${pad(Number(h))}:${pad(Number(m))}`;

  // try to parse a time token (strings like "09:00", "9", ISO date etc.)
  const parseTimeToken = (token) => {
    if (!token && token !== 0) return null;
    token = String(token).trim();
    // ISO / full datetime -> extract local hours/minutes
    if (token.includes('T') || token.includes('-') || token.includes('/')) {
      const dt = new Date(token);
      if (!isNaN(dt)) return normalizeHM(dt.getHours(), dt.getMinutes());
    }
    // plain "HH:MM" or "H:MM"
    const m1 = token.match(/^(\d{1,2}):(\d{2})$/);
    if (m1) return normalizeHM(m1[1], m1[2]);
    // plain hour like "9" or "09"
    const m2 = token.match(/^(\d{1,2})$/);
    if (m2) return normalizeHM(m2[1], 0);
    return null;
  };

  const pushShift = (s, e) => {
    const start = parseTimeToken(s);
    const end = parseTimeToken(e);
    if (start && end) {
      return { startTime: start, endTime: end };
    }
    return null;
  };

  const result = [];

  // If schedule is a plain string, allow formats like "09:00-17:00,18:00-22:00" or "09-17"
  if (typeof schedule === 'string') {
    const parts = schedule.split(/[;,|]/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      const m = part.match(/(\S+)\s*[-–—]\s*(\S+)/);
      if (m) {
        const s = pushShift(m[1], m[2]);
        if (s) result.push(s);
      }
    }
    return result;
  }

  // If schedule is an array of shifts (strings or objects)
  if (Array.isArray(schedule)) {
    for (const it of schedule) {
      if (!it) continue;
      if (typeof it === 'string') {
        const m = it.match(/(\S+)\s*[-–—]\s*(\S+)/);
        if (m) {
          const s = pushShift(m[1], m[2]);
          if (s) result.push(s);
        }
      } else if (typeof it === 'object') {
        const s = pushShift(it.startTime || it.start, it.endTime || it.end);
        if (s) result.push(s);
      }
    }
    return result;
  }

  // If schedule has common keys: shiftsData, shifts, startTime/endTime
  if (schedule.shiftsData && Array.isArray(schedule.shiftsData)) {
    for (const sh of schedule.shiftsData) {
      const s = pushShift(sh.startTime || sh.start, sh.endTime || sh.end);
      if (s) result.push(s);
    }
  }

  if (schedule.shifts && Array.isArray(schedule.shifts)) {
    for (const sh of schedule.shifts) {
      if (typeof sh === 'string') {
        const m = sh.match(/(\S+)\s*[-–—]\s*(\S+)/);
        if (m) {
          const s = pushShift(m[1], m[2]);
          if (s) result.push(s);
        }
      } else if (typeof sh === 'object') {
        const s = pushShift(sh.startTime || sh.start, sh.endTime || sh.end);
        if (s) result.push(s);
      }
    }
  }

  if (schedule.shifts && typeof schedule.shifts === 'string') {
    const parts = schedule.shifts.split(/[;,|]/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      const m = part.match(/(\S+)\s*[-–—]\s*(\S+)/);
      if (m) {
        const s = pushShift(m[1], m[2]);
        if (s) result.push(s);
      }
    }
  }

  // Single start/end pair
  if ((schedule.startTime || schedule.start) && (schedule.endTime || schedule.end)) {
    const s = pushShift(schedule.startTime || schedule.start, schedule.endTime || schedule.end);
    if (s) result.push(s);
  }

  // Some backends use { periods: [{ from:'09:00', to:'17:00' }] }
  if (schedule.periods && Array.isArray(schedule.periods)) {
    for (const p of schedule.periods) {
      const s = pushShift(p.from || p.start, p.to || p.end);
      if (s) result.push(s);
    }
  }

  // Filter duplicates and invalid
  const unique = [];
  const seen = new Set();
  for (const sh of result) {
    const key = `${sh.startTime}_${sh.endTime}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(sh);
    }
  }

  return unique;
};

const hasShiftOnDate = (employee, date) => {
  if (!employee?.workSchedule) return false;
  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];
  if (!schedule) return false;

  // If explicit boolean flag exists, prefer it
  if (typeof schedule.isWorking === 'boolean') {
    if (schedule.isWorking) return true;
    // if isWorking === false, still check for explicit shift entries (edge cases)
  }

  const parsed = parseShiftsFromSchedule(schedule);
  return parsed.length > 0;
};

// NEW: Get employee's actual shift hours for a specific date
const getEmployeeShiftHours = (employee, date) => {
  if (!employee?.workSchedule) return [];
  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];
  if (!schedule) return [];

  const parsed = parseShiftsFromSchedule(schedule);
  // Normalize times (ensure HH:MM strings)
  return parsed.map(s => ({
    startTime: String(s.startTime).padStart(5, '0'),
    endTime: String(s.endTime).padStart(5, '0')
  })).filter(s => s.startTime && s.endTime);
};
// ENHANCED: Generate time slots ONLY for employee's actual shift hours
const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration = 30, intervalMinutes = 30) => {
  // console.log('=== GENERATING TIME SLOTS FROM SHIFT ===');
  // console.log('Employee:', employee?.name);
  // console.log('Service duration:', serviceDuration, 'minutes');
  // console.log('Interval:', intervalMinutes, 'minutes');

  const shifts = getEmployeeShiftHours(employee, date);

  if (shifts.length === 0) {
    // console.log('❌ No shifts found, returning empty slots');
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
    // console.log('Processing shift:', shift.startTime, '-', shift.endTime);

    let startMinutes = toMinutes(shift.startTime);
    let endMinutes = toMinutes(shift.endTime);

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    // console.log(`Shift in minutes: ${startMinutes} - ${endMinutes}`);

    // Generate slots for this shift
    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const slotEnd = slotStart + serviceDuration;
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

  // console.log('Generated', slots.length, 'time slots from shifts');
  // console.log('Sample slots:', slots.slice(0, 3).map(s => ({
  //   start: new Date(s.startTime).toLocaleTimeString(),
  //   end: new Date(s.endTime).toLocaleTimeString()
  // })));
  // console.log('=====================================');

  return slots;
};

const MOCK_SUCCESS_DATA = {
  employees: [
    { id: 'e1', name: 'Alice', position: 'Stylist', avatar: 'https://i.pravatar.cc/150?img=1', avatarColor: '#f97316', unavailablePeriods: [] },
    { id: 'e2', name: 'Bob', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=2', avatarColor: '#22c55e', unavailablePeriods: [] },
  ],
  timeSlots: generateTimeSlots('00:00', '23:30', 30),
  appointments: {
    'e1': {
      '2025-08-02_09:00': { client: 'Client A', service: 'Haircut', duration: 30, color: '#f97316' },
    },
    'e2': {
      '2025-08-02_09:30': { client: 'Client C', service: 'Shave', duration: 15, color: '#0ea5e9' },
    }
  },
};

const MOCK_SERVICES_DATA = [
  { _id: 's1', name: 'Haircut', price: 50, duration: 30 },
  { _id: 's2', name: 'Color', price: 150, duration: 60 },
  { _id: 's3', name: 'Deep Cleansing Facial', price: 150, duration: 90 },
  { _id: 's4', name: 'Swedish Massage', price: 150, duration: 60 },
];

const MOCK_CLIENTS_DATA = [
  { _id: 'c1', firstName: 'Aswin', lastName: 'P', email: 'aswinp04@gmail.com', phone: '7736018588' },
  { _id: 'c2', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '123-456-7890' },
];

const MOCK_PROFESSIONALS_DATA = [
  { _id: 'p1', user: { firstName: 'Shaif', lastName: 'Sharif' }, position: 'massage therapist', employeeId: 'shaif_001' },
  { _id: 'p2', user: { firstName: 'Sajad', lastName: 'Yousuf' }, position: 'massage therapist', employeeId: 'sajad_002' },
];

const MOCK_TIME_SLOTS_DATA = [
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: false },
  { time: '10:30', available: true },
];

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' }
];
// Add these functions after your existing date picker functions (around line 400)

// Generate week ranges for a given month
const generateWeekRangesForMonth = (month) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  
  // Get first day of month
  const firstDay = new Date(year, monthIndex, 1);
  // Get last day of month  
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  const weeks = [];
  let currentWeekStart = new Date(firstDay);
  
  // Start from Monday of the week containing the first day
  while (currentWeekStart.getDay() !== 1) {
    currentWeekStart.setDate(currentWeekStart.getDate() - 1);
  }
  
  let weekNumber = 1;
  
  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Check if this week has any days in the current month
    const hasMonthDays = (currentWeekStart <= lastDay && weekEnd >= firstDay);
    
    if (hasMonthDays) {
      weeks.push({
        number: weekNumber,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd),
        label: `Week ${weekNumber}`,
        dateRange: `${currentWeekStart.getDate()} ${currentWeekStart.toLocaleDateString('en-US', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('en-US', { month: 'short' })}`
      });
      weekNumber++;
    }
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return weeks;
};

// Get current week range based on selected date
const getCurrentWeekRange = (date) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  startOfWeek.setDate(diff);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    startDate: startOfWeek,
    endDate: endOfWeek,
    label: `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    dateRange: `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('en-US', { month: 'short' })}`
  };
};

// Handle week range selection
const handleWeekRangeSelect = (weekRange) => {
  setCurrentDate(weekRange.startDate); // Set to start of selected week
  setSelectedWeekRange(weekRange);
  setShowDatePicker(false);
};

// Handle month selection
const handleMonthSelect = (month, year) => {
  const newDate = new Date(year, month, 1);
  setCurrentDate(newDate);
  setDatePickerCurrentMonth(newDate);
  setShowDatePicker(false);
};

// Navigate months in month-only picker
const goToDatePickerPreviousYear = () => {
  setDatePickerCurrentMonth(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
};

const goToDatePickerNextYear = () => {
  setDatePickerCurrentMonth(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
};
// --- ENHANCED: Utility to get valid time slots for a professional and service ---
const getValidTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  const shifts = getEmployeeShiftHours(employee, date);
  if (!shifts.length) return [];

  const intervalMinutes = 10;
  const validSlots = [];

  shifts.forEach(shift => {
    const startMinutes = parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1]);
    const endMinutes = parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1]);
    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += intervalMinutes) {
      const hour = Math.floor(slotStart / 60).toString().padStart(2, '0');
      const minute = (slotStart % 60).toString().padStart(2, '0');
  const slotLabel = `${hour}:${minute}`;
  const slotDate = new Date(date);
  slotDate.setHours(hour, minute, 0, 0);

      // Check for overlap with existing appointments
      const employeeAppointments = appointments[employee.id] || {};
      const overlaps = Object.entries(employeeAppointments).some(([appKey, app]) => {
        if (!appKey.startsWith(localDateKey(date))) return false;
        const [appHour, appMinute] = appKey.split('_')[1].split(':').map(Number);
        const appStart = new Date(date);
        appStart.setHours(appHour, appMinute, 0, 0);
        const appEnd = new Date(appStart.getTime() + (app.duration || 30) * 60000);
        const slotStartDate = slotDate;
        const slotEndDate = new Date(slotStartDate.getTime() + serviceDuration * 60000);
        return (slotStartDate < appEnd && slotEndDate > appStart);
      });

      if (!overlaps) {
        validSlots.push({
          startTime: slotDate.toISOString(),
          endTime: new Date(slotDate.getTime() + serviceDuration * 60000).toISOString(),
          label: slotLabel,
          available: true
        });
      }
    }
  });

  return validSlots;
};

// --- ENHANCED: Booking Modal Step 2 (Professional Selection) ---
const getAvailableProfessionalsForService = (serviceId, date, employees, appointments, availableServices) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  return employees.filter(emp => {
    if (!hasShiftOnDate(emp, date)) return false;
    const validSlots = getValidTimeSlotsForProfessional(emp, date, service.duration, appointments);
    return validSlots.length > 0;
  });
};

// --- ENHANCED: Multiple Appointments Utility Functions ---
const getAccumulatedBookings = (multipleAppointments, currentDate) => {
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

const addMinutesToTime = (timeStr, minutes) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  const newStart = timeToMinutes(newSlot);
  const newEnd = newStart + newDuration;
  
  return existingBookings.some(booking => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);
    
    // Check for overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

const getAvailableTimeSlotsWithAccumulatedBookings = (employee, date, serviceDuration, appointments, multipleAppointments) => {
  // Get base time slots for the employee
  const baseSlots = getValidTimeSlotsForProfessional(employee, date, serviceDuration, appointments);
  
  // Get accumulated bookings from current session
  const accumulatedBookings = getAccumulatedBookings(multipleAppointments, date);
  const employeeAccumulatedBookings = accumulatedBookings.filter(booking => booking.employeeId === employee._id);
  
  // Filter out conflicting slots
  return baseSlots.filter(slot => {
    // Extract time properly from slot object
    const slotTime = slot.startTime ? new Date(slot.startTime).toTimeString().slice(0, 5) : slot.time || slot;
    return !isTimeSlotConflicting(slotTime, serviceDuration, employeeAccumulatedBookings);
  });
};

const getAvailableProfessionalsWithAccumulatedBookings = (serviceId, date, employees, appointments, availableServices, multipleAppointments) => {
  const service = availableServices.find(s => s._id === serviceId);
  if (!service) return [];
  
  return employees.filter(emp => {
    // Check if employee has shift on this date
    if (!hasShiftOnDate(emp, date)) return false;
    
    // Get available time slots considering accumulated bookings
    const availableSlots = getAvailableTimeSlotsWithAccumulatedBookings(emp, date, service.duration, appointments, multipleAppointments);
    
    // Only include if employee has at least one available slot
    return availableSlots.length > 0;
  });
};

// --- ENHANCED: Multiple Appointments Management Functions ---
const getAvailableTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  return getValidTimeSlotsForProfessional(employee, date, serviceDuration, appointments);
};
// Add these helper functions for the date picker (add after the existing helper functions around line 800)
const getDatePickerCalendarDays = (month) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, monthIndex, 1);
  // Last day of the month
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  // Calculate padding days needed at the start (Monday = 1, Sunday = 0)
  const startPadding = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
  
  // Calculate padding days needed at the end
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((totalDays + startPadding) / 7) * 7;
  const endPadding = totalCells - (totalDays + startPadding);
  
  const days = [];
  
  // Add padding days from previous month
  for (let i = startPadding; i > 0; i--) {
    const day = new Date(year, monthIndex, 1 - i);
    days.push({ date: day, isCurrentMonth: false });
  }
  
  // Add current month days
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, monthIndex, day);
    days.push({ date, isCurrentMonth: true });
  }
  
  // Add padding days from next month
  for (let i = 1; i <= endPadding; i++) {
    const day = new Date(year, monthIndex + 1, i);
    days.push({ date: day, isCurrentMonth: false });
  }
  
  return days;
};
const handleDatePickerDateSelect = (date) => {
  setCurrentDate(date);
  setDatePickerSelectedDate(date);
  setShowDatePicker(false);
};

const goToDatePickerPreviousMonth = () => {
  setDatePickerCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
};

const goToDatePickerNextMonth = () => {
  setDatePickerCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
};

const goToDatePickerToday = () => {
  const today = new Date();
  setDatePickerCurrentMonth(today);
  setDatePickerSelectedDate(today);
  setCurrentDate(today);
  setShowDatePicker(false);
};

const SelectCalendar = () => {
  const [datePickerView, setDatePickerView] = useState('date'); // 'date', 'week', 'month'
const [weekRanges, setWeekRanges] = useState([]);
const [selectedWeekRange, setSelectedWeekRange] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('Day');
  const [selectedStaff, setSelectedStaff] = useState('All');
const [showDatePicker, setShowDatePicker] = useState(false);
const [datePickerCurrentMonth, setDatePickerCurrentMonth] = useState(new Date());
const [datePickerSelectedDate, setDatePickerSelectedDate] = useState(new Date());

  // Enhanced Booking Flow States
  const [availableServices, setAvailableServices] = useState([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showUnavailablePopup, setShowUnavailablePopup] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [isNewAppointment, setIsNewAppointment] = useState(false);
  // const [selectedBookingForStatus, setSelectedBookingForStatus] = useState(null);
  // Client Search States
  const [existingClients, setExistingClients] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [selectedExistingClient, setSelectedExistingClient] = useState(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);

  // Booking Selection States
  const [availableProfessionals, setAvailableProfessionals] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingDefaults, setBookingDefaults] = useState(null);

  // Form States
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Multiple Appointments States
  const [multipleAppointments, setMultipleAppointments] = useState([]);
  const [currentAppointmentIndex, setCurrentAppointmentIndex] = useState(0);
  const [isAddingAdditionalService, setIsAddingAdditionalService] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [showAppointmentSummary, setShowAppointmentSummary] = useState(false);

  // Month View More Appointments States
  const [showMoreAppointments, setShowMoreAppointments] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownPositionedAbove, setDropdownPositionedAbove] = useState(false);

  // Booking Hover Tooltip States
  const [showBookingTooltip, setShowBookingTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all'); // 'all' or 'scheduled'
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [calendarPopupTab, setCalendarPopupTab] = useState('confirmed');
  // Add these state variables with your existing useState declarations:

const [teamSearchQuery, setTeamSearchQuery] = useState('');
const [teamViewMode, setTeamViewMode] = useState('list'); // 'list' or 'grid'

// Add this helper function:
const getFilteredAndSearchedEmployees = () => {
  let filtered = employees;
  
  // Apply team filter
  if (teamFilter === 'scheduled') {
    filtered = filtered.filter(emp => hasShiftOnDate(emp, currentDate));
  }
  
  // Apply search query
  if (teamSearchQuery.trim()) {
    const query = teamSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(emp => 
      emp.name.toLowerCase().includes(query) ||
      emp.position.toLowerCase().includes(query)
    );
  }
  
  return filtered;
};

// Add this helper function:
const getEmployeeAppointmentCount = (employeeId) => {
  const empAppointments = appointments[employeeId] || {};
  const today = localDateKey(currentDate);
  
  return Object.keys(empAppointments).filter(key => 
    key.startsWith(today)
  ).length;
};

  // Time Slot Hover States
  const [showTimeHover, setShowTimeHover] = useState(false);
  const [hoverTimeData, setHoverTimeData] = useState(null);
  const [hoverTimePosition, setHoverTimePosition] = useState({ top: 0, left: 0 });

  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    paymentMethod: 'cash',
    notes: '',
    giftCardCode: '',
  });

  const schedulerContentRef = useRef(null);

  // Booking Status Management States
  const [showBookingStatusModal, setShowBookingStatusModal] = useState(false);
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState(null);
  const [bookingStatusLoading, setBookingStatusLoading] = useState(false);
  const [bookingStatusError, setBookingStatusError] = useState(null);

  // --- HELPER FUNCTIONS ---
  // const handleTimeSlotClick = (employeeId, slotTime, day) => {
  //   const dayKey = (day || currentDate).toISOString().split('T')[0];
  //   const slotKey = `${dayKey}_${slotTime}`;
  //   const existingAppointment = appointments[employeeId]?.[slotKey];

  //   if (existingAppointment) {
  //     // Show booking status modal for existing appointment
  //     const employee = employees.find(emp => emp.id === employeeId);
  //     const appointmentDetails = {
  //       ...existingAppointment,
  //       employeeId,
  //       employeeName: employee?.name,
  //       slotTime,
  //       date: dayKey,
  //       slotKey
  //     };
  //     setSelectedBookingForStatus(appointmentDetails);
  //     setShowBookingStatusModal(true);
  //     return;
  //   }

  //   // Continue with new booking flow for empty slots
  //   const employee = employees.find(emp => emp.id === employeeId);

  //   // Check if employee has a shift on this day
  //   if (!hasShiftOnDate(employee, day || currentDate)) {
  //     setUnavailableMessage(`${employee?.name || 'Employee'} has no shift scheduled on this day`);
  //     setShowUnavailablePopup(true);
  //     return;
  //   }

  //   const unavailableReason = isTimeSlotUnavailable(employeeId, slotTime);
  //   if (unavailableReason && unavailableReason !== "No shift scheduled") {
  //     setUnavailableMessage(`This time slot is unavailable: ${unavailableReason}`);
  //     setShowUnavailablePopup(true);
  //     return;
  //   }

  //   // Store the clicked employee and time slot as defaults for pre-selection
  //   const staff = employees.find(emp => emp.id === employeeId);
  //   setBookingDefaults({
  //     professional: { _id: staff.id, user: { firstName: staff.name.split(' ')[0], lastName: staff.name.split(' ')[1] || '' } },
  //     time: slotTime,
  //     staffId: staff.id
  //   });
  //   setIsNewAppointment(true);
  //   setShowAddBookingModal(true);
  // };
  const handleTimeSlotClick = (employeeId, slotTime, day) => {
    // ... (existing logic for checking existing appointments and unavailable periods)
  const dayKey = localDateKey(day || currentDate);
    const slotKey = `${dayKey}_${slotTime}`;
    const existingAppointment = appointments[employeeId]?.[slotKey];
    console.log('this is the employee id ', employeeId, slotTime)
    if (existingAppointment) {
      // Show booking status modal for existing appointment
      const employee = employees.find(emp => emp.id === employeeId);
      const appointmentDetails = {
        ...existingAppointment,
        employeeId,
        employeeName: employee?.name,
        slotTime,
        date: dayKey,
        slotKey
      };
      setSelectedBookingForStatus(appointmentDetails);
      setShowBookingStatusModal(true);
      return;
    }

    // Continue with new booking flow for empty slots
    const employee = employees.find(emp => emp.id === employeeId);

    // Check if employee has a shift on this day
    if (!hasShiftOnDate(employee, day || currentDate)) {
      setUnavailableMessage(`${employee?.name || 'Employee'} has no shift scheduled on this day`);
      setShowUnavailablePopup(true);
      return;
    }

    const unavailableReason = isTimeSlotUnavailable(employeeId, slotTime);
    if (unavailableReason && unavailableReason !== "No shift scheduled") {
      setUnavailableMessage(`This time slot is unavailable: ${unavailableReason}`);
      setShowUnavailablePopup(true);
      return;
    }
    // Store the clicked employee and time slot as defaults for pre-selection
    const staff = employees.find(emp => emp.id === employeeId);
    if (!staff) {
      console.error('Employee not found in state for ID:', employeeId);
      return;
    }
    setBookingDefaults({
      professional: staff,
      time: slotTime,
      date: day || currentDate
    });

    setIsNewAppointment(true);
    setShowAddBookingModal(true);
  };

  // ... (inside SelectCalendar component)

  const handleServiceSelect = (service) => {
    console.log('🎯 SERVICE SELECTED:', service.name);
    console.log('isAddingAdditionalService:', isAddingAdditionalService);
    console.log('Current multipleAppointments count:', multipleAppointments.length);
    
    setSelectedService(service);
    setBookingStep(2);
    setBookingError(null);

    // Case 1: User clicked a time slot directly
    if (bookingDefaults?.professional) {
      console.log('📋 Using booking defaults (direct time slot click)');
      const selectedProfessional = bookingDefaults.professional;
      console.log("selected professional ", selectedProfessional);

      setSelectedProfessional(selectedProfessional);

      const employeeWithSchedule = employees.find(e => e.id === selectedProfessional.id);
      if (employeeWithSchedule) {
        // Correctly generate and filter time slots for the selected professional and service
        const allPossibleSlots = generateTimeSlotsFromEmployeeShift(employeeWithSchedule, bookingDefaults.date, service.duration, 30);
        const filteredSlots = filterOutBookedTimeSlots(allPossibleSlots, selectedProfessional.id, bookingDefaults.date);
        setAvailableTimeSlots(filteredSlots);

        // We have the professional and the time slot already selected from the click.
        // We can skip directly to the client info step.
        const [hour, minute] = bookingDefaults.time.split(':').map(Number);
        const originalSlot = filteredSlots.find(slot => {
          const d = new Date(slot.startTime);
          return d.getHours() === hour && d.getMinutes() === minute;
        });

        if (originalSlot) {
          setSelectedTimeSlot(originalSlot);
          setBookingStep(4); // Skip to client info
        } else {
          setBookingError(`The selected service duration (${service.duration} mins) does not fit in the original time slot. Please choose a different time.`);
          setBookingStep(3); // Stay on time selection, but with a warning.
        }
      } else {
        setBookingError("Professional data is missing. Please try again.");
      }
      return;
    }

    // Case 2: User clicked "Add Appointment" from the header OR adding additional service
    console.log('📋 Using Case 2 - Professional selection flow');
    const professionals = getAvailableProfessionalsForService(
      service._id,
      currentDate,
      employees,
      appointments,
      availableServices
    );
    setAvailableProfessionals(professionals);
  };

  const closeBookingModal = () => {
    setShowAddBookingModal(false);
    setShowUnavailablePopup(false);
    
    // Only reset form, but preserve multiple appointments session
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setAvailableProfessionals([]);
    setAvailableTimeSlots([]);
    setBookingStep(1);
    setBookingError(null);
    setBookingSuccess(null);
    setBookingLoading(false);
    setSelectedExistingClient(null);
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(false);
    setIsAddingNewClient(false);
    setBookingDefaults(null);
    
    // Don't clear multiple appointments session here - only clear on successful booking
    setBookingForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      paymentMethod: 'cash',
      notes: '',
      giftCardCode: '',
    });
  };

  const closeBookingStatusModal = () => {
    setShowBookingStatusModal(false);
    setSelectedBookingForStatus(null);
    setBookingStatusError(null);
  };
// Add these functions inside the SelectCalendar component, after your existing functions

const getDatePickerCalendarDays = (month) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  
  const startPadding = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((totalDays + startPadding) / 7) * 7;
  const endPadding = totalCells - (totalDays + startPadding);
  
  const days = [];
  
  for (let i = startPadding; i > 0; i--) {
    const day = new Date(year, monthIndex, 1 - i);
    days.push({ date: day, isCurrentMonth: false });
  }
  
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, monthIndex, day);
    days.push({ date, isCurrentMonth: true });
  }
  
  for (let i = 1; i <= endPadding; i++) {
    const day = new Date(year, monthIndex + 1, i);
    days.push({ date: day, isCurrentMonth: false });
  }
  
  return days;
};

const handleDatePickerDateSelect = (date) => {
  setCurrentDate(date);
  setDatePickerSelectedDate(date);
  setShowDatePicker(false);
};

const goToDatePickerPreviousMonth = () => {
  setDatePickerCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
};

const goToDatePickerNextMonth = () => {
  setDatePickerCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
};

const goToDatePickerToday = () => {
  const today = new Date();
  setDatePickerCurrentMonth(today);
  setDatePickerSelectedDate(today);
  setCurrentDate(today);
  setShowDatePicker(false);
};
  const handleBookingStatusUpdate = async (newStatus) => {
    if (!selectedBookingForStatus || !selectedBookingForStatus.bookingId) {
      setBookingStatusError('Invalid booking selected');
      return;
    }

    setBookingStatusLoading(true);
    setBookingStatusError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      // Correct backend route (admin update booking): PATCH /bookings/admin/:id with body containing updated fields
      const bookingId = selectedBookingForStatus.bookingId;
      const endpoint = `${Base_url}/bookings/admin/${bookingId}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to update booking status (HTTP ${res.status})`);
      }

      // Update local state optimistically with new status
      setAppointments(prev => ({
        ...prev,
        [selectedBookingForStatus.employeeId]: {
          ...prev[selectedBookingForStatus.employeeId],
          [selectedBookingForStatus.slotKey]: {
            ...prev[selectedBookingForStatus.employeeId][selectedBookingForStatus.slotKey],
            status: newStatus
          }
        }
      }));

      // Close modal and refresh calendar
      closeBookingStatusModal();
      setTimeout(() => { fetchCalendarData(); }, 300);
    } catch (err) {
      console.error('Status update error:', err);
      setBookingStatusError(err.message);
    } finally {
      setBookingStatusLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBookingForStatus || !selectedBookingForStatus.bookingId) {
      setBookingStatusError('Invalid booking selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this booking for ${selectedBookingForStatus.client}?`)) {
      return;
    }

    setBookingStatusLoading(true);
    setBookingStatusError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(`${Base_url}/bookings/${selectedBookingForStatus.bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to delete booking`);
      }

      if (data.success) {
        // Remove the appointment from local state
        setAppointments(prev => {
          const newAppointments = { ...prev };
          if (newAppointments[selectedBookingForStatus.employeeId]) {
            delete newAppointments[selectedBookingForStatus.employeeId][selectedBookingForStatus.slotKey];
          }
          return newAppointments;
        });

        // Close modal and refresh calendar
        closeBookingStatusModal();
        setTimeout(() => {
          fetchCalendarData();
        }, 500);
      } else {
        throw new Error(data.message || 'Failed to delete booking');
      }
    } catch (err) {
      console.error('Delete booking error:', err);
      setBookingStatusError(err.message);
    } finally {
      setBookingStatusLoading(false);
    }
  };

  const handleAddAppointment = () => {
    setBookingDefaults(null);
    setIsNewAppointment(true); // This is a new appointment
    setShowAddBookingModal(true);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() - 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() - 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() + 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() + 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const isTimeSlotUnavailable = (employeeId, slotTime) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return false;

    // Check if employee has a shift on this day
    if (!hasShiftOnDate(employee, currentDate)) {
      return "No shift scheduled";
    }

    // Check for existing unavailable periods
    if (employee.unavailablePeriods) {
      const slotDate = new Date(currentDate);
      const [hours, minutes] = slotTime.split(':').map(Number);
      slotDate.setHours(hours, minutes, 0, 0);

      for (const period of employee.unavailablePeriods) {
        const periodStart = new Date(period.start);
        const periodEnd = new Date(period.end);

        if (slotDate >= periodStart && slotDate < periodEnd) {
          return period.reason || "Unavailable";
        }
      }
    }

    return false;
  };

  // --- ENHANCED: Multiple Appointments Management Functions ---
  // --- ENHANCED: Smart availability checking for multiple appointments ---
  const isProfessionalUnavailableInSession = (professionalId, timeSlot, date, serviceDuration) => {
    return multipleAppointments.find(apt => {
      const sameEmployee = apt.professional._id === professionalId;
      const sameDate = formatDateLocal(new Date(apt.date)) === formatDateLocal(date);
      
      if (!sameEmployee || !sameDate) return false;
      
      // Check for exact time match
      if (apt.timeSlot === timeSlot) {
        return {
          type: 'exact_time',
          conflictingService: apt.service.name,
          conflictingTime: apt.timeSlot
        };
      }
      
      // Check for overlapping times
      const existingStart = timeToMinutes(apt.timeSlot);
      const existingEnd = existingStart + apt.duration;
      const newStart = timeToMinutes(timeSlot);
      const newEnd = newStart + serviceDuration;
      
      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          type: 'time_overlap',
          conflictingService: apt.service.name,
          conflictingTime: apt.timeSlot,
          conflictingDuration: apt.duration
        };
      }
      
      return false;
    });
  };

  const getUnavailabilityMessage = (professionalName, conflict) => {
    if (conflict.type === 'exact_time') {
      return `❌ ${professionalName} is already booked for "${conflict.conflictingService}" at ${conflict.conflictingTime}. Please select a different time slot.`;
    } else if (conflict.type === 'time_overlap') {
      const endTime = addMinutesToTime(conflict.conflictingTime, conflict.conflictingDuration);
      return `❌ ${professionalName} is busy with "${conflict.conflictingService}" from ${conflict.conflictingTime} to ${endTime}. Please select a different time slot.`;
    }
    return `❌ ${professionalName} is not available at this time.`;
  };

  const addAppointmentToSession = (appointment) => {
    const newAppointment = {
      id: `temp_${Date.now()}_${Math.random()}`,
      service: appointment.service,
      professional: appointment.professional,
      timeSlot: appointment.timeSlot,
      date: appointment.date,
      duration: appointment.service.duration,
      price: appointment.service.price
    };
    
    console.log('🔥 ADDING APPOINTMENT TO SESSION:');
    console.log('Previous appointments count:', multipleAppointments.length);
    console.log('Previous appointments:', multipleAppointments);
    console.log('New appointment:', newAppointment);
    
    setMultipleAppointments(prev => {
      const updated = [...prev, newAppointment];
      console.log('🎯 UPDATED APPOINTMENTS ARRAY:', updated);
      console.log('🎯 NEW TOTAL COUNT:', updated.length);
      return updated;
    });
    
    return newAppointment;
  };

  const removeAppointmentFromSession = (appointmentId) => {
    setMultipleAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
  };

  const getTotalSessionPrice = () => {
    return multipleAppointments.reduce((total, apt) => total + (apt.price || 0), 0);
  };

  const clearAppointmentSession = () => {
    setMultipleAppointments([]);
    setCurrentAppointmentIndex(0);
    setIsAddingAdditionalService(false);
    setGiftCardCode('');
    setShowAppointmentSummary(false);
  };

  const startAdditionalService = () => {
    console.log('🚀 STARTING ADDITIONAL SERVICE');
    console.log('Current multipleAppointments count before adding another:', multipleAppointments.length);
    
    // Reset booking form for next service
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setAvailableProfessionals([]);
    setAvailableTimeSlots([]);
    setBookingStep(1);
    setIsAddingAdditionalService(true);
    setCurrentAppointmentIndex(multipleAppointments.length);
    setBookingError(null);
    setBookingSuccess(null);
    
    // CRITICAL: Clear booking defaults so new service selection doesn't use old time slot logic
    setBookingDefaults(null);
    
    console.log('✅ Additional service setup complete - should return to step 1');
  };

  // --- ENHANCED BOOKING FLOW FUNCTIONS ---
  const fetchBookingServices = useCallback(async () => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      // console.log('Fetching services from:', `${Base_url}/bookings/services`);
      const res = await fetch(`${Base_url}/bookings/services`);
      const data = await res.json();

      // console.log('Services API response:', data);

      if (res.ok && data.success) {
        setAvailableServices(data.data?.services || []);
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setBookingError('Failed to fetch services: ' + err.message);
      // Fallback to mock data
      setAvailableServices(MOCK_SERVICES_DATA);
    } finally {
      setBookingLoading(false);
    }
  }, []);

  // TEMPORARY DEBUG FUNCTION - Add this to help diagnose the issue
  const debugProfessionalData = (prof, date) => {
    // console.log('=== DEBUGGING PROFESSIONAL ===');
    // console.log('Professional:', {
    //   id: prof._id,
    //   name: `${prof.user?.firstName} ${prof.user?.lastName}`,
    //   isActive: prof.user?.isActive,
    //   position: prof.position
    // });
    // console.log('WorkSchedule:', prof.workSchedule);

    const dayName = getDayName(date);
    // console.log('Day being checked:', dayName);
    // console.log('Schedule for this day:', prof.workSchedule?.[dayName]);

    // Check what the hasShiftOnDate function actually returns
    const employeeForShiftCheck = { workSchedule: prof.workSchedule || {} };
    // console.log('Employee object for shift check:', employeeForShiftCheck);

    const hasShift = hasShiftOnDate(employeeForShiftCheck, date);
    // console.log('Has shift result:', hasShift);

    // Let's also check if the workSchedule has any data at all
    // console.log('WorkSchedule keys:', Object.keys(prof.workSchedule || {}));
    // console.log('WorkSchedule values:', Object.values(prof.workSchedule || {}));

    // console.log('================================');

    return hasShift;
  };

  const fetchBookingProfessionals = useCallback(async (serviceId, date) => {
    // console.log('=== FETCHING PROFESSIONALS ===');
    // console.log('Service ID:', serviceId);
    // console.log('Date:', date?.toDateString());

    setBookingLoading(true);
    setBookingError(null);

    try {
      const dateStr = date.toISOString().slice(0, 10);
      const url = `${EMPLOYEES_API_URL}`;
      // console.log('API URL:', url);

      const res = await fetch(url);
      const data = await res.json();

      // console.log('API Response:', data);

      if (res.ok && data.success) {
        const allProfessionals = data.data?.employees || [];
        // console.log('Total professionals from API:', allProfessionals.length);

        // Filter professionals with shifts on this date and available time slots
        const professionalsWithShifts = allProfessionals.filter(prof => {
          const isActive = prof.user?.isActive !== false;

          // Create employee object for shift checking
          const employeeForShiftCheck = {
            name: `${prof.user?.firstName} ${prof.user?.lastName}`,
            workSchedule: prof.workSchedule || {}
          };

          const hasShift = hasShiftOnDate(employeeForShiftCheck, date);

          // Check if professional has available slots considering accumulated bookings
          if (isActive && hasShift && selectedService) {
            const availableSlots = getAvailableTimeSlotsWithAccumulatedBookings(
              { _id: prof._id, ...employeeForShiftCheck }, 
              date, 
              selectedService.duration, 
              appointments, 
              multipleAppointments
            );
            return availableSlots.length > 0;
          }

          // console.log(`Professional ${prof.user?.firstName}: Active=${isActive}, HasShift=${hasShift}`);

          return isActive && hasShift;
        });

        // console.log('Professionals with shifts:', professionalsWithShifts.length);

        if (professionalsWithShifts.length === 0) {
          setBookingError(`No professionals have shifts scheduled for ${date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}. Please select a different date.`);
        }

        setAvailableProfessionals(professionalsWithShifts);

      } else {
        throw new Error(data.message || 'Failed to fetch professionals');
      }
    } catch (err) {
      console.error('Error fetching professionals:', err);
      setBookingError('Failed to fetch professionals: ' + err.message);

      // Fallback to local employees with shifts
      const localProfessionalsWithShifts = employees
        .filter(emp => emp.isActive !== false && hasShiftOnDate(emp, date))
        .map(emp => ({
          _id: emp.id,
          user: {
            firstName: emp.name.split(' ')[0],
            lastName: emp.name.split(' ').slice(1).join(' ') || '',
            isActive: emp.isActive !== false
          },
          position: emp.position,
          workSchedule: emp.workSchedule || {}
        }));

      // console.log('Fallback professionals with shifts:', localProfessionalsWithShifts.length);
      setAvailableProfessionals(localProfessionalsWithShifts);
    } finally {
      setBookingLoading(false);
      // console.log('=== FETCH PROFESSIONALS COMPLETE ===');
    }
  }, [employees, selectedService, appointments, multipleAppointments]);



  const filterOutBookedTimeSlots = (timeSlots, employeeId, date) => {
  const dayKey = localDateKey(date);
    const employeeAppointments = appointments[employeeId] || {};

    // console.log(`🔍 Filtering time slots for employee ${employeeId} on ${dayKey}`);
    // console.log('📅 Employee appointments:', employeeAppointments);

    return timeSlots.filter(slot => {
      const slotStartTime = new Date(slot.startTime);
      const slotEndTime = new Date(slot.endTime);

      // Check if this time slot conflicts with any existing appointment
      const hasConflict = Object.entries(employeeAppointments).some(([slotKey, appointment]) => {
        // Only check appointments for the same date
        if (!slotKey.startsWith(dayKey)) return false;

        // Extract time from slot key (YYYY-MM-DD_HH:MM)
        const appointmentTimeStr = slotKey.split('_')[1];
        if (!appointmentTimeStr) return false;

        // Create appointment time range
        const [hours, minutes] = appointmentTimeStr.split(':').map(Number);
        const appointmentStart = new Date(date);
        appointmentStart.setHours(hours, minutes, 0, 0);

        // Use appointment duration to calculate end time
        const appointmentDuration = appointment.duration || 30; // minutes
        const appointmentEnd = new Date(appointmentStart.getTime() + (appointmentDuration * 60000));

        // Check for time conflict
        const conflict = (slotStartTime >= appointmentStart && slotStartTime < appointmentEnd) ||
          (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
          (slotStartTime <= appointmentStart && slotEndTime >= appointmentEnd);

        if (conflict) {
          // console.log(`❌ Slot ${slotStartTime.toLocaleTimeString()} conflicts with appointment ${appointmentTimeStr} (${appointmentDuration}min)`);
        }

        return conflict;
      });

      if (!hasConflict) {
        // console.log(`✅ Slot ${slotStartTime.toLocaleTimeString()} is available`);
      }

      return !hasConflict && slot.available !== false;
    });
  };

  const fetchBookingTimeSlots = useCallback(async (employeeId, serviceId, date) => {
    console.log('=== ENHANCED TIME SLOT FETCHING ===');
    console.log('Employee ID:', employeeId);
    console.log('Service ID:', serviceId);
    console.log('Date:', date?.toDateString());

    setBookingLoading(true);
    setBookingError(null);

    try {
      // Find the employee to check their shift
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee has shift on this date
      const hasShift = hasShiftOnDate(employee, date);
      if (!hasShift) {
        setBookingError(`${employee.name} has no shift scheduled on ${date.toLocaleDateString()}`);
        setAvailableTimeSlots([]);
        setBookingLoading(false);
        return;
      }

      // Get employee's actual shift hours
      const shiftHours = getEmployeeShiftHours(employee, date);
      if (shiftHours.length === 0) {
        setBookingError(`${employee.name} has no defined shift hours on ${date.toLocaleDateString()}`);
        setAvailableTimeSlots([]);
        setBookingLoading(false);
        return;
      }

      const service = availableServices.find(s => s._id === serviceId);
      const serviceDuration = service?.duration || 30;

      console.log('📋 Employee shift hours:', shiftHours);
      console.log('⏱️ Service duration:', serviceDuration);

      // Generate slots ONLY from employee's actual shift hours
      const shiftBasedSlots = generateTimeSlotsFromEmployeeShift(employee, date, serviceDuration, 30);

      if (shiftBasedSlots.length === 0) {
        setBookingError(`No time slots can be generated from ${employee.name}'s shift hours`);
        setAvailableTimeSlots([]);
        setBookingLoading(false);
        return;
      }

      console.log('🔧 Generated shift-based slots:', shiftBasedSlots.length);

      // Filter out already booked time slots AND accumulated bookings from current session
      let availableSlots = filterOutBookedTimeSlots(shiftBasedSlots, employeeId, date);
      
      // Additional filtering for accumulated bookings from current session
      const accumulatedBookings = getAccumulatedBookings(multipleAppointments, date);
      const employeeAccumulatedBookings = accumulatedBookings.filter(booking => booking.employeeId === employeeId);
      
      if (employeeAccumulatedBookings.length > 0) {
        availableSlots = availableSlots.filter(slot => {
          const slotTime = new Date(slot.startTime).toTimeString().slice(0, 5);
          return !isTimeSlotConflicting(slotTime, serviceDuration, employeeAccumulatedBookings);
        });
        console.log('🚫 Filtered out accumulated bookings, remaining slots:', availableSlots.length);
      }

      console.log('✅ Available slots after filtering:', availableSlots.length);
      console.log('📅 Sample available times:', availableSlots.slice(0, 5).map(slot =>
        new Date(slot.startTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      ));

      if (availableSlots.length === 0) {
        setBookingError(`All time slots are already booked for ${employee.name} on ${date.toLocaleDateString()}. Please select a different date or professional.`);
        setAvailableTimeSlots([]);
      } else {
        setAvailableTimeSlots(availableSlots);
        setBookingError(null);
      }

    } catch (err) {
      console.error('Error in fetchBookingTimeSlots:', err);
      setBookingError(`Failed to fetch time slots: ${err.message}`);
      setAvailableTimeSlots([]);
    } finally {
      setBookingLoading(false);
      console.log('=== TIME SLOT FETCHING COMPLETE ===');
    }
  }, [employees, availableServices, appointments, multipleAppointments]);

  const fetchExistingClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, using mock clients');
        setExistingClients(MOCK_CLIENTS_DATA);
        return;
      }

      // console.log('Fetching clients from:', `${Base_url}/admin/clients`);
      const res = await fetch(`${Base_url}/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      // console.log('Clients API response:', data);

      if (res.ok && data.success) {
        setExistingClients(data.data?.clients || []);
      } else {
        console.error('Failed to fetch clients:', data.message);
        setExistingClients(MOCK_CLIENTS_DATA);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setExistingClients(MOCK_CLIENTS_DATA);
    }
  }, []);

  const searchClients = useCallback((query) => {
    if (!query.trim()) {
      setClientSearchResults(existingClients.slice(0, 10));
      return;
    }

    const filtered = existingClients.filter(client => {
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      const searchTerm = query.toLowerCase();

      return fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm);
    });
    setClientSearchResults(filtered);
  }, [existingClients]);

  const handleClientSearchChange = (e) => {
    const query = e.target.value;
    setClientSearchQuery(query);
    searchClients(query);
  };

  const selectExistingClient = (client) => {
    setSelectedExistingClient(client);
    setClientSearchQuery(`${client.firstName} ${client.lastName}`);
    setClientInfo({ name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone });
    setShowClientSearch(false);
    setIsAddingNewClient(false);
  };

  const clearClientSelection = () => {
    setSelectedExistingClient(null);
    setClientInfo({ name: '', email: '', phone: '' });
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(true);
  };

  const addNewClient = () => {
    setIsAddingNewClient(true);
    setSelectedExistingClient(null);
    setClientInfo({ name: clientSearchQuery, email: '', phone: '' });
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(false);
  };

  const handleShowMoreAppointments = (dayAppointments, dayDate, event) => {
    const rect = event.target.getBoundingClientRect();
    const dropdownHeight = 280; // Estimated dropdown height
    const dropdownWidth = 320; // Estimated dropdown width
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Calculate initial position
    let top = rect.bottom + scrollY + 8; // 8px gap below
    let left = rect.left + scrollX;
    let positionedAbove = false;

    // Check if dropdown would overflow bottom of viewport
    if (rect.bottom + dropdownHeight > viewportHeight) {
      // Position above the element instead
      top = rect.top + scrollY - dropdownHeight - 8; // 8px gap above
      positionedAbove = true;
    }

    // Check if dropdown would overflow right side of viewport
    if (rect.left + dropdownWidth > viewportWidth) {
      // Align to the right edge of the trigger element
      left = rect.right + scrollX - dropdownWidth;
    }

    // Ensure dropdown doesn't go off the left edge
    if (left < scrollX + 16) { // 16px minimum margin
      left = scrollX + 16;
    }

    // Ensure dropdown doesn't go off the top edge
    if (top < scrollY + 16) { // 16px minimum margin
      top = scrollY + 16;
      positionedAbove = false; // Reset if we had to move it down
    }

    setDropdownPosition({ top, left });
    setDropdownPositionedAbove(positionedAbove);
    setSelectedDayAppointments(dayAppointments);
    setSelectedDayDate(dayDate);
    setShowMoreAppointments(true);
  };

  const closeMoreAppointmentsDropdown = () => {
    setShowMoreAppointments(false);
    setSelectedDayAppointments([]);
    setSelectedDayDate(null);
    setDropdownPositionedAbove(false);
  };
useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDatePicker && !event.target.closest('.date-picker-container') && !event.target.closest('.date-display-button')) {
      setShowDatePicker(false);
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape' && showDatePicker) {
      setShowDatePicker(false);
    }
  };

  if (showDatePicker) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }
}, [showDatePicker]);
  // Booking Tooltip Functions
  const showBookingTooltipHandler = (event, appointment) => {
    if (!event) return;
    const el = event.currentTarget || event.target;
    if (!el || !el.getBoundingClientRect) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 280;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    let x = rect.left + scrollX + rect.width / 2; // center horizontally
    // We render with transform translate(-50%, -100%), so y should be the element top (adds 8px gap)
    let y = rect.top + scrollY - 8;
    // Constrain horizontally so tooltip (after translating -50%) stays in viewport roughly
    const halfWidth = tooltipWidth / 2;
    const minX = scrollX + halfWidth + 8;
    const maxX = scrollX + window.innerWidth - halfWidth - 8;
    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    setTooltipPosition({ x, y });
    setTooltipData(appointment);
    setShowBookingTooltip(true);
  };

  const hideBookingTooltip = () => {
    setShowBookingTooltip(false);
    setTooltipData(null);
  };

  // Time Slot Hover Functions
  const showTimeHoverHandler = (event, timeSlot) => {
    if (!event) return;
    const el = event.currentTarget || event.target;
    if (!el || !el.getBoundingClientRect) return;

    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Position tooltip above the time slot
    const x = rect.left + scrollX + rect.width / 2;
    const y = rect.top + scrollY - 8;

    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    setHoverTimePosition({ x, y });
    setHoverTimeData({
      timeSlot,
      currentTime: currentTimeStr,
      date: currentDate.toLocaleDateString()
    });
    setShowTimeHover(true);
  };

  const hideTimeHover = () => {
    setShowTimeHover(false);
    setHoverTimeData(null);
  };

  const formatTooltipTime = (timeString) => {
    if (!timeString) return 'Time TBD';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Close dropdown when clicking outside or on escape key
  useEffect(() => {
    if (employees.length > 0 && selectedEmployees.size === 0) {
      // By default, select all employees
      setSelectedEmployees(new Set(employees.map(emp => emp.id)));
    }
  }, [employees]);
    // NEW: Filter employees based on team selection and selected employees

    const getFilteredEmployees = () => {
      let filteredByTeam = employees;

      if (teamFilter === 'scheduled') {
        // Only show employees who have shifts today
        filteredByTeam = employees.filter(emp => hasShiftOnDate(emp, currentDate));
      }

      // Then filter by selected employees
      return filteredByTeam.filter(emp => selectedEmployees.has(emp.id));
    };
    // NEW: Team management functions
    const handleEmployeeToggle = (employeeId) => {
      const newSelected = new Set(selectedEmployees);
      if (newSelected.has(employeeId)) {
        newSelected.delete(employeeId);
        // Ensure at least one employee remains selected
        if (newSelected.size === 0) {
          const firstEmployee = employees[0];
          if (firstEmployee) {
            newSelected.add(firstEmployee.id);
          }
        }
      } else {
        newSelected.add(employeeId);
      }
      setSelectedEmployees(newSelected);
    };

    const handleClearSelection = () => {
      // Keep only the first employee selected
      const firstEmployee = employees[0];
      if (firstEmployee) {
        setSelectedEmployees(new Set([firstEmployee.id]));
      }
    };
    const handleTeamFilterChange = (filter) => {
      setTeamFilter(filter);
      if (filter === 'scheduled') {
        // When switching to scheduled team, update selected employees to only include those with shifts
        const employeesWithShifts = employees.filter(emp => hasShiftOnDate(emp, currentDate));
        const newSelected = new Set();
        employeesWithShifts.forEach(emp => {
          if (selectedEmployees.has(emp.id)) {
            newSelected.add(emp.id);
          }
        });
        // Ensure at least one employee is selected
        if (newSelected.size === 0 && employeesWithShifts.length > 0) {
          newSelected.add(employeesWithShifts[0].id);
        }
        setSelectedEmployees(newSelected);
      }
    };
    // NEW: Get appointments for calendar popup
    const getAppointmentsForDateRange = () => {
      const { startDate, endDate } = getDisplayDateRange();
      const appointmentsList = [];

      Object.entries(appointments).forEach(([employeeId, empAppointments]) => {
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        Object.entries(empAppointments).forEach(([slotKey, appointment]) => {
          const appointmentDate = new Date(appointment.date || slotKey.split('_')[0]);
          if (appointmentDate >= startDate && appointmentDate <= endDate) {
            appointmentsList.push({
              ...appointment,
              employeeName: employee.name,
              appointmentDate,
              timeSlot: slotKey.split('_')[1] || appointment.startTime
            });
          }
        });
      });

      return appointmentsList.filter(app => {
        if (calendarPopupTab === 'confirmed') return app.status === 'confirmed' || !app.status;
        if (calendarPopupTab === 'started') return app.status === 'started';
        if (calendarPopupTab === 'completed') return app.status === 'completed';
        return true;
      });
    };

    // NEW: Refresh calendar to current time
    const handleRefreshToNow = () => {
      setCurrentDate(new Date());
      fetchCalendarData();
    };
 useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDatePicker && !event.target.closest('.date-picker-container') && !event.target.closest('.date-navigation')) {
      setShowDatePicker(false);
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape' && showDatePicker) {
      setShowDatePicker(false);
    }
  };

  if (showDatePicker) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }
}, [showDatePicker]);

  // Handle ESC key for booking modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showAddBookingModal) {
        closeBookingModal();
      }
    };

    if (showAddBookingModal) {
      document.addEventListener('keydown', handleEscapeKey);

      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showAddBookingModal]);

  const handleAddToBookingSession = () => {
    // Validate required fields
    if (!selectedService || !selectedProfessional || !selectedTimeSlot) {
      setBookingError('Please complete all booking steps: Service, Professional, and Time selection.');
      return;
    }

    // Extract time slot properly
    const timeSlot = selectedTimeSlot.startTime 
      ? new Date(selectedTimeSlot.startTime).toTimeString().slice(0, 5)
      : selectedTimeSlot.time || selectedTimeSlot;

    // ENHANCED: Check for conflicts using the new smart validation
    const conflict = isProfessionalUnavailableInSession(
      selectedProfessional._id, 
      timeSlot, 
      currentDate, 
      selectedService.duration
    );

    if (conflict) {
      const professionalName = selectedProfessional.user?.firstName || selectedProfessional.name;
      const errorMessage = getUnavailabilityMessage(professionalName, conflict);
      setBookingError(errorMessage);
      return;
    }

    // Store service name for success message before clearing
    const serviceName = selectedService.name;

    // Add current appointment to session
    const appointment = {
      service: selectedService,
      professional: selectedProfessional,
      timeSlot: timeSlot,
      date: currentDate,
    };

    console.log('Adding appointment to session:', appointment);
    const newAppointment = addAppointmentToSession(appointment);
    console.log('New appointment added:', newAppointment);
    console.log('Updated session:', [...multipleAppointments, newAppointment]);
    
    // Clear the current selection to show empty "Ready to Add" section
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setAvailableProfessionals([]);
    setAvailableTimeSlots([]);
    setBookingError(null);
    
    // Show success message and auto-focus on the session summary
    setBookingSuccess(`✅ "${serviceName}" added to booking session! Total services: ${multipleAppointments.length + 1}`);
    setTimeout(() => setBookingSuccess(null), 4000);
  };

  const handleCreateBooking = async () => {
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setBookingError('Authentication required. Please log in again.');
        setBookingLoading(false);
        return;
      }

      // Check if we have appointments to book
      if (multipleAppointments.length === 0) {
        setBookingError('No appointments in session. Please add at least one service.');
        setBookingLoading(false);
        return;
      }

      let clientData;

      if (selectedExistingClient) {
        clientData = {
          firstName: selectedExistingClient.firstName,
          lastName: selectedExistingClient.lastName,
          email: selectedExistingClient.email,
          phone: selectedExistingClient.phone
        };
      } else {
        const nameString = clientInfo.name ? clientInfo.name.trim() : '';
        if (!nameString) {
          setBookingError('Client name is required.');
          setBookingLoading(false);
          return;
        }
        const [firstName, ...rest] = nameString.split(' ');
        const lastName = rest.join(' ') || '';
        clientData = {
          firstName,
          lastName,
          email: clientInfo.email.trim(),
          phone: clientInfo.phone.trim()
        };
      }

      if (!clientData.email || !clientData.phone) {
        setBookingError('Client email and phone are required.');
        setBookingLoading(false);
        return;
      }

      // Create services array from multiple appointments
      const services = multipleAppointments.map(apt => {
        const startTime = new Date(apt.date);
        const [hours, minutes] = apt.timeSlot.split(':');
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + apt.service.duration);

        return {
          service: apt.service._id,
          employee: apt.professional._id || apt.professional.id,
          duration: apt.service.duration,
          price: apt.service.price,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        };
      });

      // Calculate totals
      const totalDuration = multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0);
      const totalAmount = getTotalSessionPrice();
      const finalAmount = totalAmount; // TODO: Apply gift card discount if needed

      // Create the booking payload for multiple services
      const bookingPayload = {
        services: services,
        appointmentDate: services[0].startTime, // Use first appointment date as main date
        totalDuration: totalDuration,
        totalAmount: totalAmount,
        finalAmount: finalAmount,
        paymentMethod: paymentMethod,
        client: clientData,
        notes: bookingForm.notes || '',
        giftCardCode: giftCardCode || '',
        bookingSource: 'admin'
      };

      console.log('Multiple appointments booking payload:', JSON.stringify(bookingPayload, null, 2));

      const res = await fetch(`${Base_url}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (!responseData.success) {
        throw new Error(responseData.message || 'Booking creation failed');
      }

      const clientName = selectedExistingClient
        ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
        : clientData.firstName;

      setBookingSuccess(`✨ ${multipleAppointments.length} service(s) booked successfully for ${clientName}! Booking ID: ${responseData.data?.booking?.bookingNumber || 'N/A'}`);

      // Clear the appointments session after successful booking
      setTimeout(() => {
        clearAppointmentSession();
      }, 1500);

      // Refresh calendar data after successful booking
      setTimeout(() => {
        closeBookingModal();
        fetchCalendarData(); // Refresh the calendar
      }, 3000);

    } catch (err) {
      console.error('Booking creation error:', err);
      setBookingError(`Failed to create booking: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBookingForm = (clearSession = true) => {
    console.log('🔄 RESETTING BOOKING FORM - clearSession:', clearSession);
    setBookingStep(1);
    setSelectedExistingClient(null);
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setClientInfo({ name: '', email: '', phone: '' });
    setPaymentMethod('cash');
    setBookingSuccess(null);
    setBookingError(null);
    setAvailableServices([]);
    setAvailableProfessionals([]);
    setAvailableTimeSlots([]);
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(false);
    setIsAddingNewClient(false);
    setBookingDefaults(null);
    
    // Only clear appointments session if explicitly requested
    if (clearSession) {
      console.log('🗑️ CLEARING APPOINTMENTS SESSION');
      clearAppointmentSession();
    } else {
      console.log('💾 PRESERVING APPOINTMENTS SESSION - Current appointments:', multipleAppointments.length);
    }
    
    setBookingForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      paymentMethod: 'cash',
      notes: '',
      giftCardCode: '',
    });
  };
  const getDisplayDateRange = () => {
    let startDate, endDate;

    if (currentView === 'Day') {
      // For day view, use the exact currentDate
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    } else if (currentView === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      startDate = startOfWeek;
      endDate = new Date(startOfWeek);
      endDate.setDate(endDate.getDate() + 6);
    } else if (currentView === 'Month') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };
  const formatDateForAPI = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };


  // --- API CALL FUNCTION ---
  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the actual display date range based on current view and date
      const { startDate, endDate } = getDisplayDateRange();

      // Format dates for API using local date components (avoid UTC timezone shift)
      const startDateParam = formatDateForAPI(startDate);
      const endDateParam = formatDateForAPI(endDate);

      console.log('📅 Fetching calendar data:', {
        view: currentView,
        currentDate: currentDate.toLocaleDateString(),
        startDateParam,
        endDateParam
      });

      // For employees API, send the week start date for proper schedule context
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      const weekStartDateParam = formatDateForAPI(weekStart);

      const [employeesResponse, bookingsResponse, servicesResponse] = await Promise.all([
        api.get(`${EMPLOYEES_API_URL}?weekStartDate=${startDateParam}`),
        api.get(`${BOOKING_API_URL}/admin/all?startDate=${startDateParam}&endDate=${endDateParam}`),
        api.get(SERVICES_API_URL)
      ]);

      if (bookingsResponse.data.success && employeesResponse.data.success) {
        const allBookings = bookingsResponse.data.data.bookings || [];
        const employees = employeesResponse.data.data.employees || [];

        if (servicesResponse.data.success) {
          setAvailableServices(servicesResponse.data.data.services || []);
        }

        // Filter out inactive employees from calendar display and booking interfaces
        const activeEmployees = employees.filter(emp => emp.user?.isActive !== false);

        const transformedEmployees = activeEmployees.map(emp => ({
          id: emp._id, // Always use backend _id
          name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim(),
          position: emp.position || emp.department || 'Staff',
          avatar: emp.user?.avatar || emp.avatar,
          avatarColor: getRandomColor(),
          unavailablePeriods: emp.unavailablePeriods || [],
          isActive: emp.user?.isActive !== false,
          workSchedule: emp.workSchedule || {}
        }));

        const transformedAppointments = {};

        allBookings.forEach(booking => {
          booking.services?.forEach(service => {
            const employeeId = service.employee?._id || service.employee;
            if (!employeeId) return;
            if (!transformedAppointments[employeeId]) transformedAppointments[employeeId] = {};

            // Prefer service.startTime ISO when available, fallback to booking.appointmentDate
            const startISO = service.startTime ? String(service.startTime) : (booking.appointmentDate ? String(booking.appointmentDate) : null);

            // Compute end ISO either from provided endTime or from duration
            let endISO = null;
            if (service.endTime) {
              endISO = String(service.endTime);
            } else if (startISO && service.duration) {
              const sDt = new Date(startISO);
              endISO = new Date(sDt.getTime() + (service.duration * 60000)).toISOString();
            }

            // Build local YYYY-MM-DD using local timezone (avoid UTC iso string)
            const startDateTime = startISO ? new Date(startISO) : new Date();
            const localYear = startDateTime.getFullYear();
            const localMonth = String(startDateTime.getMonth() + 1).padStart(2, '0');
            const localDay = String(startDateTime.getDate()).padStart(2, '0');
            const appointmentLocalDate = `${localYear}-${localMonth}-${localDay}`;

            // Local HH:MM labels for display
            const timeSlot = startISO ? startDateTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            }) : (service.startTime || '');

            const endTimeLabel = endISO ? new Date(endISO).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null;

            const slotKey = `${appointmentLocalDate}_${timeSlot}`;

            transformedAppointments[employeeId][slotKey] = {
              client: `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''}`.trim(),
              service: service.service?.name || service.name || 'Service',
              duration: service.duration || 30,
              color: getRandomAppointmentColor(),
              date: appointmentLocalDate,
              bookingId: booking._id,
              status: booking.status || 'confirmed',
              isMainSlot: true,
              // keep both ISO and local labels — ISO used for layout calculations
              startISO: startISO,
              endISO: endISO,
              startTime: timeSlot,   // local HH:MM for display
              endTime: endTimeLabel  // local HH:MM for display
            };
          });
        });

        console.log('✅ Calendar data fetched successfully:', {
          employees: transformedEmployees.length,
          appointments: Object.keys(transformedAppointments).length,
          dateRange: `${startDateParam} to ${endDateParam}`
        });

        setEmployees(transformedEmployees);
        setTimeSlots(generateTimeSlots('00:00', '23:30', 30));
        setAppointments(transformedAppointments);
        setExistingClients(MOCK_CLIENTS_DATA); // Use mock clients as fallback
      } else {
        throw new Error('Failed to fetch calendar data');
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError(`Failed to load calendar data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, currentView]);

  // Initialize booking modal when opened
  useEffect(() => {
    if (showAddBookingModal) {
      // Both Add button and time slot clicks now start from service selection
      setBookingStep(1); // Always start with service selection
      fetchBookingServices();
      fetchExistingClients();
    }
  }, [showAddBookingModal, fetchBookingServices, fetchExistingClients]);

  // Auto-selection effects for booking modal (when defaults are available)
  useEffect(() => {
    if (bookingStep === 2 && bookingDefaults?.staffId && availableProfessionals.length > 0) {
      const defaultProf = availableProfessionals.find(p => p._id === bookingDefaults.staffId);
      if (defaultProf) {
        setSelectedProfessional(defaultProf);
        setBookingStep(3);
        fetchBookingTimeSlots(defaultProf._id, selectedService._id, currentDate);
      }
    }
  }, [bookingStep, bookingDefaults, availableProfessionals, selectedService, currentDate, fetchBookingTimeSlots]);

  useEffect(() => {
    if (bookingStep === 3 && bookingDefaults?.time && availableTimeSlots.length > 0) {
      const [hour, minute] = bookingDefaults.time.split(':').map(Number);
      const defaultSlot = availableTimeSlots.find(slot => {
        const d = new Date(slot.startTime);
        return slot.available && d.getHours() === hour && d.getMinutes() === minute;
      });
      if (defaultSlot) {
        setSelectedTimeSlot(defaultSlot);
        setBookingStep(4);
        setBookingDefaults(null); // Clear defaults after use
      }
    }
  }, [bookingStep, bookingDefaults, availableTimeSlots]);

  // --- CURRENT TIME LINE LOGIC ---
  const [currentTimeLineTop, setCurrentTimeLineTop] = useState(0);
  const [currentTimeText, setCurrentTimeText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const updateCurrentTimeLine = () => {
    const now = new Date();
    setCurrentTime(now);

    if (now.toDateString() !== currentDate.toDateString() || currentView !== 'Day') {
      setCurrentTimeLineTop(-100);
      return;
    }

    const timeSlotHeightPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--time-slot-height')) || 20;
    const firstSlotTimeMinutes = (parseFloat(timeSlots[0]?.split(':')[0]) * 60) + parseFloat(timeSlots[0]?.split(':')[1]);
    const currentTimeMinutes = (now.getHours() * 60) + now.getMinutes();
    const minutesIntoSchedule = currentTimeMinutes - firstSlotTimeMinutes; 

    if (minutesIntoSchedule < 0) {
      setCurrentTimeLineTop(-100);
      return;
    }

    const minutesPerSlot = 30; // Updated to 30-minute intervals
    const topPosition = ((minutesIntoSchedule / minutesPerSlot) * timeSlotHeightPx)+75;
 
    setCurrentTimeLineTop(topPosition);
    setCurrentTimeText(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
  };

  useEffect(() => {
    updateCurrentTimeLine();
    const interval = setInterval(updateCurrentTimeLine, 60 * 1000);
    return () => clearInterval(interval);
  }, [timeSlots, currentDate, currentView]);

  useEffect(() => {
    const headerTimeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(headerTimeTimer);
  }, []);

  const displayEmployees = getFilteredEmployees();

  const getCalendarDays = () => {
    if (currentView === 'Day') {
      return [currentDate];
    } else if (currentView === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
      });
    } else if (currentView === 'Month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const numDays = endOfMonth.getDate();
      return Array.from({ length: numDays }, (_, i) => {
        const day = new Date(startOfMonth);
        day.setDate(startOfMonth.getDate() + i);
        return day;
      });
    }
    return [currentDate];
  };

  const calendarDays = getCalendarDays();

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayIndex = startOfMonth.getDay();
    const emptyCellsBefore = Array.from({ length: (firstDayIndex === 0 ? 6 : firstDayIndex - 1) });

    return (
      <div className="month-view-container">
        <div className="month-day-names">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="month-day-name">{day}</div>)}
        </div>
        <div className="month-view-grid">
          {emptyCellsBefore.map((_, index) => <div key={`empty-${index}`} className="month-day-cell empty"></div>)}
          {calendarDays.map(day => {
            const dayKey = localDateKey(day);
            const dayAppointments = [];

            // Get appointments for this day from all employees
            displayEmployees.forEach(emp => {
              if (appointments[emp.id]) {
                Object.entries(appointments[emp.id]).forEach(([slotKey, appointment]) => {
                  // Check if the appointment is for this day
                  if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
                    // Extract time from slot key (format: YYYY-MM-DD_HH:MM)
                    const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
                    dayAppointments.push({
                      ...appointment,
                      employeeName: emp.name,
                      employeeAvatar: emp.avatar,
                      employeeId: emp.id,
                      time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD'
                    });
                  }
                });
              }
            });

            return (
              <div key={dayKey} className="month-day-cell">
                <div className="month-day-header">
                  <span className="month-day-date">{day.getDate()}</span>
                </div>
                <div className="month-appointments">
                  {dayAppointments.length > 0 ? (
                    <>
                      {dayAppointments.slice(0, 3).map((app, index) => (
                        <div key={index}
                          className="month-appointment-entry"
                          style={{ backgroundColor: app.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (app.bookingId) {
                              // Show booking status for existing appointment
                              const appointmentDetails = {
                                ...app,
                                employeeId: app.employeeId,
                                employeeName: app.employeeName,
                                slotTime: app.time,
                                date: dayKey,
                                slotKey: `${dayKey}_${app.time}`
                              };
                              setSelectedBookingForStatus(appointmentDetails);
                              setShowBookingStatusModal(true);
                            }
                          }}
                          onMouseEnter={(e) => showBookingTooltipHandler(e, {
                            client: app.client,
                            service: app.service,
                            time: app.time,
                            professional: app.employeeName,
                            status: app.status || 'Confirmed',
                            notes: app.notes
                          })}
                          onMouseLeave={hideBookingTooltip}>
                          <span className="appointment-client-name">{app.client}</span>
                          <span className="appointment-service-name">{app.service}</span>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div
                          className="month-more-appointments"
                          onClick={(event) => handleShowMoreAppointments(dayAppointments, day, event)}
                        >
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarContent = () => {
    if (loading) {
      return (
        <div className="content-loading-overlay">
          <div className="loading-message">
<Loading/>          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="content-error-message-overlay">
         <Error500Page/>
        </div>
      );
    }
    if (employees.length === 0 && Object.keys(appointments).length === 0) {
      return (
        <div className="content-empty-state">
          <div className="empty-state-content">
<NoDataState/>         
 </div>
        </div>
      );
    }

    if (currentView === 'Month') {
      return renderMonthView();
    }

    return (
      <div className="calendar-grid-container">
        {currentView === 'Day' && (
          <div className="time-column">
            <div className="time-header">Time</div>
            <div className="time-slots">
              {timeSlots.map(slot => (
                <div key={slot} className={`time-slot-label ${slot.endsWith(':00') ? 'hour-start' : 'half-hour'}`}>
                  <span className="time-text">{formatTime(slot)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

     <div className={`staff-grid cols-${Math.min(displayEmployees.length || 1, 6)}`}
          // make columns equal share of available width; each column min 220px, otherwise scroll
        >
          {currentView === 'Day' && displayEmployees.map(employee => (
            <StaffColumn
              key={employee.id}
              employee={employee}
              timeSlots={timeSlots}
              appointments={appointments}
              currentDate={currentDate}
              isTimeSlotUnavailable={isTimeSlotUnavailable}
              handleTimeSlotClick={handleTimeSlotClick}
              showBookingTooltipHandler={showBookingTooltipHandler}
              hideBookingTooltip={hideBookingTooltip}
              showTimeHoverHandler={showTimeHoverHandler}
              hideTimeHover={hideTimeHover}
              setSelectedBookingForStatus={setSelectedBookingForStatus}
              setShowBookingStatusModal={setShowBookingStatusModal}
            />
          ))}
          {currentView === 'Week' && (
            <div className="week-view-container">
              {/* Week Day Headers */}
              <div className="week-headers-row">
                <div className="week-staff-header-cell">Staff</div>
                {calendarDays.map(day => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={day.toISOString()} className={`week-day-header-cell ${isToday ? 'is-today' : ''}`}>
                      <div className="week-day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="week-day-number">{day.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Employee Rows with Daily Appointments */}
              {displayEmployees.map(employee => (
                <div key={employee.id} className="week-employee-row">
                  <div className="week-staff-cell">
                    <div className="staff-avatar" style={{ backgroundColor: employee.avatarColor }}>
                      {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.charAt(0)}
                    </div>
                    <div className="staff-info">
                      <div className="staff-name">{employee.name}</div>
                      <div className="staff-position">{employee.position}</div>
                    </div>
                  </div>

                  {/* Daily appointment cells for this employee */}
                  {calendarDays.map(day => {
                    const dayKey = day.toISOString().split('T')[0];
                    const hasShift = hasShiftOnDate(employee, day);

                    // Get appointments for this employee on this day
                    const dayAppointments = [];
                    if (appointments[employee.id]) {
                      Object.entries(appointments[employee.id]).forEach(([slotKey, appointment]) => {
                        if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
                          const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
                          dayAppointments.push({
                            ...appointment,
                            time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD',
                            slotKey,
                            timeSlot: timeFromKey,

                          });
                        }
                      });
                    }

                    return (
                      <div key={`${employee.id}-${dayKey}`} className={`week-day-cell ${!hasShift ? 'no-shift' : ''}`}>
                        {!hasShift ? (
                          <div className="week-no-shift">
                            <span className="no-shift-text">No shift today</span>
                          </div>
                        ) : dayAppointments.length > 0 ? (
                          <div className="week-appointments-container">
                            {dayAppointments.slice(0, 3).map((app, index) => (
                              <div
                                key={index}
                                className="week-appointment-block"
                                style={{ backgroundColor: app.color }}
                                onClick={() => {
                                  if (app.timeSlot && app.bookingId) {
                                    // Show booking status for existing appointment
                                    const appointmentDetails = {
                                      ...app,
                                      employeeId: employee.id,
                                      employeeName: employee.name,
                                      slotTime: app.timeSlot,
                                      date: dayKey,
                                      slotKey: app.slotKey
                                    };
                                    setSelectedBookingForStatus(appointmentDetails);
                                    setShowBookingStatusModal(true);
                                  } else if (app.timeSlot) {
                                    // Fallback to regular time slot click
                                    handleTimeSlotClick(employee.id, app.timeSlot, day);
                                  }
                                }}
                                onMouseEnter={(e) => showBookingTooltipHandler(e, {
                                  client: app.client,
                                  service: app.service,
                                  time: app.time,
                                  professional: employee.name,
                                  status: app.status || 'Confirmed',
                                  notes: app.notes
                                })}
                                onMouseLeave={hideBookingTooltip}
                              >
                                <div className="appointment-client">{app.client}</div>
                                <div className="appointment-service">{app.service}</div>
                              </div>
                            ))}
                            {dayAppointments.length > 3 && (
                              <div
                                className="week-more-appointments"
                                onClick={(event) => handleShowMoreAppointments(dayAppointments, day, event)}
                              >
                                +{dayAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="week-empty-cell"
                          // onClick={hasShift ? () => {
                          //   const defaultTime = "09:00";
                          //   handleTimeSlotClick(employee.id, defaultTime, day);
                          // } : undefined}
                          // style={{ cursor: hasShift ? 'pointer' : 'not-allowed' }}
                          >
                            {/* <span className="add-appointment-plus">{hasShift ? '+' : ''}</span> */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="scheduler-root">
      {/* REDESIGNED Application-level Header */}
      <div className="scheduler-header-redesigned">
        {/* Left Side Controls */}
        <div className="header-left-controls">
          {/* Today Button */}
          <button
            className="header-btn today-btn"
            onClick={goToToday}
          >
            Today
          </button>

          {/* Date Navigation */}
          <div className="date-navigation">
  <button className="nav-arrow-btn" onClick={goToPrevious}>
    <ChevronLeft size={16} />
  </button>
<button 
  className="date-display-button"
  onClick={() => {
    setDatePickerCurrentMonth(currentDate);
    setDatePickerSelectedDate(currentDate);
    
    // Set picker view based on current calendar view
    if (currentView === 'Week') {
      setDatePickerView('week');
      setWeekRanges(generateWeekRangesForMonth(currentDate));
      setSelectedWeekRange(getCurrentWeekRange(currentDate));
    } else if (currentView === 'Month') {
      setDatePickerView('month');
    } else {
      setDatePickerView('date');
    }
    
    setShowDatePicker(!showDatePicker);
  }}
>
    <span className="date-display-text">
      {currentView === 'Day' && currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
      {currentView === 'Week' && calendarDays.length > 0 && 
        `${calendarDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${calendarDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }
      {currentView === 'Month' && currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })}
    </span>
    <CalendarIcon size={14} className="date-picker-icon" />
  </button>
  <button className="nav-arrow-btn" onClick={goToNext}>
    <ChevronRight size={16} />
  </button>
  


{/* Date Picker Popup */}
{showDatePicker && (
  <>
    <div className="date-picker-backdrop" onClick={() => setShowDatePicker(false)} />
    <div className="date-picker-container">
      
      {/* DATE VIEW (Day View) */}
      {datePickerView === 'date' && (
        <>
          <div className="date-picker-header">
            <button 
              className="date-picker-nav-btn"
              onClick={goToDatePickerPreviousMonth}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-picker-month-year">
              {datePickerCurrentMonth.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </div>
            <button 
              className="date-picker-nav-btn"
              onClick={goToDatePickerNextMonth}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="date-picker-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="date-picker-weekday">
                {day}
              </div>
            ))}
          </div>
          
          <div className="date-picker-days">
            {getDatePickerCalendarDays(datePickerCurrentMonth).map((dayObj, index) => {
              const isToday = dayObj.date.toDateString() === new Date().toDateString();
              const isSelected = dayObj.date.toDateString() === datePickerSelectedDate.toDateString();
              const isCurrentView = dayObj.date.toDateString() === currentDate.toDateString();
              
              return (
                <button
                  key={index}
                  className={`date-picker-day ${
                    !dayObj.isCurrentMonth ? 'other-month' : ''
                  } ${isToday ? 'today' : ''} ${
                    isSelected ? 'selected' : ''
                  } ${isCurrentView ? 'current-view' : ''}`}
                  onClick={() => handleDatePickerDateSelect(dayObj.date)}
                >
                  {dayObj.date.getDate()}
                </button>
              );
            })}
          </div>
          
          <div className="date-picker-footer">
            <button 
              className="date-picker-today-btn"
              onClick={goToDatePickerToday}
            >
              Today
            </button>
            <button 
              className="date-picker-close-btn"
              onClick={() => setShowDatePicker(false)}
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* WEEK VIEW (Week View) */}
      {datePickerView === 'week' && (
        <>
          <div className="date-picker-header">
            <button 
              className="date-picker-nav-btn"
              onClick={() => {
                const prevMonth = new Date(datePickerCurrentMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setDatePickerCurrentMonth(prevMonth);
                setWeekRanges(generateWeekRangesForMonth(prevMonth));
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-picker-month-year">
              Week Ranges - {datePickerCurrentMonth.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </div>
            <button 
              className="date-picker-nav-btn"
              onClick={() => {
                const nextMonth = new Date(datePickerCurrentMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setDatePickerCurrentMonth(nextMonth);
                setWeekRanges(generateWeekRangesForMonth(nextMonth));
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="week-ranges-container">
            {weekRanges.map((weekRange, index) => {
              const isCurrentWeek = selectedWeekRange && 
                weekRange.startDate.toDateString() === selectedWeekRange.startDate.toDateString();
              
              return (
                <button
                  key={index}
                  className={`week-range-item ${isCurrentWeek ? 'selected' : ''}`}
                  onClick={() => handleWeekRangeSelect(weekRange)}
                >
                  <div className="week-range-label">{weekRange.label}</div>
                  <div className="week-range-dates">{weekRange.dateRange}</div>
                </button>
              );
            })}
          </div>
          
          <div className="date-picker-footer">
            <button 
              className="date-picker-today-btn"
              onClick={() => {
                const thisWeek = getCurrentWeekRange(new Date());
                handleWeekRangeSelect(thisWeek);
              }}
            >
              This Week
            </button>
            <button 
              className="date-picker-close-btn"
              onClick={() => setShowDatePicker(false)}
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* MONTH VIEW (Month View) */}
      {datePickerView === 'month' && (
        <>
          <div className="date-picker-header">
            <button 
              className="date-picker-nav-btn"
              onClick={goToDatePickerPreviousYear}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-picker-month-year">
              {datePickerCurrentMonth.getFullYear()}
            </div>
            <button 
              className="date-picker-nav-btn"
              onClick={goToDatePickerNextYear}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="month-grid-container">
            {[
              'January', 'February', 'March', 'April', 
              'May', 'June', 'July', 'August', 
              'September', 'October', 'November', 'December'
            ].map((monthName, monthIndex) => {
              const isCurrentMonth = currentDate.getMonth() === monthIndex && 
                                   currentDate.getFullYear() === datePickerCurrentMonth.getFullYear();
              const isToday = new Date().getMonth() === monthIndex && 
                             new Date().getFullYear() === datePickerCurrentMonth.getFullYear();
              
              return (
                <button
                  key={monthIndex}
                  className={`month-picker-item ${isCurrentMonth ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleMonthSelect(monthIndex, datePickerCurrentMonth.getFullYear())}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
          
          <div className="date-picker-footer">
            <button 
              className="date-picker-today-btn"
              onClick={() => {
                const today = new Date();
                handleMonthSelect(today.getMonth(), today.getFullYear());
              }}
            >
              This Month
            </button>
            <button 
              className="date-picker-close-btn"
              onClick={() => setShowDatePicker(false)}
            >
              Close
            </button>
          </div>
        </>
      )}
      
    </div>
  </>
)}
</div>

          {/* Team Icon with Popup */}
          <div className="team-control-container">
            <button
              className="header-btn team-icon-btn"
              onClick={() => setShowTeamPopup(!showTeamPopup)}
            >
              <Users size={16} />
            </button>

            {showTeamPopup && (
  <>
    <div className="popup-backdrop" onClick={() => setShowTeamPopup(false)} />
    <div className="team-popup-enhanced">
      {/* Close button */}
      <button
        type="button"
        className="team-popup-close-btn"
        aria-label="Close team selector"
        title="Close"
        onClick={() => setShowTeamPopup(false)}
      >
        ×
      </button>
      {/* Header with filters */}
      <div className="team-popup-header-enhanced">
        <div className="team-filters">
          <button 
            className={`team-filter-pill ${teamFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleTeamFilterChange('all')}
          >
            {/* <span className="filter-icon">👥</span> */}
            All Team
            <span className="filter-count">{employees.length}</span>
          </button>
          <button 
            className={`team-filter-pill ${teamFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => handleTeamFilterChange('scheduled')}
          >
            {/* <span className="filter-icon">📅</span> */}
            Scheduled Today
            <span className="filter-count">
              {employees.filter(emp => hasShiftOnDate(emp, currentDate)).length}
            </span>
          </button>
        </div>
        <div className="team-actions">
          <button 
            className="select-all-btn"
            onClick={() => setSelectedEmployees(new Set(employees.map(emp => emp.id)))}
          >
            Select All
          </button>
          <button 
            className="clear-all-btn"
            onClick={handleClearSelection}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="team-search-container">
        <div className="search-input-wrapper">
          {/* <span className="search-icon">🔍</span> */}
          <input
            type="text"
            placeholder="Search team members..."
            className="team-search-input"
            value={teamSearchQuery || ''}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
          />
          {teamSearchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setTeamSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Team members list */}
      <div className="team-members-container">
        <div className="team-members-header">
          <h4 className="members-title">
            Team Members
            <span className="selected-count">
              {selectedEmployees.size} selected
            </span>
          </h4>
          <div className="view-toggle">
            <button 
              className={`view-btn ${teamViewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setTeamViewMode('grid')}
            >
              ⚏
            </button>
            <button 
              className={`view-btn ${teamViewMode === 'list' ? 'active' : ''}`}
              onClick={() => setTeamViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>

        <div className={`team-members-list ${teamViewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
          {getFilteredAndSearchedEmployees().map(employee => {
            const isSelected = selectedEmployees.has(employee.id);
            const hasShift = hasShiftOnDate(employee, currentDate);
            
            return (
              <div 
                key={employee.id} 
                className={`team-member-card ${isSelected ? 'selected' : ''} ${!hasShift ? 'no-shift' : ''}`}
                onClick={() => handleEmployeeToggle(employee.id)}
              >
                <div className="member-avatar-section">
                  <div 
                    className="member-avatar" 
                    style={{ backgroundColor: employee.avatarColor }}
                  >
                    {employee.avatar ? 
                      <img src={employee.avatar} alt={employee.name} className="avatar-image" /> :
                      employee.name.charAt(0)
                    }
                    {!hasShift && <div className="no-shift-indicator">!</div>}
                  </div>
                  <div className="selection-indicator">
                    <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                  </div>
                </div>

                <div className="member-info-section">
                  <div className="member-primary-info">
                    <h5 className="member-name">{employee.name}</h5>
                    <span className="member-role">{employee.position}</span>
                  </div>
                  
                  <div className="member-status-info">
                    {hasShift ? (
                      <div className="shift-status available">
                        <span className="status-dot"></span>
                        <span className="status-text">Available Today</span>
                      </div>
                    ) : (
                      <div className="shift-status unavailable">
                        <span className="status-dot"></span>
                        <span className="status-text">No Shift</span>
                      </div>
                    )}
                    
                    <div className="member-stats">
                      <span className="stat-item">
                        <span className="stat-value">{getEmployeeAppointmentCount(employee.id)}</span>
                        <span className="stat-label">appointments</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="member-actions">
                  <button className="quick-action-btn" title="View Schedule">
                    📅
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {getFilteredAndSearchedEmployees().length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4>No team members found</h4>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Footer with summary */}
      <div className="team-popup-footer-enhanced">
        <div className="selection-summary">
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-number">{selectedEmployees.size}</span>
              <span className="summary-label">Selected</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <span className="summary-number">
                {employees.filter(emp => hasShiftOnDate(emp, currentDate) && selectedEmployees.has(emp.id)).length}
              </span>
              <span className="summary-label">Working Today</span>
            </div>
          </div>
        </div>
        
        <div className="footer-actions">
          <button 
            className="apply-selection-btn"
            onClick={() => setShowTeamPopup(false)}
          >
            Apply Selection
          </button>
        </div>
      </div>
    </div>
  </>
)}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="header-right-controls">
          {/* Calendar Icon with Popup */}
          <div className="calendar-control-container">
            <button
              className="header-btn calendar-icon-btn"
              onClick={() => setShowCalendarPopup(!showCalendarPopup)}
            >
              <Calendar size={16} />
            </button>

            {showCalendarPopup && (
              <>
                <div className="popup-backdrop" onClick={() => setShowCalendarPopup(false)} />
                <div className="calendar-popup">
                  <div className="calendar-popup-tabs">
                    <button
                      className={`popup-tab ${calendarPopupTab === 'confirmed' ? 'active' : ''}`}
                      onClick={() => setCalendarPopupTab('confirmed')}
                    >
                      Confirmed
                    </button>
                    <button
                      className={`popup-tab ${calendarPopupTab === 'started' ? 'active' : ''}`}
                      onClick={() => setCalendarPopupTab('started')}
                    >
                      Started
                    </button>
                    <button
                      className={`popup-tab ${calendarPopupTab === 'completed' ? 'active' : ''}`}
                      onClick={() => setCalendarPopupTab('completed')}
                    >
                      Completed
                    </button>
                  </div>

                  <div className="calendar-popup-content">
                    {getAppointmentsForDateRange().length > 0 ? (
                      getAppointmentsForDateRange().map((appointment, index) => (
                        <div key={index} className="appointment-popup-item">
                          <div
                            className="appointment-color-dot"
                            style={{ backgroundColor: appointment.color }}
                          />
                          <div className="appointment-popup-details">
                            <div className="appointment-popup-client">{appointment.client}</div>
                            <div className="appointment-popup-service">{appointment.service}</div>
                            <div className="appointment-popup-meta">
                              {appointment.employeeName} • {appointment.timeSlot}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-appointments-message">
                        No {calendarPopupTab} appointments for this period
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* View Controls with Refresh */}
          <div className="view-controls">
            <button
              className="refresh-btn"
              onClick={handleRefreshToNow}
              title="Refresh to current time"
            >
              <RotateCcw size={14} />
            </button>
            <select
              value={currentView}
              onChange={(e) => setCurrentView(e.target.value)}
              className="view-selector"
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            className="add-appointment-btn"
            onClick={handleAddAppointment}
          >
            <h1>Add Appointment</h1>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Calendar Content */}
      <div className="scheduler-content" ref={schedulerContentRef}>
        {renderCalendarContent()}
        <div className="current-time-line" style={{ top: `${currentTimeLineTop}px` }}>
          <span className="current-time-marker">{currentTimeText}</span>
        </div>
      </div>

      {/* Modals */}
      {showUnavailablePopup && (
        <div className="service-selection-overlay" onClick={closeBookingModal}>
          <div className="service-selection-popup" onClick={e => e.stopPropagation()}>
            <div className="service-popup-header">
              <h3>Time Slot Unavailable</h3>
              <p>{unavailableMessage}</p>
            </div>
            <button className="action-btn" onClick={closeBookingModal}>Got It</button>
          </div>
        </div>
      )}

      {/* Booking Status Modal */}
      {showBookingStatusModal && selectedBookingForStatus && (
        <div className="modern-booking-modal">
          <div className="booking-modal-overlay booking-modal-fade-in">
            <div className="booking-modal booking-modal-animate-in">
              <button className="booking-modal-close" onClick={closeBookingStatusModal}>×</button>
              <h2>Booking Management</h2>

              {bookingStatusError && (
                <div className="booking-modal-error">
                  <div className="error-icon">⚠️</div>
                  <div className="error-content">
                    <strong>Error</strong>
                    <p>{bookingStatusError}</p>
                  </div>
                </div>
              )}

              {bookingStatusLoading && (
                <div className="booking-modal-loading">
                  <div className="loading-spinner"></div>
                  <div className="loading-content">
                    <strong>Processing</strong>
                    <p>Updating booking status...</p>
                  </div>
                </div>
              )}

              <div className="booking-status-details">
                <div className="booking-status-header">
                  <div className="booking-status-avatar" >
                    {/* {selectedBookingForStatus.client} */}
                  </div>
                  <div className="booking-status-info">
                    <h3>{selectedBookingForStatus.client}</h3>
                    <p>{selectedBookingForStatus.service}</p>
                  </div>
                  <div className={`booking-status-badge status-${selectedBookingForStatus.status?.toLowerCase() || 'booked'}`}>
                    {(selectedBookingForStatus.status || 'Booked').charAt(0).toUpperCase() + (selectedBookingForStatus.status || 'Booked').slice(1)}
                  </div>
                </div>

                <div className="booking-status-grid">
                  <div className="status-detail">
                    <div className="detail-icon">👨‍⚕️</div>
                    <div className="detail-content">
                      <span className="detail-label">Professional</span>
                      <span className="detail-value">{selectedBookingForStatus.employeeName}</span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">📅</div>
                    <div className="detail-content">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">
                        {new Date(selectedBookingForStatus.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">🕒</div>
                    <div className="detail-content">
                      <span className="detail-label">{selectedBookingForStatus.slotTime}</span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">⏱️</div>
                    <div className="detail-content">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{selectedBookingForStatus.duration} minutes</span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">🆔</div>
                    <div className="detail-content">
                      <span className="detail-label">Booking ID</span>
                      <span className="detail-value">{selectedBookingForStatus.bookingId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="booking-status-actions">
                  <div className="status-actions-header">
                    <label htmlFor="booking-status-select" className="status-select-label">Update Status</label>
                    <div className="status-select-wrapper">
                      <select
                        id="booking-status-select"
                        className="status-select"
                        disabled={bookingStatusLoading}
                        value={(selectedBookingForStatus.status || 'booked').toLowerCase()}
                        onChange={(e) => handleBookingStatusUpdate(e.target.value)}
                      >
                        <option value="booked">Booked</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="arrived">Arrived</option>
                        <option value="started">Started</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-danger-zone">
                    <div className="danger-zone-header">
                      <h5>Danger Zone</h5>
                      <p>This action cannot be undone</p>
                    </div>
                    <button
                      className="delete-booking-btn"
                      onClick={handleDeleteBooking}
                      disabled={bookingStatusLoading}
                    >
                      <span className="btn-icon">🗑️</span>
                      <span className="btn-text">Delete Booking</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={closeBookingStatusModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddBookingModal && (
        <div className="modern-booking-modal">
          <div className="booking-modal-overlay booking-modal-fade-in" onClick={closeBookingModal}>
            <div className={`booking-modal booking-modal-animate-in ${bookingStep === 6 ? 'final-step' : ''}`} onClick={e => e.stopPropagation()}>
              <button className="booking-modal-close" onClick={closeBookingModal}>×</button>
              <h2>New Appointment</h2>

              {/* Step Indicator */}
              <div className="step-indicator">
                <div className={`step-dot ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}></div>
                <div className={`step-connector ${bookingStep > 1 ? 'active' : ''}`}></div>
                <div className={`step-dot ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}></div>
                <div className={`step-connector ${bookingStep > 2 ? 'active' : ''}`}></div>
                <div className={`step-dot ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}></div>
                <div className={`step-connector ${bookingStep > 3 ? 'active' : ''}`}></div>
                <div className={`step-dot ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'completed' : ''}`}></div>
                <div className={`step-connector ${bookingStep > 4 ? 'active' : ''}`}></div>
                <div className={`step-dot ${bookingStep >= 5 ? 'active' : ''} ${bookingStep > 5 ? 'completed' : ''}`}></div>
                <div className={`step-connector ${bookingStep > 5 ? 'active' : ''}`}></div>
                <div className={`step-dot ${bookingStep >= 6 ? 'active' : ''}`}></div>
              </div>

              {bookingError && <div className="booking-modal-error">{bookingError}</div>}
              {bookingLoading && <div className="booking-modal-loading">Creating your perfect appointment...</div>}
              {bookingSuccess && <div className="booking-modal-success">{bookingSuccess}</div>}

              {/* Service Selection Step */}
              {bookingStep === 1 && (
                <>
                  {console.log('🎯 RENDERING STEP 1 - Service Selection')}
                  {console.log('isAddingAdditionalService:', isAddingAdditionalService)}
                  {console.log('availableServices count:', availableServices.length)}
                  {console.log('currentAppointmentIndex:', currentAppointmentIndex)}
                  <h3>Select Your Service {isAddingAdditionalService ? `(Adding Service #${currentAppointmentIndex + 1})` : ''}</h3>
                  <div className="booking-modal-list">
                    {availableServices.map(service => (
                      <button
                        key={service._id}
                        className={`booking-modal-list-item${selectedService && selectedService._id === service._id ? ' selected' : ''}`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="booking-modal-item-name">{service.name}</div>
                        <div className="booking-modal-list-desc">{service.duration} minutes • AED {service.price}</div>
                      </button>
                    ))}
                  </div>
                  {/* <div className="booking-modal-actions">
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
                  </div> */}
                </>
              )}

              {/* Professional Selection Step */}
              {bookingStep === 2 && (
                <>
                  <h3>👨‍⚕️ Choose Your Professional</h3>
                  {availableProfessionals.length === 0 ? (
                    <div className="booking-modal-empty-state">
                      <p>No professionals are available for this service on {currentDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}.</p>
                      <p>Please select a different date or service.</p>
                    </div>
                  ) : (
                    <div className="booking-modal-list">
                      {availableProfessionals.map(prof => {
                        // FIXED: Create proper employee object for shift checking
                        const employeeForShiftCheck = {
                          workSchedule: prof.workSchedule || {}
                        };
                        const hasShift = hasShiftOnDate(employeeForShiftCheck, currentDate);
                        const dayName = getDayName(currentDate);
                        const todaySchedule = prof.workSchedule?.[dayName];

                        // Check if this professional has conflicts in current session
                        const sessionConflicts = multipleAppointments.filter(apt => 
                          apt.professional._id === prof._id && 
                          formatDateLocal(new Date(apt.date)) === formatDateLocal(currentDate)
                        );

                        // FIXED: Better shift info display
                        let shiftInfo = 'Available';
                        if (todaySchedule) {
                          if (todaySchedule.shifts && typeof todaySchedule.shifts === 'string') {
                            shiftInfo = todaySchedule.shifts;
                          } else if (todaySchedule.startTime && todaySchedule.endTime) {
                            shiftInfo = `${todaySchedule.startTime} - ${todaySchedule.endTime}`;
                          } else if (Array.isArray(todaySchedule.shiftsData) && todaySchedule.shiftsData.length > 0) {
                            const firstShift = todaySchedule.shiftsData[0];
                            shiftInfo = `${firstShift.startTime} - ${firstShift.endTime}`;
                            if (todaySchedule.shiftsData.length > 1) {
                              shiftInfo += ' +more';
                            }
                          }
                        }

                        return (
                          <button
                            key={prof._id}
                            className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}${sessionConflicts.length > 0 ? ' has-conflicts' : ''}`}
                            onClick={() => {
                              setSelectedProfessional(prof); // Correctly sets the professional from the map
                              setBookingStep(3);
                              const service = selectedService;
                              const slots = getValidTimeSlotsForProfessional(prof, currentDate, service.duration, appointments);
                              setAvailableTimeSlots(slots);
                            }}
                          >
                            <div className="booking-modal-item-name">
                              {prof.name}
                              {sessionConflicts.length > 0 ? (
                                <span className="professional-conflict-indicator">
                                  ⚠️ {sessionConflicts.length} booking(s) in session
                                </span>
                              ) : (
                                <span className="professional-shift-indicator">
                                  ✓ Available
                                </span>
                              )}
                            </div>
                            <div className="booking-modal-list-desc">
                              {prof.position} • Shift: {shiftInfo}
                              {sessionConflicts.length > 0 && (
                                <div className="conflict-details">
                                  Current bookings: {sessionConflicts.map(apt => `${apt.service.name} at ${apt.timeSlot}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => setBookingStep(1)}>← Back</button>
                    {/* <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button> */}
                  </div>
                </>
              )}

              {/* Time Selection Step */}
              {bookingStep === 3 && (
                <>
                  <h3>🕐 Pick Your Perfect Time</h3>
                  <div className="booking-modal-list">
                    {availableTimeSlots.filter(slot => slot.available).map(slot => (
                      <button key={slot.startTime} className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} onClick={() => { 
                        console.log('🕐 TIME SLOT SELECTED:', slot);
                        setSelectedTimeSlot(slot); 
                        setBookingStep(4); 
                        console.log('📋 MOVING TO STEP 4 - SERVICES HUB');
                      }}>
                        <div className="booking-modal-item-name">
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div className="booking-modal-list-desc">
                          {selectedService?.duration} minutes with {selectedProfessional?.name}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => setBookingStep(2)}>← Back</button>
                  </div>
                </>
              )}

              {/* Multiple Services Management Step */}
              {bookingStep === 4 && (
                <>
                  {console.log('🎯 RENDERING STEP 4 - Current multipleAppointments:', multipleAppointments)}
                  <h3>📋 Service Selection Summary</h3>
                  
                  {/* Current Service to Add - only show if selections are made */}
                  {selectedService && selectedProfessional && selectedTimeSlot ? (
                    <div className="current-service-summary">
                      <h4>🎯 Ready to Add:</h4>
                      <div className="service-card-to-add">
                        <div className="service-main-info">
                          <div className="service-name">{selectedService?.name}</div>
                          <div className="service-details">
                            <span className="professional-name">
                              👨‍⚕️ {selectedProfessional?.user?.firstName || selectedProfessional?.name}
                            </span>
                            <span className="time-slot">
                              🕐 {selectedTimeSlot ? new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                            </span>
                            <span className="duration">⏱️ {selectedService?.duration}min</span>
                            <span className="price">💰 AED {selectedService?.price}</span>
                          </div>
                        </div>
                        <button 
                          className="add-service-btn"
                          onClick={handleAddToBookingSession}
                          disabled={bookingLoading}
                        >
                          ➕ Add Service
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-service-selection">
                      <div className="empty-service-message">
                        <div className="empty-icon">➕</div>
                        <h4>Ready to add services to your booking session</h4>
                        <p>Click "Add Another Service" below to start selecting services for this booking.</p>
                      </div>
                    </div>
                  )}

                  {/* Multiple Appointments Summary */}
                  {multipleAppointments.length > 0 && (
                    <div className="services-session-summary">
                      <h4>✨ Services in Your Booking Session ({multipleAppointments.length})</h4>
                      {console.log('🎯 RENDERING SERVICES SUMMARY:', multipleAppointments)}
                      <div className="services-list">
                        {multipleAppointments.map((apt, index) => (
                          <div key={apt.id} className="service-session-item">
                            <div className="service-number">#{index + 1}</div>
                            <div className="service-session-details">
                              <div className="service-session-name">{apt.service.name}</div>
                              <div className="service-session-meta">
                                👨‍⚕️ {apt.professional.user?.firstName || apt.professional.name} • 
                                🕐 {apt.timeSlot} • ⏱️ {apt.service.duration}min • 💰 AED {apt.service.price}
                              </div>
                            </div>
                            <button 
                              className="remove-service-btn"
                              onClick={() => removeAppointmentFromSession(apt.id)}
                              title="Remove this service"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="session-summary-totals">
                        <div className="summary-total-row">
                          <span>Total Services:</span>
                          <span className="total-count">{multipleAppointments.length}</span>
                        </div>
                        <div className="summary-total-row">
                          <span>Total Duration:</span>
                          <span className="total-duration">{multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0)} minutes</span>
                        </div>
                        <div className="summary-total-row total-price-row">
                          <span>Total Amount:</span>
                          <span className="total-amount">AED {getTotalSessionPrice()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="multi-service-actions">
                    <button 
                      className="add-another-service-btn"
                      onClick={startAdditionalService}
                      disabled={bookingLoading}
                    >
                      ➕ Add Another Service
                    </button>
                    
                    {multipleAppointments.length > 0 && (
                      <button 
                        className="proceed-to-client-btn"
                        onClick={() => setBookingStep(5)}
                        disabled={bookingLoading}
                      >
                        👤 Proceed to Client Information →
                      </button>
                    )}
                    
                    {multipleAppointments.length === 0 && (
                      <div className="no-services-message">
                        <p>ℹ️ Please add at least one service to proceed to client information.</p>
                      </div>
                    )}
                  </div>

                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => setBookingStep(3)}>← Back to Time</button>
                  </div>
                </>
              )}

              {/* Client Information Step */}
              {bookingStep === 5 && (
                <>
                  <h3>👤 Client Information</h3>

                  {/* Services Summary Header */}
                  <div className="client-step-services-summary">
                    <h4>📋 Selected Services ({multipleAppointments.length})</h4>
                    <div className="mini-services-list">
                      {multipleAppointments.map((apt, index) => (
                        <div key={apt.id} className="mini-service-item">
                          <span className="mini-service-name">{apt.service.name}</span>
                          <span className="mini-service-price">AED {apt.service.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mini-total">
                      <strong>Total: AED {getTotalSessionPrice()}</strong>
                    </div>
                  </div>

                  {/* Client Search Section */}
                  <div className="client-search-section">
                    <div className="client-search-header">
                      <h4>Search Existing Client</h4>
                      {selectedExistingClient && (
                        <button
                          className="clear-client-btn"
                          onClick={clearClientSelection}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    {!selectedExistingClient && !isAddingNewClient && (
                      <div className="client-search-input-wrapper">
                        <input
                          type="text"
                          placeholder="Search by name, email, or phone..."
                          value={clientSearchQuery}
                          onChange={handleClientSearchChange}
                          onFocus={() => {
                            setShowClientSearch(true);
                            searchClients(clientSearchQuery);
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowClientSearch(false), 200);
                          }}
                        />
                        {showClientSearch && clientSearchResults.length > 0 && (
                          <div className="client-search-results">
                            {clientSearchResults.map(client => (
                              <div
                                key={client._id}
                                className="client-search-result"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectExistingClient(client)}
                              >
                                <div className="client-result-avatar">
                                  {(client.firstName?.[0] || '') + (client.lastName?.[0] || '')}
                                </div>
                                <div className="client-result-info">
                                  <div className="client-result-name">
                                    {client.firstName} {client.lastName}
                                  </div>
                                  <div className="client-result-contact">
                                    {client.email} • {client.phone}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {showClientSearch && clientSearchQuery && clientSearchResults.length === 0 && (
                          <div className="client-search-no-results">
                            <p>No clients found for "{clientSearchQuery}"</p>
                            <button
                              className="add-new-client-btn"
                              onClick={addNewClient}
                            >
                              Add New Client
                            </button>
                          </div>
                        )}

                        {!showClientSearch && !isAddingNewClient && (
                          <button
                            className="add-new-client-btn"
                            onClick={addNewClient}
                          >
                            + Add New Client
                          </button>
                        )}
                      </div>
                    )}

                    {/* Selected Client Display */}
                    {selectedExistingClient && (
                      <div className="selected-client-display">
                        <div className="selected-client-avatar">
                          {(selectedExistingClient.firstName?.[0] || '') + (selectedExistingClient.lastName?.[0] || '')}
                        </div>
                        <div className="selected-client-info">
                          <div className="selected-client-name">
                            {selectedExistingClient.firstName} {selectedExistingClient.lastName}
                          </div>
                          <div className="selected-client-contact">
                            {selectedExistingClient.email} • {selectedExistingClient.phone}
                          </div>
                        </div>
                        <div className="selected-client-badge">
                          Existing Client
                        </div>
                      </div>
                    )}

                    {/* New Client Form */}
                    {isAddingNewClient && (
                      <div className="new-client-form">
                        <div className="new-client-header">
                          <h4>Add New Client</h4>
                          <button
                            className="back-to-search-btn"
                            onClick={() => {
                              setIsAddingNewClient(false);
                              setShowClientSearch(true);
                              setClientInfo({ name: '', email: '', phone: '' });
                            }}
                          >
                            ← Back to Search
                          </button>
                        </div>
                        <div className="booking-modal-form">
                          <div className="form-group">
                            <label htmlFor="clientName">Client Name *</label>
                            <input
                              id="clientName"
                              type="text"
                              placeholder="Enter client's full name"
                              value={clientInfo.name}
                              onChange={e => setClientInfo(f => ({ ...f, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="clientEmail">Email Address *</label>
                            <input
                              id="clientEmail"
                              type="email"
                              placeholder="Enter client's email address"
                              value={clientInfo.email}
                              onChange={e => setClientInfo(f => ({ ...f, email: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="clientPhone">Phone Number *</label>
                            <input
                              id="clientPhone"
                              type="tel"
                              placeholder="Enter client's phone number"
                              value={clientInfo.phone}
                              onChange={e => setClientInfo(f => ({ ...f, phone: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="booking-modal-actions">
                    <button
                      className="booking-modal-next"
                      onClick={() => setBookingStep(6)}
                      disabled={
                        !selectedExistingClient &&
                        (!clientInfo.name.trim() || !clientInfo.email.trim() || !clientInfo.phone.trim())
                      }
                    >
                      Continue to Payment →
                    </button>
                    <button className="booking-modal-back" onClick={() => setBookingStep(4)}>← Back to Services</button>
                  </div>
                </>
              )}

              {/* Payment & Confirmation Step */}
              {bookingStep === 6 && (
                <>
                  <h3>💳 Payment & Final Confirmation</h3>
                  
                  {/* Multiple Appointments Summary */}
                  <div className="multiple-appointments-summary">
                    <h4>📋 Appointment Session Summary</h4>
                    <div className="appointments-list">
                      {multipleAppointments.map((apt, index) => (
                        <div key={apt.id} className="appointment-summary-item">
                          <div className="appointment-number">#{index + 1}</div>
                          <div className="appointment-details">
                            <div className="service-name">{apt.service.name}</div>
                            <div className="appointment-meta">
                              {apt.professional.user?.firstName || apt.professional.name} • 
                              {apt.timeSlot} • {apt.service.duration}min • AED {apt.service.price}
                            </div>
                          </div>
                          <button 
                            className="remove-appointment-btn"
                            onClick={() => removeAppointmentFromSession(apt.id)}
                            title="Remove this appointment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="session-totals">
                      <div className="total-item">
                        <span>Total Services:</span>
                        <span>{multipleAppointments.length}</span>
                      </div>
                      <div className="total-item">
                        <span>Total Duration:</span>
                        <span>{multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0)} minutes</span>
                      </div>
                      <div className="total-item total-price">
                        <span>Total Amount:</span>
                        <span>AED {getTotalSessionPrice()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Information Display */}
                  <div className="client-summary">
                    <h4>  Client Information</h4>
                    <div className="summary-item">
                      <span>Client:</span>
                      <span>
                        {selectedExistingClient
                          ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
                          : clientInfo.name
                        }
                        {selectedExistingClient && (
                          <span className="existing-client-indicator">✨ VIP Member</span>
                        )}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span>📧 Email:</span>
                      <span>
                        {selectedExistingClient
                          ? selectedExistingClient.email
                          : clientInfo.email
                        }
                      </span>
                    </div>
                    <div className="summary-item">
                      <span>📱 Phone:</span>
                      <span>
                        {selectedExistingClient
                          ? selectedExistingClient.phone
                          : clientInfo.phone
                        }
                      </span>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="booking-modal-form">
                    <div className="form-group">
                      <label>💳 Select Payment Method:</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>🎁 Gift Card Code (Optional):</label>
                      <input
                        type="text"
                        placeholder="Enter gift card code"
                        value={giftCardCode}
                        onChange={e => setGiftCardCode(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>📝 Notes (Optional):</label>
                      <textarea
                        placeholder="Any special requests or notes..."
                        value={bookingForm.notes}
                        onChange={e => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="booking-modal-actions">
                    <button
                      className="booking-modal-confirm"
                      onClick={handleCreateBooking}
                      disabled={bookingLoading || multipleAppointments.length === 0}
                    >
                      {bookingLoading ? '✨ Creating Your Luxury Experience...' : `🎉 Confirm ${multipleAppointments.length} Service${multipleAppointments.length > 1 ? 's' : ''} - AED ${getTotalSessionPrice()}`}
                    </button>
                    <button className="booking-modal-back" onClick={() => setBookingStep(5)}>← Back</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* More Appointments Dropdown */}
      {showMoreAppointments && (
        <>
          <div className="more-appointments-backdrop" onClick={closeMoreAppointmentsDropdown}></div>
          <div
            className={`more-appointments-dropdown ${dropdownPositionedAbove ? 'positioned-above' : ''}`}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            <div className="more-appointments-dropdown-header">
              <span>All Appointments</span>
              <span className="more-appointments-date">
                {selectedDayDate?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="more-appointments-dropdown-list">
              {selectedDayAppointments.map((app, index) => (
                <div key={index} className="more-appointment-dropdown-item">
                  <div className="more-appointment-color" style={{ backgroundColor: app.color }}></div>
                  <div className="more-appointment-details">
                    <div className="more-appointment-client">{app.client}</div>
                    <div className="more-appointment-service">{app.service}</div>
                  </div>
                  <div className="more-appointment-time">
                    {app.time || 'Time TBD'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Booking Tooltip */}
      {showBookingTooltip && tooltipData && (
        <div
          className="booking-tooltip"
          style={{
            position: 'fixed',
            top: tooltipPosition?.y,
            left: tooltipPosition?.x,
            zIndex: 10000,
            backgroundColor: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{tooltipData.client}</div>
          <div style={{ marginBottom: '2px' }}>{tooltipData.service}</div>
          <div style={{ marginBottom: '2px' }}>Time: {formatTooltipTime(tooltipData.time)}</div>
          <div style={{ marginBottom: '2px' }}>Professional: {tooltipData.professional}</div>
          <div style={{ fontSize: '11px', color: '#ccc' }}>Status: {tooltipData.status}</div>
          {tooltipData.notes && (
            <div style={{ fontSize: '11px', color: '#ccc', marginTop: '4px' }}>
              Notes: {tooltipData.notes}
            </div>
          )}
        </div>
      )}

      {/* Time Hover Tooltip */}
      {showTimeHover && hoverTimeData && (
        <div
          className="time-hover-tooltip"
          style={{
            position: 'fixed',
            top: hoverTimePosition?.y,
            left: hoverTimePosition?.x,
            zIndex: 10000,
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            border: '1px solid #374151'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Slot: {hoverTimeData.timeSlot}
          </div>
          <div style={{ marginBottom: '2px', color: '#e5e7eb' }}>
            Current Time: {hoverTimeData.currentTime}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            {hoverTimeData.date}
          </div>
        </div>
      )}
    </div>
  );
};
const computeAppointmentLayout = (
  { startTime, endTime, durationMinutes },
  timeSlotsOrFirstVisible = "00:00",
  slotInterval = 30,
  slotHeightPx = 80
) => {
  const parseHM = (t = "00:00") => {
    if (!t) return 0;
    if (typeof t !== "string") return 0;
    if (t.includes("T") || t.includes("-") || t.endsWith("Z")) {
      const d = new Date(t);
      return d.getHours() * 60 + d.getMinutes();
    }
    const [hh = "0", mm = "0"] = t.split(":");
    return (Number(hh) || 0) * 60 + (Number(mm) || 0);
  };

  const minutesToLabel = (mins) => {
    mins = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const startM = parseHM(startTime);
  let endM = endTime
    ? parseHM(endTime)
    : startM + (Number(durationMinutes) || slotInterval);
  if (endM <= startM) endM = startM + (Number(durationMinutes) || slotInterval);

  const durationMins = Math.max(1, endM - startM);

  let refM;
  if (Array.isArray(timeSlotsOrFirstVisible)) {
    const slotMs = timeSlotsOrFirstVisible
      .map(s => parseHM(s))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b);
    const candidate = slotMs.slice().reverse().find(m => m <= startM);
    refM = (typeof candidate === 'number') ? candidate : (slotMs.length ? slotMs[0] : 0);
  } else {
    refM = parseHM(timeSlotsOrFirstVisible || "00:00");
  }
  if (!Number.isFinite(refM)) refM = 0;

  // FIXED: Calculate position without extra offset
  const topPx = Math.max(0, ((startM - refM) / slotInterval) * slotHeightPx);

  // FIXED: Calculate height without extra padding
  const heightPx = Math.max(
    Math.ceil((durationMins / slotInterval) * slotHeightPx),
    slotHeightPx
  );

  // build coveredSlots aligned to slotInterval - FIXED: Only include slots that START within appointment
  const coveredSlots = [];
  for (let s = startM; s < endM; s += slotInterval) {
    // Only add slots whose start time is within the appointment duration
    if (s >= startM && s < endM) {
      coveredSlots.push(minutesToLabel(s));
    }
  }

  return {
    topPx,
    heightPx,
    durationMins,
    startLabel: minutesToLabel(startM),
    endLabel: minutesToLabel(endM),
    coveredSlots
  };
};

// Reusable components for cleaner rendering
const StaffColumn = ({
  employee,
  timeSlots,
  appointments,
  currentDate,
  isTimeSlotUnavailable,
  handleTimeSlotClick,
  showBookingTooltipHandler,
  hideBookingTooltip,
  showTimeHoverHandler,
  hideTimeHover,
  setSelectedBookingForStatus,
  setShowBookingStatusModal
}) => {
  const timeSlotHeightPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--time-slot-height')) || 20;
  const dayKey = localDateKey(currentDate);
  const hasShift = hasShiftOnDate(employee, currentDate);
  const shiftHours = getEmployeeShiftHours(employee, currentDate);
  const hasValidShifts = shiftHours.length > 0;

  const processAppointmentBlocks = () => {
    const employeeAppointments = appointments[employee.id] || {};
    const appointmentBlocks = [];
    const processedSlots = new Set();
    const firstVisibleSlot = (timeSlots && timeSlots.length) ? timeSlots[0] : '00:00';

    Object.entries(employeeAppointments).forEach(([slotKey, appointment]) => {
      if (!slotKey.startsWith(dayKey) || processedSlots.has(slotKey)) return;
      if (!appointment.isMainSlot) return;

      const durationMinutes = Number(appointment.duration) || 30;

      // compute layout using helper
      const layout = computeAppointmentLayout(
        {
          startTime: appointment.startISO || appointment.startTime,
          endTime: appointment.endISO || appointment.endTime,
          durationMinutes
        },
        firstVisibleSlot,
        30,
        timeSlotHeightPx
      );

      // FIXED: Mark covered slots properly - only slots that START within the appointment
      layout.coveredSlots.forEach(coveredSlot => {
        processedSlots.add(`${dayKey}_${coveredSlot}`);
      });

      appointmentBlocks.push({
        startSlot: layout.startLabel,
        durationMinutes: layout.durationMins,
        durationSlots: Math.ceil(layout.durationMins / 30),
        height: layout.heightPx,
        topPx: layout.topPx,
        appointment: { ...appointment, startTime: layout.startLabel, endTime: layout.endLabel },
        coveredSlots: layout.coveredSlots
      });
    });

    return { appointmentBlocks, processedSlots };
  };

  // FIXED: Get both appointment blocks and processed slots
  const { appointmentBlocks, processedSlots } = processAppointmentBlocks();

  return (
    <div key={employee.id} className={`staff-column ${!hasShift ? 'staff-absent' : ''} ${!hasValidShifts ? 'no-shifts' : ''}`}>
      <div className="staff-header">
        <div className="staff-avatar" style={{
          backgroundColor: hasShift && hasValidShifts ? employee.avatarColor : '#9ca3af',
          opacity: hasShift && hasValidShifts ? 1 : 0.5
        }}>
          {employee.avatar ?
            <img src={employee.avatar} alt={employee.name} className="avatar-image" style={{
              opacity: hasShift && hasValidShifts ? 1 : 0.5
            }} /> :
            employee.name.charAt(0)
          }
        </div>
        <div className="staff-info">
          <div className="staff-name" style={{
            color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af'
          }}>
            {employee.name}
          </div>
          <div className="staff-position" style={{
            color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af'
          }}>
            {employee.position}
          </div>
        </div>
      </div>

      <div className="time-slots-column" style={{ position: 'relative' }}>
        {/* Render ALL time slots first (including those that will be covered) */}
        {timeSlots.map((slot, index) => {
          const slotKey = `${dayKey}_${slot}`;
          const unavailableReason = isTimeSlotUnavailable(employee.id, slot);

          // ---- SHIFT OVERLAP / PARTIAL SHIFT LOGIC ----
          // Each visual slot spans 30 minutes from slotStart to slotEnd
          const [slotHour, slotMinute] = slot.split(':').map(Number);
          const slotStartMinutes = slotHour * 60 + slotMinute;
          const slotEndMinutes = slotStartMinutes + 30; // fixed 30‑min visual slot

          let isWithinShift = false;          // legacy: slot start lies within shift
          let isFullyCoveredByShift = false;  // shift spans entire 30‑min cell
          let isPartialShift = false;         // any overlap but not full
          let partialGradientStyle = undefined; // inline style for partial visualisation
          let partialOverlapLabel = '';
          let overlapStartsAtSlotStart = false;
          let overlapEndsAtSlotEnd = false;
          let overlapMinutes = 0;
          let percentStart = 0; // percentage start of overlap (vertical)
          let percentEnd = 0;   // percentage end of overlap (vertical)

          if (hasShift && hasValidShifts) {
            for (const shift of shiftHours) {
              const [shiftStartHour, shiftStartMinute] = shift.startTime.split(':').map(Number);
              const [shiftEndHour, shiftEndMinute] = shift.endTime.split(':').map(Number);
              const shiftStart = shiftStartHour * 60 + shiftStartMinute;
              const shiftEnd = shiftEndHour * 60 + shiftEndMinute;

              // Overlap minutes between [slotStart, slotEnd) and [shiftStart, shiftEnd)
              const overlapStart = Math.max(slotStartMinutes, shiftStart);
              const overlapEnd = Math.min(slotEndMinutes, shiftEnd);
              const thisOverlapMinutes = Math.max(0, overlapEnd - overlapStart);

              if (thisOverlapMinutes > 0) {
                // Legacy isWithinShift (slot label itself lies inside shift)
                if (slotStartMinutes >= shiftStart && slotStartMinutes < shiftEnd) {
                  isWithinShift = true;
                }
                if (thisOverlapMinutes >= 30) {
                  isFullyCoveredByShift = true;
                } else {
                  isPartialShift = true;
                  overlapMinutes = thisOverlapMinutes;
                  overlapStartsAtSlotStart = overlapStart === slotStartMinutes;
                  overlapEndsAtSlotEnd = overlapEnd === slotEndMinutes;
                  percentStart = ((overlapStart - slotStartMinutes) / 30) * 100;
                  percentEnd = ((overlapEnd - slotStartMinutes) / 30) * 100;
                  // Base background for partial cells (light grey)
                  partialGradientStyle = { background: '#f3f4f6' };
                  const toLabel = (mins) => {
                    const h = Math.floor(mins / 60).toString().padStart(2, '0');
                    const m = (mins % 60).toString().padStart(2, '0');
                    return `${h}:${m}`;
                  };
                  partialOverlapLabel = `${toLabel(overlapStart)}-${toLabel(overlapEnd)}`;
                }
                // We can break early if full coverage achieved
                if (isFullyCoveredByShift) break;
              }
            }
          }
          // If fully covered, treat as within shift
          if (isFullyCoveredByShift) {
            isWithinShift = true;
            isPartialShift = false; // not partial if fully covered
          }

          // FIXED: Check if this specific slot is covered by appointment
          const isCoveredByAppointment = processedSlots.has(slotKey);

          return (
            <div
              key={slot}
              className="time-slot-wrapper"
              style={{
                height: `${timeSlotHeightPx}px`,
                // Hide covered slots but keep them in the layout to maintain spacing
                visibility: isCoveredByAppointment ? 'hidden' : 'visible'
              }}
            >
              <div className={`time-slot ${(!hasShift || !hasValidShifts ? 'no-shift' :
                (isPartialShift ? 'partial-shift' :
                  (!isWithinShift ? 'outside-shift' :
                    (unavailableReason ? 'unavailable' : 'empty'))))
                }`}
                // Only allow click for full or leading partial starting exactly at slot start
                onClick={(() => {
                  const minBookable = 10;
                  if (!hasShift || !hasValidShifts || isCoveredByAppointment) return undefined;
                  if (!isPartialShift && isWithinShift) return () => handleTimeSlotClick(employee.id, slot, currentDate);
                  if (isPartialShift && overlapStartsAtSlotStart && overlapMinutes >= minBookable) return () => handleTimeSlotClick(employee.id, slot, currentDate);
                  return undefined;
                })()}
                onMouseEnter={(e) => !isCoveredByAppointment && showTimeHoverHandler(e, slot)}
                onMouseLeave={hideTimeHover}
                style={{
                  cursor: (!hasShift || !hasValidShifts || isCoveredByAppointment) ? 'not-allowed' :
                    (!isPartialShift && isWithinShift) ? 'pointer' :
                      (isPartialShift && overlapStartsAtSlotStart && overlapMinutes >= 10 ? 'pointer' : 'default'),
                  opacity: (!hasShift || !hasValidShifts || (!isWithinShift && !isPartialShift)) ? 0.3 : 1,
                  backgroundColor: (!hasShift || !hasValidShifts) ? 'gray' :
                    (isPartialShift ? '#f3f4f6' : (!isWithinShift ? 'gray' : '#ffffff')),
                  ...(isPartialShift && partialGradientStyle ? partialGradientStyle : {})
                }}>

                {unavailableReason && isWithinShift && (
                  <div className="unavailable-text">
                    {unavailableReason.includes("Day Off") ? "DAY OFF" : (unavailableReason.includes("Block") ? "BLOCKED" : "UNAVAIL")}
                  </div>
                )}
                {isPartialShift && partialOverlapLabel && (
                  <>
                    <div
                      className="partial-shift-available"
                      style={{
                        top: `${percentStart}%`,
                        height: `${percentEnd - percentStart}%`,
                        width: '100%',
                        cursor: overlapStartsAtSlotStart ? 'pointer' : 'default'
                      }}
                      title={`Shift: ${partialOverlapLabel}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const minBookable = 10;
                        if (overlapStartsAtSlotStart && overlapMinutes >= minBookable && !isCoveredByAppointment) {
                          handleTimeSlotClick(employee.id, slot, currentDate);
                        }
                      }}
                    >
                      <span className="partial-shift-label">{partialOverlapLabel}</span>
                    </div>
                  </>
                )}
                {!hasShift && (
                  <div className="unavailable-text">
                  </div>
                )}
                {hasShift && !hasValidShifts && (
                  <div className="unavailable-text">
                  </div>
                )}
                {hasShift && hasValidShifts && !isWithinShift && (
                  <div className="unavailable-text off-shift-text">
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Render appointment blocks on top */}
        {appointmentBlocks.map((block, index) => {
          return (
            <div
              key={`block-${index}`}
              className="appointment-block fresha-style"
              style={{
                position: 'absolute',
                top: `${block.topPx}px`,
                left: '4px',
                right: '4px',
                height: `${block.height}px`,
                backgroundColor: getAppointmentColorByStatus(block.appointment.status, block.appointment.color),
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                zIndex: 10,
                border: '2px solid rgba(255,255,255,0.2)',
                transition: 'all 0.2s ease',
                overflow: 'hidden'
              }}
              onClick={() => {
                const appointmentDetails = {
                  ...block.appointment,
                  employeeId: employee.id,
                  employeeName: employee.name,
                  slotTime: block.startSlot,
                  date: dayKey,
                  slotKey: `${dayKey}_${block.startSlot}`
                };
                setSelectedBookingForStatus(appointmentDetails);
                setShowBookingStatusModal(true);
              }}
              onMouseEnter={(e) => showBookingTooltipHandler(e, {
                client: block.appointment.client,
                service: block.appointment.service,
                time: block.appointment.startTime,
                professional: employee.name,
                status: block.appointment.status || 'Confirmed',
                notes: block.appointment.notes
              })}
              onMouseLeave={hideBookingTooltip}
            >
              <div className="appointment-client" style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                {block.appointment.client}
              </div>
              <div className="appointment-service" style={{ color: '#fff', fontSize: 13, opacity: 0.95 }}>
                {block.appointment.service}
              </div>
              <div className="appointment-time" style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                {block.appointment.startTime} - {block.appointment.endTime}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeekDayColumn = ({ day, employees, timeSlots, appointments, isTimeSlotUnavailable, handleTimeSlotClick, onShowMoreAppointments, showBookingTooltipHandler, hideBookingTooltip }) => {
  const dayKey = day.toISOString().split('T')[0];
  const isToday = day.toDateString() === new Date().toDateString();

  // Get all appointments for this day from all employees (similar to month view)
  const dayAppointments = [];

  employees.forEach(emp => {
    if (appointments[emp.id]) {
      Object.entries(appointments[emp.id]).forEach(([slotKey, appointment]) => {
        // Check if the appointment is for this day
        if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
          // Extract time from slot key (format: YYYY-MM-DD_HH:MM)
          const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
          dayAppointments.push({
            ...appointment,
            time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD',
            slotKey,
            timeSlot: timeFromKey,

          });
        }
      });
    }
  });

  return (
    <div key={dayKey} className="week-day-column">
      <div className={`week-day-header ${isToday ? 'is-today' : ''}`}>
        <span className="weekday-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        <span className="day-number">{day.getDate()}</span>
      </div>
      <div className="week-appointments">
        {dayAppointments.length > 0 ? (
          <>
            {dayAppointments.slice(0, 3).map((app, index) => (
              <div key={index}
                className="week-appointment-entry"
                style={{ backgroundColor: app.color }}
                onMouseEnter={(e) => showBookingTooltipHandler(e, {
                  client: app.client,
                  service: app.service,
                  time: app.time,
                  professional: app.employeeName,
                  status: app.status || 'Confirmed',
                  notes: app.notes
                })}
                onMouseLeave={hideBookingTooltip}>
                <span className="appointment-client-name">{app.client}</span>
                <span className="appointment-service-name">{app.service}</span>
                <span className="appointment-time">{app.time}</span>
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <div
                className="week-more-appointments"
                onClick={(event) => onShowMoreAppointments(dayAppointments, day, event)}
              >
                +{dayAppointments.length - 3} more
              </div>
            )}
          </>
        ) : (
          <div className="week-no-appointments">
            <NoDataState/>
          </div>
        )}
      </div>
    </div>
  );
};
export default SelectCalendar