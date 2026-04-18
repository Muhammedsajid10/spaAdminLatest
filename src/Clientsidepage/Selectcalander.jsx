import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import Loading from '../states/Loading.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { useDatePickerState, hasShiftOnDate, getEmployeeShiftHours, getAppointmentColorByStatus, localDateKey, formatDateLocal, getDayName, WeekDayColumn, BookingTooltip, TimeHoverTooltip, MoreAppointmentsDropdown } from '../calendar';
import { StaffColumn } from '../calendar/components/StaffColumn';
import DayView from '../calendar/components/DayView.jsx';
import WeekView from '../calendar/components/WeekView.jsx';
import MonthView from '../calendar/components/MonthView.jsx';
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
import BookingWizardModal from '../calendar/components/BookingWizard/BookingWizardModal.jsx';
import BookingStatusModal from '../calendar/components/BookingStatusModal.jsx';
import CalendarHeader from '../calendar/components/CalendarHeader.jsx';
import { adminBookingActions } from '../store/adminBookingSlice';
import { calendarActions, setCurrentDateISO, setCurrentView } from '../store/calendarSlice';
import { bookingSessionActions } from '../store/bookingSessionSlice';
import { 
  fetchManagementBookingDetailsThunk,
  fetchBookingServicesThunk,
  fetchBookingProfessionalsThunk,
  fetchExistingClientsThunk,
  searchClientsThunk,
  loadClientBenefitsThunk
} from '../store/adminBookingThunks';
import { fetchCalendarThunk } from '../store/calendarThunks';

// --- API ENDPOINTS ---
const BOOKING_API_URL = `${Base_url}/bookings`;
const SERVICES_API_URL = `${Base_url}/services`;
const EMPLOYEES_API_URL = `${Base_url}/employees`;
const CLIENTS_API_URL = `${Base_url}/clients`;

