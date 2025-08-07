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
  if (!employee.workSchedule) return false;
  
  const dayName = getDayName(date);
  const schedule = employee.workSchedule[dayName];
  
  return schedule && schedule.isWorking;
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

  // --- HELPER FUNCTIONS ---
  const handleTimeSlotClick = (employeeId, slotTime, day) => {
    // This function is for clicking a slot on the calendar grid
    // Now it behaves the same as the "Add" button - full booking flow
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
      console.log('Fetching services from:', `${Base_url}/bookings/services`);
      const res = await fetch(`${Base_url}/bookings/services`);
      const data = await res.json();
      
      console.log('Services API response:', data);
      
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

  const fetchBookingProfessionals = useCallback(async (serviceId, date) => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const dateStr = date.toISOString().slice(0, 10);
      const url = `${Base_url}/bookings/professionals?service=${serviceId}&date=${dateStr}`;
      console.log('Fetching professionals from:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log('Professionals API response:', data);
      
      if (res.ok && data.success) {
        const allProfessionals = data.data?.professionals || [];
        console.log('Total professionals received:', allProfessionals.length);
        
        // Debug: Log each professional's status
        allProfessionals.forEach((prof, index) => {
          const isActive = prof.user?.isActive !== false;
          const workScheduleForCheck = {
            workSchedule: prof.workSchedule || {}
          };
          const hasShift = hasShiftOnDate(workScheduleForCheck, date);
          
          console.log(`Professional ${index + 1}:`, {
            name: `${prof.user?.firstName} ${prof.user?.lastName}`,
            isActive,
            hasShift,
            workSchedule: prof.workSchedule,
            selectedDate: date.toISOString().split('T')[0],
            dayName: getDayName(date),
            scheduleForDay: prof.workSchedule?.[getDayName(date)]
          });
        });
        
        // Filter out inactive employees and those without shifts on the selected date
        const activeProfessionals = allProfessionals.filter(prof => {
          const isActive = prof.user?.isActive !== false;
          const workScheduleForCheck = {
            workSchedule: prof.workSchedule || {}
          };
          const hasShift = hasShiftOnDate(workScheduleForCheck, date);
          
          // For booking purposes, show all active professionals regardless of shift
          // The backend should handle availability checking
          console.log(`Filtering Professional: ${prof.user?.firstName} - Active: ${isActive}, HasShift: ${hasShift}`);
          
          return isActive; // Only filter by active status for now
        });
        
        console.log('Active professionals with shifts:', activeProfessionals.length);
        
        setAvailableProfessionals(activeProfessionals);
        
        if (activeProfessionals.length === 0 && (data.data?.professionals || []).length > 0) {
          const totalProfessionals = data.data?.professionals || [];
          const inactiveProfessionals = totalProfessionals.filter(prof => prof.user?.isActive === false);
          
          let errorMessage = 'No professionals are available for this service at the selected date.';
          if (inactiveProfessionals.length > 0) {
            errorMessage += ` ${inactiveProfessionals.length} staff members are currently inactive.`;
          }
          if (totalProfessionals.length === inactiveProfessionals.length) {
            errorMessage = 'All professionals for this service are currently inactive.';
          }
          
          setBookingError(errorMessage);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch professionals');
      }
    } catch (err) {
      console.error('Error fetching professionals:', err);
      setBookingError('Failed to fetch professionals: ' + err.message);
      // Fallback to mock data
      setAvailableProfessionals(MOCK_PROFESSIONALS_DATA);
    } finally {
      setBookingLoading(false);
    }
  }, []);

  const fetchBookingTimeSlots = useCallback(async (employeeId, serviceId, date) => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const dateStr = date.toISOString().slice(0, 10);
      const url = `${Base_url}/bookings/time-slots?employeeId=${employeeId}&serviceId=${serviceId}&date=${dateStr}`;
      console.log('Fetching time slots from:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log('Time slots API response:', data);
      
      if (res.ok && data.success) {
        setAvailableTimeSlots(data.data?.timeSlots || []);
      } else {
        throw new Error(data.message || 'Failed to fetch time slots');
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setBookingError('Failed to fetch time slots: ' + err.message);
      // Fallback to mock data
      const mockTimeSlots = MOCK_TIME_SLOTS_DATA.map(slot => ({
        startTime: `${date.toISOString().slice(0, 10)}T${slot.time}:00.000Z`,
        endTime: `${date.toISOString().slice(0, 10)}T${slot.time.split(':')[0]}:${(parseInt(slot.time.split(':')[1]) + 30).toString().padStart(2, '0')}:00.000Z`,
        available: slot.available
      }));
      setAvailableTimeSlots(mockTimeSlots);
    } finally {
      setBookingLoading(false);
    }
  }, []);

  const fetchExistingClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, using mock clients');
        setExistingClients(MOCK_CLIENTS_DATA);
        return;
      }
      
      console.log('Fetching clients from:', `${Base_url}/admin/clients`);
      const res = await fetch(`${Base_url}/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      console.log('Clients API response:', data);
      
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
  const showBookingTooltipHandler = (appointment, event) => {
    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Calculate position
    let top = rect.top + scrollY - tooltipHeight - 10; // Position above by default
    let left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2); // Center horizontally
    
    // Adjust if tooltip goes off screen
    if (top < scrollY + 10) {
      top = rect.bottom + scrollY + 10; // Position below if not enough space above
    }
    
    if (left < scrollX + 10) {
      left = scrollX + 10; // Ensure minimum left margin
    } else if (left + tooltipWidth > scrollX + viewportWidth - 10) {
      left = scrollX + viewportWidth - tooltipWidth - 10; // Ensure minimum right margin
    }
    
    setTooltipPosition({ top, left });
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

      console.log('Booking payload:', JSON.stringify(bookingPayload, null, 2));
      
      const res = await fetch(`${Base_url}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });
      
      const responseData = await res.json();
      console.log('Booking creation response:', responseData);

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

      console.log('Fetching calendar data for:', { startDateParam, endDateParam, currentView });

      const [employeesResponse, bookingsResponse, servicesResponse] = await Promise.all([
        api.get(EMPLOYEES_API_URL),
        api.get(`${BOOKING_API_URL}/admin/all?startDate=${startDateParam}&endDate=${endDateParam}`),
        api.get(SERVICES_API_URL)
      ]);

      console.log('API Responses:', {
        employees: employeesResponse.data,
        bookings: bookingsResponse.data,
        services: servicesResponse.data
      });

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
              
              const timeSlot = startTime.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const slotKey = `${appointmentDate.toISOString().split('T')[0]}_${timeSlot}`;
              
              if (!transformedAppointments[employeeId][slotKey]) {
                transformedAppointments[employeeId][slotKey] = {
                  client: `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''}`.trim(),
                  service: service.service?.name || 'Service',
                  duration: service.service?.duration || service.duration || 30,
                  color: getRandomAppointmentColor(),
                  date: appointmentDate.toISOString().split('T')[0],
                  bookingId: booking._id,
                  status: booking.status || 'confirmed'
                };
              }
            }
          });
        });
        
        console.log('Transformed data:', {
          employees: transformedEmployees.length,
          appointments: Object.keys(transformedAppointments).length
        });
        
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
          
          <div className="staff-grid">
            {currentView === 'Day' && displayEmployees.map(employee => (
                <StaffColumn key={employee.id} employee={employee} timeSlots={timeSlots} appointments={appointments} currentDate={currentDate} isTimeSlotUnavailable={isTimeSlotUnavailable} handleTimeSlotClick={handleTimeSlotClick} showBookingTooltipHandler={showBookingTooltipHandler} hideBookingTooltip={hideBookingTooltip} />
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
                                <span className="no-shift-text">No shift</span>
                              </div>
                            ) : dayAppointments.length > 0 ? (
                              <div className="week-appointments-container">
                                {dayAppointments.slice(0, 3).map((app, index) => (
                                  <div 
                                    key={index} 
                                    className="week-appointment-block" 
                                    style={{ backgroundColor: app.color }}
                                    onClick={() => app.timeSlot && handleTimeSlotClick(employee.id, app.timeSlot, day)}
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
                                onClick={hasShift ? () => {
                                  const defaultTime = "09:00";
                                  handleTimeSlotClick(employee.id, defaultTime, day);
                                } : undefined}
                                style={{ cursor: hasShift ? 'pointer' : 'not-allowed' }}
                              >
                                <span className="add-appointment-plus">{hasShift ? '+' : ''}</span>
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
      
      {showAddBookingModal && (
        <div className="modern-booking-modal">
          <div className="booking-modal-overlay booking-modal-fade-in">
            <div className="booking-modal booking-modal-animate-in">
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
                  <h3>✨ Select Your Service</h3>
                  <div className="booking-modal-list">
                    {availableServices.map(service => (
                      <button key={service._id} className={`booking-modal-list-item${selectedService && selectedService._id === service._id ? ' selected' : ''}`} onClick={() => { setSelectedService(service); setBookingStep(2); fetchBookingProfessionals(service._id, currentDate); }}>
                        <div className="booking-modal-item-name">{service.name}</div>
                        <div className="booking-modal-list-desc">{service.duration} minutes • AED {service.price}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Professional Selection Step */}
              {bookingStep === 2 && (
                <>
                  <h3>👨‍⚕️ Choose Your Professional</h3>
                  <div className="booking-modal-list">
                    {availableProfessionals.map(prof => (
                      <button key={prof._id} className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}`} onClick={() => { setSelectedProfessional(prof); setBookingStep(3); fetchBookingTimeSlots(prof._id, selectedService._id, currentDate); }}>
                        <div className="booking-modal-item-name">{prof.user.firstName} {prof.user.lastName}</div>
                        <div className="booking-modal-list-desc">{prof.position} • Expert in {selectedService?.name}</div>
                      </button>
                    ))}
                  </div>
                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => setBookingStep(1)}>← Back</button>
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
                      {bookingLoading ? '✨ Creating Your Luxury Experience...' : '🌟 Confirm Booking 🌟'}
                    </button>
                    <button className="booking-modal-back" onClick={() => setBookingStep(4)}>← Back</button>
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
            top: tooltipPosition.y,
            left: tooltipPosition.x,
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

    return (
        <div key={employee.id} className={`staff-column ${!hasShift ? 'staff-absent' : ''}`}>
            <div className="staff-header">
                <div className="staff-avatar" style={{ backgroundColor: hasShift ? employee.avatarColor : '#9ca3af' }}>
                    {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.charAt(0)}
                </div>
                <div className="staff-info">
                    <div className="staff-name">{employee.name}</div>
                    <div className="staff-position">{employee.position}</div>
                    {!hasShift && <div className="staff-status">No shift</div>}
                </div>
            </div>
            <div className="time-slots-column">
                {timeSlots.map((slot) => {
                    const slotKey = `${dayKey}_${slot}`;
                    const appointment = appointments[employee.id]?.[slotKey];
                    const unavailableReason = isTimeSlotUnavailable(employee.id, slot);

                    return (
                        <div key={slot} className="time-slot-wrapper" style={{ height: `${timeSlotHeightPx}px` }}>
                            <div className={`time-slot ${
                                appointment ? 'appointment' : 
                                (!hasShift ? 'no-shift' : 
                                (unavailableReason ? 'unavailable' : 'empty'))
                            }`}
                                 onClick={hasShift ? () => handleTimeSlotClick(employee.id, slot, currentDate) : undefined}
                                 onMouseEnter={appointment ? (e) => showBookingTooltipHandler(e, {
                                     client: appointment.client,
                                     service: appointment.service,
                                     time: slot,
                                     professional: employee.name,
                                     status: appointment.status || 'Confirmed',
                                     notes: appointment.notes
                                 }) : null}
                                 onMouseLeave={appointment ? hideBookingTooltip : null}
                                 style={{
                                     ...(appointment ? { backgroundColor: appointment.color } : {}),
                                     cursor: hasShift ? 'pointer' : 'not-allowed'
                                 }}>
                                {appointment && <div className="appointment-text">{appointment.client} - {appointment.service}</div>}
                                {unavailableReason && !appointment && (
                                    <div className="unavailable-text">
                                        {unavailableReason.includes("Day Off") ? "DAY OFF" : (unavailableReason.includes("Block") ? "BLOCKED" : "UNAVAIL")}
                                    </div>
                                )}
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