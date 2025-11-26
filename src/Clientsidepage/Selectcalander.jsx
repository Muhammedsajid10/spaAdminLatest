import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import Loading from '../states/Loading.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { useDatePickerState, hasShiftOnDate, getEmployeeShiftHours, getAppointmentColorByStatus, localDateKey, formatDateLocal, getDayName, WeekDayColumn, BookingTooltip, TimeHoverTooltip, MoreAppointmentsDropdown } from '../calendar';
import { StaffColumn } from '../calendar/components/StaffColumn';
import ClientSummary from '../calendar/components/ClientInformation.jsx';
import AdminMembershipChecker from '../calendar/components/AdminMembershipChecker.jsx';
import { MdDelete } from "react-icons/md";
import {
  formatUTCToLocal,
  generateTimeSlots,
  formatTime,
  getRandomColor,
  getRandomAppointmentColor,
  calculateAppointmentHeight,
  generateTimeSlotsFromEmployeeShift,
  getValidTimeSlotsForProfessional,
  getAvailableProfessionalsForService,
  getAccumulatedBookings,
  addMinutesToTime,
  isTimeSlotConflicting,
  timeToMinutes,
  detectProfessionalConflict,
  getAvailableTimeSlotsWithAccumulatedBookings,
  getAvailableProfessionalsWithAccumulatedBookings,
  getAvailableTimeSlotsForProfessional,
  getDatePickerCalendarDays,
  getWeeksInMonth,
  getMonthsInYear
} from './helpers/selectCalendarHelpers';
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
  X,
  Edit2,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Hash,
  FileText,
  Timer,
  Gift,
  Crown,
  Trash2,
  Mail,
  Phone,
  Tag,
  Landmark
} from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import Error500Page from '../states/ErrorPage';
import NoDataState from '../states/NoData';
import { addAppointmentToSession, removeAppointmentFromSession, clearSession as clearSessionAction, setShowServiceCatalog as setShowServiceCatalogAction } from '../store/bookingSessionSlice';
import { fetchCalendarThunk, fetchServicesThunk } from '../store/thunks';