const MOCK_CLIENTS_DATA = [
  { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890' },
  { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '0987654321' }
];

const MOCK_SERVICES_DATA = [
  { _id: 's1', name: 'Massage', duration: 60, price: 100 },
  { _id: 's2', name: 'Facial', duration: 45, price: 80 }
];

const MOCK_EMPLOYEES_DATA = [
  { id: 'e1', name: 'Alice', color: '#ff0000' },
  { id: 'e2', name: 'Bob', color: '#00ff00' }
];

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
  const datePickerView = datePicker.view;
  const showDatePicker = datePicker.show;
  const datePickerCurrentMonth = new Date(datePicker.currentMonthISO);
  const datePickerSelectedDate = new Date(datePicker.selectedDateISO);

  const setDatePickerView = (val) => dispatch(calendarActions.setDatePickerView(val));
  const setShowDatePicker = (val) => dispatch(calendarActions.setDatePickerShow(val));
  const setCurrentDate = (date) => dispatch(setCurrentDateISO(date.toISOString()));
  const setCurrentView = (val) => dispatch(adminBookingActions.setCurrentView(val));

  // 2. Booking Session Data (Already in Redux)
  const multipleAppointments = useSelector(state => state.bookingSession.multipleAppointments);
  const currentAppointmentIndex = useSelector(state => state.bookingSession.currentAppointmentIndex);
  const showServiceCatalog = useSelector(state => state.bookingSession.showServiceCatalog);
  const isAddingAdditionalService = useSelector(state => state.bookingSession.isAddingAdditionalService);

  // 3. Admin Booking Workflow State (New Redux Slice)
  const bookingStep = useSelector(state => state.adminBooking.step);
  const showAddBookingModal = useSelector(state => state.adminBooking.showModal);
  const isWalkIn = useSelector(state => state.adminBooking.isWalkIn);
  
  // Client selection & search
  const selectedExistingClient = useSelector(state => state.adminBooking.client.selected);
  const clientSearchQuery = useSelector(state => state.adminBooking.client.searchQuery);
  const clientSearchResults = useSelector(state => state.adminBooking.client.searchResults);
  const isAddingNewClient = useSelector(state => state.adminBooking.client.isAddingNew);
  const clientInfo = useSelector(state => state.adminBooking.client.info);
  
  // Selection
  const selectedService = useSelector(state => state.adminBooking.selection.service);
  const selectedProfessional = useSelector(state => state.adminBooking.selection.professional);
  const selectedTimeSlot = useSelector(state => state.adminBooking.selection.timeSlot);
  const selectedBookingDate = useSelector(state => state.adminBooking.selection.date);
  const bookingDefaults = useSelector(state => state.adminBooking.navigation.defaults);
  
  // Derived / Available Lists
  const availableServices = useSelector(state => state.adminBooking.available.services);
  const availableProfessionals = useSelector(state => state.adminBooking.available.professionals);
  const availableTimeSlots = useSelector(state => state.adminBooking.available.timeSlots);
  
  // Persistence / Navigation
  const lastSelectedService = useSelector(state => state.adminBooking.navigation.lastService);
  const lastSelectedProfessional = useSelector(state => state.adminBooking.navigation.lastProfessional);
  
  // Payment & Pricing
  const paymentMethod = useSelector(state => state.adminBooking.payment.method);
  const customTotalDiscount = useSelector(state => state.adminBooking.payment.customTotalDiscount);
  const membershipDiscountAmount = useSelector(state => state.adminBooking.payment.membershipDiscountAmount);
  const editedServicePrices = useSelector(state => state.adminBooking.payment.editedServicePrices);
  const bookingPreview = useSelector(state => state.adminBooking.payment.preview);
  const bookingPreviewLoading = useSelector(state => state.adminBooking.payment.previewLoading);
  const bookingPreviewError = useSelector(state => state.adminBooking.payment.previewError);
  
  // Benefits
  const appliedMembership = useSelector(state => state.adminBooking.benefits.appliedMembership);
  const selectedGiftCard = useSelector(state => state.adminBooking.benefits.appliedGiftCard);
  const availableMemberships = useSelector(state => state.adminBooking.benefits.availableMemberships);
  const availableGiftCards = useSelector(state => state.adminBooking.benefits.availableGiftCards);
  
  // Status
  const bookingLoading = useSelector(state => state.adminBooking.status.loading);
  const bookingError = useSelector(state => state.adminBooking.status.error);
  const bookingSuccess = useSelector(state => state.adminBooking.status.success);

  // Redux Dispatch Mappings (Migration of local setters)
  const setBookingStep = (val) => dispatch(adminBookingActions.setStep(val));
  const setShowAddBookingModal = (val) => dispatch(adminBookingActions.setModalOpen(val));
  const setIsWalkIn = (val) => dispatch(adminBookingActions.setIsWalkIn(val));
  const setSelectedExistingClient = (val) => dispatch(adminBookingActions.setSelectedClient(val));
  const setClientSearchQuery = (val) => dispatch(adminBookingActions.setClientSearchQuery(val));
  const setClientSearchResults = (val) => dispatch(adminBookingActions.setClientSearchResults(val));
  const setIsAddingNewClient = (val) => dispatch(adminBookingActions.setIsAddingNewClient(val));
  const setClientInfo = (val) => dispatch(adminBookingActions.setClientInfo(val));
  
  const setSelectedService = (val) => dispatch(adminBookingActions.setSelectedService(val));
  const setSelectedProfessional = (val) => dispatch(adminBookingActions.setSelectedProfessional(val));
  const setSelectedTimeSlot = (val) => dispatch(adminBookingActions.setSelectedTimeSlot(val));
  const setSelectedBookingDate = (val) => dispatch(adminBookingActions.setSelectedDate(val));
  const setBookingDefaults = (val) => dispatch(adminBookingActions.setBookingDefaults(val));
  
  const setAvailableServices = (val) => dispatch(adminBookingActions.setAvailableServices(val));
  const setAvailableProfessionals = (val) => dispatch(adminBookingActions.setAvailableProfessionals(val));
  const setAvailableTimeSlots = (val) => dispatch(adminBookingActions.setAvailableTimeSlots(val));
  
  const setPaymentMethod = (val) => dispatch(adminBookingActions.setPaymentMethod(val));
  const setCustomTotalDiscount = (val) => dispatch(adminBookingActions.setCustomTotalDiscount(val));
  const setMembershipDiscountAmount = (val) => dispatch(adminBookingActions.setMembershipDiscountAmount(val));
  const setEditedServicePrices = (val) => {
    // Adapter for multiple edited prices
    Object.entries(val).forEach(([id, price]) => {
      dispatch(adminBookingActions.setEditedServicePrice({ id, price }));
    });
  };
  
  const setBookingPreview = (val) => dispatch(adminBookingActions.setBookingPreview(val));
  const setBookingPreviewLoading = (val) => dispatch(adminBookingActions.setBookingPreviewLoading(val));
  const setBookingPreviewError = (val) => dispatch(adminBookingActions.setBookingPreviewError(val));
  
  const setAppliedMembership = (val) => dispatch(adminBookingActions.setAppliedMembership(val));
  const setSelectedGiftCard = (val) => dispatch(adminBookingActions.setAppliedGiftCard(val));
  const setAvailableMemberships = (val) => dispatch(adminBookingActions.setAvailableMemberships(val));
  const setAvailableGiftCards = (val) => dispatch(adminBookingActions.setAvailableGiftCards(val));
  
  const setBookingLoading = (val) => dispatch(adminBookingActions.setBookingStatus({ loading: val }));
  const setBookingError = (val) => dispatch(adminBookingActions.setBookingStatus({ error: val }));
  const setBookingSuccess = (val) => dispatch(adminBookingActions.setBookingStatus({ success: val }));
  
  const setIsNewAppointment = (val) => dispatch(adminBookingActions.setIsNewAppointment(val));
  const setShowServiceCatalog = (val) => dispatch(bookingSessionActions.setShowServiceCatalog(val));
  const setIsAddingAdditionalService = (val) => dispatch(bookingSessionActions.setIsAddingAdditionalService(val));
  const setCurrentAppointmentIndex = (val) => dispatch(bookingSessionActions.setCurrentAppointmentIndex(val));

  const setBenefitsLoading = (val) => dispatch(adminBookingActions.setBenefitsStatus({ loading: val }));
  const setBenefitsError = (val) => dispatch(adminBookingActions.setBenefitsStatus({ error: val }));
  const setGiftCardAppliedAmount = (val) => dispatch(adminBookingActions.setAppliedGiftCardAmount(val));
  const setRedeemGiftCardAmount = (val) => dispatch(adminBookingActions.setRedeemGiftCardAmount(val));
  const setGiftCardCode = (val) => dispatch(adminBookingActions.setGiftCardCode(val));
  const setGiftCardError = (val) => dispatch(adminBookingActions.setGiftCardError(val));
  const setGiftCardLoading = (val) => dispatch(adminBookingActions.setGiftCardLoading(val));
  const setEditingTotalPrice = (val) => dispatch(adminBookingActions.setEditingTotalPrice(val));
  const setTempTotalPrice = (val) => dispatch(adminBookingActions.setTempTotalPrice(val));

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

  const [showTimeHover, setShowTimeHover] = useState(false);
  const [hoverTimeData, setHoverTimeData] = useState(null);
  const [hoverTimePosition, setHoverTimePosition] = useState({ top: 0, left: 0 });
  const [fullBookingDetailsLoading, setFullBookingDetailsLoading] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [bookingForm, setBookingForm] = useState({ notes: '' });

  // Refs
  const staffHeadersRef = useRef(null);
  const staffGridRef = useRef(null);
  const schedulerContentRef = useRef(null);

  // Core scheduler state (Existing Redux)
  const employees = useSelector(state => state.employees.list);
  const employeesLoading = useSelector(state => state.employees.loading);
  const employeesError = useSelector(state => state.employees.error);
  const timeSlots = useSelector(state => state.calendar.timeSlots);
  const loading = useSelector(state => state.calendar.loading);
  const error = useSelector(state => state.calendar.error);
  const selectedStaff = useSelector(state => state.calendar.selectedStaff);
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

  const handleServiceSelect = (service) => {
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
        originalPrice: service.price, // Store original price for discount calculation
        startTime,
        endTime
      };
      dispatch(bookingSessionActions.addAppointmentToSession(newAppointment));
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

      // Find the actual employee object from employees array (important for helper functions)
      const actualEmployee = employees.find(emp =>
        emp.id === professionalId ||
        emp._id === professionalId ||
        emp.id === professionalToSet.id ||
        emp._id === professionalToSet._id
      );

      if (!actualEmployee) {
        console.error('Ã¢Â Å’ Could not find employee in employees array!', {
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
    dispatch(bookingSessionActions.clearSession());

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
      return `Ã¢Â Å’ ${professionalName} is already booked for "${conflict.conflictingService}" at ${conflict.conflictingTime}. Please select a different time slot.`;
    } else if (conflict.type === 'time_overlap') {
      const endTime = addMinutesToTime(conflict.conflictingTime, conflict.conflictingDuration);
      return `Ã¢Â Å’ ${professionalName} is busy with "${conflict.conflictingService}" from ${conflict.conflictingTime} to ${endTime}. Please select a different time slot.`;
    }
    return ` ${professionalName} is not available at this time.`;
  };

  // (Removed local add/remove/total functions Ã¢â‚¬â€  replaced by hook implementations)

  const clearAppointmentSession = () => {
    dispatch(bookingSessionActions.clearSession());
    setGiftCardCode('');
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
    dispatch(fetchBookingServicesThunk());
  }, [dispatch]);

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
    dispatch(fetchBookingProfessionalsThunk({ serviceId, date }));
  }, [dispatch]);



  const filterOutBookedTimeSlots = (timeSlots, employeeId, date) => {
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

      // Generate slots ONLY from employee's actual shift hours
      const shiftBasedSlots = generateTimeSlotsFromEmployeeShift(employee, date, serviceDuration, 30);

      if (shiftBasedSlots.length === 0) {
        setBookingError(`No time slots can be generated from ${employee.name}'s shift hours`);
        setAvailableTimeSlots([]);
        setBookingLoading(false);
        return;
      }

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
      }

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
    }
  }, [employees, availableServices, appointments, multipleAppointments]);

  // NEW: Function to get available professionals for a specific time slot
  const getAvailableProfessionalsForTimeSlot = useCallback((serviceId, timeSlot, date, currentProfessionalId = null) => {
    try {
      const service = availableServices.find(s => s._id === serviceId);
      const serviceDuration = service?.duration || 30;

      // Get all ACTIVE employees who have a shift on this date
      const employeesWithShift = employees.filter(emp => {
        // Check 1: Employee must be active
        const isActive = emp.isActive !== false;
        if (!isActive) {
          return false;
        }

        // Check 2: Employee must have shift on this date
        const hasShift = hasShiftOnDate(emp, date);
        if (!hasShift) {
          return false;
        }

        return true;
      });

      // Filter to only those who don't have conflicts at this specific time slot
      const availableProfessionals = employeesWithShift.filter(emp => {
        const dayKey = date.toISOString().split('T')[0];

        // Convert timeSlot (e.g., "14:30") to check for conflicts
        const [hours, mins] = timeSlot.split(':').map(Number);
        const slotStartMinutes = hours * 60 + mins;
        const slotEndMinutes = slotStartMinutes + serviceDuration;

        // Check 1: Check time slot conflict with existing appointments
        const existingAppointmentsForEmp = appointments[emp.id] || {};

        const hasTimeConflict = Object.keys(existingAppointmentsForEmp).some(key => {
          if (!key.includes(dayKey)) return false;
          const existingSlot = key.split('_')[1];
          const [h, m] = existingSlot.split(':').map(Number);
          const existingStartMinutes = h * 60 + m;
          const existingEndMinutes = existingStartMinutes + 30; // Assuming 30 min for checking
          return slotStartMinutes < existingEndMinutes && slotEndMinutes > existingStartMinutes;
        });

        if (hasTimeConflict) {
          return false;
        }

        // Check 2: Check against accumulated bookings in current session
        const accumulatedBookings = multipleAppointments.filter(apt =>
          apt.professional.id === emp.id &&
          apt.date === dayKey
        );

        const hasSessionConflict = accumulatedBookings.some(apt => {
          const [h, m] = apt.timeSlot.split(':').map(Number);
          const aptStartMinutes = h * 60 + m;
          const aptEndMinutes = aptStartMinutes + apt.service.duration;
          return slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
        });

        if (hasSessionConflict) {
          return false;
        }

        return true;
      });

      return availableProfessionals.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting available professionals:', error);
      return [];
    }
  }, [employees, availableServices, appointments, multipleAppointments]);

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

  const formatTooltipTime = (timeString) => {
    if (!timeString) return 'Time TBD';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
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

  // Booking preview handling logic removed from UI, now handled by Redux thunks
  

  const resetBookingForm = (clearSession = true) => {
    setBookingStep(1);
    setSelectedExistingClient(null);
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setClientInfo({ name: '', email: '', phone: '' });
    setPaymentMethod('cash');
    setBookingSuccess(null);
    setBookingError(null);
    setBookingPreview(null);
    setBookingPreviewError(null);
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
      clearAppointmentSession();
    } else {}

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

  // Debug: Track when existing clients state changes
  useEffect(() => {
    if (existingClients.length > 0) {}
  }, [existingClients]);

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
// computeAppointmentLayout now in calendar/dateUtils (used only in StaffColumn extraction)


// WeekDayColumn extracted
export default SelectCalendar
