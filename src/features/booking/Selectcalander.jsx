import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Loading from '@components/ui/Loading.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { hasShiftOnDate, getEmployeeShiftHours, localDateKey, formatDateLocal, getDayName, BookingTooltip, TimeHoverTooltip, MoreAppointmentsDropdown } from '@features/booking';
import DayView from '@features/booking/components/DayView.jsx';
import WeekView from '@features/booking/components/WeekView.jsx';
import MonthView from '@features/booking/components/MonthView.jsx';
import {
  formatTime,
  generateTimeSlotsFromEmployeeShift,
  getAccumulatedBookings,
  isTimeSlotConflicting,
  getDatePickerCalendarDays
} from './helpers/selectCalendarHelpers';
import './Selectcalander.css';
import Error500Page from '@components/ui/ErrorPage';
import NoDataState from '@components/ui/NoData';
import BookingWizardModal from '@features/booking/components/BookingWizard/BookingWizardModal.jsx';
import BookingStatusModal from '@features/booking/components/BookingStatusModal.jsx';
import CalendarHeader from '@features/booking/components/CalendarHeader.jsx';
import { adminBookingActions } from '@store/adminBookingSlice';
import { calendarActions, setCurrentDateISO } from '@store/calendarSlice';
import { bookingSessionActions } from '@store/bookingSessionSlice';
import { 
  fetchManagementBookingDetailsThunk,
  fetchBookingServicesThunk,
  fetchExistingClientsThunk,
  loadClientBenefitsThunk,
  searchClientsThunk
} from '@store/adminBookingThunks';
import { fetchCalendarThunk } from '@store/calendarThunks';



