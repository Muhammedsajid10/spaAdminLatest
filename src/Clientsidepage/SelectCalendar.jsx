import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';
import './SelectCalendar.css';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Calendar as CalendarIcon,
  LayoutGrid,
  ListTodo,
} from "lucide-react";
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import 'react-day-picker/dist/style.css';
import { DayPicker } from 'react-day-picker';

dayjs.extend(weekOfYear);

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
    { id: 'e1', name: 'margaritta Balute', position: 'Stylist', avatar: 'https://i.pravatar.cc/150?img=1', avatarColor: '#f97316', unavailablePeriods: [] },
    { id: 'e2', name: 'Icha Faradisa', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=2', avatarColor: '#22c55e', unavailablePeriods: [] },
    { id: 'e3', name: 'Nining Niken', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=3', avatarColor: '#8b5cf6', unavailablePeriods: [] },
    { id: 'e4', name: 'Onni', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=4', avatarColor: '#0ea5e9', unavailablePeriods: [] },
    { id: 'e5', name: 'Putri Dahlia', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=5', avatarColor: '#ec4899', unavailablePeriods: [] },
    { id: 'e6', name: 'Employee', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=6', avatarColor: '#ef4444', unavailablePeriods: [] },
    { id: 'e7', name: 'sarita Lamsal', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=7', avatarColor: '#f59e0b', unavailablePeriods: [] },
    { id: 'e8', name: 'Intan Arnella', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=8', avatarColor: '#10b981', unavailablePeriods: [] },
    { id: 'e9', name: 'Dayu Eka', position: 'Barber', avatar: 'https://i.pravatar.cc/150?img=9', avatarColor: '#f97316', unavailablePeriods: [] },
  ],
  timeSlots: generateTimeSlots('00:00', '23:50', 10),
  appointments: {
    'e1': {
      '2025-07-29_09:00': { client: 'Client A', service: 'Haircut', duration: 30, color: '#f97316', status: 'upcoming' },
      '2025-07-29_10:30': { client: 'Client B', service: 'Color', duration: 60, color: '#0ea5e9', status: 'in-progress' },
    },
    'e2': {
      '2025-07-29_09:30': { client: 'Client C', service: 'Shave', duration: 15, color: '#22c55e', status: 'completed' },
      '2025-07-29_11:30': { client: 'Client D', service: 'Massage', duration: 45, color: '#8b5cf6', status: 'upcoming' },
    },
    'e7': {
      '2025-07-29_12:30': { client: 'Client E', service: 'Haircut', duration: 30, color: '#ef4444', status: 'in-progress' },
      '2025-07-29_14:00': { client: 'Client F', service: 'Color', duration: 60, color: '#ec4899', status: 'upcoming' },
    },
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

// --- MAIN COMPONENT ---
const SelectCalendar = () => {
  const [employees, setEmployees] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('Day');
  const [selectedStaff, setSelectedStaff] = useState([]); // Array for multi-select
  
  // New States for Header Functionality
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  
  const calendarPickerRef = useRef(null);
  const teamPopupRef = useRef(null);
  const viewDropdownRef = useRef(null);
  const statusPopupRef = useRef(null);
  const dateButtonRef = useRef(null);
  const teamButtonRef = useRef(null);
  const viewButtonRef = useRef(null);
  const statusButtonRef = useRef(null);

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
  const [hoveredSlot, setHoveredSlot] = useState({ employeeId: null, slotTime: null });

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
    const employee = employees.find(emp => emp.id === employeeId);
    
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
      const staff = employees.find(emp => emp.id === employeeId);
      const [hour, minute] = slotTime.split(':').map(Number);
      const startTime = new Date(currentDate);
      startTime.setHours(hour, minute, 0, 0);
      const endTime = new Date(startTime.getTime() + 30 * 60000);
      
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
      
      setIsNewAppointment(true);
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
    setIsNewAppointment(true);
    setShowAddBookingModal(true);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day' || currentView === '3 Day') newDate.setDate(newDate.getDate() - 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() - 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day' || currentView === '3 Day') newDate.setDate(newDate.getDate() + 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() + 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const isTimeSlotUnavailable = (employeeId, slotTime) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return false;

    if (!hasShiftOnDate(employee, currentDate)) {
      return "No shift scheduled";
    }

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

  const fetchBookingServices = useCallback(async () => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/services`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAvailableServices(data.data?.services || []);
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      setBookingError('Failed to fetch services: ' + err.message);
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
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.success) {
        const allProfessionals = data.data?.professionals || [];
        const activeProfessionals = allProfessionals.filter(prof => {
          const isActive = prof.user?.isActive !== false;
          return isActive;
        });
        
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
      setBookingError('Failed to fetch professionals: ' + err.message);
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
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAvailableTimeSlots(data.data?.timeSlots || []);
      } else {
        throw new Error(data.message || 'Failed to fetch time slots');
      }
    } catch (err) {
      setBookingError('Failed to fetch time slots: ' + err.message);
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
        setExistingClients(MOCK_CLIENTS_DATA);
        return;
      }
      
      const res = await fetch(`${Base_url}/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setExistingClients(data.data?.clients || []);
      } else {
        setExistingClients(MOCK_CLIENTS_DATA);
      }
    } catch (error) {
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
    const dropdownHeight = 280;
    const dropdownWidth = 320;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;
    let positionedAbove = false;
    
    if (rect.bottom + dropdownHeight > viewportHeight) {
      top = rect.top + scrollY - dropdownHeight - 8;
      positionedAbove = true;
    }
    
    if (rect.left + dropdownWidth > viewportWidth) {
      left = rect.right + scrollX - dropdownWidth;
    }
    
    if (left < scrollX + 16) {
      left = scrollX + 16;
    }
    
    if (top < scrollY + 16) {
      top = scrollY + 16;
      positionedAbove = false;
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

  const showBookingTooltipHandler = (event, data) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + window.scrollX + rect.width / 2, y: rect.top + window.scrollY });
    setTooltipData(data);
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

  // Close dropdowns and popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoreAppointments && !event.target.closest('.more-appointments-dropdown') && !event.target.closest('.month-more-appointments') && !event.target.closest('.week-more-appointments')) {
        closeMoreAppointmentsDropdown();
      }
      if (showCalendarPicker && calendarPickerRef.current && !calendarPickerRef.current.contains(event.target) && !dateButtonRef.current.contains(event.target)) {
        setShowCalendarPicker(false);
      }
      if (showTeamPopup && teamPopupRef.current && !teamPopupRef.current.contains(event.target) && !teamButtonRef.current.contains(event.target)) {
        setShowTeamPopup(false);
      }
      if (showViewDropdown && viewDropdownRef.current && !viewDropdownRef.current.contains(event.target) && !viewButtonRef.current.contains(event.target)) {
        setShowViewDropdown(false);
      }
      if (showStatusPopup && statusPopupRef.current && !statusPopupRef.current.contains(event.target) && !statusButtonRef.current.contains(event.target)) {
        setShowStatusPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreAppointments, showCalendarPicker, showTeamPopup, showViewDropdown, showStatusPopup]);

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
        finalAmount: selectedService.price,
        paymentMethod: paymentMethod,
        client: clientData,
        notes: '',
        bookingSource: 'admin'
      };
      
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
      
      setBookingSuccess(`✨ Booking created successfully for ${clientName}! Booking ID: ${responseData.data?.booking?.bookingNumber || 'N/A'}`);
      
      setTimeout(() => {
        closeBookingModal();
        fetchCalendarData();
      }, 2500);
      
    } catch (err) {
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

      const [employeesResponse, bookingsResponse, servicesResponse] = await Promise.all([
        api.get(EMPLOYEES_API_URL),
        api.get(`${BOOKING_API_URL}/admin/all?startDate=${startDateParam}&endDate=${endDateParam}`),
        api.get(SERVICES_API_URL)
      ]);

      if (bookingsResponse.data.success && employeesResponse.data.success) {
        const allBookings = bookingsResponse.data.data.bookings || [];
        const employees = employeesResponse.data.data.employees || [];
        
        if (servicesResponse.data.success) {
          setAvailableServices(servicesResponse.data.data.services || []);
        }

        const activeEmployees = employees.filter(emp => emp.user?.isActive !== false);
        
        const transformedEmployees = activeEmployees.map(emp => ({
          id: emp._id || emp.id,
          name: `${emp.user?.firstName || emp.firstName || ''} ${emp.user?.lastName || emp.lastName || ''}`.trim(),
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
        
        setEmployees(transformedEmployees);
        setTimeSlots(generateTimeSlots('00:00', '23:50', 10));
        setAppointments(transformedAppointments);
        setExistingClients(MOCK_CLIENTS_DATA);
      } else {
        throw new Error('Failed to fetch calendar data');
      }
    } catch (err) {
      setError(`Failed to load calendar data: ${err.message}`);
      
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

  useEffect(() => {
    if (showAddBookingModal) {
      setBookingStep(1);
      fetchBookingServices();
      fetchExistingClients();
    }
  }, [showAddBookingModal, fetchBookingServices, fetchExistingClients]);

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
        setBookingDefaults(null);
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

    const timeSlotHeightPx = 12; // Height of each 15-minute slot
    const firstSlotTimeMinutes = 0; // Starts at 00:00
    const currentTimeMinutes = (now.getHours() * 60) + now.getMinutes();
    const minutesIntoSchedule = currentTimeMinutes - firstSlotTimeMinutes;

    if (minutesIntoSchedule < 0) {
      setCurrentTimeLineTop(-100);
      return;
    }

    const minutesPerSlot = 15;
    const topPosition = (minutesIntoSchedule / minutesPerSlot) * timeSlotHeightPx;

    setCurrentTimeLineTop(topPosition);
    setCurrentTimeText(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
  };

  useEffect(() => {
    updateCurrentTimeLine();
    const interval = setInterval(updateCurrentTimeLine, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate, currentView]);

  useEffect(() => {
    const headerTimeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(headerTimeTimer);
  }, []);

  const displayEmployees = employees.filter(emp => selectedStaff.length === 0 || selectedStaff.includes(emp.id));

  const getCalendarDays = () => {
    if (currentView === 'Day') {
      return [currentDate];
    } else if (currentView === 'Week' || currentView === '3 Day') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      
      const numDays = currentView === '3 Day' ? 3 : 7;
      
      return Array.from({ length: numDays }, (_, i) => {
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
  const getSelectedMonth = () => currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

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
            
            employees.forEach(emp => {
              if (appointments[emp.id]) {
                Object.entries(appointments[emp.id]).forEach(([slotKey, appointment]) => {
                  if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
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
  dayjs.extend(weekOfYear);

// const formatTime = (time) => time; 

// dayjs.extend(weekOfYear);



const WeekCalendarGrid = ({ employees, appointments, currentDate }) => {
    const [hoveredAppointment, setHoveredAppointment] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    const startOfWeek = dayjs(currentDate).startOf('week').toDate();
    const weekDays = Array.from({ length: 7 }, (_, i) => dayjs(startOfWeek).add(i, 'day').toDate());

    const handleMouseEnter = (event, appointment) => {
        setHoveredAppointment(appointment);
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            top: rect.top + window.scrollY - 10,
            left: rect.left + window.scrollX + rect.width / 2,
        });
    };

    const handleMouseLeave = () => {
        setHoveredAppointment(null);
    };

    const getDayName = (date) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    };

    return (
        <div className="calendar-grid-container-final">
            {/* Top-left corner space */}
            <div className="grid-cell-header-space"></div>
            
            {/* Day headers */}
            {weekDays.map(day => (
                <div key={day.toISOString()} className="grid-cell-day-header">
                    <div className="week-day-date">{day.getDate()}</div>
                    <div className="week-day-name">{day.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                </div>
            ))}

            {/* Employee rows and appointment slots */}
            {employees.map(employee => (
                <React.Fragment key={employee.id}>
                    {/* Employee info panel */}
                    <div className="grid-cell-employee-info">
                        <div className="week-employee-avatar" style={{ backgroundColor: employee.avatarColor }}>
                            {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.charAt(0)}
                        </div>
                        <div className="week-employee-text">
                            <div className="week-employee-name">{employee.name}</div>
                            <div className="week-employee-position">{employee.position}</div>
                        </div>
                    </div>

                    {/* Schedule slots for each day */}
                    {weekDays.map(day => {
                        const dayKey = day.toISOString().split('T')[0];
                        const dailyAppointments = Object.entries(appointments[employee.id] || {})
                            .filter(([key]) => key.startsWith(dayKey))
                            .map(([key, app]) => ({ ...app, time: key.split('_')[1] }));

                        // Calculate the maximum height for this employee's row
                        let maxRowHeight = 0;
                        dailyAppointments.forEach(appointment => {
                             const [hours, minutes] = appointment.time.split(':').map(Number);
                             const endMinutes = hours * 60 + minutes + appointment.duration;
                             if (endMinutes > maxRowHeight) {
                                 maxRowHeight = endMinutes;
                             }
                        });

                        return (
                            <div key={dayKey} className="grid-cell-schedule-day">
                                {dailyAppointments.map(appointment => {
                                    const [hours, minutes] = appointment.time.split(':').map(Number);
                                    const topPosition = (hours * 60 + minutes); // 1px per minute

                                    return (
                                        <div
                                            key={appointment.bookingId || `${dayKey}_${appointment.time}`}
                                            className="week-appointment-block-final"
                                            style={{
                                                backgroundColor: appointment.color,
                                                height: `${appointment.duration}px`,
                                                top: `${topPosition}px`,
                                            }}
                                            onMouseEnter={(e) => handleMouseEnter(e, appointment)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <span className="appointment-time">{appointment.time}</span>
                                            <span className="week-appointment-client-name">{appointment.client}</span>
                                            <span className="week-appointment-service-name">{appointment.service}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}

            {/* Hover tooltip for appointment details */}
            {hoveredAppointment && (
                <div
                    className="week-appointment-tooltip-final"
                    style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
                >
                    <div className="tooltip-title">{hoveredAppointment.client}</div>
                    <div className="tooltip-details">
                        <span className="tooltip-service">{hoveredAppointment.service}</span>
                        <span className="tooltip-time">{hoveredAppointment.time}</span>
                    </div>
                </div>
            )}
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
    }else if(currentView === 'Week' ) {
        return <WeekCalendarGrid employees={employees} appointments={appointments} currentDate={currentDate} onTimeSlotClick={handleTimeSlotClick} />;
    }


    // New Grid Layout
    return (
        <div className="calendar-grid-container">
            <div className="time-column">
                <div className="time-header-space"></div>
                <div className="time-slots-only">
                    {generateTimeSlots('00:00', '23:00', 60).map(slot => (
                        <div key={slot} className="time-slot-label-new">
                            {slot}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="main-calendar-scroll-wrapper">
                <div className="staff-grid-header">
                    {displayEmployees.map(employee => (
                        <div key={employee.id} className="staff-header">
                            <div className="staff-avatar" style={{ backgroundColor: employee.avatarColor }}>
                                {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.charAt(0)}
                            </div>
                            <div className="staff-info">
                                <div className="staff-name">{employee.name}</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="main-calendar-grid">
                    {displayEmployees.map(employee => (
                        <div key={employee.id} className="employee-column">
                            {generateTimeSlots('00:00', '23:45', 15).map(slot => {
                                const slotKey = `${currentDate.toISOString().split('T')[0]}_${slot}`;
                                const appointment = appointments[employee.id]?.[slotKey];
                                const unavailableReason = isTimeSlotUnavailable(employee.id, slot);

                                return (
                                    <div key={slot}
                                        className={`appointment-slot-cell ${appointment ? 'has-appointment' : ''} ${unavailableReason ? 'is-unavailable' : ''}`}
                                        onClick={hasShiftOnDate(employee, currentDate) ? () => handleTimeSlotClick(employee.id, slot, currentDate) : undefined}
                                        onMouseEnter={() => setHoveredSlot({ employeeId: employee.id, slotTime: slot })}
                                        onMouseLeave={() => setHoveredSlot({ employeeId: null, slotTime: null })}
                                        style={{
                                          cursor: hasShiftOnDate(employee, currentDate) ? 'pointer' : 'not-allowed',
                                        }}
                                    >
                                        {appointment && <div className="appointment-block" style={{ backgroundColor: appointment.color }} >
                                            <span className="appointment-client-name">{appointment.client}</span>
                                            <span className="appointment-service-name">{appointment.service}</span>
                                        </div>}
                                        {hoveredSlot.employeeId === employee.id && hoveredSlot.slotTime === slot && <span className="hover-time-indicator">{slot}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    {currentView === 'Day' && <div className="current-time-line" style={{ top: `${currentTimeLineTop}px` }}>
                        <span className="current-time-marker">{currentTimeText}</span>
                    </div>}
                </div>
            </div>
        </div>
    );
  };
  
  // New components for header logic
  const CalendarDatePopup = ({ date, setDate, onClose }) => {
    const handleInXWeeks = (weeks) => {
        const newDate = dayjs(date).add(weeks, 'week').toDate();
        setDate(newDate);
        onClose();
    };

    return (
      <div className="calendar-popup" ref={calendarPickerRef}>
        <div className="calendar-picker-header">
            <div className="month-nav">
                <button onClick={() => setDate(dayjs(date).subtract(1, 'month').toDate())}><ChevronLeft size={16} /></button>
                <div className="current-month-year">
                    <span>{dayjs(date).format('MMMM')}</span>
                    <span>{dayjs(date).format('YYYY')}</span>
                </div>
                <button onClick={() => setDate(dayjs(date).add(1, 'month').toDate())}><ChevronRight size={16} /></button>
            </div>
        </div>
        <DayPicker
          mode="single"
          selected={date}
          onSelect={day => {
            if (day) {
              setDate(day);
              onClose();
            }
          }}
          modifiersClassNames={{ selected: 'selected-day' }}
        />
        <div className="calendar-popup-footer">
            <button className="week-shortcut-btn" onClick={() => handleInXWeeks(1)}>In 1 week</button>
            <button className="week-shortcut-btn" onClick={() => handleInXWeeks(2)}>In 2 weeks</button>
            <button className="week-shortcut-btn" onClick={() => handleInXWeeks(3)}>In 3 weeks</button>
            <button className="week-shortcut-btn" onClick={() => handleInXWeeks(4)}>In 4 weeks</button>
            <button className="week-shortcut-btn" onClick={() => handleInXWeeks(5)}>In 5 weeks</button>
        </div>
      </div>
    );
  };

  const TeamMemberPopup = ({ employees, selectedStaff, setSelectedStaff, onClose }) => {
    const handleToggleStaff = (employeeId) => {
      setSelectedStaff(prev => {
        const newSelection = prev.includes(employeeId)
          ? prev.filter(id => id !== employeeId)
          : [...prev, employeeId];
        return newSelection;
      });
    };

    const handleClearAll = () => {
      setSelectedStaff([]);
    };
    
    return (
      <div className="team-popup" ref={teamPopupRef}>
        <div className="team-popup-header">
            <div className="team-status-options">
                <div className="team-status-btn active">Scheduled team</div>
                <div className="team-status-btn">All team</div>
            </div>
        </div>
        <div className="team-members-list-wrapper">
            <div className="popup-subtitle">Team members</div>
            <button className="clear-all-btn" onClick={handleClearAll}>Clear all</button>
        </div>
        <div className="team-members-list">
          {employees.map(emp => (
            <div
              key={emp.id}
              className={`team-member-item ${selectedStaff.includes(emp.id) ? 'selected' : ''}`}
              onClick={() => handleToggleStaff(emp.id)}
            >
              <input type="checkbox" checked={selectedStaff.includes(emp.id)} readOnly />
              <div className="team-member-avatar" style={{ backgroundColor: emp.avatarColor }}>
                {emp.avatar ? <img src={emp.avatar} alt={emp.name} className="avatar-image" /> : emp.name.charAt(0)}
              </div>
              <span className="team-member-name">{emp.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AppointmentStatusPopup = ({ onClose }) => {
    const statuses = [
      { id: 'upcoming', label: 'Upcoming', color: '#0ea5e9' },
      { id: 'in-progress', label: 'In Progress', color: '#f59e0b' },
      { id: 'completed', label: 'Completed', color: '#22c55e' },
      { id: 'cancelled', label: 'Cancelled', color: '#ef4444' },
    ];
    
    const [activeStatuses, setActiveStatuses] = useState([]);
    
    const handleStatusToggle = (statusId) => {
        setActiveStatuses(prev => prev.includes(statusId) ? prev.filter(id => id !== statusId) : [...prev, statusId]);
    };

    return (
      <div className="status-popup" ref={statusPopupRef}>
        <div className="status-options-list">
            {statuses.map(status => (
                <div key={status.id}
                     className={`status-item ${activeStatuses.includes(status.id) ? 'active' : ''}`}
                     onClick={() => handleStatusToggle(status.id)}>
                    <div className="status-indicator" style={{ backgroundColor: status.color }}></div>
                    <span className="status-label">{status.label}</span>
                </div>
            ))}
        </div>
      </div>
    );
  };
  
  const ViewDropdown = ({ currentView, setCurrentView, onClose }) => {
    const viewOptions = [
      { id: 'Day', label: 'Day', icon: <CalendarIcon size={16} /> },
    //   { id: '3 Day', label: '3 Day', icon: <ListTodo size={16} /> },
      { id: 'Week', label: 'Week', icon: <LayoutGrid size={16} /> },
      { id: 'Month', label: 'Month', icon: <CalendarIcon size={16} /> },
    ];

    return (
      <div className="view-dropdown" ref={viewDropdownRef}>
        {viewOptions.map(option => (
            <div key={option.id}
                 className={`view-option ${currentView === option.id ? 'active' : ''}`}
                 onClick={() => { setCurrentView(option.id); onClose(); }}>
              {option.icon} {option.label}
            </div>
        ))}
      </div>
    );
  };

  const getDayOrWeekDisplay = (view) => {
    const today = dayjs(currentDate);
    if (view === 'Day') {
        return today.format('ddd DD MMM');
    }
    const startOfWeek = today.startOf('week');
    const endOfWeek = today.endOf('week');
    return `${startOfWeek.format('D MMM')} - ${endOfWeek.format('D MMM')}`;
  };
  
  const getMonthDisplay = () => currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const handleViewChange = (view) => {
      setCurrentView(view);
      setShowViewDropdown(false);
  };
  
  return (
    <div className="scheduler-root">
      <div className="main-header-toolbar">
        <div className="toolbar-left">
          <button className="action-btn-today" onClick={goToToday}>Today</button>
        </div>
        <div className="toolbar-center">
          <button className="nav-arrow-btn" onClick={goToPrevious} aria-label="Previous Day/Week">
            <ChevronLeft size={16} />
          </button>
          
          <div className="date-display-wrapper">
            <button
              className="date-display-btn"
              onClick={() => setShowCalendarPicker(prev => !prev)}
              ref={dateButtonRef}
            >
                {currentView === 'Month' ? getMonthDisplay() : getDayOrWeekDisplay(currentView)}
            </button>
            {showCalendarPicker && (
              <CalendarDatePopup date={currentDate} setDate={setCurrentDate} onClose={() => setShowCalendarPicker(false)} />
            )}
          </div>
          
          <button className="nav-arrow-btn" onClick={goToNext} aria-label="Next Day/Week">
            <ChevronRight size={16} />
          </button>
          
          <button
            className={`tool-icon-btn ${showTeamPopup ? 'active' : ''}`}
            onClick={() => setShowTeamPopup(prev => !prev)}
            ref={teamButtonRef}
          >
            <Users size={18} />
          </button>
          {showTeamPopup && (
            <TeamMemberPopup
                employees={employees}
                selectedStaff={selectedStaff}
                setSelectedStaff={setSelectedStaff}
                onClose={() => setShowTeamPopup(false)}
            />
          )}

          <button
            className={`tool-icon-btn ${showStatusPopup ? 'active' : ''}`}
            onClick={() => setShowStatusPopup(prev => !prev)}
            ref={statusButtonRef}
          >
            <CalendarIcon size={18} />
          </button>
          {showStatusPopup && (
            <AppointmentStatusPopup onClose={() => setShowStatusPopup(false)} />
          )}
          
        </div>
        <div className="toolbar-right">
          <button className={`day-view-selector-btn ${showViewDropdown ? 'active' : ''}`}
            onClick={() => setShowViewDropdown(prev => !prev)}
            ref={viewButtonRef}
          >
            {currentView}
            <ChevronRight size={16} className="rotate-90" />
          </button>
          {showViewDropdown && (
            <ViewDropdown currentView={currentView} setCurrentView={handleViewChange} onClose={() => setShowViewDropdown(false)} />
          )}
          <button className="add-booking-btn primary-btn" onClick={handleAddAppointment}>
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="scheduler-content-wrapper" ref={schedulerContentRef}>
        {renderCalendarContent()}
      </div>
      
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

              {bookingStep === 4 && (
                <>
                  <h3>👤 Client Information</h3>
                  
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
      
      {showBookingTooltip && tooltipData && (
        <div
          className="booking-tooltip"
          style={{
            position: 'absolute',
            top: tooltipPosition.y,
            left: tooltipPosition.x,
            zIndex: 10000,
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

export default SelectCalendar;
