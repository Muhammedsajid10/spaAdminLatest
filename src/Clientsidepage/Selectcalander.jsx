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
} from "lucide-react";

// --- API ENDPOINTS ---
const BOOKING_API_URL = `${Base_url}/bookings`;
const SERVICES_API_URL = `${Base_url}/services`;
const EMPLOYEES_API_URL = `${Base_url}/employees`;
const CLIENTS_API_URL = `${Base_url}/clients`;

// --- HELPER FUNCTIONS ---
const generateTimeSlots = (startTime, endTime, intervalMinutes) => {
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

const getRandomColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomAppointmentColor = () => {
  const colors = ['#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to check if an employee has a shift on a specific day
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const hasShiftOnDate = (employee, date) => {
  // console.log('=== SHIFT CHECK DEBUG ===');
  // console.log('Employee:', employee?.name || 'Unknown');
  // console.log('Date:', date?.toDateString());
  
  if (!employee?.workSchedule) {
    // console.log('❌ No workSchedule found');
    return false;
  }
  
  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];
  // console.log('Day name:', dayName);
  // console.log('Schedule for day:', schedule);
  
  if (!schedule) {
    // console.log('❌ No schedule for this day');
    return false;
  }
  
  // Check different possible schedule formats
  let hasShift = false;
  
  // Format 1: { isWorking: true/false }
  if (typeof schedule.isWorking === 'boolean') {
    hasShift = schedule.isWorking;
    // console.log('✅ Found isWorking:', hasShift);
  }
  // Format 2: { startTime: "09:00", endTime: "17:00" }
  else if (schedule.startTime && schedule.endTime) {
    hasShift = true;
    // console.log('✅ Found startTime/endTime:', schedule.startTime, '-', schedule.endTime);
  }
  // Format 3: { shifts: "09:00 - 17:00" }
  else if (schedule.shifts && typeof schedule.shifts === 'string' && schedule.shifts.trim()) {
    hasShift = true;
    // console.log('✅ Found shifts string:', schedule.shifts);
  }
  // Format 4: { shiftsData: [{ startTime, endTime }] }
  else if (Array.isArray(schedule.shiftsData) && schedule.shiftsData.length > 0) {
    hasShift = schedule.shiftsData.some(shift => shift.startTime && shift.endTime);
    // console.log('✅ Found shiftsData:', schedule.shiftsData.length, 'shifts');
  }
  
  // console.log('Final hasShift result:', hasShift);
  // console.log('========================');
  
  return hasShift;
};

// NEW: Get employee's actual shift hours for a specific date
const getEmployeeShiftHours = (employee, date) => {
  // console.log('=== GETTING SHIFT HOURS ===');
  // console.log('Employee:', employee?.name);
  // console.log('Date:', date?.toDateString());
  
  if (!employee?.workSchedule) {
    // console.log('❌ No workSchedule');
    return [];
  }
  
  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];
  
  if (!schedule) {
    // console.log('❌ No schedule for', dayName);
    return [];
  }
  
  let shifts = [];
  
  // Handle multiple shift formats
  if (Array.isArray(schedule.shiftsData) && schedule.shiftsData.length > 0) {
    shifts = schedule.shiftsData
      .filter(shift => shift.startTime && shift.endTime)
      .map(shift => ({
        startTime: shift.startTime,
        endTime: shift.endTime
      }));
    // console.log('✅ Using shiftsData:', shifts);
  }
  else if (typeof schedule.shifts === 'string' && schedule.shifts.trim()) {
    // Parse "09:00 - 13:00, 14:00 - 18:00" format
    shifts = schedule.shifts
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(block => {
        const parts = block.split(' - ');
        if (parts.length >= 2) {
          return { startTime: parts[0].trim(), endTime: parts[1].trim() };
        }
        return null;
      })
      .filter(Boolean);
    // console.log('✅ Using shifts string:', shifts);
  }
  else if (schedule.startTime && schedule.endTime) {
    shifts = [{
      startTime: schedule.startTime,
      endTime: schedule.endTime
    }];
    // console.log('✅ Using single shift:', shifts);
  }
  
  // console.log('Final shifts:', shifts);
  // console.log('===========================');
  
  return shifts;
};

// ENHANCED: Generate time slots ONLY for employee's actual shift hours
const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration = 30, intervalMinutes = 10) => {
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
  timeSlots: generateTimeSlots('00:00', '23:50', 10),
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

const SelectCalendar = () => {
  const [employees, setEmployees] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('Day');
  const [selectedStaff, setSelectedStaff] = useState('All');
  
  // Enhanced Booking Flow States
  const [availableServices, setAvailableServices] = useState([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showUnavailablePopup, setShowUnavailablePopup] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [isNewAppointment, setIsNewAppointment] = useState(false);
  
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

  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    paymentMethod: 'cash',
    notes: '',
  });

  const schedulerContentRef = useRef(null);

  // Booking Status Management States
  const [showBookingStatusModal, setShowBookingStatusModal] = useState(false);
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState(null);
  const [bookingStatusLoading, setBookingStatusLoading] = useState(false);
  const [bookingStatusError, setBookingStatusError] = useState(null);

  // --- HELPER FUNCTIONS ---
  const handleTimeSlotClick = (employeeId, slotTime, day) => {
    // Check if this time slot has an existing appointment
    const dayKey = (day || currentDate).toISOString().split('T')[0];
    const slotKey = `${dayKey}_${slotTime}`;
    const existingAppointment = appointments[employeeId]?.[slotKey];
    
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
    } else if (unavailableReason !== "No shift scheduled") {
      // Store the clicked employee and time slot as defaults for pre-selection
      const staff = employees.find(emp => emp.id === employeeId);
      const [hour, minute] = slotTime.split(':').map(Number);
      const startTime = new Date(currentDate);
      startTime.setHours(hour, minute, 0, 0);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // Default 30 minutes
      
      const timeSlot = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: true
      };

      setBookingDefaults({
        professional: { _id: staff.id, user: { firstName: staff.name.split(' ')[0], lastName: staff.name.split(' ')[1] || '' } },
        timeSlot,
        staffId: staff.id,
        time: slotTime
      });
      
      setIsNewAppointment(true); // Now behaves like "Add" button - full booking flow
      setShowAddBookingModal(true);
    }
  };

  const closeBookingModal = () => {
    setShowAddBookingModal(false);
    setShowUnavailablePopup(false);
    resetBookingForm();
  };

  const closeBookingStatusModal = () => {
    setShowBookingStatusModal(false);
    setSelectedBookingForStatus(null);
    setBookingStatusError(null);
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
      const url = `${Base_url}/bookings/professionals?service=${serviceId}&date=${dateStr}`;
      // console.log('API URL:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      // console.log('API Response:', data);
      
      if (res.ok && data.success) {
        const allProfessionals = data.data?.professionals || [];
        // console.log('Total professionals from API:', allProfessionals.length);
        
        // Filter professionals with shifts on this date
        const professionalsWithShifts = allProfessionals.filter(prof => {
          const isActive = prof.user?.isActive !== false;
          
          // Create employee object for shift checking
          const employeeForShiftCheck = {
            name: `${prof.user?.firstName} ${prof.user?.lastName}`,
            workSchedule: prof.workSchedule || {}
          };
          
          const hasShift = hasShiftOnDate(employeeForShiftCheck, date);
          
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
  }, [employees]);

  const filterOutBookedTimeSlots = (timeSlots, employeeId, date) => {
    const dayKey = date.toISOString().split('T')[0];
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
      const shiftBasedSlots = generateTimeSlotsFromEmployeeShift(employee, date, serviceDuration, 10);
      
      if (shiftBasedSlots.length === 0) {
        setBookingError(`No time slots can be generated from ${employee.name}'s shift hours`);
        setAvailableTimeSlots([]);
        setBookingLoading(false);
        return;
      }
      
      console.log('🔧 Generated shift-based slots:', shiftBasedSlots.length);
      
      // Filter out already booked time slots
      const availableSlots = filterOutBookedTimeSlots(shiftBasedSlots, employeeId, date);
      
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
  }, [employees, availableServices, appointments]);

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

  const formatTooltipTime = (timeString) => {
    if (!timeString) return 'Time TBD';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Close dropdown when clicking outside or on escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoreAppointments && !event.target.closest('.more-appointments-dropdown') && !event.target.closest('.month-more-appointments') && !event.target.closest('.week-more-appointments')) {
        closeMoreAppointmentsDropdown();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showMoreAppointments) {
        closeMoreAppointmentsDropdown();
      }
    };

    if (showMoreAppointments) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showMoreAppointments]);

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

      // Validate required fields
      if (!selectedService || !selectedProfessional || !selectedTimeSlot) {
        setBookingError('Please complete all booking steps: Service, Professional, and Time selection.');
        setBookingLoading(false);
        return;
      }

      if (!clientData.email || !clientData.phone) {
        setBookingError('Client email and phone are required.');
        setBookingLoading(false);
        return;
      }

      // Create the booking payload according to backend model
      const bookingPayload = {
        services: [
          {
            service: selectedService._id,
            employee: selectedProfessional._id,
            duration: selectedService.duration,
            price: selectedService.price,
            startTime: selectedTimeSlot.startTime,
            endTime: selectedTimeSlot.endTime,
          },
        ],
        appointmentDate: selectedTimeSlot.startTime,
        totalDuration: selectedService.duration,
        totalAmount: selectedService.price,
        finalAmount: selectedService.price, // Add finalAmount as required by backend
        paymentMethod: paymentMethod,
        client: clientData,
        notes: '', // Add notes field
        bookingSource: 'admin' // Specify this is admin-created booking
      };

      // console.log('Booking payload:', JSON.stringify(bookingPayload, null, 2));
      
      const res = await fetch(`${Base_url}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });
      
      const responseData = await res.json();
      // console.log('Booking creation response:', responseData);

      if (!res.ok) {
        throw new Error(responseData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Booking creation failed');
      }
      
      const clientName = selectedExistingClient 
        ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
        : clientData.firstName;
      
      setBookingSuccess(`✨ Booking created successfully for ${clientName}! Booking ID: ${responseData.data?.booking?.bookingNumber || 'N/A'}`);
      
      // Refresh calendar data after successful booking
      setTimeout(() => {
        closeBookingModal();
        fetchCalendarData(); // Refresh the calendar
      }, 2500);
      
    } catch (err) {
      console.error('Booking creation error:', err);
      setBookingError(`Failed to create booking: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBookingForm = () => {
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
  };

  // --- API CALL FUNCTION ---
  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      let startDate, endDate;
      if (currentView === 'Day') {
        const dateStr = currentDate.toISOString().split('T')[0];
        startDate = new Date(dateStr);
        endDate = new Date(dateStr);
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
      
      const startDateParam = startDate.toISOString().split('T')[0];
      const endDateParam = endDate.toISOString().split('T')[0];

      // console.log('Fetching calendar data for:', { startDateParam, endDateParam, currentView });

      const [employeesResponse, bookingsResponse, servicesResponse] = await Promise.all([
        api.get(EMPLOYEES_API_URL),
        api.get(`${BOOKING_API_URL}/admin/all?startDate=${startDateParam}&endDate=${endDateParam}`),
        api.get(SERVICES_API_URL)
      ]);

      // console.log('API Responses:', {
      //   employees: employeesResponse.data,
      //   bookings: bookingsResponse.data,
      //   services: servicesResponse.data
      // });

      if (bookingsResponse.data.success && employeesResponse.data.success) {
        const allBookings = bookingsResponse.data.data.bookings || [];
        const employees = employeesResponse.data.data.employees || [];
        
        if (servicesResponse.data.success) {
          setAvailableServices(servicesResponse.data.data.services || []);
        }

        // Filter out inactive employees from calendar display and booking interfaces
        const activeEmployees = employees.filter(emp => emp.user?.isActive !== false);
        
        const transformedEmployees = activeEmployees.map(emp => ({
          id: emp._id || emp.id,
          name: `${emp.user?.firstName || emp.firstName || ''} ${emp.user?.lastName || emp.lastName || ''}`.trim(),
          position: emp.position || emp.department || 'Staff',
          avatar: emp.user?.avatar || emp.avatar,
          avatarColor: getRandomColor(),
          unavailablePeriods: emp.unavailablePeriods || [],
          isActive: emp.user?.isActive !== false, // Ensure we track active status
          workSchedule: emp.workSchedule || {} // Include work schedule for shift checking
        }));

        const transformedAppointments = {};
        allBookings.forEach(booking => {
          booking.services?.forEach(service => {
            const employeeId = service.employee?._id || service.employee;
            if (employeeId) {
              if (!transformedAppointments[employeeId]) {
                transformedAppointments[employeeId] = {};
              }

              const appointmentDate = new Date(booking.appointmentDate);
              const startTime = service.startTime ? new Date(service.startTime) : appointmentDate;
              const serviceDuration = service.service?.duration || service.duration || 30;
              
              const timeSlot = startTime.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const appointmentInfo = {
                client: `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''}`.trim(),
                service: service.service?.name || 'Service',
                duration: serviceDuration,
                color: getRandomAppointmentColor(),
                date: appointmentDate.toISOString().split('T')[0],
                bookingId: booking._id,
                status: booking.status || 'confirmed'
              };

              // Create time slots for the full duration of the service
              const intervalMinutes = 10; // Time slot interval
              const slotsToCreate = Math.ceil(serviceDuration / intervalMinutes);
              
              for (let i = 0; i < slotsToCreate; i++) {
                const slotStartTime = new Date(startTime);
                slotStartTime.setMinutes(startTime.getMinutes() + (i * intervalMinutes));
                
                const slotTimeString = slotStartTime.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                const slotKey = `${appointmentDate.toISOString().split('T')[0]}_${slotTimeString}`;
                
                // Add appointment info to each slot for the duration
                if (!transformedAppointments[employeeId][slotKey]) {
                  transformedAppointments[employeeId][slotKey] = {
                    ...appointmentInfo,
                    isMainSlot: i === 0, // Mark the first slot as main slot
                    slotIndex: i,
                    totalSlots: slotsToCreate
                  };
                }
              }
            }
          });
        });
        
        // console.log('Transformed data:', {
        //   employees: transformedEmployees.length,
        //   appointments: Object.keys(transformedAppointments).length
        // });
        
        setEmployees(transformedEmployees);
        setTimeSlots(generateTimeSlots('00:00', '23:50', 10));
        setAppointments(transformedAppointments);
        setExistingClients(MOCK_CLIENTS_DATA); // Use mock clients as fallback
      } else {
        throw new Error('Failed to fetch calendar data');
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError(`Failed to load calendar data: ${err.message}`);
      
      // Use mock data for development/demo
      setEmployees(MOCK_SUCCESS_DATA.employees);
      setTimeSlots(generateTimeSlots('00:00', '23:50', 10));
      setAppointments(MOCK_SUCCESS_DATA.appointments);
      setAvailableServices(MOCK_SERVICES_DATA);
      setExistingClients(MOCK_CLIENTS_DATA);
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

    const minutesPerSlot = 10;
    const topPosition = (minutesIntoSchedule / minutesPerSlot) * timeSlotHeightPx;

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

  const displayEmployees = employees.filter(emp => selectedStaff === 'All' || emp.id === selectedStaff);

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
            const dayKey = day.toISOString().split('T')[0];
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
              <p>Loading calendar data...</p>
          </div>
        </div>
      );
    }
    if (error) {
        return (
            <div className="content-error-message-overlay">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchCalendarData} className="action-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    if (employees.length === 0 && Object.keys(appointments).length === 0) {
        return (
            <div className="content-empty-state">
                <div className="empty-state-content">
                    <p>No employees or appointments scheduled.</p>
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
                  <div key={slot} className={`time-slot-label ${slot.endsWith(':00') ? 'hour-start' : ''}`}>
                    {slot.endsWith(':00') ? <span>{formatTime(slot)}</span> : slot}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="staff-grid">
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
      {/* Application-level Header */}
      <div className="scheduler-header">
        <div className="header-left">
          <h1>Scheduler Overview</h1>
          <p className="current-time-display">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={goToToday}>Today</button>
          <button className="action-btn" onClick={goToPrevious}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="date-display">
            {currentView === 'Day' && currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {currentView === 'Week' && `${calendarDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${calendarDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {currentView === 'Month' && currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </span>
          <button className="action-btn" onClick={goToNext}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <select value={currentView} onChange={(e) => setCurrentView(e.target.value)} className="action-btn">
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </select>
          <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="action-btn">
            <option value="All">All Staff</option>
            {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
          </select>
          <button className="action-btn primary-btn" onClick={handleAddAppointment}>
            <Plus size={16} />
            Add
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
                  <div className="booking-status-avatar" style={{ backgroundColor: selectedBookingForStatus.color }}>
                    {selectedBookingForStatus.client.charAt(0)}
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
            <div className="booking-modal booking-modal-animate-in" onClick={e => e.stopPropagation()}>
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
                <div className={`step-dot ${bookingStep >= 5 ? 'active' : ''}`}></div>
              </div>

              {bookingError && <div className="booking-modal-error">{bookingError}</div>}
              {bookingLoading && <div className="booking-modal-loading">Creating your perfect appointment...</div>}
              {bookingSuccess && <div className="booking-modal-success">{bookingSuccess}</div>}

              {/* Service Selection Step */}
              {bookingStep === 1 && (
                <>
                  <h3>Select Your Service</h3>
                  <div className="booking-modal-list">
                    {availableServices.map(service => (
                      <button key={service._id} className={`booking-modal-list-item${selectedService && selectedService._id === service._id ? ' selected' : ''}`} onClick={() => { setSelectedService(service); setBookingStep(2); fetchBookingProfessionals(service._id, currentDate); }}>
                        <div className="booking-modal-item-name">{service.name}</div>
                        <div className="booking-modal-list-desc">{service.duration} minutes • AED {service.price}</div>
                      </button>
                    ))}
                  </div>
                  <div className="booking-modal-actions">
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
                  </div>
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
                            className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}`} 
                            onClick={() => { 
                              setSelectedProfessional(prof); 
                              setBookingStep(3); 
                              fetchBookingTimeSlots(prof._id, selectedService._id, currentDate); 
                            }}
                          >
                            <div className="booking-modal-item-name">
                              {prof.user.firstName} {prof.user.lastName}
                              <span className="professional-shift-indicator">
                                ✓ Available
                              </span>
                            </div>
                            <div className="booking-modal-list-desc">
                              {prof.position} • Shift: {shiftInfo} • Expert in {selectedService?.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => setBookingStep(1)}>← Back</button>
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Time Selection Step */}
              {bookingStep === 3 && (
                <>
                  <h3>🕐 Pick Your Perfect Time</h3>
                  <div className="booking-modal-list">
                    {availableTimeSlots.filter(slot => slot.available).map(slot => (
                      <button key={slot.startTime} className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} onClick={() => { setSelectedTimeSlot(slot); setBookingStep(4); }}>
                        <div className="booking-modal-item-name">
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div className="booking-modal-list-desc">
                          {selectedService?.duration} minutes with {selectedProfessional?.user?.firstName}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => setBookingStep(2)}>← Back</button>
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Client Information Step */}
              {bookingStep === 4 && (
                <>
                  <h3>👤 Client Information</h3>
                  
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
                      onClick={() => setBookingStep(5)}
                      disabled={
                        !selectedExistingClient && 
                        (!clientInfo.name.trim() || !clientInfo.email.trim() || !clientInfo.phone.trim())
                      }
                    >
                      Continue to Payment →
                    </button>
                    <button className="booking-modal-back" onClick={() => setBookingStep(3)}>← Back</button>
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Payment & Confirmation Step */}
              {bookingStep === 5 && (
                <>
                  <h3>💳 Payment & Final Confirmation</h3>
                  <div className="booking-summary">
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
                    <div className="summary-item">
                      <span>💆‍♀️ Service:</span>
                      <span>{selectedService?.name}</span>
                    </div>
                    <div className="summary-item">
                      <span>👨‍⚕️ Professional:</span>
                      <span>{selectedProfessional?.user?.firstName} {selectedProfessional?.user?.lastName}</span>
                    </div>
                    <div className="summary-item">
                      <span>📅 Date & Time:</span>
                      <span>
                        {currentDate?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {' '}
                        {selectedTimeSlot ? new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span>⏱️ Duration:</span>
                      <span>{selectedService?.duration} minutes of luxury</span>
                    </div>
                    <div className="summary-item">
                      <span>💰 Investment:</span>
                      <span>AED {selectedService?.price}</span>
                    </div>
                  </div>
                  <div className="booking-modal-form">
                    <div className="form-group">
                      <label>💳 Select Payment Method:</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                  </div>
                  <div className="booking-modal-actions">
                    <button 
                      className="booking-modal-confirm" 
                      onClick={handleCreateBooking}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? ' Creating Your Luxury Experience...' : ' Confirm Booking '}

                    </button>
                    <button className="booking-modal-back" onClick={() => setBookingStep(4)}>← Back</button>
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
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
    </div>
  );
};

// Reusable components for cleaner rendering
const StaffColumn = ({ employee, timeSlots, appointments, currentDate, isTimeSlotUnavailable, handleTimeSlotClick, showBookingTooltipHandler, hideBookingTooltip }) => {
    const timeSlotHeightPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--time-slot-height')) || 20;
    const dayKey = currentDate.toISOString().split('T')[0];
    const hasShift = hasShiftOnDate(employee, currentDate);
    const shiftHours = getEmployeeShiftHours(employee, currentDate);
    const hasValidShifts = shiftHours.length > 0;

    // ENHANCED: StaffColumn component with Fresha-style appointment blocks
    const processAppointmentBlocks = () => {
      const employeeAppointments = appointments[employee.id] || {};
      const appointmentBlocks = [];
      const processedSlots = new Set();

      Object.entries(employeeAppointments).forEach(([slotKey, appointment]) => {
        if (!slotKey.startsWith(dayKey) || processedSlots.has(slotKey)) return;

        if (appointment.isMainSlot) {
          // Calculate the full appointment block
          const startTimeStr = slotKey.split('_')[1];
          const duration = appointment.duration || 30;
          const totalSlots = appointment.totalSlots || Math.ceil(duration / 10);
          
          // Mark all slots in this appointment as processed
          const [startHour, startMinute] = startTimeStr.split(':').map(Number);
          for (let i = 0; i < totalSlots; i++) {
            const slotTime = new Date();
            slotTime.setHours(startHour, startMinute + (i * 10), 0, 0);
            const slotTimeStr = slotTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            });
            const slotKeyToProcess = `${dayKey}_${slotTimeStr}`;
            processedSlots.add(slotKeyToProcess);
          }

          appointmentBlocks.push({
            startSlot: startTimeStr,
            duration: totalSlots,
            height: totalSlots * timeSlotHeightPx,
            appointment: appointment
          });
        }
      });

      return appointmentBlocks;
    };

    const appointmentBlocks = processAppointmentBlocks();

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
                    {!hasShift && <div className="staff-status no-shift">No shift today</div>}
                    {hasShift && !hasValidShifts && <div className="staff-status no-hours">No shift hours</div>}
                    {hasShift && hasValidShifts && (
                      <div className="staff-shift-info">
                        {shiftHours.map((shift, index) => (
                          <div key={index} className="shift-time">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
            </div>
            
            <div className="time-slots-column">
                {/* Render time slots */}
                {timeSlots.map((slot, index) => {
                    const slotKey = `${dayKey}_${slot}`;
                    const appointment = appointments[employee.id]?.[slotKey];
                    const unavailableReason = isTimeSlotUnavailable(employee.id, slot);
                    
                    // Check if this slot is within employee's shift hours
                    const isWithinShift = hasShift && hasValidShifts && shiftHours.some(shift => {
                      const [slotHour, slotMinute] = slot.split(':').map(Number);
                      const [shiftStartHour, shiftStartMinute] = shift.startTime.split(':').map(Number);
                      const [shiftEndHour, shiftEndMinute] = shift.endTime.split(':').map(Number);
                      
                      const slotMinutes = slotHour * 60 + slotMinute;
                      const shiftStartMinutes = shiftStartHour * 60 + shiftStartMinute;
                      const shiftEndMinutes = shiftEndHour * 60 + shiftEndMinute;
                      
                      return slotMinutes >= shiftStartMinutes && slotMinutes < shiftEndMinutes;
                    });

                    // Check if this slot is covered by an appointment block
                    const isCoveredByAppointment = appointmentBlocks.some(block => {
                      const [blockStartHour, blockStartMinute] = block.startSlot.split(':').map(Number);
                      const [slotHour, slotMinute] = slot.split(':').map(Number);
                      
                      const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
                      const blockEndMinutes = blockStartMinutes + (block.duration * 10);
                      const slotMinutes = slotHour * 60 + slotMinute;
                      
                      return slotMinutes >= blockStartMinutes && slotMinutes < blockEndMinutes;
                    });

                    // Don't render individual slots if they're covered by appointment blocks
                    if (isCoveredByAppointment) {
                      return null;
                    }

                    return (
                        <div key={slot} className="time-slot-wrapper" style={{ height: `${timeSlotHeightPx}px` }}>
                            <div className={`time-slot ${
                                (!hasShift || !hasValidShifts ? 'no-shift' : 
                                (!isWithinShift ? 'outside-shift' :
                                (unavailableReason ? 'unavailable' : 'empty')))
                            }`}
                                 onClick={hasShift && hasValidShifts && isWithinShift ? () => handleTimeSlotClick(employee.id, slot, currentDate) : undefined}
                                 style={{
                                     cursor: (hasShift && hasValidShifts && isWithinShift) ? 'pointer' : 'not-allowed',
                                     opacity: (!hasShift || !hasValidShifts || !isWithinShift) ? 0.3 : 1,
                                     backgroundColor: (!hasShift || !hasValidShifts) ? '#f3f4f6' : 
                                                   (!isWithinShift ? '#e5e7eb' : '#ffffff') // Light grey for outside shift
                                 }}>
                                
                                {unavailableReason && isWithinShift && (
                                    <div className="unavailable-text">
                                        {unavailableReason.includes("Day Off") ? "DAY OFF" : (unavailableReason.includes("Block") ? "BLOCKED" : "UNAVAIL")}
                                    </div>
                                )}
                                {!hasShift && (
                                    <div className="unavailable-text">
                                        NO SHIFT
                                    </div>
                                )}
                                {hasShift && !hasValidShifts && (
                                    <div className="unavailable-text">
                                        NO HOURS
                                    </div>
                                )}
                                {hasShift && hasValidShifts && !isWithinShift && (
                                    <div className="unavailable-text off-shift-text">
                                        OFF SHIFT
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Render appointment blocks (Fresha style) */}
                {appointmentBlocks.map((block, index) => {
                  const [blockHour, blockMinute] = block.startSlot.split(':').map(Number);
                  const slotIndex = timeSlots.findIndex(slot => {
                    const [slotHour, slotMin] = slot.split(':').map(Number);
                    return slotHour === blockHour && slotMin === blockMinute;
                  });
                  
                  const topPosition = slotIndex * timeSlotHeightPx;

                  return (
                    <div
                      key={`block-${index}`}
                      className="appointment-block fresha-style"
                      style={{
                        position: 'absolute',
                        top: `${topPosition}px`,
                        left: '0',
                        right: '0',
                        height: `${block.height}px`,
                        backgroundColor: block.appointment.color || '#3b82f6', // Use appointment color or blue default
                        borderRadius: '6px',
                        border: `1px solid ${block.appointment.color ? `${block.appointment.color}CC` : '#2563eb'}`,
                        margin: '1px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 10
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
                        time: block.startSlot,
                        professional: employee.name,
                        status: block.appointment.status || 'Confirmed',
                        notes: block.appointment.notes,
                        duration: block.appointment.duration
                      })}
                      onMouseLeave={hideBookingTooltip}
                    >
                      <div className="appointment-block-content">
                        <div className="appointment-block-client" style={{
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '13px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {block.appointment.client}
                        </div>
                        <div className="appointment-block-service" style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {block.appointment.service}
                        </div>
                        <div className="appointment-block-duration" style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '11px',
                          marginTop: '2px'
                        }}>
                          {block.appointment.duration}min
                        </div>
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
                    No appointments
                  </div>
                )}
            </div>
        </div>
    );
};

export default SelectCalendar;