const SelectCalendar = () => {
  const dispatch = useDispatch();

  // 1. Calendar State (Date & View from Redux)
  const { 
    currentDateISO, 
    currentView, 
    datePicker, 
    filters 
  } = useSelector(state => state.calendar);
  
  const currentDate = useMemo(() => new Date(currentDateISO), [currentDateISO]);
  const showDatePicker = datePicker.show;

  const setShowDatePicker = (val) => dispatch(calendarActions.setDatePickerShow(val));
  const setCurrentDate = (date) => dispatch(setCurrentDateISO(date.toISOString()));

  // 2. Booking Session Data (Already in Redux)
  const multipleAppointments = useSelector(state => state.bookingSession.multipleAppointments);


  // 3. Admin Booking Workflow State (New Redux Slice)
  const showAddBookingModal = useSelector(state => state.adminBooking.showModal);
  
  // Client selection
  const selectedExistingClient = useSelector(state => state.adminBooking.client.selected);
  const selectedBookingDate = useSelector(state => state.adminBooking.selection.date);

  // Derived / Available Lists
  const availableServices = useSelector(state => state.adminBooking.available.services);
  const bookingStep = useSelector(state => state.adminBooking.step);
  const bookingState = useSelector(state => state.adminBooking.bookingState);

  
  // Redux Action Dispatchers
  const setShowAddBookingModal = (val) => dispatch(adminBookingActions.setModalOpen(val));
  const setSelectedBookingDate = (val) => dispatch(adminBookingActions.setSelectedDate(val));
  const setIsNewAppointment = (val) => dispatch(adminBookingActions.setIsNewAppointment(val));
  const setShowServiceCatalog = (val) => dispatch(bookingSessionActions.setShowServiceCatalog(val));
  const setGiftCardCode = (val) => dispatch(adminBookingActions.setGiftCardCode(val));
  const setBookingDefaults = (val) => dispatch(adminBookingActions.setBookingDefaults(val));
  const setBookingError = (val) => dispatch(adminBookingActions.setBookingStatus({ error: val }));
  const setAvailableTimeSlots = (val) => dispatch(adminBookingActions.setAvailableTimeSlots(val));
  const setSelectedProfessional = (val) => dispatch(adminBookingActions.setSelectedProfessional(val));
  const setSelectedService = (val) => dispatch(adminBookingActions.setSelectedService(val));
  const setBookingStep = (val) => dispatch(adminBookingActions.setStep(val));
  const setClientSearchQuery = (val) => dispatch(adminBookingActions.setClientSearchQuery(val));
  const setClientSearchResults = (val) => dispatch(adminBookingActions.setClientSearchResults(val));
  const setSelectedExistingClient = (val) => dispatch(adminBookingActions.setSelectedClient(val));
  const setIsAddingNewClient = (val) => dispatch(adminBookingActions.setIsAddingNewClient(val));
  const setClientInfo = (val) => dispatch(adminBookingActions.setClientInfo(val));


  const [showUnavailablePopup, setShowUnavailablePopup] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [showBookingDatePicker, setShowBookingDatePicker] = useState(false);
  const [showMoreAppointments, setShowMoreAppointments] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownPositionedAbove, setDropdownPositionedAbove] = useState(false);

  const [showBookingTooltip, setShowBookingTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const [showClientSearch, setShowClientSearch] = useState(false);
  
  // Time Slot Hover State
  const [showTimeHover, setShowTimeHover] = useState(false);
  const [hoverTimeData, setHoverTimeData] = useState(null);
  const [hoverTimePosition, setHoverTimePosition] = useState({ x: 0, y: 0 });


  // Refs
  const staffHeadersRef = useRef(null);
  const staffGridRef = useRef(null);
  const schedulerContentRef = useRef(null);

  // Core scheduler state (Existing Redux)
  const employees = useSelector(state => state.employees.list);
  const timeSlots = useSelector(state => state.calendar.timeSlots);
  const loading = useSelector(state => state.calendar.loading);
  const error = useSelector(state => state.calendar.error);

  const appointments = useSelector(state => state.appointments.byEmployee);

  const handleTimeSlotClick = (employeeId, slotTime, day) => {
    const dayKey = localDateKey(day || currentDate);
    const slotKey = `${dayKey}_${slotTime}`;
    const existingAppointment = appointments[employeeId]?.[slotKey];

    // CUTOFF CHECK: Block any booking starting at or after 23:30
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotTimeInMinutes = hours * 60 + minutes;
    const cutoffTimeInMinutes = 23 * 60 + 30; // 23:30

    if (slotTimeInMinutes >= cutoffTimeInMinutes) {
      setUnavailableMessage('Bookings cannot start at or after 23:30 to prevent overflow into the next day. Please select an earlier time slot.');
      setShowUnavailablePopup(true);
      return;
    }

    if (existingAppointment) {
      const employee = employees.find(emp => emp.id === employeeId);
      const appointmentDetails = {
        ...existingAppointment,
        employeeId,
        employeeName: employee?.name,
        slotTime,
        date: dayKey,
        slotKey
      };
      dispatch(adminBookingActions.setSelectedManagementBooking(appointmentDetails));
      dispatch(adminBookingActions.setManagementStatusModal(true));
      dispatch(fetchManagementBookingDetailsThunk(existingAppointment.bookingId));
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

  const closeBookingModal = () => {
    setShowAddBookingModal(false);
    setShowUnavailablePopup(false);

    // Reset workflow state via single reset action if available, or manual clear
    dispatch(adminBookingActions.resetBookingState());
    dispatch(bookingSessionActions.clearSession());
  };

  const closeBookingStatusModal = () => {
    dispatch(adminBookingActions.setManagementStatusModal(false));
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

  const clearAppointmentSession = () => {
    dispatch(bookingSessionActions.clearSession());
    setGiftCardCode('');
  };



  // --- ENHANCED BOOKING FLOW FUNCTIONS ---
  const fetchBookingServices = useCallback(async () => {
    dispatch(fetchBookingServicesThunk());
  }, [dispatch]);








  // Optimized client fetching: don't fetch 10,000 clients at once
  const fetchExistingClients = useCallback(async () => {
    dispatch(fetchExistingClientsThunk());
  }, [dispatch]);

  // Server-side search with debounce
  const clientSearchTimeoutRef = useRef(null);

  const searchClients = useCallback(async (query) => {
    dispatch(searchClientsThunk(query));
  }, [dispatch]);

  const handleClientSearchChange = (e) => {
    const query = e.target.value;
    setClientSearchQuery(query);
    
    if (clientSearchTimeoutRef.current) {
      clearTimeout(clientSearchTimeoutRef.current);
    }
    
    clientSearchTimeoutRef.current = setTimeout(() => {
      searchClients(query);
    }, 300);
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


  // Close dropdown when clicking outside or on escape key
  useEffect(() => {
    if (employees.length > 0 && filters.selectedEmployeeIds.length === 0) {
      // By default, select all employees
      dispatch(calendarActions.setEmployeeSelection(employees.map(emp => emp.id)));
    }
  }, [employees]);
  // NEW: Filter employees based on team selection and selected employees

  const getFilteredEmployees = () => {
    const selectedEmployeesSet = new Set(filters.selectedEmployeeIds);
    const teamFilter = filters.teamFilter;

    // First filter out "Allora Spa Dubai" staff
    let filteredByName = employees.filter(emp =>
      emp.name !== 'Allora Spa Dubai' &&
      emp.name?.toLowerCase() !== 'allora spa dubai'
    );

    let filteredByTeam = filteredByName;

    if (teamFilter === 'scheduled') {
      filteredByTeam = filteredByName.filter(emp => hasShiftOnDate(emp, currentDate));
    } else if (teamFilter === 'active') {
      filteredByTeam = filteredByName.filter(emp => emp.isActive !== false);
    } else if (teamFilter === 'inactive') {
      filteredByTeam = filteredByName.filter(emp => emp.isActive === false);
    }

    // Then filter by selected employees
    return filteredByTeam.filter(emp => selectedEmployeesSet.size === 0 || selectedEmployeesSet.has(emp.id));
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

  // Booking preview handling logic removed from UI, now handled by Redux thunks
  




  // --- API CALL FUNCTION (moved to Redux thunk) ---
  const fetchCalendarData = () => {
    dispatch(fetchCalendarThunk({ currentDate, currentView }));
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, currentView]);

  // Load services on component mount for price lookups
  useEffect(() => {
    fetchBookingServices();
  }, [fetchBookingServices]);

  // Initialize booking modal when opened
  useEffect(() => {
    if (showAddBookingModal) {
      // Both Add button and time slot clicks now start from service selection
      setBookingStep(1); // Always start with service selection
      fetchBookingServices();
      fetchExistingClients();
    }
  }, [showAddBookingModal, fetchBookingServices, fetchExistingClients]);



  // Auto-fetch gift cards useEffect moved after function definition

  // Load client gift cards when entering payment step
  const loadBenefitsIfNeeded = useCallback(async (force = false) => {
    if (!selectedExistingClient?._id) return;
    dispatch(loadClientBenefitsThunk(selectedExistingClient._id));
  }, [dispatch, selectedExistingClient]);

  // Add useEffect to trigger benefits load when needed
  useEffect(() => {
    if (bookingStep === 6 && selectedExistingClient?._id) {
      loadBenefitsIfNeeded();
    }
  }, [bookingStep, selectedExistingClient, loadBenefitsIfNeeded]);

  // Auto-selection logic for booking modal has been moved to Redux thunks
  

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



  const getFilteredAndSearchedEmployees = () => {
    let filtered = employees;
    if (filters.teamFilter === 'scheduled') {
      filtered = employees.filter(emp => hasShiftOnDate(emp, currentDate));
    }
    return filtered;
  };

  const getAppointmentsForDateRange = () => {
    const status = (filters.calendarPopupTab || 'confirmed').toLowerCase();
    let startDate, endDate;

    if (currentView === 'Day') {
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (currentView === 'Week') {
      startDate = new Date(calendarDays[0]);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(calendarDays[6]);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    }

    const result = [];
    Object.keys(appointments).forEach(empId => {
      const empSlots = appointments[empId];
      Object.keys(empSlots).forEach(slotKey => {
        const apt = empSlots[slotKey];
        if (apt.status?.toLowerCase() === status) {
          const aptDate = new Date(apt.date);
          if (aptDate >= startDate && aptDate <= endDate) {
            result.push(apt);
          }
        }
      });
    });

    return result;
  };



  const displayEmployees = useMemo(() => getFilteredEmployees(), [employees, filters.teamFilter, filters.selectedEmployeeIds, currentDate]);

  const renderCalendarContent = () => {
    if (loading) {
      return (
        <div className="content-loading-overlay">
          <div className="loading-message">
            <Loading />
          </div>
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
      return (
        <MonthView
          currentDate={currentDate}
          calendarDays={calendarDays}
          localDateKey={localDateKey}
          displayEmployees={displayEmployees}
          mergedAppointments={mergedAppointments}
          formatTime={formatTime}
          handleMonthDayClick={handleMonthDayClick}
          availableServices={availableServices}
          showBookingTooltipHandler={showBookingTooltipHandler}
          hideBookingTooltip={hideBookingTooltip}
          handleShowMoreAppointments={handleShowMoreAppointments}
        />
      );
    }

    return (
      <div className="calendar-grid-container">
        {currentView === 'Day' ? (
          <DayView
            timeSlots={timeSlots}
            formatTime={formatTime}
            displayEmployees={displayEmployees}
            staffHeadersRef={staffHeadersRef}
            hasShiftOnDate={hasShiftOnDate}
            getEmployeeShiftHours={getEmployeeShiftHours}
            currentDate={currentDate}
            staffGridRef={staffGridRef}
            mergedAppointments={mergedAppointments}
            isTimeSlotUnavailable={isTimeSlotUnavailable}
            handleTimeSlotClick={handleTimeSlotClick}
            showBookingTooltipHandler={showBookingTooltipHandler}
            hideBookingTooltip={hideBookingTooltip}
            showTimeHoverHandler={showTimeHoverHandler}
            hideTimeHover={hideTimeHover}
          />
        ) : (
          <WeekView
            calendarDays={calendarDays}
            displayEmployees={displayEmployees}
            mergedAppointments={mergedAppointments}
            hasShiftOnDate={hasShiftOnDate}
            formatDateLocal={formatDateLocal}
            formatTime={formatTime}
            availableServices={availableServices}
            handleTimeSlotClick={handleTimeSlotClick}
            showBookingTooltipHandler={showBookingTooltipHandler}
            hideBookingTooltip={hideBookingTooltip}
            employees={employees}
            setBookingDefaults={setBookingDefaults}
            setSelectedBookingDate={setSelectedBookingDate}
            setIsNewAppointment={setIsNewAppointment}
            setShowAddBookingModal={setShowAddBookingModal}
            setShowServiceCatalog={setShowServiceCatalog}
            handleShowMoreAppointments={handleShowMoreAppointments}
          />
        )}
      </div>
    );
  };

  return (
    <div className="select-calendar-container">
      <CalendarHeader 
        goToToday={goToToday}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        handleRefreshToNow={handleRefreshToNow}
        handleAddAppointment={handleAddAppointment}
        calendarDays={calendarDays}
        employees={employees}
        getFilteredAndSearchedEmployees={getFilteredAndSearchedEmployees}
        getAppointmentsForDateRange={getAppointmentsForDateRange}
      />
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
      <BookingStatusModal />
      <BookingWizardModal />

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

export default SelectCalendar;