// --- API ENDPOINTS ---
const BOOKING_API_URL = `${Base_url}/bookings`;
const SERVICES_API_URL = `${Base_url}/services`;
const EMPLOYEES_API_URL = `${Base_url}/employees`;
const CLIENTS_API_URL = `${Base_url}/clients`;
const SelectCalendar = () => {
  // Date / picker state consolidated
  const {
    currentDate, datePickerView, showDatePicker, datePickerCurrentMonth, datePickerSelectedDate,
    setCurrentDate, setDatePickerView, setShowDatePicker, setDatePickerCurrentMonth,
    setDatePickerSelectedDate,
    goToDatePickerPreviousMonth,
    goToDatePickerNextMonth,
    goToDatePickerToday,
    handleDatePickerDateSelect
  } = useDatePickerState(new Date());

  // Booking session (multi services) moved to Redux
  const multipleAppointments = useSelector(state => state.bookingSession.multipleAppointments);
  const currentAppointmentIndex = useSelector(state => state.bookingSession.currentAppointmentIndex);
  const showServiceCatalog = useSelector(state => state.bookingSession.showServiceCatalog);
  const isAddingAdditionalService = useSelector(state => state.bookingSession.isAddingAdditionalService);
  const dispatch = useDispatch();

  // Price editing states - MUST be declared before getTotalSessionPrice
  const [editingTotalPrice, setEditingTotalPrice] = useState(false);
  const [tempTotalPrice, setTempTotalPrice] = useState('');
  const [customTotalDiscount, setCustomTotalDiscount] = useState(0);

  const setCurrentAppointmentIndex = (idx) => { /* UI-only; kept local for now */ dispatch({ type: 'bookingSession/setCurrentAppointmentIndex', payload: idx }); };
  const setShowServiceCatalog = (val) => dispatch(setShowServiceCatalogAction(val));
  const setIsAddingAdditionalService = (val) => dispatch({ type: 'bookingSession/setIsAddingAdditionalService', payload: val });
  const addAppointmentToSessionLocal = (apt) => dispatch(addAppointmentToSession(apt));
  const removeAppointmentFromSessionLocal = (id) => {
    console.log('🗑️ Removing appointment with ID:', id);
    console.log('Current multipleAppointments:', multipleAppointments.map(a => ({ id: a.id, service: a.service?.name })));
    dispatch(removeAppointmentFromSession(id));
    
    // If this is the last appointment being removed, show the service catalog
    const remainingAppointments = multipleAppointments.filter(apt => apt.id !== id);
    if (remainingAppointments.length === 0) {
      console.log('📋 Last appointment removed, showing service catalog');
      setShowServiceCatalog(true);
    }
  };
  const clearSessionLocal = () => dispatch(clearSessionAction());

  // Total price editing functions
  const startEditingTotalPrice = () => {
    const currentTotal = getTotalSessionPrice();
    setTempTotalPrice(currentTotal.toString());
    setEditingTotalPrice(true);
  };

  const cancelEditingTotalPrice = () => {
    setEditingTotalPrice(false);
    setTempTotalPrice('');
  };

  const saveEditedTotalPrice = () => {
    const originalTotal = multipleAppointments.reduce((sum, a) => {
      const price = (a && (a.price ?? a.service?.price ?? 0)) || 0;
      return sum + Number(price || 0);
    }, 0);
    
    const newTotal = parseFloat(tempTotalPrice);
    if (!isNaN(newTotal) && newTotal >= 0) {
      const discount = originalTotal - newTotal;
      setCustomTotalDiscount(discount);
      setEditingTotalPrice(false);
      setTempTotalPrice('');
    }
  };

  const clearCustomDiscount = () => {
    setCustomTotalDiscount(0);
  };

  // Week and Month navigation functions for date picker
  const goToDatePickerPreviousWeek = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setDate(newDate.getDate() - 7);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const goToDatePickerNextWeek = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setDate(newDate.getDate() + 7);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const goToDatePickerPreviousYear = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const goToDatePickerNextYear = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  // Week selection handler
  const handleWeekSelect = useCallback((weekStartDate) => {
    setCurrentDate(weekStartDate);
    setDatePickerSelectedDate(weekStartDate);
    setShowDatePicker(false);
  }, [setCurrentDate, setDatePickerSelectedDate, setShowDatePicker]);

  // Month selection handler
  const handleMonthSelect = useCallback((month, year) => {
    const selectedDate = new Date(year, month, 1);
    setCurrentDate(selectedDate);
    setDatePickerSelectedDate(selectedDate);
    setShowDatePicker(false);
  }, [setCurrentDate, setDatePickerSelectedDate, setShowDatePicker]);

  // Calculate total session price from Redux booking session
  const getTotalSessionPrice = useCallback(() => {
    if (!Array.isArray(multipleAppointments)) return 0;
    const originalTotal = multipleAppointments.reduce((sum, a) => {
      // Use original price (not custom price)
      const price = (a && (a.price ?? a.service?.price ?? 0)) || 0;
      return sum + Number(price || 0);
    }, 0);
    // Apply custom discount to total
    return Math.max(0, originalTotal - customTotalDiscount);
  }, [multipleAppointments, customTotalDiscount]);

  // Core scheduler state (moved to Redux)
  const employees = useSelector(state => state.employees.list);
  const employeesLoading = useSelector(state => state.employees.loading);
  const employeesError = useSelector(state => state.employees.error);
  const timeSlots = useSelector(state => state.calendar.timeSlots);
  const loading = useSelector(state => state.calendar.loading);
  const error = useSelector(state => state.calendar.error);
  const selectedStaff = useSelector(state => state.calendar.selectedStaff);
  const appointments = useSelector(state => state.appointments.byEmployee);
  const [currentView, setCurrentView] = useState('Day');

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

  // Store last selected values for navigation back
  const [lastSelectedService, setLastSelectedService] = useState(null);
  const [lastSelectedProfessional, setLastSelectedProfessional] = useState(null);
  const [lastAddedAppointmentId, setLastAddedAppointmentId] = useState(null);

  // Form States
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Signal to force membership checker to refetch from server
  const [membershipRefreshSignal, setMembershipRefreshSignal] = useState(0);

  // Date selection for booking modal (especially for week view)
  const [selectedBookingDate, setSelectedBookingDate] = useState(null);
  const [showBookingDatePicker, setShowBookingDatePicker] = useState(false);

  // Payment detail & redemption states
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [availableGiftCards, setAvailableGiftCards] = useState([]); // [{_id, code, remainingValue}]
  const [availableMemberships, setAvailableMemberships] = useState([]); // [{_id, name, status, expiresAt}]

  // Membership integration states
  const [appliedMembership, setAppliedMembership] = useState(null);
  const [membershipDiscountAmount, setMembershipDiscountAmount] = useState(0);
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [redeemGiftCardAmount, setRedeemGiftCardAmount] = useState(0);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitsError, setBenefitsError] = useState(null);

  // Session UI extras
  const [giftCardCode, setGiftCardCode] = useState('');
  const [showAppointmentSummary, setShowAppointmentSummary] = useState(false);

  // Enhanced Gift Card Flow States
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardAppliedAmount, setGiftCardAppliedAmount] = useState(0);
  const [isWalkIn, setIsWalkIn] = useState(false);

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
    // First filter out "Allora Spa Dubai" staff
    let filtered = employees.filter(emp => 
      emp.name !== 'Allora Spa Dubai' && 
      emp.name?.toLowerCase() !== 'allora spa dubai'
    );

    // Apply team filter
    if (teamFilter === 'scheduled') {
      filtered = filtered.filter(emp => hasShiftOnDate(emp, currentDate));
    } else if (teamFilter === 'active') {
      filtered = filtered.filter(emp => emp.isActive !== false);
    } else if (teamFilter === 'inactive') {
      filtered = filtered.filter(emp => emp.isActive === false);
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
    const dayKey = localDateKey(day || currentDate);
    const slotKey = `${dayKey}_${slotTime}`;
    const existingAppointment = appointments[employeeId]?.[slotKey];
    console.log('Time slot clicked - Employee:', employeeId, 'Time:', slotTime, 'Day:', day);

    // CUTOFF CHECK: Block any booking starting at or after 23:00
    const [hours] = slotTime.split(':').map(Number);
    if (hours >= 23) {
      console.log('🚫 Booking blocked - Time slot at', slotTime, 'is past cutoff (23:00)');
      setUnavailableMessage('Bookings cannot start at or after 23:00. Please select an earlier time slot.');
      setShowUnavailablePopup(true);
      return;
    }

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

    // Store the clicked employee, time slot, and date as defaults for pre-selection
    const staff = employees.find(emp => emp.id === employeeId);
    if (!staff) {
      console.error('Employee not found in state for ID:', employeeId);
      return;
    }

    const bookingDate = day || currentDate;

    // Enhanced booking defaults with normalized professional object
    setBookingDefaults({
      professional: {
        _id: staff._id || staff.id,
        id: staff.id,
        user: {
          firstName: staff.name.split(' ')[0],
          lastName: staff.name.split(' ')[1] || ''
        },
        name: staff.name,
        position: staff.position,
        ...staff
      },
      time: slotTime,
      date: bookingDate,
      isDirectTimeSlotSelection: true // Flag to indicate this was a direct time slot click
    });

    // Set the booking date for the modal
    setSelectedBookingDate(bookingDate);
    setIsNewAppointment(true);
    setShowAddBookingModal(true);
  };

  // ... (inside SelectCalendar component)

  const handleServiceSelect = (service) => {
    console.log('🎯 SERVICE SELECTED:', service.name);
    console.log('isAddingAdditionalService:', isAddingAdditionalService);
    console.log('Current multipleAppointments count:', multipleAppointments.length);
    setBookingError(null);

    // NEW LOGIC: If user clicked a time slot (bookingDefaults set with time), auto-assign professional & chained time without further steps
    if (bookingDefaults?.professional && bookingDefaults?.time) {
      const prof = bookingDefaults.professional;
      // Normalize professional object to include _id
      const professionalObj = { ...prof, _id: prof._id || prof.id };

      // Determine start time (first service uses clicked slot; subsequent services chain from last end)
      let startTime;
      if (multipleAppointments.length === 0) {
        startTime = bookingDefaults.time;
      } else {
        const last = multipleAppointments[multipleAppointments.length - 1];
        startTime = addMinutesToTime(last.timeSlot, last.duration);
      }
      const endTime = addMinutesToTime(startTime, service.duration);

      // Conflict detection BEFORE shift fit check / creation
      const bookingDate = bookingDefaults?.date || selectedBookingDate || currentDate;
      const conflict = detectProfessionalConflict(professionalObj._id || professionalObj.id, bookingDate, startTime, service.duration, appointments, multipleAppointments);
      if (conflict) {
        const conflictStartStr = `${String(Math.floor(conflict.start / 60)).padStart(2, '0')}:${String(conflict.start % 60).padStart(2, '0')}`;
        const conflictEndStr = `${String(Math.floor(conflict.end / 60)).padStart(2, '0')}:${String(conflict.end % 60).padStart(2, '0')}`;
        setBookingError(`Time conflict: ${prof.name || 'Professional'} already has a booking from ${conflictStartStr} to ${conflictEndStr}. Choose another start time or remove the conflicting service.`);
        return;
      }

      // Validate against professional shift blocks
      const employeeFull = employees.find(e => (e.id === professionalObj.id) || (e._id === professionalObj._id));
      const dayName = getDayName(bookingDate);
      const schedule = employeeFull?.workSchedule?.[dayName];

      const fitsInShift = (() => {
        if (!schedule) return false;
        const blocks = [];
        if (schedule.shifts && typeof schedule.shifts === 'string') {
          schedule.shifts.split(',').map(s => s.trim()).filter(Boolean).forEach(seg => {
            const parts = seg.split('-');
            if (parts.length === 2) {
              const sT = parts[0].trim();
              const eT = parts[1].trim();
              blocks.push({ start: sT, end: eT });
            }
          });
        }
        if (blocks.length === 0 && schedule.startTime && schedule.endTime) {
          blocks.push({ start: schedule.startTime, end: schedule.endTime });
        }
        if (blocks.length === 0 && Array.isArray(schedule.shiftsData)) {
          schedule.shiftsData.forEach(sh => blocks.push({ start: sh.startTime, end: sh.endTime }));
        }
        const startM = timeToMinutes(startTime);
        const endM = timeToMinutes(endTime);
        return blocks.some(b => {
          const bStart = timeToMinutes(b.start);
          const bEnd = timeToMinutes(b.end);
          return startM >= bStart && endM <= bEnd;
        });
      })();

      if (!fitsInShift) {
        setBookingError(`Selected service (${service.duration}m) does not fit in available shift time starting at ${startTime}.`);
        return;
      }

      // Build appointment object and add to session
      const newAppointment = {
        id: `temp_${Date.now()}_${Math.random()}`,
        service,
        professional: professionalObj,
        timeSlot: startTime,
        date: bookingDate,
        duration: service.duration,
        price: service.price,
        startTime,
        endTime
      };
      addAppointmentToSessionLocal(newAppointment);
      // Persist selected professional for potential later use
      setSelectedProfessional(professionalObj);
      setSelectedService(null); // We store service in appointment card instead
      // Remain on step 1 (service/cards view) for adding more services
      setBookingStep(1);
      setShowServiceCatalog(false);
      return;
    }

    // NEW LOGIC: If user selected employee but no specific time (from week view cell click), skip professional selection
    if (bookingDefaults?.professional && bookingDefaults?.isDirectEmployeeSelection) {
      const professionalToSet = bookingDefaults.professional;
      const bookingDate = bookingDefaults?.date || selectedBookingDate || currentDate;
      const professionalId = professionalToSet.id || professionalToSet._id;
      
      console.log('🎯 Week view flow: Service selected, professional pre-set:', {
        professional: professionalToSet.name || professionalToSet.user?.firstName,
        professionalId: professionalId,
        service: service.name,
        serviceId: service._id,
        date: bookingDate,
        employeesCount: employees.length
      });
      
      // Find the actual employee object from employees array (important for helper functions)
      const actualEmployee = employees.find(emp => 
        emp.id === professionalId || 
        emp._id === professionalId ||
        emp.id === professionalToSet.id ||
        emp._id === professionalToSet._id
      );
      
      console.log('🔍 Found actual employee:', {
        found: !!actualEmployee,
        employeeName: actualEmployee?.name,
        hasWorkSchedule: !!actualEmployee?.workSchedule,
        workSchedule: actualEmployee?.workSchedule
      });
      
      if (!actualEmployee) {
        console.error('❌ Could not find employee in employees array!', {
          searchingFor: professionalId,
          availableIds: employees.map(e => ({ id: e.id, _id: e._id, name: e.name }))
        });
      }
      
      // Set all required state before moving to step 3
      setSelectedService(service);
      setSelectedProfessional(actualEmployee || professionalToSet); // Use actual employee if found
      setSelectedBookingDate(bookingDate); // Important: set the booking date
      
      // Generate time slots immediately using the local function with CORRECT parameters
      const timeSlots = getAvailableTimeSlotsForProfessional(
        actualEmployee || professionalToSet,  // employee object (not ID)
        bookingDate,                          // date
        service.duration,                     // service duration in minutes
        appointments                          // appointments object
      );
      
      console.log('✅ Generated time slots for week view booking:', {
        count: timeSlots.length,
        samples: timeSlots.slice(0, 3),
        allSlots: timeSlots
      });
      setAvailableTimeSlots(timeSlots);
      
      // Now move to step 3 with time slots already populated
      setBookingStep(3);
      return;
    }

    // Fallback: original multi-step flow when no pre-selected professional/time
    setSelectedService(service);
    setBookingStep(2);
    const bookingDate = selectedBookingDate || currentDate;
    const professionals = getAvailableProfessionalsForService(
      service._id,
      bookingDate,
      employees,
      appointments,
      availableServices
    );
    setAvailableProfessionals(professionals);
  };

  const closeBookingModal = () => {
    setShowAddBookingModal(false);
    setShowUnavailablePopup(false);

    // Reset all form state and clear multiple appointments session
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
    setIsWalkIn(false);
    setClientInfo({ name: '', email: '', phone: '' });
    setBookingDefaults(null);
    setSelectedBookingDate(null);
    setShowBookingDatePicker(false);

    // Clear multiple appointments session when closing modal
    dispatch(clearSessionAction());
    
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

  const handleBookingStatusUpdate = async (newStatus) => {
    console.log('🔄 Status update initiated:', {
      newStatus,
      selectedBooking: selectedBookingForStatus,
      bookingId: selectedBookingForStatus?.bookingId,
      serviceEntryId: selectedBookingForStatus?.serviceEntryId
    });

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

      const bookingId = selectedBookingForStatus.bookingId;
      const serviceEntryId = selectedBookingForStatus.serviceEntryId; // sub-document id

      // Use per-service status endpoint if serviceEntryId present
      const endpoint = serviceEntryId
        ? `${Base_url}/bookings/admin/${bookingId}/service/${serviceEntryId}/status`
        : `${Base_url}/bookings/admin/${bookingId}`; // fallback whole booking

      console.log('🚀 API Request:', {
        endpoint,
        method: 'PATCH',
        body: { status: newStatus },
        hasToken: !!token
      });

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('📡 API Response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      const data = await res.json();
      console.log('📄 Response Data:', data);

      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to update booking status (HTTP ${res.status})`);
      }

      // BACKEND STATUS MAPPING: Service-level vs Booking-level status handling
      // Service level uses: scheduled, confirmed, arrived, in-progress, completed, cancelled, no-show
      // Booking level uses: booked, confirmed, arrived, started, in-progress, completed, cancelled, no-show
      // When we send 'confirmed' it stays as 'confirmed' at both levels
      const backendStatusMapping = {
        'booked': 'booked',           // Maps to booking-level 'booked'
        'confirmed': 'confirmed',     // Maps to booking-level 'confirmed'  
        'arrived': 'arrived',         // Maps to booking-level 'arrived'
        'started': 'started',         // Maps to booking-level 'started'
        'in-progress': 'started',     // Maps to booking-level 'started'
        'completed': 'completed',     // Maps to booking-level 'completed'
        'cancelled': 'cancelled',     // Maps to booking-level 'cancelled'
        'no-show': 'no-show'          // Maps to booking-level 'no-show'
      };

      const actualBackendStatus = backendStatusMapping[newStatus] || newStatus;
      console.log('📝 Status mapping:', newStatus, '→', actualBackendStatus);

      // Update only this slot locally with the backend status (Redux)
      try {
        const empId = selectedBookingForStatus.employeeId;
        const slotKey = selectedBookingForStatus.slotKey;
        const updated = { ...appointments };
        if (updated[empId] && updated[empId][slotKey]) {
          updated[empId] = { ...updated[empId], [slotKey]: { ...updated[empId][slotKey], status: actualBackendStatus } };
          dispatch(setAppointments(updated));
        }
      } catch (e) {
        console.warn('Failed to update appointment in redux store', e);
      }

      // Update the selected booking status for immediate UI feedback
      setSelectedBookingForStatus(prev => ({
        ...prev,
        status: actualBackendStatus
      }));

      console.log('✅ Status update successful');

      // Close modal and refresh calendar after a brief delay to show the update
      setTimeout(() => {
        closeBookingStatusModal();
        fetchCalendarData();
      }, 500);
    } catch (err) {
      console.error('❌ Status update error:', err);
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

    const result = await Swal.fire({
      title: 'Delete Booking?',
      text: `Are you sure you want to delete this booking for ${selectedBookingForStatus.client}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    setBookingStatusLoading(true);
    setBookingStatusError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      const id = selectedBookingForStatus.bookingId;
      const serviceEntryId = selectedBookingForStatus.serviceEntryId;
      // Decide endpoint: if serviceEntryId then per-service delete, else whole booking
      const primaryUrl = serviceEntryId
        ? `${Base_url}/bookings/admin/${id}/service/${serviceEntryId}`
        : `${Base_url}/bookings/${id}`;
      const altUrl = serviceEntryId
        ? `${Base_url}/bookings/admin/${id}/service/${serviceEntryId}`
        : `${Base_url}/bookings/admin/${id}`; // fallback (legacy)

      // Optimistic removal: adjust Redux store copy
      try {
        const updated = { ...appointments };
        if (serviceEntryId) {
          const empId = selectedBookingForStatus.employeeId;
          const slotKey = selectedBookingForStatus.slotKey;
          if (updated[empId]) {
            const empSlots = { ...updated[empId] };
            delete empSlots[slotKey];
            if (Object.keys(empSlots).length === 0) delete updated[empId]; else updated[empId] = empSlots;
          }
        } else {
          // Remove every slot referencing bookingId
          Object.keys(updated).forEach(empId => {
            const empSlots = updated[empId];
            const newEmp = { ...empSlots };
            let changed = false;
            Object.keys(newEmp).forEach(k => {
              if (newEmp[k]?.bookingId === id) { delete newEmp[k]; changed = true; }
            });
            if (changed) {
              if (Object.keys(newEmp).length === 0) delete updated[empId]; else updated[empId] = newEmp;
            }
          });
        }
        dispatch(setAppointments(updated));
      } catch (e) {
        console.warn('Failed to optimistic remove appointment in redux store', e);
      }

      let res = await fetch(primaryUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) {
        // Try alternate admin path
        res = await fetch(altUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      }
      let data = {};
      try { data = await res.json(); } catch (_) { }
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete booking');
      }

      closeBookingStatusModal();
      // Refresh to sync any related derived state
      fetchCalendarData();
    } catch (err) {
      console.error('Delete booking error:', err);
      setBookingStatusError(err.message);
      // If optimistic removal happened but server failed, trigger refetch to restore
      fetchCalendarData();
    } finally {
      setBookingStatusLoading(false);
    }
  };

  const handleAddAppointment = () => {
    setBookingDefaults(null);
    setIsNewAppointment(true); // This is a new appointment

    // For week view and month view, show date picker to select which day to book
    if (currentView === 'Week' || currentView === 'Month') {
      setSelectedBookingDate(null);
      setShowBookingDatePicker(true);
    } else {
      // For day view, use current date
      setSelectedBookingDate(currentDate);
      setShowAddBookingModal(true);
      setShowServiceCatalog(true); // Ensure service list visible when no preselected slot
    }
  };

  // Month view day click handler for booking
  const handleMonthDayClick = (selectedDay) => {
    console.log('🗓️ Month day clicked:', selectedDay.toLocaleDateString());

    // Store the selected day for booking
    setSelectedBookingDate(selectedDay);

    // Clear any existing booking defaults (since this is a fresh booking from month view)
    setBookingDefaults(null);

    // Set up for new appointment booking starting with service selection
    setIsNewAppointment(true);
    setBookingStep(1); // Start at service selection step

    // Open the booking modal
    setShowAddBookingModal(true);
    setShowServiceCatalog(true);

    console.log('📅 Booking modal opened for date:', selectedDay.toLocaleDateString());
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
    return ` ${professionalName} is not available at this time.`;
  };

  // (Removed local add/remove/total functions — replaced by hook implementations)

  const clearAppointmentSession = () => {
    clearSessionLocal();
    setGiftCardCode('');
    setShowAppointmentSummary(false);
  };

  const startAdditionalService = () => {
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setAvailableProfessionals([]);
    setAvailableTimeSlots([]);
    setBookingStep(1);
    setIsAddingAdditionalService(true);
    setCurrentAppointmentIndex(multipleAppointments.length);
    setBookingDefaults(null);
  };

  // --- ENHANCED BOOKING FLOW FUNCTIONS ---
  const fetchBookingServices = useCallback(async () => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      // console.log('Fetching services from:', `${Base_url}/bookings/services`);
      // Try to load services via thunk-backed API first
      try {
        const services = await dispatch(fetchServicesThunk()).unwrap();
        setAvailableServices(services || MOCK_SERVICES_DATA);
        setBookingLoading(false);
        return;
      } catch (err) {
        console.warn('fetchServicesThunk failed, falling back to direct fetch', err);
      }
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

      // Try to fetch professionals via thunk (but fallback to local fetch)
      try {
        const profs = await dispatch(fetchProfessionalsThunk({ date })).unwrap();
        // map to expected structure
        const allProfessionals = profs || [];
        // proceed with same logic using allProfessionals
        const data = { success: true, data: { employees: allProfessionals } };
        // fallthrough to existing handling below by setting res-like data
        // eslint-disable-next-line no-unused-vars
        // const res = { ok: true };
      } catch (err) {
        console.warn('fetchProfessionalsThunk failed, falling back to direct fetch', err);
      }
      const res = await fetch(url);
      const data = await res.json();

      // console.log('API Response:', data);

      if (res.ok && data.success) {
        const allProfessionals = data.data?.employees || [];
        // console.log('Total professionals from API:', allProfessionals.length);

        // Filter professionals with shifts on this date and available time slots
        const professionalsWithShifts = allProfessionals.filter(prof => {
          const isActive = prof.isActive !== false;

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
    console.log('[DEBUG] filterOutBookedTimeSlots: employeeId', employeeId, 'appointments keys', Object.keys(appointments[employeeId] || {}));
    const dayKey = localDateKey(date);
    const employeeAppointments = appointments[employeeId] || {};

    // Build concrete appointment ranges (Date objects) for this employee on the target day
    const appointmentRanges = [];
    Object.entries(employeeAppointments).forEach(([slotKey, appointment]) => {
      try {
        // Restrict to same day when possible
        if (slotKey && typeof slotKey === 'string' && !slotKey.startsWith(dayKey)) {
          // If appointment has explicit ISO start we still allow it below, otherwise skip
          if (!appointment || !appointment.startISO) return;
        }

        // Prefer explicit ISO times returned from backend/ui
        let apptStart = appointment?.startISO ? new Date(appointment.startISO) : null;
        let apptEnd = appointment?.endISO ? new Date(appointment.endISO) : null;

        // Fallback: some entries store startTime/endTime as ISO strings
        if ((!apptStart || isNaN(apptStart)) && appointment?.startTime && appointment.startTime.includes('T')) {
          apptStart = new Date(appointment.startTime);
        }
        if ((!apptEnd || isNaN(apptEnd)) && appointment?.endTime && appointment.endTime.includes('T')) {
          apptEnd = new Date(appointment.endTime);
        }

        // Last fallback: parse the slotKey (YYYY-MM-DD_HH:MM) into a local Date on the requested day
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

        if ((!apptEnd || isNaN(apptEnd)) && apptStart) {
          const dur = Number(appointment?.duration) || 30;
          apptEnd = new Date(apptStart.getTime() + dur * 60000);
        }

        if (apptStart && !isNaN(apptStart) && apptEnd && !isNaN(apptEnd)) {
          appointmentRanges.push({ start: apptStart, end: apptEnd });
        }
      } catch (e) {
        // ignore malformed appointment entries
      }
    });

    // Now filter slots by overlap with any appointment ranges
    console.log('[DEBUG] appointmentRanges', appointmentRanges);
    return timeSlots.filter(slot => {
      const slotStartTime = new Date(slot.startTime);
      const slotEndTime = new Date(slot.endTime);

      const hasConflict = appointmentRanges.some(r => {
        // overlap if slotStart < apptEnd && slotEnd > apptStart
        return slotStartTime < r.end && slotEndTime > r.start;
      });

      return !hasConflict && slot.available !== false;
    });
  };

  const fetchBookingTimeSlots = useCallback(async (employeeId, serviceId, date) => {
    console.log('[DEBUG] fetchBookingTimeSlots: employeeId', employeeId);
    console.log('[DEBUG] appointments keys', Object.keys(appointments[employeeId] || {}));
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
          const dt = new Date(slot.startTime);
          const slotTime = `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`;
          return !isTimeSlotConflicting(slotTime, serviceDuration, employeeAccumulatedBookings);
        });
        console.log('🚫 Filtered out accumulated bookings, remaining slots:', availableSlots.length);
      }

      console.log('✅ Available slots after filtering:', availableSlots.length);
      console.log('📅 Sample available times:', availableSlots.slice(0, 5).map(slot => {
        const dt = new Date(slot.startTime);
        return `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`;
      }));

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

      // Fetch ALL clients without pagination for search functionality
      const res = await fetch(`${Base_url}/admin/clients?limit=10000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      console.log('📋 Clients API response:', data);
      console.log('📋 Number of clients fetched:', data.data?.clients?.length || 0);
      console.log('📋 Total clients in database:', data.totalCount || 0);

      if (res.ok && data.success) {
        const clients = data.data?.clients || [];
        console.log('✅ Setting existing clients:', clients.length);
        setExistingClients(clients);
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
    console.log('🔍 Search triggered with query:', query);
    console.log('🔍 Total existing clients:', existingClients.length);
    
    if (!query.trim()) {
      // Show all clients when search is empty
      console.log('🔍 Empty query - showing all clients:', existingClients.length);
      setClientSearchResults(existingClients);
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
    
    console.log('🔍 Filtered results:', filtered.length);
    console.log('🔍 Sample filtered clients:', filtered.slice(0, 3).map(c => `${c.firstName} ${c.lastName}`));
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
    if (client._id) {
      loadBenefitsIfNeeded(true);
    }
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
    // Ensure we pass price and finalAmount for proper display
    setTooltipData({
      ...appointment,
      price: appointment.price || appointment.totalAmount,
      finalAmount: appointment.finalAmount || appointment.finalPrice
    });
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
    // First filter out "Allora Spa Dubai" staff
    let filteredByName = employees.filter(emp => 
      emp.name !== 'Allora Spa Dubai' && 
      emp.name?.toLowerCase() !== 'allora spa dubai'
    );

    let filteredByTeam = filteredByName;

    if (teamFilter === 'scheduled') {
      // Only show employees who have shifts today
      filteredByTeam = filteredByName.filter(emp => hasShiftOnDate(emp, currentDate));
    } else if (teamFilter === 'active') {
      filteredByTeam = filteredByName.filter(emp => emp.isActive !== false);
    } else if (teamFilter === 'inactive') {
      filteredByTeam = filteredByName.filter(emp => emp.isActive === false);
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
      // When switching to scheduled team, select all employees with shifts
      const employeesWithShifts = employees.filter(emp => hasShiftOnDate(emp, currentDate));
      setSelectedEmployees(new Set(employeesWithShifts.map(emp => emp.id)));
    } else if (filter === 'all') {
      // When switching to all team, select all employees
      setSelectedEmployees(new Set(employees.map(emp => emp.id)));
    } else if (filter === 'active' || filter === 'inactive') {
      // Select all matching active/inactive employees
      const matched = employees.filter(emp => filter === 'active' ? emp.isActive !== false : emp.isActive === false);
      setSelectedEmployees(new Set(matched.map(emp => emp.id)));
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

    console.log('📊 Calendar Popup Debug:', {
      tab: calendarPopupTab,
      totalAppointments: appointmentsList.length,
      appointmentStatuses: appointmentsList.map(app => ({
        client: app.client,
        status: app.status || 'no-status',
        time: app.timeSlot
      }))
    });

    // 🔧 FIXED: Improved status filtering with proper mapping
    const filtered = appointmentsList.filter(app => {
      const status = (app.status || 'confirmed').toLowerCase();

      if (calendarPopupTab === 'confirmed') {
        // Include: confirmed, booked, scheduled, or no status (default)
        return ['confirmed', 'booked', 'scheduled'].includes(status) || !app.status;
      }

      if (calendarPopupTab === 'started') {
        // Include: started, in-progress, arrived
        return ['started', 'in-progress', 'arrived'].includes(status);
      }

      if (calendarPopupTab === 'completed') {
        // Include: completed
        return status === 'completed';
      }

      return true; // Default: show all
    });

    console.log(`📋 Filtered ${filtered.length} appointments for "${calendarPopupTab}" tab`);
    return filtered;
  };

  // NEW: Refresh calendar to current time
  const handleRefreshToNow = () => {
    setCurrentDate(new Date());
    fetchCalendarData();
  };

  // Booking date picker functions
  const getBookingDatePickerDays = () => {
    if (currentView === 'Week') {
      // For week view, show only the days of the current week
      const weekStart = new Date(currentDate);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
      weekStart.setDate(diff);

      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        weekDays.push({
          date: day,
          day: day.getDate(),
          isCurrentMonth: true,
          isToday: formatDateLocal(day) === formatDateLocal(new Date()),
          dayName: day.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      return weekDays;
    } else {
      // For other views, show a full month calendar - pass the correct month object
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      return getDatePickerCalendarDays(monthDate);
    }
  };

  const handleBookingDateSelect = (day) => {
    setSelectedBookingDate(day.date);
    setShowBookingDatePicker(false);
    // Automatically open booking modal with service selection
    setShowAddBookingModal(true);
    setShowServiceCatalog(true);
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

  const handleAddToBookingSession = (overrideSlot = null) => {
    const slotToUse = overrideSlot || selectedTimeSlot;

    // Validate required fields
    if (!selectedService || !selectedProfessional || !slotToUse) {
      setBookingError('Please complete all booking steps: Service, Professional, and Time selection.');
      return false;
    }

    // Extract time slot preserving the user's selected local time (not UTC)
    const timeSlot = (() => {
      if (slotToUse?.label) return slotToUse.label; // preferred if provided by slot generator
      if (slotToUse?.startTime) {
        const dt = new Date(slotToUse.startTime);
        // Use local hours/minutes to reflect the user's intended selection
        return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }
      return slotToUse.time || slotToUse;
    })();

    // Use the correct booking date - priority: bookingDefaults.date > selectedBookingDate > currentDate
    const bookingDate = bookingDefaults?.date || selectedBookingDate || currentDate;

    // Use unified conflict detection for both session and persisted appointments
    const professionalId = selectedProfessional._id;
    const dateKey = bookingDate instanceof Date ? formatDateLocal(bookingDate) : bookingDate;
    const conflictObj = detectProfessionalConflict(
      professionalId,
      bookingDate,
      timeSlot,
      selectedService.duration,
      appointments,
      multipleAppointments
    );
    if (conflictObj) {
      const professionalName = selectedProfessional.user?.firstName || selectedProfessional.name;
      setBookingError(`Time conflict: ${professionalName} already has a booking at this time. Please select a different slot.`);
      return false;
    }

    // Store service name for success message before clearing
    const serviceName = selectedService.name;

    // Ensure date is stored in a consistent format (YYYY-MM-DD string)
    const appointmentDate = bookingDate instanceof Date
      ? formatDateLocal(bookingDate)
      : bookingDate;

    // Add current appointment to session, using strict duration and time format
    const appointment = {
      id: `${professionalId}_${appointmentDate}_${timeSlot}_${Date.now()}`, // Generate unique ID
      service: selectedService,
      professional: selectedProfessional,
      timeSlot: timeSlot,
      date: appointmentDate, // Store as consistent YYYY-MM-DD string
      duration: selectedService.duration // ensure duration is present for conflict check
    };

    // Double-check for session conflict before adding
    const sessionConflict = detectProfessionalConflict(
      selectedProfessional._id,
      bookingDate,
      timeSlot,
      selectedService.duration,
      appointments,
      [...multipleAppointments, appointment] // include the new appointment for strict check
    );
    if (sessionConflict) {
      setBookingError('Time conflict: This professional already has a booking at this time. Please select a different slot.');
      return false;
    }

    console.log('Adding appointment to session with date:', {
      originalBookingDate: bookingDate,
      bookingDateType: typeof bookingDate,
      isDateObject: bookingDate instanceof Date,
      finalAppointmentDate: appointmentDate,
      formatDateLocalResult: bookingDate instanceof Date ? formatDateLocal(bookingDate) : 'N/A'
    });
    console.log('Full appointment:', appointment);
    const newAppointment = addAppointmentToSessionLocal(appointment);
    console.log('New appointment added:', newAppointment);

    // Store current selections and appointment ID before clearing (for back navigation)
    setLastSelectedService(selectedService);
    setLastSelectedProfessional(selectedProfessional);
    setLastAddedAppointmentId(appointment.id);

    // Clear the current selection to show empty "Ready to Add" section
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setAvailableProfessionals([]);
    setAvailableTimeSlots([]);
    setBookingError(null);

    // Show success message and auto-focus on the session summary
    setBookingSuccess(` "${serviceName}" added to booking session! Total services: ${multipleAppointments.length + 1}`);
    setTimeout(() => setBookingSuccess(null), 4000);
    return true;
  };

  // Membership integration handlers
  const handleMembershipApplied = (membership, matchingService) => {
    console.log('🎯 Admin applying membership:', membership, 'for service:', matchingService);

    setAppliedMembership(membership);
    setMembershipDiscountAmount(matchingService.price || 0);

    // Show success feedback
    Swal.fire({
      icon: 'success',
      title: 'Membership Applied',
      text: `Membership "${membership.name}" applied! The service "${matchingService.name}" will be FREE for this client.`,
      confirmButtonColor: '#1f2937'
    });
  };

  const handleMembershipRemoved = () => {
    console.log('❌ Admin removing applied membership');

    setAppliedMembership(null);
    setMembershipDiscountAmount(0);

    // Show feedback
    Swal.fire({
      icon: 'info',
      title: 'Membership Removed',
      text: 'Regular pricing restored.',
      confirmButtonColor: '#1f2937'
    });
  };

  // Gift Card Functions - Updated to use new API
  const fetchGiftCardsForClient = async (clientId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(`${Base_url}/giftcards/purchased`, { headers });


    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift cards');
    }

    return data;
  };

  const getGiftCardDetails = async (giftCardCode) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${Base_url}/giftcards/validate/${giftCardCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid gift card code');
    }

    return data;
  };

  const removeAppliedGiftCard = () => {
    setSelectedGiftCard(null);
    setGiftCardAppliedAmount(0);
    setGiftCardError('');
  };

  const calculateGiftCardValue = (giftCard) => {
    // Handle different possible response structures from new API
    if (giftCard?.remainingValue !== undefined) {
      return giftCard.remainingValue;
    }
    if (giftCard?.value && giftCard?.usedAmount !== undefined) {
      return Math.max(0, giftCard.value - giftCard.usedAmount);
    }
    if (giftCard?.amount) {
      return giftCard.amount;
    }
    if (giftCard?.balance) {
      return giftCard.balance;
    }
    return 0;
  };

  const calculateTotalWithGiftCard = () => {
    const total = getTotalSessionPrice();
    const discountFromMembership = membershipDiscountAmount || 0;

    let giftCardDiscount = 0;
    if (selectedGiftCard) {
      const availableValue = calculateGiftCardValue(selectedGiftCard);
      giftCardDiscount = Math.min(total - discountFromMembership, availableValue);
      
      console.log('💰 calculateTotalWithGiftCard:', {
        total,
        discountFromMembership,
        availableValue,
        giftCardDiscount,
        currentAppliedAmount: giftCardAppliedAmount
      });

      // Update the applied amount for display if it changed
      if (giftCardAppliedAmount !== giftCardDiscount) {
        console.log('🔄 Updating giftCardAppliedAmount from', giftCardAppliedAmount, 'to', giftCardDiscount);
        setGiftCardAppliedAmount(giftCardDiscount);
      }
    }

    return {
      subtotal: total,
      membershipDiscount: discountFromMembership,
      giftCardDiscount: giftCardDiscount,
      remainingAmount: Math.max(0, total - discountFromMembership - giftCardDiscount)
    };
  };

  // Gift Card Selection Handlers
  const handleGiftCardSelect = (giftCard) => {
    console.log('🎁 Selected gift card:', giftCard);
    setSelectedGiftCard(giftCard);

    // Auto-calculate the maximum redeemable amount
    const totalAmount = getTotalSessionPrice();
    const availableValue = calculateGiftCardValue(giftCard);
    const maxRedeemable = Math.min(availableValue, totalAmount);

    setRedeemGiftCardAmount(maxRedeemable);
    setGiftCardAppliedAmount(maxRedeemable);

    console.log('Auto-applied gift card amount:', maxRedeemable);
  };

  const handleGiftCardRemove = () => {
    console.log('❌ Removing applied gift card');
    setSelectedGiftCard(null);
    setRedeemGiftCardAmount(0);
    setGiftCardAppliedAmount(0);
  };

  const validateGiftCardCode = async (code) => {
    if (!code || !code.trim()) {
      throw new Error('Gift card code is required');
    }

    try {
      setGiftCardLoading(true);
      setGiftCardError('');

      const response = await getGiftCardDetails(code.trim());
      const giftCard = response.giftCard;

      if (!giftCard) {
        throw new Error('Invalid gift card code');
      }

      // Validate gift card status and value
      if (giftCard.status !== 'active') {
        throw new Error('Gift card is not active');
      }

      if (giftCard.remainingValue <= 0) {
        throw new Error('Gift card has no remaining value');
      }

      if (giftCard.expiresAt && new Date(giftCard.expiresAt) <= new Date()) {
        throw new Error('Gift card has expired');
      }

      return giftCard;
    } catch (error) {
      setGiftCardError(error.message);
      throw error;
    } finally {
      setGiftCardLoading(false);
    }
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
        if (!isWalkIn) {
          if (!nameString) {
            setBookingError('Client name is required.');
            setBookingLoading(false);
            return;
          }
        }

        const [firstName, ...rest] = nameString.split(' ');
        const lastName = rest.join(' ') || '';
        clientData = {
          firstName: firstName || 'Walk-in',
          lastName: lastName || 'Customer',
          email: clientInfo.email ? clientInfo.email.trim() : '',
          phone: clientInfo.phone ? clientInfo.phone.trim() : ''
        };
      }

      // Email and phone are now optional - booking can proceed without them

      // Create services array from multiple appointments
      const services = multipleAppointments.map(apt => {
        // Ensure we have a valid date object
        let appointmentDate;
        if (apt.date instanceof Date) {
          appointmentDate = new Date(apt.date);
        } else if (typeof apt.date === 'string') {
          appointmentDate = new Date(apt.date);
        } else {
          // Fallback to current date if date is invalid
          console.warn('Invalid date in appointment, using current date:', apt.date);
          appointmentDate = new Date();
        }

        // Ensure the date is valid
        if (isNaN(appointmentDate.getTime())) {
          console.error('Invalid date created from:', apt.date);
          appointmentDate = new Date(); // Fallback to current date
        }

        // const [hours, minutes] = apt.timeSlot.split(':');

        // TIMEZONE FIX: Create UTC datetime that represents the exact date/time user selected
        // This ensures the appointment appears on the correct date regardless of server timezone

        let dateStr;
        if (typeof apt.date === 'string' && apt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateStr = apt.date;
        } else {
          const year = appointmentDate.getFullYear();
          const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
          const day = String(appointmentDate.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }

        const timeStr = apt.timeSlot;

        // Validate inputs
        if (!dateStr || !timeStr) {
          console.error('❌ Invalid appointment data:', { dateStr, timeStr });
          throw new Error(`Invalid appointment: date=${dateStr}, time=${timeStr}`);
        }

        // Create UTC datetime directly using the date string and time
        // This prevents any local timezone interference
        const [hours, minutes] = timeStr.split(':').map(Number);
        const appointmentDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`);

        const endTime = new Date(appointmentDateTime);
        endTime.setUTCMinutes(endTime.getUTCMinutes() + apt.service.duration);

        // Validate that the dates were created successfully
        if (isNaN(appointmentDateTime.getTime()) || isNaN(endTime.getTime())) {
          console.error('❌ Invalid date created');
          throw new Error('Failed to create valid dates');
        }

        console.log(`📅 Booking: ${apt.service.name} on ${dateStr} at ${timeStr}`);
        console.log(`🕐 Created UTC datetime: ${appointmentDateTime.toISOString()}`);
        console.log(`✅ Time will display correctly as: ${timeStr}`);

        return {
          service: apt.service._id,
          employee: apt.professional._id || apt.professional.id,
          duration: apt.service.duration,
          price: apt.service.price,
          startTime: appointmentDateTime.toISOString(),
          endTime: endTime.toISOString(),
        };
      });

      // Calculate totals & apply payment adjustments using the new gift card flow
      const totalDuration = multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0);
      const totalAmount = getTotalSessionPrice(); // This already includes customTotalDiscount
      const originalTotalAmount = multipleAppointments.reduce((sum, a) => {
        const price = (a && (a.price ?? a.service?.price ?? 0)) || 0;
        return sum + Number(price || 0);
      }, 0); // Original total without custom discount
      const paymentCalculation = calculateTotalWithGiftCard();
      let finalAmount = paymentCalculation.remainingAmount;
      const paymentDetails = {};

      console.log('💳 Payment Calculation:', {
        originalTotalAmount,
        customTotalDiscount,
        totalAmount,
        membershipDiscount: paymentCalculation.membershipDiscount,
        giftCardDiscount: paymentCalculation.giftCardDiscount,
        finalAmount,
        selectedGiftCard: selectedGiftCard ? {
          id: selectedGiftCard._id || selectedGiftCard.id,
          code: selectedGiftCard.code || selectedGiftCard.giftCardCode,
          availableValue: calculateGiftCardValue(selectedGiftCard)
        } : null
      });

      // Apply admin membership discount first
      if (appliedMembership && membershipDiscountAmount > 0) {
        console.log(' Applying admin membership discount:', {
          membership: appliedMembership.name,
          discount: membershipDiscountAmount,
          originalAmount: totalAmount
        });

        paymentDetails.adminMembership = {
          membershipId: appliedMembership._id,
          discountAmount: membershipDiscountAmount,
          membershipName: appliedMembership.name,
          sessionDeduction: true,
          remainingSessionsBefore: appliedMembership.remainingSessions
        };
      }

      // Apply gift card if one was selected
      if (selectedGiftCard) {
        const giftCardId = selectedGiftCard._id || selectedGiftCard.id;
        const giftCardCode = selectedGiftCard.code || selectedGiftCard.giftCardCode || selectedGiftCard.cardNumber;
        const availableValue = calculateGiftCardValue(selectedGiftCard);
        
        // Calculate the actual amount to redeem at booking time
        const amountAfterMembership = totalAmount - (membershipDiscountAmount || 0);
        const actualRedeemAmount = Math.min(availableValue, amountAfterMembership);

        console.log('🎁 Gift Card Application Check:', {
          giftCardId,
          giftCardCode,
          availableValue,
          totalAmount,
          membershipDiscountAmount,
          amountAfterMembership,
          actualRedeemAmount,
          willApply: actualRedeemAmount > 0
        });

        // Only apply if there's actually an amount to redeem
        if (actualRedeemAmount > 0) {
          console.log('✅ Applying gift card to booking:', {
            id: giftCardId,
            code: giftCardCode,
            redeemAmount: actualRedeemAmount
          });

          paymentDetails.giftCard = {
            giftCardId: giftCardId,
            code: giftCardCode,
            redeemAmount: actualRedeemAmount
          };
          
          // Update finalAmount to reflect gift card redemption
          finalAmount = Math.max(0, amountAfterMembership - actualRedeemAmount);
          
          console.log('💰 Updated finalAmount after gift card:', finalAmount);
        } else {
          console.log('⚠️ Gift card selected but no amount to redeem:', {
            availableValue,
            totalAmount,
            membershipDiscount: membershipDiscountAmount
          });
        }
      } else {
        console.log('⚠️ No gift card selected');
      }

      // Normalize payment methods to backend-accepted enums and attach details
      // Backend expects values like: 'cash', 'card', 'online', 'giftcard' (common)
      const paymentMethodMapping = {
        upi: 'online', // UPI is an online payment type on many backends
      };

      // Attach payment details for remaining amount (if any)
      // Card and UPI details are optional - payment method selection is sufficient
      if (finalAmount > 0) {
        if (paymentMethod === 'card') {
          // Card payment selected - no additional details required
          paymentDetails.paymentType = 'card';
        } else if (paymentMethod === 'upi' || paymentMethod === 'online') {
          // UPI/Online payment selected - no additional details required
          paymentDetails.paymentType = 'upi';
        }
      }

      // Determine the effective payment method for the booking (normalize unknown aliases)
      let effectivePaymentMethod;
      if (finalAmount === 0 && selectedGiftCard) {
        effectivePaymentMethod = 'giftcard';
      } else {
        effectivePaymentMethod = paymentMethodMapping[paymentMethod] || paymentMethod || 'cash';
      }

      // Create the booking payload for multiple services
      const bookingPayload = {
        services,
        appointmentDate: services[0].startTime,
        totalDuration,
        totalAmount: originalTotalAmount, // Send original total
        finalAmount, // This includes all discounts (custom, membership, gift card)
        paymentMethod: effectivePaymentMethod,
        paymentDetails,
        client: clientData,
        notes: bookingForm.notes || '',
        giftCardCode: selectedGiftCard?.code || selectedGiftCard?.giftCardCode || selectedGiftCard?.cardNumber || '',
        bookingSource: 'admin',
        customDiscount: customTotalDiscount > 0 ? customTotalDiscount : undefined,
        discountedTotal: customTotalDiscount > 0 ? totalAmount : undefined // Total after custom discount, before other discounts
      };

      console.log('📦 Multiple appointments booking payload:', JSON.stringify(bookingPayload, null, 2));
      console.log('🎁 Gift card in payload:', {
        giftCardCode: bookingPayload.giftCardCode,
        paymentMethod: bookingPayload.paymentMethod,
        hasGiftCardInPaymentDetails: !!bookingPayload.paymentDetails?.giftCard,
        giftCardDetails: bookingPayload.paymentDetails?.giftCard
      });

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

      setBookingSuccess(` ${multipleAppointments.length} service(s) booked successfully for ${clientName}! Booking ID: ${responseData.data?.booking?.bookingNumber || 'N/A'}`);

      console.log('✅ Booking created successfully. Preparing to refresh gift cards...');

      // Clear the appointments session after successful booking
      setTimeout(() => {
        clearAppointmentSession();
        // Clear new gift card states
        setGiftCardAppliedAmount(0);
        setGiftCardCode('');
        setGiftCardError('');
        // Force refresh of gift cards so redeemed gift card disappears
        setAvailableGiftCards([]);
        setSelectedGiftCard(null);
        setRedeemGiftCardAmount(0);
        
        console.log('🔄 Triggering gift card refresh after booking...');
        
        // Add additional delay to ensure backend DB has been fully updated
        setTimeout(() => {
          if (selectedExistingClient?._id) {
            console.log('🎁 Fetching updated gift cards for client:', selectedExistingClient._id);
            loadBenefitsIfNeeded(true);
          }
        }, 500);
      }, 1500);

      // If booking used an admin-applied membership, update local membership counters so UI shows reduced remaining sessions
      try {
        const adminMembershipInfo = paymentDetails?.adminMembership;
        if (appliedMembership && adminMembershipInfo && adminMembershipInfo.sessionDeduction) {
          console.log('Updating local membership usage after booking:', appliedMembership._id);
          // Mutate local appliedMembership safely
          setAppliedMembership(prev => {
            if (!prev) return prev;
            const used = (prev.usedSessions || 0) + 1;
            const remaining = (typeof prev.remainingSessions === 'number') ? Math.max(0, prev.remainingSessions - 1) : (typeof prev.numberOfSessions === 'number' ? Math.max(0, prev.numberOfSessions - used) : null);
            const updated = { ...prev, usedSessions: used, remainingSessions: remaining };
            return updated;
          });

          // Update any availableMemberships list we have cached to reflect the deduction
          setAvailableMemberships(list => list.map(m => m._id === appliedMembership._id ? ({ ...m, usedSessions: (m.usedSessions || 0) + 1, remainingSessions: (typeof m.remainingSessions === 'number' ? Math.max(0, m.remainingSessions - 1) : (typeof m.numberOfSessions === 'number' ? Math.max(0, m.numberOfSessions - ((m.usedSessions || 0) + 1)) : m.remainingSessions)) }) : m));

          // Also refresh memberships list from server in background to keep authoritative state
          // bump signal to force AdminMembershipChecker to refetch
          setTimeout(() => setMembershipRefreshSignal(s => s + 1), 800);
        }
      } catch (e) {
        console.warn('Failed to update local membership usage after booking:', e);
      }

      // Refresh calendar data immediately to see the new booking
      console.log('🔄 Refreshing calendar to show new booking...');
      fetchCalendarData();

      // Close modal after a short delay
      setTimeout(() => {
        closeBookingModal();
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
    setSelectedBookingDate(null);
    setShowBookingDatePicker(false);

    // Only clear appointments session if explicitly requested
    if (clearSession) {
      console.log('🗑️ CLEARING APPOINTMENTS SESSION');
      clearAppointmentSession();
    } else {
      console.log('💾 PRESERVING APPOINTMENTS SESSION - Current appointments:', multipleAppointments.length);
    }

    // Reset gift card and membership states
    setAvailableGiftCards([]);
    setSelectedGiftCard(null);
    setRedeemGiftCardAmount(0);
    setGiftCardAppliedAmount(0);
    setGiftCardCode('');
    setGiftCardError('');
    setGiftCardLoading(false);

    // Reset membership states
    setAvailableMemberships([]);
    setSelectedMembership(null);
    setAppliedMembership(null);
    setMembershipDiscountAmount(0);

    // Reset custom discount
    setCustomTotalDiscount(0);
    setEditingTotalPrice(false);
    setTempTotalPrice('');

    // Reset benefits loading states
    setBenefitsLoading(false);
    setBenefitsError(null);

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
      // For day view, fetch a wider range to ensure we don't miss appointments due to timezone issues
      // This fetches the day before and after to account for any server-side timezone filtering
      startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 1); // Day before
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 1); // Day after  
      endDate.setHours(23, 59, 59, 999);
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


  // --- API CALL FUNCTION (moved to Redux thunk) ---
  const fetchCalendarData = () => {
    dispatch(fetchCalendarThunk({ currentDate, currentView }));
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

  // Debug: Track when existing clients state changes
  useEffect(() => {
    console.log('📊 Existing clients state updated:', existingClients.length, 'clients');
    if (existingClients.length > 0) {
      console.log('📊 Sample clients:', existingClients.slice(0, 3).map(c => `${c.firstName} ${c.lastName}`));
    }
  }, [existingClients]);

  // Auto-fetch gift cards useEffect moved after function definition

  // Load client gift cards when entering payment step
  const loadBenefitsIfNeeded = useCallback(async (force = false) => {
    // Only proceed if we have a selected client
    if (!selectedExistingClient?._id && !force) {
      console.log('No client selected, skipping benefits load');
      return;
    }

    setBenefitsLoading(true);
    setBenefitsError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch gift cards
      const gcRes = await fetch(`${Base_url}/giftcards/purchased`, { headers });
      const gcData = await gcRes.json();

      console.log('Gift cards API response:', gcData); // Debug log

      if (!gcRes.ok) {
        throw new Error('Failed to fetch gift cards');
      }

      // Filter gift cards for the current client
      const clientId = selectedExistingClient._id;
      const ownedGiftCards = (gcData.data?.giftCards || []).filter(card => {
        // Check ownership
        const isOwner = card.purchasedBy?._id === clientId;
        const isRecipient = card.recipientName?.toLowerCase?.()
          .includes(selectedExistingClient.firstName?.toLowerCase() || '');

        // Check validity
        const now = new Date();
        const isExpired = card.expiryDate && new Date(card.expiryDate) < now;
        const hasValue = card.remainingValue > 0;
        // Only include active or partially used cards that still have value
        const isUsable = ['active', 'partially used'].includes(card.status?.toLowerCase());
        
        // Debug logging for each card
        console.log(`🎁 Gift card filter check for ${card.code}:`, {
          status: card.status,
          remainingValue: card.remainingValue,
          isOwner,
          isRecipient,
          isExpired,
          hasValue,
          isUsable,
          willInclude: (isOwner || isRecipient) && !isExpired && hasValue && isUsable
        });

        return (isOwner || isRecipient) && !isExpired && hasValue && isUsable;
      });

      console.log('Filtered gift cards:', ownedGiftCards); // Debug log
      setAvailableGiftCards(ownedGiftCards);

      // Clear selected gift card if it's no longer valid
      if (selectedGiftCard?._id && !ownedGiftCards.some(gc => gc._id === selectedGiftCard._id)) {
        setSelectedGiftCard(null);
        setGiftCardAppliedAmount(0);
      }

    } catch (error) {
      console.error('Error loading gift cards:', error);
      setBenefitsError(error.message);
      setAvailableGiftCards([]);
    } finally {
      setBenefitsLoading(false);
    }
  }, [selectedExistingClient, selectedGiftCard]);

  // Add useEffect to trigger benefits load when needed
  useEffect(() => {
    if (bookingStep === 6 && selectedExistingClient?._id) {
      loadBenefitsIfNeeded();
    }
  }, [bookingStep, selectedExistingClient, loadBenefitsIfNeeded]);

  // Auto-selection effects for booking modal (when defaults are available)
  useEffect(() => {
    if (bookingStep === 2 && bookingDefaults?.staffId && availableProfessionals.length > 0) {
      const defaultProf = availableProfessionals.find(p => p._id === bookingDefaults.staffId);
      if (defaultProf) {
        setSelectedProfessional(defaultProf);
        setBookingStep(3);
        const bookingDate = bookingDefaults?.date || selectedBookingDate || currentDate;
        fetchBookingTimeSlots(defaultProf._id, selectedService._id, bookingDate);
      }
    }
  }, [bookingStep, bookingDefaults, availableProfessionals, selectedService, selectedBookingDate, currentDate, fetchBookingTimeSlots]);

  useEffect(() => {
    if (bookingStep === 3 && bookingDefaults?.time && availableTimeSlots.length > 0) {
      const [hour, minute] = bookingDefaults.time.split(':').map(Number);
      const defaultSlot = availableTimeSlots.find(slot => {
        const d = new Date(slot.startTime);
        return slot.available && d.getUTCHours() === hour && d.getUTCMinutes() === minute;
      });
      if (defaultSlot) {
        setSelectedTimeSlot(defaultSlot);
        setBookingStep(4);
        setBookingDefaults(null); // Clear defaults after use
      }
    }
  }, [bookingStep, bookingDefaults, availableTimeSlots]);

  // NEW: Auto-populate professionals when on step 2
  useEffect(() => {
    console.log('🔍 Step 2 useEffect triggered:', {
      bookingStep,
      hasService: !!selectedService,
      professionalsLength: availableProfessionals.length
    });
    
    if (bookingStep === 2 && selectedService) {
      if (availableProfessionals.length === 0) {
        console.log('🔄 Step 2 - Fetching professionals for service:', selectedService.name);
        const bookingDate = selectedBookingDate || currentDate;
        let professionals = getAvailableProfessionalsForService(
          selectedService._id,
          bookingDate,
          employees,
          appointments,
          availableServices
        );
        
        // Fallback: use selectedProfessional if available
        if (professionals.length === 0 && selectedProfessional) {
          console.log('⚠️ Using selectedProfessional as fallback');
          professionals = [selectedProfessional];
        }
        
        console.log('✅ Auto-populated professionals on step 2:', professionals.length, professionals);
        setAvailableProfessionals(professionals);
      } else {
        console.log('ℹ️ Professionals already populated:', availableProfessionals.length);
      }
    } else {
      console.log('⚠️ Step 2 requirements not met');
    }
  }, [bookingStep, selectedService, availableProfessionals.length, selectedProfessional, selectedBookingDate, currentDate, employees, appointments, availableServices]);

  // NEW: Auto-populate time slots when on step 3
  useEffect(() => {
    console.log('🔍 Step 3 useEffect triggered:', {
      bookingStep,
      hasService: !!selectedService,
      hasProfessional: !!selectedProfessional,
      professionalId: selectedProfessional?.id || selectedProfessional?._id,
      timeSlotsLength: availableTimeSlots.length
    });
    
    if (bookingStep === 3 && selectedService && selectedProfessional) {
      if (availableTimeSlots.length === 0) {
        console.log('🔄 Step 3 - Fetching time slots for professional:', selectedProfessional.name || selectedProfessional.user?.firstName);
        const bookingDate = selectedBookingDate || currentDate;
        const timeSlots = getAvailableTimeSlotsForProfessional(
          selectedProfessional,     // employee object (not ID)
          bookingDate,             // date
          selectedService.duration, // service duration in minutes
          appointments             // appointments object
        );
        
        console.log('✅ Auto-populated time slots on step 3:', timeSlots.length, timeSlots);
        setAvailableTimeSlots(timeSlots);
      } else {
        console.log('ℹ️ Time slots already populated:', availableTimeSlots.length);
      }
    } else {
      console.log('⚠️ Step 3 requirements not met');
    }
  }, [bookingStep, selectedService, selectedProfessional, availableTimeSlots.length, selectedBookingDate, currentDate, employees, appointments, availableServices]);

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
    const firstSlotTime = timeSlots[0] || '00:00';
    const firstSlotTimeMinutes = (parseFloat(firstSlotTime.split(':')[0]) * 60) + parseFloat(firstSlotTime.split(':')[1]);
    const currentTimeMinutes = (now.getHours() * 60) + now.getMinutes();
    const minutesIntoSchedule = currentTimeMinutes - firstSlotTimeMinutes;

    if (minutesIntoSchedule < 0) {
      setCurrentTimeLineTop(-100);
      return;
    }

    const minutesPerSlot = 30; // Updated to 30-minute intervals
    const topPosition = ((minutesIntoSchedule / minutesPerSlot) * timeSlotHeightPx) + 75;

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

  // Merge persisted appointments with current session appointments
  const mergedAppointments = useMemo(() => {
    const merged = { ...appointments };

    // Add session appointments to the merged object
    multipleAppointments.forEach(sessionApt => {
      const employeeId = sessionApt.professional._id || sessionApt.professional.id;

      // Since we now store dates consistently as YYYY-MM-DD strings, use directly
      const dayKey = sessionApt.date;
      const slotKey = `${dayKey}_${sessionApt.timeSlot}`;

      if (!merged[employeeId]) {
        merged[employeeId] = {};
      }

      // Add session appointment with a distinctive styling

    });

    return merged;
  }, [appointments, multipleAppointments]);

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
              if (mergedAppointments[emp.id]) {
                Object.entries(mergedAppointments[emp.id]).forEach(([slotKey, appointment]) => {
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
              <div
                key={dayKey}
                className="month-day-cell"
                onClick={() => handleMonthDayClick(day)}
                style={{ cursor: 'pointer' }}
                title={`Click to add appointment on ${day.toLocaleDateString()}`}
              >
                <div className="month-day-header">
                  <span className="month-day-date">{day.getDate()}</span>
                  <span className="month-add-appointment-hint">+</span>
                </div>
                <div className="month-appointments">
                  {dayAppointments.length > 0 ? (
                    <>
                      {dayAppointments.slice(0, 3).map((app, index) => (
                        <div key={index}
                          className="month-appointment-entry"
                          style={{ backgroundColor: app.color }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent day click when clicking on appointment
                            if (app.bookingId) {
                              // Show booking status for existing appointment
                              const appointmentDetails = {
                                ...app,
                                employeeId: app.employeeId,
                                employeeName: app.employeeName,
                                slotTime: app.time,
                                date: dayKey,
                                slotKey: `${dayKey}_${app.time}`,
                                serviceEntryId: app.serviceEntryId // Include serviceEntryId for per-service operations
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
                          onClick={(event) => {
                            event.stopPropagation(); // Prevent day click when clicking on "more"
                            handleShowMoreAppointments(dayAppointments, day, event);
                          }}
                        >
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="month-empty-day">
                      <span className="add-appointment-text">Click to add appointment</span>
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

  const renderCalendarContent = () => {
    if (loading) {
      return (
        <div className="content-loading-overlay">
          <div className="loading-message">
            <Loading />          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="content-error-message-overlay">
          <Error500Page />
        </div>
      );
    }
    if (employees.length === 0 && Object.keys(appointments).length === 0) {
      return (
        <div className="content-empty-state">
          <div className="empty-state-content">
            <NoDataState />
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

        <div className="staff-grid-wrapper">
          {/* Sticky Headers Row - All staff headers in one fixed row */}
          {currentView === 'Day' && (
            <div className="staff-headers-row">
              {displayEmployees.map(employee => {
                const hasShift = hasShiftOnDate(employee, currentDate);
                const shiftHours = getEmployeeShiftHours(employee, currentDate);
                const hasValidShifts = shiftHours.length > 0;

                return (
                  <div key={`header-${employee.id}`} className="staff-header-cell">
                    <div className="staff-avatar" style={{
                      backgroundColor: hasShift && hasValidShifts ? employee.avatarColor : '#9ca3af',
                      opacity: hasShift && hasValidShifts ? 1 : 0.5
                    }}>
                      {employee.avatar ?
                        <img src={employee.avatar} alt={employee.name} className="avatar-image" style={{ opacity: hasShift && hasValidShifts ? 1 : 0.5 }} /> :
                        employee.name.charAt(0)
                      }
                    </div>
                    <div className="staff-info">
                      <div className="staff-name" style={{ color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af' }}>{employee.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scrollable Content - Time slots for each employee */}
          <div
            className={`staff-grid cols-${Math.min(displayEmployees.length || 1, 20)}`}
            style={{
              '--dynamic-employee-count': displayEmployees.length || 1,
              '--dynamic-column-width': displayEmployees.length <= 6
                ? `${100 / (displayEmployees.length || 1)}%`
                : 'var(--staff-column-width)'
            }}
          // Dynamic width allocation: 1-6 employees get equal width, 7+ get fixed width with scroll
          >
            {currentView === 'Day' && displayEmployees.map(employee => (
              <StaffColumn
                key={employee.id}
                employee={employee}
                timeSlots={timeSlots}
                appointments={mergedAppointments}
                currentDate={currentDate}
                isTimeSlotUnavailable={isTimeSlotUnavailable}
                handleTimeSlotClick={handleTimeSlotClick}
                showBookingTooltipHandler={showBookingTooltipHandler}
                hideBookingTooltip={hideBookingTooltip}
                showTimeHoverHandler={showTimeHoverHandler}
                hideTimeHover={hideTimeHover}
                setSelectedBookingForStatus={setSelectedBookingForStatus}
                setShowBookingStatusModal={setShowBookingStatusModal}
                hideHeader={true}
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
                      const dayKey = formatDateLocal(day); // Use same format as session appointments
                      const hasShift = hasShiftOnDate(employee, day);

                      // Get appointments for this employee on this day
                      const dayAppointments = [];
                      if (mergedAppointments[employee.id]) {
                        Object.entries(mergedAppointments[employee.id]).forEach(([slotKey, appointment]) => {
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
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    console.log('Week appointment clicked:', app);

                                    if (app.timeSlot && app.bookingId) {
                                      // Show booking status for existing appointment
                                      const appointmentDetails = {
                                        ...app,
                                        employeeId: employee.id,
                                        employeeName: employee.name,
                                        slotTime: app.timeSlot,
                                        date: dayKey,
                                        slotKey: app.slotKey,
                                        serviceEntryId: app.serviceEntryId // Include serviceEntryId for per-service operations
                                      };
                                      console.log('Opening booking status modal:', appointmentDetails);
                                      setSelectedBookingForStatus(appointmentDetails);
                                      setShowBookingStatusModal(true);
                                    } else if (app.timeSlot) {
                                      // Fallback to regular time slot click
                                      console.log('Fallback to time slot click');
                                      handleTimeSlotClick(employee.id, app.timeSlot, day);
                                    } else {
                                      // No time slot info, show general appointment booking
                                      console.log('No time slot, showing add appointment modal');
                                      const staff = employees.find(emp => emp.id === employee.id);
                                      if (staff) {
                                        setBookingDefaults({
                                          professional: {
                                            _id: staff._id || staff.id,
                                            id: staff.id,
                                            user: {
                                              firstName: staff.name.split(' ')[0],
                                              lastName: staff.name.split(' ')[1] || ''
                                            },
                                            name: staff.name,
                                            position: staff.position,
                                            ...staff
                                          },
                                          date: day,
                                          isDirectEmployeeSelection: true
                                        });
                                        setSelectedBookingDate(day);
                                        setIsNewAppointment(true);
                                        setShowAddBookingModal(true);
                                        setShowServiceCatalog(true);
                                      }
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

                              {/* Add appointment button for days with existing appointments */}
                              <div
                                className="week-add-appointment-btn"
                                onClick={hasShift ? (e) => {
                                  e.stopPropagation(); // Prevent event bubbling
                                  console.log('Add appointment clicked for employee:', employee.name, 'on day:', day.toLocaleDateString());

                                  // Show service selection for this employee and day
                                  const staff = employees.find(emp => emp.id === employee.id);
                                  if (staff) {
                                    setBookingDefaults({
                                      professional: {
                                        _id: staff._id || staff.id,
                                        id: staff.id,
                                        user: {
                                          firstName: staff.name.split(' ')[0],
                                          lastName: staff.name.split(' ')[1] || ''
                                        },
                                        name: staff.name,
                                        position: staff.position,
                                        ...staff
                                      },
                                      date: day,
                                      isDirectEmployeeSelection: true // Flag for skipping professional selection
                                    });
                                    setSelectedBookingDate(day);
                                    setIsNewAppointment(true);
                                    setShowAddBookingModal(true);
                                    setShowServiceCatalog(true); // Show service selection first
                                    console.log('Opening booking modal with defaults:', {
                                      professional: staff.name,
                                      date: day.toLocaleDateString(),
                                      isDirectEmployeeSelection: true
                                    });
                                  }
                                }
                                  : undefined}
                                style={{ cursor: hasShift ? 'pointer' : 'not-allowed' }}
                                title={hasShift ? `Add another appointment with ${employee.name}` : 'No shift scheduled'}
                              >
                                <span className="add-appointment-icon">+</span>
                              </div>

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
                              className="week-empty-cell clickable-slot"
                              onClick={hasShift ? (e) => {
                                e.stopPropagation(); // Prevent event bubbling
                                console.log('Week empty cell clicked for employee:', employee.name, 'on day:', day.toLocaleDateString());

                                // Show service selection for this employee and day
                                const staff = employees.find(emp => emp.id === employee.id);
                                if (staff) {
                                  setBookingDefaults({
                                    professional: {
                                      _id: staff._id || staff.id,
                                      id: staff.id,
                                      user: {
                                        firstName: staff.name.split(' ')[0],
                                        lastName: staff.name.split(' ')[1] || ''
                                      },
                                      name: staff.name,
                                      position: staff.position,
                                      ...staff
                                    },
                                    date: day,
                                    isDirectEmployeeSelection: true // Flag for skipping professional selection
                                  });
                                  setSelectedBookingDate(day);
                                  setIsNewAppointment(true);
                                  setShowAddBookingModal(true);
                                  setShowServiceCatalog(true); // Show service selection first
                                  console.log('Opening booking modal with defaults:', {
                                    professional: staff.name,
                                    date: day.toLocaleDateString(),
                                    isDirectEmployeeSelection: true
                                  });
                                }
                              } : undefined}
                              style={{ cursor: hasShift ? 'pointer' : 'not-allowed' }}
                              title={hasShift ? `Book appointment with ${employee.name} on ${day.toLocaleDateString()}` : 'No shift scheduled'}
                            >
                              {/* <span className="book-appointment-text">
                              {hasShift ? 'Click to Book' : 'No Shift'}
                            </span>
                            {hasShift && (
                              <div className="week-time-slots-hint">
                                <span className="plus-icon">+</span>
                              </div>
                            )} */}
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
      </div>
    );
  };

  return (
    <div className="scheduler-root">
      {/* REDESIGNED Application-level Header */}
      <div className="scheduler-header-redesigned">
        {/* Left Side Controls */}
        <div className="header-left-controls">
          {/* Today Button - Only show in Day view */}
          {currentView === 'Day' && (
            <button
              className="header-btn today-btn"
              onClick={goToToday}
            >
              Today
            </button>
          )}

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
                              className={`date-picker-day ${!dayObj.isCurrentMonth ? 'other-month' : ''
                                } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''
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

                  {/* WEEK VIEW (Week Picker) */}
                  {datePickerView === 'week' && (
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
                          })} - Week Selection
                        </div>
                        <button
                          className="date-picker-nav-btn"
                          onClick={goToDatePickerNextMonth}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="date-picker-weeks">
                        {getWeeksInMonth(datePickerCurrentMonth).map((week, index) => {
                          const isCurrentWeek = week.isCurrentWeek;
                          const isSelectedWeek = week.startDate.toDateString() === currentDate.toDateString() ||
                            (currentDate >= week.startDate && currentDate <= week.endDate);

                          return (
                            <button
                              key={index}
                              className={`date-picker-week ${isCurrentWeek ? 'current-week' : ''} ${isSelectedWeek ? 'selected-week' : ''}`}
                              onClick={() => handleWeekSelect(week.startDate)}
                            >
                              <div className="week-info">
                                <span className="week-number">Week {week.weekNumber}</span>
                                <span className="week-range">
                                  {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                                  {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="date-picker-footer">
                        <button
                          className="date-picker-today-btn"
                          onClick={goToDatePickerToday}
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

                  {/* MONTH VIEW (Month Picker) */}
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
                          {datePickerCurrentMonth.getFullYear()} - Month Selection
                        </div>
                        <button
                          className="date-picker-nav-btn"
                          onClick={goToDatePickerNextYear}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="date-picker-months">
                        {getMonthsInYear(datePickerCurrentMonth.getFullYear()).map((monthObj) => {
                          const isCurrentMonth = monthObj.current;
                          const isSelectedMonth = currentDate.getFullYear() === monthObj.year &&
                            currentDate.getMonth() + 1 === monthObj.month;

                          return (
                            <button
                              key={monthObj.month}
                              className={`date-picker-month ${isCurrentMonth ? 'current-month' : ''} ${isSelectedMonth ? 'selected-month' : ''}`}
                              onClick={() => handleMonthSelect(monthObj.month - 1, monthObj.year)}
                            >
                              <div className="month-info">
                                <span className="month-name">{monthObj.label}</span>
                                <span className="month-year">{monthObj.year}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="date-picker-footer">
                        <button
                          className="date-picker-today-btn"
                          onClick={goToDatePickerToday}
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
                  {/* Header with Multiple team members title */}
                  

                  {/* Team filter options */}
                  <div className="team-filter-options">
                    <button
                      className={`team-filter-option ${teamFilter === 'scheduled' ? 'active' : ''}`}
                      onClick={() => handleTeamFilterChange('scheduled')}
                    >
                      <Users size={18} />
                      <span>Scheduled team</span>
                    </button>
                    <button
                      className={`team-filter-option ${teamFilter === 'all' ? 'active' : ''}`}
                      onClick={() => handleTeamFilterChange('all')}
                    >
                      <Users size={18} />
                      <span>All team</span>
                    </button>
                  </div>

                  {/* Team members section */}
                  <div className="team-members-container">
                    <div className="team-members-header-section">
                      <h3 className="team-members-title">Team members</h3>
                      <button className="clear-all-link" onClick={handleClearSelection}>
                        Clear all
                      </button>
                    </div>


                    <div className="team-members-list-simple">
                      {getFilteredAndSearchedEmployees().map(employee => {
                        const isSelected = selectedEmployees.has(employee.id);
                        const hasShift = hasShiftOnDate(employee, currentDate);

                        return (
                          <div
                            key={employee.id}
                            className={`team-member-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleEmployeeToggle(employee.id)}
                          >
                            <div className="member-checkbox-left">
                              <div className={`checkbox-square ${isSelected ? 'checked' : ''}`}>
                                {isSelected && (
                                  <Check size={14} strokeWidth={3} />
                                )}
                              </div>
                            </div>

                            <div
                              className="member-avatar-circle"
                              style={{ backgroundColor: employee.avatarColor }}
                            >
                              {employee.avatar ?
                                <img src={employee.avatar} alt={employee.name} className="avatar-image" /> :
                                employee.name.substring(0, 2).toUpperCase()
                              }
                            </div>

                            <span className="member-name-text">{employee.name}</span>
                          </div>
                        );
                      })}
                    </div>

                    {getFilteredAndSearchedEmployees().length === 0 && (
                      <div className="empty-state-simple">
                        <p>No team members found</p>
                      </div>
                    )}
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
            <h1>Add</h1>
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
            <div className="booking-modal booking-modal-animate-in pro-theme">
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
                <div className="booking-modal-loading" style={{ justifyContent: 'center' }}>
                  <Loading text="Updating status" />
                </div>
              )}

              <div className="booking-status-details">
                <div className="booking-status-header">
             
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
                    <div className="detail-icon">
                      <User size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Professional</span>
                      <span className="detail-value">{selectedBookingForStatus.employeeName}</span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">
                      <Calendar size={20} />
                    </div>
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
                    <div className="detail-icon">
                      <Clock size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Time</span>
                      <span className="detail-value">{selectedBookingForStatus.slotTime}</span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">
                      <Timer size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{selectedBookingForStatus.duration} minutes</span>
                    </div>
                  </div>
                  <div className="status-detail">
                    <div className="detail-icon">
                      <Hash size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Booking ID</span>
                      <span className="detail-value">{selectedBookingForStatus.bookingId || 'N/A'}</span>
                    </div>
                  </div>
                  {(selectedBookingForStatus.finalAmount !== undefined || selectedBookingForStatus.price !== undefined || selectedBookingForStatus.totalAmount !== undefined) && (
                    <div className="status-detail">
                      <div className="detail-icon">
                        <Banknote size={20} />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Amount</span>
                        <span className="detail-value" style={{ fontWeight: selectedBookingForStatus.finalAmount !== undefined && selectedBookingForStatus.finalAmount !== selectedBookingForStatus.price ? 'bold' : 'normal' }}>
                          {selectedBookingForStatus.finalAmount !== undefined && selectedBookingForStatus.finalAmount !== selectedBookingForStatus.price && (
                            <span style={{ textDecoration: 'line-through', marginRight: 8, opacity: 0.6 }}>
                              AED {Number(selectedBookingForStatus.price || selectedBookingForStatus.totalAmount || 0).toFixed(2)}
                            </span>
                          )}
                          <span style={{ color: selectedBookingForStatus.finalAmount !== undefined && selectedBookingForStatus.finalAmount !== selectedBookingForStatus.price ? '#4ade80' : 'inherit' }}>
                            AED {Number(selectedBookingForStatus.finalAmount || selectedBookingForStatus.price || selectedBookingForStatus.totalAmount || 0).toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="booking-status-actions">
                  <div className="status-actions-header">
                    <div className="status-options" role="radiogroup" aria-label="Update status">
                      {['confirmed', 'started', 'completed', 'no-show'].map(st => {
                        const current = (selectedBookingForStatus.status || 'confirmed').toLowerCase();

                        // UPDATED STATUS LOGIC: Handle booking-level statuses returned from backend
                        let isActive = current === st;

                        // Handle booking-level status mappings:
                        // Backend returns booking-level status which can be: booked, confirmed, arrived, started, completed, etc.

                        // Handle in-progress mapping (started maps to in-progress in backend, shows as 'started' button)
                        if ((current === 'in-progress' || current === 'started') && st === 'started') {
                          isActive = true;
                        }

                        // Handle legacy scheduled/booked status (fallback)
                        if ((current === 'scheduled' || current === 'booked') && st === 'confirmed') {
                          isActive = true;
                        }

                        const label = st === 'no-show' ? 'No-Show' : st.charAt(0).toUpperCase() + st.slice(1);

                        return (
                          <button
                            key={st}
                            type="button"
                            className={`status-option ${isActive ? 'active' : ''}`}
                            data-status={st}
                            role="radio"
                            aria-checked={isActive}
                            disabled={bookingStatusLoading}
                            onClick={() => handleBookingStatusUpdate(st)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="booking-danger-zone">
                    <button
                      className="delete-booking-btn"
                      title="Delete booking"
                      aria-label="Delete booking"
                      onClick={handleDeleteBooking}
                      disabled={bookingStatusLoading}
                    >
                      <span className="btn-icon"><MdDelete /></span>
                      <span className="btn-label">Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        </div>
      )}

      {showAddBookingModal && (
        <div className="modern-booking-modal">
          <div className="booking-modal-overlay booking-modal-fade-in" onClick={closeBookingModal}>
            <div className={`booking-modal booking-modal-animate-in pro-theme ${bookingStep === 6 ? 'final-step' : ''}`} onClick={e => e.stopPropagation()}>
              <button className="booking-modal-close" onClick={closeBookingModal}>×</button>
              <h2>New Appointment</h2>

              {bookingError && <div className="booking-modal-error">{bookingError}</div>}
              {bookingLoading && <div className="booking-modal-loading">Creating your perfect appointment...</div>}
              {bookingSuccess && <div className="booking-modal-success">{bookingSuccess}</div>}

              {/* Date Selection for Week View */}
              {currentView === 'Week' && !bookingDefaults?.isDirectTimeSlotSelection && !selectedBookingDate && (
                <div className="booking-date-selection">
                  <h3>Select Date</h3>
                  <div className="selected-date-display">
                    <button
                      type="button"
                      className="select-date-btn"
                      onClick={() => setShowBookingDatePicker(true)}
                    >
                      Select Date
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Time Slot Selection Info */}
              {bookingDefaults?.isDirectTimeSlotSelection && (
                <div className="booking-preselection-info">

                </div>
              )}

              {/* Service Selection Step */}
              {bookingStep === 1 && (currentView !== 'Week' || bookingDefaults?.isDirectTimeSlotSelection || selectedBookingDate) && (
                <>
                  {console.log('🎯 RENDERING STEP 1 - Service Selection')}
                  {console.log('isAddingAdditionalService:', isAddingAdditionalService)}
                  {console.log('availableServices count:', availableServices.length)}
                  {console.log('currentAppointmentIndex:', currentAppointmentIndex)}
                  <h3 className="services-section-title">Services</h3>

                  {/* SERVICE CARDS LIKE DESIGN */}
                  {(bookingDefaults?.professional || multipleAppointments.length > 0) && (
                    <div className="service-cards-stack">
                      {multipleAppointments.map((apt, idx) => {
                        console.log('🎯 Rendering appointment card:', { id: apt.id, service: apt.service?.name, index: idx });
                        const start = apt.timeSlot;
                        const end = addMinutesToTime(apt.timeSlot, apt.duration);
                        return (
                          <div key={apt.id} className="service-card-mini">
                            <div className="service-card-left-bar" />
                            <div className="service-card-body">
                              <div className="service-card-row1">
                                <span className="svc-name">{apt.service.name}</span>
                                <span className="svc-price">AED {apt.price}</span>
                              </div>
                              <div className="service-card-row2">
                                <span className="svc-time">{start}</span>
                                <span className="svc-dot">•</span>
                                <span className="svc-duration">{Math.round(apt.duration / 60) || 1}h{apt.duration % 60 ? ` ${apt.duration % 60}m` : ''}</span>
                                <span className="svc-dot">•</span>
                                <span className="svc-prof">{apt.professional.user?.firstName || apt.professional.name}</span>
                              </div>
                            </div>
                            <div className="service-card-actions">

                              <button className="svc-delete-btn" title="Remove" onClick={() => removeAppointmentFromSessionLocal(apt.id)}>
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className="add-service-inline-btn"
                        onClick={() => { setShowServiceCatalog(true); setTimeout(() => document.querySelector('.service-catalog-grid')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
                        title="Add another service"
                      >
                        Add service
                      </button>
                    </div>
                  )}

                  {/* Service catalog list for selection */}
                  {showServiceCatalog && (
                    <div className="service-catalog-grid pro-theme">
                      {availableServices.map(service => {
                        const isSelected = selectedService && selectedService._id === service._id;
                        return (
                          <button
                            key={service._id}
                            className={`service-catalog-item pro-theme ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleServiceSelect(service)}
                            type="button"
                          >
                            <span className="catalog-name">{service.name}</span>
                            <span className="catalog-meta">{service.duration}m • AED {service.price}</span>
                            <div className="badge-row">
                              <span className="badge"> {service.duration}m</span>
                              <span className="badge"> AED {service.price}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer summary (total + actions) */}
                  {bookingDefaults?.professional && (
                    <div className="services-footer-summary">
                      <div className="footer-left">
                        <div className="footer-date-line">
                          {currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="footer-total-line">
                          <span className="footer-total-label">Total</span>
                          <span className="footer-total-value">AED {getTotalSessionPrice()}</span>
                        </div>
                      </div>
                      <div className="footer-actions">
                        <button type="button" className="footer-btn secondary" onClick={closeBookingModal}>Cancel</button>
                        <button type="button" className="footer-btn" disabled={multipleAppointments.length === 0} onClick={() => setBookingStep(5)}>Checkout</button>
                        {/* <button type="button" className="footer-btn primary" disabled={multipleAppointments.length===0} onClick={()=> setBookingStep(5)}>Save</button> */}
                      </div>
                    </div>
                  )}
                  {/* <div className="booking-modal-actions">
                    <button className="booking-modal-cancel" onClick={closeBookingModal}>
                      Cancel
                    </button>
                  </div> */}
                </>
              )}

              {/* Professional Selection Step - Skip if employee already selected from week view */}
              {bookingStep === 2 && !bookingDefaults?.isDirectEmployeeSelection && (
                <>
                  <h3> Choose Your Professional</h3>
                  {availableProfessionals.length === 0 ? (
                    <div className="booking-modal-empty-state">
                      <p>No professionals are available for this service on {(selectedBookingDate || currentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}.</p>
                      <p>Please select a different date or service.</p>
                    </div>
                  ) : (
                    <div className="booking-modal-list">
                      {availableProfessionals.map(prof => {
                        const bookingDate = selectedBookingDate || currentDate;
                        // FIXED: Create proper employee object for shift checking
                        const employeeForShiftCheck = {
                          workSchedule: prof.workSchedule || {}
                        };
                        const hasShift = hasShiftOnDate(employeeForShiftCheck, bookingDate);
                        const dayName = getDayName(bookingDate);
                        const todaySchedule = prof.workSchedule?.[dayName];

                        // Check if this professional has conflicts in current session
                        const sessionConflicts = multipleAppointments.filter(apt =>
                          apt.professional._id === prof._id &&
                          formatDateLocal(new Date(apt.date)) === formatDateLocal(bookingDate)
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
                              const bookingDate = selectedBookingDate || currentDate;
                              const slots = getValidTimeSlotsForProfessional(prof, bookingDate, service.duration, appointments);
                              setAvailableTimeSlots(slots);
                            }}
                          >
                            <div className="booking-modal-item-name">
                              {prof.name}

                              <span className="professional-shift-indicator">
                                Available
                              </span>

                            </div>
                            <div className="booking-modal-list-desc">
                              {prof.position}

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
                  <h3> Pick Your Perfect Time</h3>
                  <div className="booking-modal-list">
                    {availableTimeSlots
                      .filter(slot => {
                        // Filter out slots that are not available
                        if (!slot.available) return false;
                        
                        // CUTOFF: Block any booking starting at or after 23:00
                        const startTime = slot.startTime;
                        const [hours] = startTime.split(':').map(Number);
                        if (hours >= 23) {
                          console.log('🚫 Blocking slot at', startTime, '- cutoff is 23:00');
                          return false;
                        }
                        
                        return true;
                      })
                      .map(slot => (
                      <button key={slot.startTime} className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} onClick={() => {
                        console.log('🕐 TIME SLOT SELECTED:', slot);
                        // Set then immediately add to session (auto-add first service)
                        setSelectedTimeSlot(slot);
                        const added = handleAddToBookingSession(slot);
                        // Move to multi-service management (step 4) after auto-add
                        setBookingStep(4);
                        console.log('📋 MOVING TO STEP 4 - SERVICES HUB (auto-added:', added, ')');
                      }}>
                        <div className="booking-modal-item-name">
                          {formatUTCToLocal(slot.startTime, { hour: '2-digit', minute: '2-digit', hour12: false })} - {formatUTCToLocal(slot.endTime, { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div className="booking-modal-list-desc">
                          {selectedService?.duration} minutes with {selectedProfessional?.name}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => {
                      console.log('⬅️ Going back from step 3 to step 2');
                      // Restore the last selected service
                      if (lastSelectedService) setSelectedService(lastSelectedService);
                      // Clear time slot selection and professionals to force refresh
                      setSelectedTimeSlot(null);
                      setSelectedProfessional(null);
                      setAvailableProfessionals([]);
                      setAvailableTimeSlots([]);
                      setBookingStep(2);
                    }}>← Back</button>
                  </div>
                </>
              )}

              {/* Multiple Services Management Step */}
              {bookingStep === 4 && (
                <>
                  {console.log('🎯 RENDERING STEP 4 - Current multipleAppointments:', multipleAppointments)}

                  {/* Auto-add now happens on time selection; show hint if user wants to add more */}
                  {(!selectedService || !selectedProfessional || !selectedTimeSlot) && multipleAppointments.length === 0 && (
                    <div className="empty-service-selection">
                      <div className="empty-service-message">
                        <div className="empty-icon">➕</div>
                        <h4>No services added yet</h4>
                        <p>Select a service to begin. When you pick a time it will be added automatically.</p>
                      </div>
                    </div>
                  )}

                  {/* Multiple Appointments Summary */}
                  {multipleAppointments.length > 0 && (
                    <div className="services-session-summary">
                      <h4> Services in Your Booking Session ({multipleAppointments.length})</h4>
                      {console.log('🎯 RENDERING SERVICES SUMMARY:', multipleAppointments)}
                      <div className="services-list">
                        {multipleAppointments.map((apt, index) => (
                          <div key={apt.id} className="service-session-item">
                            <div className="service-number">{index + 1}</div>
                            <div className="service-session-details">
                              <div className="service-session-name">{apt.service.name}</div>
                              <div className="service-session-meta">
                                {apt.professional.user?.firstName || apt.professional.name} •
                                {apt.timeSlot} •  {apt.service.duration}min •  AED {apt.service.price}
                              </div>
                            </div>
                            <button
                              className="remove-service-btn"
                              onClick={() => removeAppointmentFromSessionLocal(apt.id)}
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
                      Add Another Service
                    </button>

                    {multipleAppointments.length > 0 && (
                      <button
                        className="proceed-to-client-btn"
                        onClick={() => setBookingStep(5)}
                        disabled={bookingLoading}
                      >
                        Proceed to Client Information →
                      </button>
                    )}

                    {multipleAppointments.length === 0 && (
                      <div className="no-services-message">
                        <p> Please add at least one service to proceed to client information.</p>
                      </div>
                    )}
                  </div>

                  <div className="booking-modal-actions">
                    <button className="booking-modal-back" onClick={() => {
                      console.log('⬅️ Going back from step 4 to step 3');
                      // Remove the last added appointment from session
                      if (lastAddedAppointmentId) {
                        console.log('🗑️ Removing last appointment:', lastAddedAppointmentId);
                        removeAppointmentFromSessionLocal(lastAddedAppointmentId);
                        setLastAddedAppointmentId(null);
                      }
                      // Restore the last selected service and professional
                      if (lastSelectedService) setSelectedService(lastSelectedService);
                      if (lastSelectedProfessional) setSelectedProfessional(lastSelectedProfessional);
                      // Clear and force refresh of time slots
                      setAvailableTimeSlots([]);
                      setBookingStep(3);
                    }}>← Back to Time</button>
                  </div>
                </>
              )}

              {/* Client Information Step */}
              {bookingStep === 5 && (
                <>
                  <h3> Client Information</h3>

                  {/* Services Summary Header */}
                  {/* <div className="client-step-services-summary">
                    <h4> Selected Services ({multipleAppointments.length})</h4>
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
                  </div> */}

                  <div className="client-step-grid">
                    <aside className="client-right-panel">
                      <h4 className="client-right-heading">Walk-in client</h4>
                      <div className="walkin-control">
                        <label className="walkin-switch" htmlFor="walkInSwitch">
                          <input
                            id="walkInSwitch"
                            type="checkbox"
                            checked={isWalkIn}
                            onChange={e => {
                              const checked = e.target.checked;
                              setIsWalkIn(checked);
                                if (checked) {
                                  // If user marks as walk-in, clear any selected existing client
                                  setSelectedExistingClient(null);
                                  // Clear all client info including name to prevent previous selection from showing
                                  setClientInfo({ name: '', email: '', phone: '' });
                                }
                            }}
                          />
                          <span className="walkin-slider" />
                        </label>
                        <div className="walkin-labels">
                          <div className="walkin-title">Walk-in client</div>
                          <div className="walkin-sub">No additional data required</div>
                        </div>
                      </div>

                      {/* <div className="walkin-help">
                    <p>If checked, only client name is required. When you Continue, the summary will show the client as a walk-in.</p>
                  </div> */}
                    </aside>
                    <div className="client-search-section">
                      <div className="client-search-header">
                        <h4>Search Existing Client</h4>
                        <div className="client-search-right">
                          {selectedExistingClient && (
                            <button
                              className="clear-client-btn"
                              onClick={clearClientSelection}
                            >
                              Clear Selection
                            </button>
                          )}

                          {/* Walk-in checkbox on the right side */}
                          {/* <div className="walkin-control-inline">
                                <label className="checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={isWalkIn}
                                  onChange={e => {
                                  const checked = e.target.checked;
                                  setIsWalkIn(checked);
                                  if (checked) {
                                    setSelectedExistingClient(null);
                                    setClientInfo(f => ({ ...f, email: '', phone: '' }));
                                    setIsAddingNewClient(false);
                                    setShowClientSearch(false);
                                  }
                                  }}
                                />
                                <span className="checkmark"></span>
                                </label>
                              </div> */}

                          {/* <div className="walkin-text">Walk-in client (no data required)</div> */}
                        </div>
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
                              <p>No clients found</p>
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
                              Add New Client
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
                                setClientInfo({ name: '', 
                                  email: '', phone: '' });
                                setIsWalkIn(false);
                              }}
                            >
                              ← Back to Search
                            </button>
                          </div>
                          <div className="booking-modal-form">

                            <div className="form-group">
                              <label htmlFor="clientName">Client Name {isWalkIn ? '(optional for walk-ins)' : '*'}</label>
                              <input
                                id="clientName"
                                type="text"
                                placeholder="Enter client's full name"
                                value={clientInfo.name}
                                onChange={e => setClientInfo(f => ({ ...f, name: e.target.value }))}
                                required={!isWalkIn}
                              />
                            </div>
                            {/* Email and phone are optional/hidden for walk-in bookings */}
                            {!isWalkIn && (
                              <>
                                <div className="form-group">
                                  <label htmlFor="clientEmail">Email Address (Optional)</label>
                                  <input
                                    id="clientEmail"
                                    type="email"
                                    placeholder="Enter client's email address"
                                    value={clientInfo.email}
                                    onChange={e => setClientInfo(f => ({ ...f, email: e.target.value }))}
                                  />
                                </div>
                                <div className="form-group">
                                  <label htmlFor="clientPhone">Phone Number (Optional)</label>
                                  <input
                                    id="clientPhone"
                                    type="tel"
                                    placeholder="Enter client's phone number"
                                    value={clientInfo.phone}
                                    onChange={e => setClientInfo(f => ({ ...f, phone: e.target.value }))}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right-side panel: Walk-in toggle and helpers */}

                  </div>

                  <div className="booking-modal-actions">
                    <button
                      className="booking-modal-next"
                      onClick={() => setBookingStep(6)}
                      disabled={
                        !selectedExistingClient && !(
                          isWalkIn || (clientInfo.name && clientInfo.name.trim())
                        )
                      }
                    >
                      Continue to Payment
                    </button>
                    <button className="booking-modal-back" onClick={() => {
                      // If booking came from grid/calendar time slot (bookingDefaults exists),
                      // skip professional/time selection and go directly back to service selection (step 1)
                      if (bookingDefaults?.professional && bookingDefaults?.time) {
                        console.log('⬅️ Going back from step 5 to step 1 (grid booking mode)');
                        setBookingStep(1);
                        // DON'T clear booking defaults - keep professional & time info for grid booking flow
                        // setBookingDefaults(null); ❌ Removed - this was causing the flow to forget grid selection
                        // Show service catalog so user can select services
                        setShowServiceCatalog(true);
                      } else {
                        console.log('⬅️ Going back from step 5 to step 4 (normal booking mode)');
                        setBookingStep(4);
                      }
                    }}>← Back to Services</button>
                  </div>
                </>
              )}

              {/* Payment & Confirmation Step */}
              {/* Payment & Confirmation Step */}
              {bookingStep === 6 && (
                <>
                  <div className="payment-step-grid">
                    {/* Left Column */}
                    <div className="payment-left-column">
                      
                      {/* 1. Appointment Summary */}
                      <div className="appointment-summary-card">
                        <h4><Calendar size={18} /> Appointment Summary</h4>
                        <div className="appointments-list">
                          {multipleAppointments.map((apt, index) => (
                            <div key={apt.id} className="appointment-summary-item">
                              <div className="appointment-main-info">
                                <div className="service-name">{apt.service.name}</div>
                                <div className="appointment-meta-row">
                                  <span className="meta-icon"><User size={14} /></span> {apt.professional.user?.firstName || apt.professional.name}
                                  <span className="meta-divider">|</span>
                                  <span className="meta-icon"><Clock size={14} /></span> {apt.timeSlot}
                                  <span className="meta-divider">|</span>
                                  <span className="meta-icon"><RotateCcw size={14} /></span> {apt.service.duration} min
                                </div>
                              </div>
                              <div className="appointment-price-action">
                                <div className="service-price">AED {apt.service.price}</div>
                                <button
                                  className="remove-appointment-btn-simple"
                                  onClick={() => removeAppointmentFromSessionLocal(apt.id)}
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="appointment-summary-footer">
                          <div className="summary-stat">
                            <span className="stat-label">Total Services</span>
                            <span className="stat-value">{multipleAppointments.length}</span>
                          </div>
                          <div className="summary-stat">
                            <span className="stat-label">Total Duration</span>
                            <span className="stat-value">{multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0)} minutes</span>
                          </div>
                          <div className="summary-stat highlight total-price-container">
                            <span className="stat-label">Total Price</span>
                            {editingTotalPrice ? (
                              <div className="price-edit-wrapper">
                                <span className="currency-prefix">AED</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={tempTotalPrice}
                                  onChange={(e) => setTempTotalPrice(e.target.value)}
                                  className="price-edit-input-modern"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditedTotalPrice();
                                    if (e.key === 'Escape') cancelEditingTotalPrice();
                                  }}
                                />
                                <div className="edit-actions">
                                  <button className="edit-action-btn save" onClick={saveEditedTotalPrice} title="Save">
                                    <Check size={14} />
                                  </button>
                                  <button className="edit-action-btn cancel" onClick={cancelEditingTotalPrice} title="Cancel">
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="price-display-wrapper">
                                <span className="stat-value">AED {getTotalSessionPrice().toFixed(2)}</span>
                                <button className="edit-price-btn-modern" onClick={startEditingTotalPrice} title="Edit Total Price">
                                  <Edit2 size={14} />
                                </button>
                                {customTotalDiscount > 0 && (
                                   <button className="clear-discount-btn-modern" onClick={clearCustomDiscount} title="Remove Discount">
                                     <X size={12} />
                                   </button>
                                )}
                              </div>
                            )}
                            
                            {customTotalDiscount > 0 && !editingTotalPrice && (
                               <div className="original-price-subtext">
                                  <span className="original">AED {(multipleAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0)).toFixed(2)}</span>
                                  <span className="discount-tag">-{customTotalDiscount.toFixed(2)} off</span>
                               </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Client Details */}
                      <div className="client-details-card">
                        <h4><User size={18} /> Client Details</h4>
                        {selectedExistingClient ? (
                          <div className="client-profile-header">
                            <div className="client-avatar-large">
                              {(selectedExistingClient.firstName?.[0] || '') + (selectedExistingClient.lastName?.[0] || '')}
                            </div>
                            <div className="client-profile-info">
                              <div className="client-name-large">{selectedExistingClient.firstName} {selectedExistingClient.lastName}</div>
                              <div className="client-type-badge">Returning Client</div>
                            </div>
                          </div>
                        ) : (
                           <div className="client-profile-header">
                            <div className="client-avatar-large placeholder">
                              {clientInfo.name ? clientInfo.name[0] : 'G'}
                            </div>
                            <div className="client-profile-info">
                              <div className="client-name-large">{clientInfo.name || 'Walk In Client'}</div>
                              <div className="client-type-badge new">New Client</div>
                            </div>
                          </div>
                        )}

                        <div className="client-fields-grid">
                          <div className="client-field-group">
                            <label>Name</label>
                            <div className="readonly-field"><User size={14} className="text-gray-400" /> {selectedExistingClient ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}` : clientInfo.name}</div>
                          </div>
                          <div className="client-field-group">
                            <label>Email</label>
                            <div className="readonly-field"><Mail size={14} className="text-gray-400" /> {selectedExistingClient ? selectedExistingClient.email : (clientInfo.email || '-')}</div>
                          </div>
                          <div className="client-field-group full-width">
                            <label>Phone</label>
                            <div className="readonly-field"><Phone size={14} className="text-gray-400" /> {selectedExistingClient ? selectedExistingClient.phone : (clientInfo.phone || '-')}</div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Billing & Redeem */}
                      <div className="billing-redeem-card">
                        <h4><Tag size={18} /> Billing & Redeem</h4>
                        
                        {/* Gift Card Section */}
                        <div className="redeem-section">
                          <div className="redeem-header">
                            <Gift size={16} className="redeem-icon" />
                            <span className="redeem-title">Gift Card</span>
                          </div>
                          
                          {selectedGiftCard && (
                             <div className="applied-redeem-item">
                                <div className="redeem-info">
                                  <span className="redeem-code">{selectedGiftCard.code}</span>
                                  <span className="redeem-amount">- AED {giftCardAppliedAmount}</span>
                                </div>
                                <button onClick={() => setSelectedGiftCard(null)} className="remove-redeem-btn">Remove</button>
                             </div>
                          )}
                          
                          {/* Available Gift Cards List (Simplified) */}
                          {availableGiftCards.length > 0 && !selectedGiftCard && (
                             <div className="available-redeem-list">
                                {availableGiftCards.map(gc => (
                                   <button key={gc._id} className="redeem-option-chip" onClick={() => {
                                      setSelectedGiftCard(gc);
                                      const total = getTotalSessionPrice();
                                      const val = calculateGiftCardValue(gc);
                                      setGiftCardAppliedAmount(Math.min(val, total));
                                   }}>
                                     <Gift size={12} /> {gc.code} (AED {calculateGiftCardValue(gc)})
                                   </button>
                                ))}
                             </div>
                          )}
                        </div>

                        {/* Membership Section */}
                        <div className="redeem-section">
                          <div className="redeem-header">
                            <Crown size={16} className="redeem-icon" />
                            <span className="redeem-title">Membership</span>
                          </div>
                          
                          <AdminMembershipChecker
                              selectedClient={selectedExistingClient || {
                                firstName: clientInfo.name?.split(' ')[0] || '',
                                lastName: clientInfo.name?.split(' ').slice(1).join(' ') || '',
                                email: clientInfo.email,
                                phone: clientInfo.phone
                              }}
                              selectedServices={multipleAppointments.map(apt => apt.service)}
                              appliedMembership={appliedMembership}
                              onMembershipApplied={handleMembershipApplied}
                              onMembershipRemoved={handleMembershipRemoved}
                              refreshSignal={membershipRefreshSignal}
                            />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="payment-right-column">
                      
                      {/* 1. Payment Breakdown */}
                      <div className="payment-breakdown-card">
                        <h4><Banknote size={18} /> Payment Breakdown</h4>
                        <div className="breakdown-row">
                          <span className="breakdown-label">Service Total</span>
                          <span className="breakdown-value">AED {getTotalSessionPrice().toFixed(2)}</span>
                        </div>
                        
                        {appliedMembership && membershipDiscountAmount > 0 && (
                          <div className="breakdown-row discount">
                            <span className="breakdown-label">Membership Discount</span>
                            <span className="breakdown-value">-AED {membershipDiscountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {selectedGiftCard && giftCardAppliedAmount > 0 && (
                          <div className="breakdown-row discount">
                            <span className="breakdown-label">Gift Card</span>
                            <span className="breakdown-value">-AED {giftCardAppliedAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {customTotalDiscount > 0 && (
                           <div className="breakdown-row discount">
                            <span className="breakdown-label">Manual Discount</span>
                            <span className="breakdown-value">-AED {customTotalDiscount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="breakdown-divider"></div>
                        
                        <div className="breakdown-row total">
                          <span className="breakdown-label">Remaining Amount</span>
                          <span className="breakdown-value">AED {calculateTotalWithGiftCard().remainingAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 2. Payment Method */}
                      <div className="payment-method-card">
                        <h4><CreditCard size={18} /> Payment Method</h4>
                        <div className="payment-methods-grid-large">
                          <button 
                            className={`pm-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('cash')}
                          >
                            <div className="pm-icon"><Banknote size={24} /></div>
                            <div className="pm-name">Cash</div>
                          </button>
                          <button 
                            className={`pm-card ${paymentMethod === 'card' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            <div className="pm-icon"><CreditCard size={24} /></div>
                            <div className="pm-name">Card</div>
                          </button>
                         
                          <button 
                            className={`pm-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('upi')}
                          >
                            <div className="pm-icon"><Landmark size={24} /></div>
                            <div className="pm-name">Bank Transfer</div>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Bottom Floating Action Bar */}
                  <div className="confirm-appointment-bar">
                     <button className="back-btn-simple" onClick={() => setBookingStep(5)}>
                        <ChevronLeft size={16} /> Back
                     </button>
                     <button 
                        className="confirm-booking-btn-large"
                        onClick={handleCreateBooking}
                        disabled={bookingLoading}
                     >
                        {bookingLoading ? 'Processing...' : (
                          <>
                            <Check size={18} />
                            {`Confirm Appointment — Pay AED ${calculateTotalWithGiftCard().remainingAmount.toFixed(2)}`}
                          </>
                        )}
                     </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* More Appointments Dropdown */}
      <MoreAppointmentsDropdown visible={showMoreAppointments} appointments={selectedDayAppointments} dayDate={selectedDayDate} position={dropdownPosition} positionedAbove={dropdownPositionedAbove} onClose={closeMoreAppointmentsDropdown} />

      {/* Booking Tooltip */}
      {showBookingTooltip && tooltipData && (<BookingTooltip tooltipData={tooltipData} position={tooltipPosition} />)}

      {/* Time Hover Tooltip */}
      {showTimeHover && hoverTimeData && (<TimeHoverTooltip hoverTimeData={hoverTimeData} position={hoverTimePosition} />)}

      {/* Booking Date Picker Modal */}
      {showBookingDatePicker && (
        <div className="modern-booking-modal">
          <div className="booking-modal-overlay booking-modal-fade-in" onClick={() => setShowBookingDatePicker(false)}>
            <div className="booking-modal booking-modal-animate-in pro-theme" onClick={e => e.stopPropagation()}>
              <button className="booking-modal-close" onClick={() => setShowBookingDatePicker(false)}>×</button>
              <h2>Select Appointment Date</h2>

              <div className="date-picker-section">
                {currentView === 'Week' ? (
                  <>
                    <h3>Choose a day from this week:</h3>
                    <div className="week-days-grid">
                      {getBookingDatePickerDays().map((day, index) => (
                        <button
                          key={index}
                          className={`week-day-btn ${day.isToday ? 'today' : ''} ${selectedBookingDate && formatDateLocal(selectedBookingDate) === formatDateLocal(day.date) ? 'selected' : ''
                            }`}
                          onClick={() => handleBookingDateSelect(day)}
                        >
                          <div className="day-name">{day.dayName}</div>
                          <div className="day-number">{day.day}</div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Click any day to schedule an appointment:</h3>

                    {/* Day headers */}
                    <div className="calendar-day-headers">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="calendar-day-header">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="month-calendar-grid">
                      {getBookingDatePickerDays().map((day, index) => (
                        <button
                          key={index}
                          className={`calendar-day-btn ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''
                            } ${selectedBookingDate && formatDateLocal(selectedBookingDate) === formatDateLocal(day.date) ? 'selected' : ''
                            }`}
                          onClick={() => handleBookingDateSelect(day)}
                          disabled={!day.isCurrentMonth}
                        >
                          {String(day.day).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setShowBookingDatePicker(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// computeAppointmentLayout now in calendar/dateUtils (used only in StaffColumn extraction)


// WeekDayColumn extracted
export default SelectCalendar
