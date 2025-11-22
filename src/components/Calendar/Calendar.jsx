import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import './Calendar.css';
import './WeekMonthViews.css';

// Import hooks
import { useCalendarState } from '../../hooks/calendar/useCalendarState';
import { useBookingFlow } from '../../hooks/calendar/useBookingFlow';
import { useAppointments } from '../../hooks/calendar/useAppointments';
import { useMembershipIntegration } from '../../hooks/calendar/useMembershipIntegration';
import { useGiftCardIntegration } from '../../hooks/calendar/useGiftCardIntegration';

// Import components
import CalendarHeader from './Header/CalendarHeader';
import CalendarGrid from './Grid/CalendarGrid';
import BookingModal from './BookingFlow/BookingModal';
import TeamFilter from './Header/TeamFilter';
import DatePicker from '../DatePicker/DatePicker';

// Import utilities
import { generateTimeSlots, addMinutesToTime, timeToMinutes } from '../../utils/calendar/timeHelpers';
import { formatDateLocal, localDateKey } from '../../utils/calendar';

// Import Redux actions and API
import { setEmployees, setEmployeesLoading, setEmployeesError } from '../../store/employeesSlice';
import { clearSession, removeAppointmentFromSession } from '../../store/bookingSessionSlice';
import { ReportsAPI } from '../../Service/api/reportsApi';
import { fetchCalendarThunk, fetchServicesThunk, fetchClientsThunk } from '../../store/thunks';
import api from '../../Service/Api';

/**
 * Main Calendar Component
 * Orchestrates the entire calendar system
 */
const Calendar = () => {
  console.log('🎯 Calendar component START');
  
  const dispatch = useDispatch();
  console.log('✅ useDispatch initialized');

  // Custom hooks
  console.log('🔧 About to call useCalendarState...');
  const {
    currentDate,
    currentView,
    selectedStaffFilter,
    isToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setCurrentView,
    goToSpecificDate
  } = useCalendarState();
  
  console.log('✅ useCalendarState completed, currentDate:', currentDate);

  console.log('🔧 About to call useBookingFlow...');
  const {
    showBookingModal,
    bookingModalStep,
    selectedServiceForBooking,
    selectedProfessionalForBooking,
    selectedTimeSlotForBooking,
    selectedDateForBooking,
    selectedClientForBooking,
    multipleAppointments,
    openBookingModal,
    closeBookingModal,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    selectService,
    selectProfessional,
    selectTimeSlot,
    selectDate,
    selectClient,
    addAppointmentToSessionLocal
  } = useBookingFlow();

  const [expandedWeekCell, setExpandedWeekCell] = useState(null);

  const toggleWeekCellExpansion = (cellKey) => {
    setExpandedWeekCell(prev => (prev === cellKey ? null : cellKey));
  };
  
  console.log('✅ useBookingFlow completed');

  // Membership integration hook
  console.log('🔧 About to call useMembershipIntegration...');
  const {
    appliedMembership,
    membershipDiscountAmount,
    selectedMembership,
    availableMemberships,
    membershipRefreshSignal,
    handleMembershipApplied,
    handleMembershipRemoved,
    selectMembership,
    clearMembership,
    setMemberships,
    refreshMemberships,
    getMembershipDiscount,
    hasMembershipApplied
  } = useMembershipIntegration();
  console.log('✅ useMembershipIntegration completed');

  // Gift card integration hook
  console.log('🔧 About to call useGiftCardIntegration...');
  const {
    selectedGiftCard,
    redeemGiftCardAmount,
    giftCardAppliedAmount,
    availableGiftCards,
    giftCardCode,
    giftCardError,
    giftCardLoading,
    handleGiftCardSelect,
    handleGiftCardRemove,
    removeAppliedGiftCard,
    validateGiftCardCode,
    fetchGiftCardsForClient,
    getGiftCardDetails,
    setGiftCards,
    clearGiftCard,
    setGiftCardCode,
    calculateGiftCardValue,
    calculateTotalWithGiftCard,
    getGiftCardDiscount,
    hasGiftCardApplied
  } = useGiftCardIntegration();
  console.log('✅ useGiftCardIntegration completed');

  console.log('🔧 About to call useAppointments...');
  // Only call useAppointments if currentDate is initialized
  const {
    appointments,
    getEmployeeAppointments,
    hasConflict
  } = useAppointments(currentDate || new Date());
  
  console.log('✅ useAppointments completed, appointments:', appointments);

  // Redux state - Memoized selectors to prevent unnecessary rerenders
  console.log('🔧 About to read Redux state...');
  const employees = useSelector(state => state.employees?.list || [], (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
    return left.length === right.length && left.every((val, idx) => val === right[idx]);
  });
  
  const loading = useSelector(state => state.employees?.loading || false);
  const error = useSelector(state => state.employees?.error || null);
  
  const services = useSelector(state => state.services?.list || [], (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
    return left.length === right.length && left.every((val, idx) => val === right[idx]);
  });
  
  const clients = useSelector(state => state.clients?.list || [], (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
    return left.length === right.length && left.every((val, idx) => val === right[idx]);
  });

  console.log('📊 Redux data - services:', services.length, 'clients:', clients.length, 'employees:', employees.length);

  // Convert nested appointments structure to flat array for booking modal
  const flatAppointments = useMemo(() => {
    if (!appointments || typeof appointments !== 'object') return [];
    
    const result = [];
    Object.entries(appointments).forEach(([employeeId, employeeAppts]) => {
      if (!employeeAppts || typeof employeeAppts !== 'object') return;
      
      Object.entries(employeeAppts).forEach(([key, appointment]) => {
        if (!appointment) return;
        
        // Parse the key format: YYYY-MM-DD_HH:mm
        const [dateStr, timeStr] = key.split('_');
        
        result.push({
          ...appointment,
          employeeId,
          key,
          date: dateStr,
          time: timeStr,
          startTime: appointment.startTime || `${dateStr}T${timeStr}:00`
        });
      });
    });
    
    console.log('📊 Converted appointments to flat array:', result.length, 'appointments');
    return result;
  }, [appointments]);

  // Local state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [bookingDefaults, setBookingDefaults] = useState(null); // Track grid booking context (professional, time, date)
  const [customTotalDiscount, setCustomTotalDiscount] = useState(0); // Custom discount amount
  const timeSlots = useMemo(() => generateTimeSlots('00:00', '23:30', 30), []);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        console.log('🔄 Fetching employees...');
        dispatch(setEmployeesLoading(true));
        const response = await ReportsAPI.getEmployees();
        console.log('✅ Employees fetched:', response);
        
        // Extract employees array from nested response structure
        const employeesData = response?.data?.employees || response?.employees || response?.data || [];
        console.log('📦 Extracted employees:', employeesData);
        dispatch(setEmployees(employeesData));
      } catch (err) {
        console.error('❌ Error fetching employees:', err);
        dispatch(setEmployeesError(err.message || 'Failed to fetch employees'));
      } finally {
        dispatch(setEmployeesLoading(false));
      }
    };

    if (employees.length === 0 && !loading) {
      fetchEmployees();
    }
  }, [dispatch, employees.length, loading]);

  // Initialize selected employee IDs when employees are loaded
  useEffect(() => {
    if (employees.length > 0 && selectedEmployeeIds.length === 0) {
      const allEmployeeIds = employees.map(emp => emp._id || emp.id);
      setSelectedEmployeeIds(allEmployeeIds);
    }
  }, [employees]);

  // Fetch services on component mount
  useEffect(() => {
    console.log('🔄 Checking services... current count:', services.length);
    if (services.length === 0) {
      console.log('🔄 Fetching services...');
      dispatch(fetchServicesThunk());
    }
  }, [dispatch, services.length]);

  // Fetch clients on component mount
  useEffect(() => {
    console.log('🔄 CLIENT FETCH CHECK');
    console.log('🔄 Current clients in Redux:', clients);
    console.log('🔄 Clients count:', clients.length);
    console.log('🔄 Clients is array?:', Array.isArray(clients));
    
    if (clients.length === 0) {
      console.log('🔄 Fetching clients from API...');
      dispatch(fetchClientsThunk())
        .unwrap()
        .then((result) => {
          console.log('✅ Clients fetched successfully:', result);
          console.log('✅ Clients count:', result?.length);
        })
        .catch((error) => {
          console.error('❌ Error fetching clients:', error);
        });
    } else {
      console.log('✅ Clients already loaded:', clients.length);
    }
  }, [dispatch, clients.length]);

  // Helper function to calculate total session price
  const getTotalSessionPrice = useCallback(() => {
    return multipleAppointments.reduce((sum, apt) => {
      const price = apt.price || apt.servicePrice || apt.service?.price || 0;
      return sum + price;
    }, 0);
  }, [multipleAppointments]);

  // Custom discount handlers
  const handleSaveCustomDiscount = useCallback((discount) => {
    setCustomTotalDiscount(discount);
  }, []);

  const handleClearCustomDiscount = useCallback(() => {
    setCustomTotalDiscount(0);
  }, []);

  // Handlers
  const handleOpenBooking = (options = {}) => {
    // Only clear session if we're starting a fresh booking (not adding to existing session)
    // Don't clear if we already have appointments in the session
    if (multipleAppointments.length === 0) {
      console.log('🆕 Starting fresh booking - clearing session');
      dispatch(clearSession());
    } else {
      console.log('➡️ Continuing existing session with', multipleAppointments.length, 'appointments');
    }
    
    // If time and employee are provided (grid selection), store as bookingDefaults
    // This is used to detect grid booking mode and chain times for multiple services
    if (options.time && options.employee) {
      console.log('🎯 Grid booking detected - storing bookingDefaults');
      setBookingDefaults({
        professional: options.employee,
        time: options.time,
        date: options.date || currentDate,
        isDirectTimeSlotSelection: true
      });
    } else {
      // Manual booking mode ("Add Appointment" button)
      setBookingDefaults(null);
    }
    
    openBookingModal(
      options.date || currentDate,
      options.time,
      options.employee
    );
    
    // If booking from grid, we already have time and employee, so stay at step 1 (service)
    // The flow will be: Service → Client → Confirmation
    // If booking from button, flow will be: Service → Professional → Time → Client → Confirmation
  };

  // Conflict detection function from old calendar (proven working)
  const detectProfessionalConflict = useCallback((professionalId, date, startTime, duration, appointments, multipleAppointments) => {
    if (!professionalId || !startTime || !duration) return null;
    const dayKey = localDateKey(date);
    const desiredStart = timeToMinutes(startTime);
    const desiredEnd = desiredStart + duration;

    // 1. Check existing multipleAppointments in the current session
    for (const apt of multipleAppointments) {
      const aptProfId = apt.professional?._id || apt.professional?.id || apt.professionalId;
      const aptDate = apt.date instanceof Date ? formatDateLocal(apt.date) : apt.date;
      
      if (aptProfId === professionalId && aptDate === dayKey) {
        const s = timeToMinutes(apt.timeSlot || apt.time);
        const e = s + (apt.duration || apt.serviceDuration || 30);
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
  }, []);

  // OLD CALENDAR APPROACH: Add appointment to session with proper conflict detection
  // This function is called directly from time selection click handler
  const handleAddToBookingSession = useCallback((overrideSlot = null) => {
    console.log('📝 ========== ADD TO BOOKING SESSION ==========');
    
    const slotToUse = overrideSlot || selectedTimeSlotForBooking;

    // Validate required fields
    if (!selectedServiceForBooking || !selectedProfessionalForBooking || !slotToUse) {
      console.error('❌ Missing required fields:');
      console.error('  - Service:', selectedServiceForBooking);
      console.error('  - Professional:', selectedProfessionalForBooking);
      console.error('  - TimeSlot:', slotToUse);
      return false;
    }

    // Extract time slot preserving the user's selected local time (not UTC)
    const timeSlot = (() => {
      if (typeof slotToUse === 'string') return slotToUse;
      if (slotToUse?.label) return slotToUse.label; // preferred if provided by slot generator
      if (slotToUse?.startTime) {
        const dt = new Date(slotToUse.startTime);
        // Use local hours/minutes to reflect the user's intended selection
        return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }
      return slotToUse.time || slotToUse;
    })();

    // Use the correct booking date - priority: bookingDefaults.date > selectedDateForBooking > currentDate
    const bookingDate = bookingDefaults?.date || selectedDateForBooking || currentDate;

    // Use unified conflict detection for both session and persisted appointments
    const professionalId = selectedProfessionalForBooking._id || selectedProfessionalForBooking.id;
    const dateKey = bookingDate instanceof Date ? formatDateLocal(bookingDate) : bookingDate;
    const conflictObj = detectProfessionalConflict(
      professionalId,
      bookingDate,
      timeSlot,
      selectedServiceForBooking.duration,
      appointments,
      multipleAppointments
    );
    if (conflictObj) {
      const professionalName = selectedProfessionalForBooking.user?.firstName || selectedProfessionalForBooking.name;
      console.error(`❌ Time conflict: ${professionalName} already has a booking at this time.`);
      Swal.fire({
        icon: 'error',
        title: 'Time Conflict',
        text: `${professionalName} already has a booking at this time. Please select a different slot.`,
        confirmButtonColor: '#1f2937'
      });
      return false;
    }

    // Store service name for success message before clearing
    const serviceName = selectedServiceForBooking.name;

    // Ensure date is stored in a consistent format (YYYY-MM-DD string)
    const appointmentDate = bookingDate instanceof Date
      ? formatDateLocal(bookingDate)
      : bookingDate;

    // Add current appointment to session, using strict duration and time format
    const appointment = {
      id: `${professionalId}_${appointmentDate}_${timeSlot}_${Date.now()}`, // Generate unique ID
      service: selectedServiceForBooking,
      professional: selectedProfessionalForBooking,
      timeSlot: timeSlot,
      date: appointmentDate, // Store as consistent YYYY-MM-DD string
      duration: selectedServiceForBooking.duration, // ensure duration is present for conflict check
      // Additional Redux-friendly fields
      serviceId: selectedServiceForBooking._id || selectedServiceForBooking.id,
      serviceName: selectedServiceForBooking.name,
      serviceDuration: selectedServiceForBooking.duration || 30,
      servicePrice: selectedServiceForBooking.price || 0,
      serviceCategory: selectedServiceForBooking.category || '',
      professionalId: professionalId,
      professionalName: selectedProfessionalForBooking.user?.firstName 
        ? `${selectedProfessionalForBooking.user.firstName} ${selectedProfessionalForBooking.user.lastName || ''}`.trim()
        : selectedProfessionalForBooking.name || 'Staff',
      professionalPosition: selectedProfessionalForBooking.position || '',
      time: timeSlot,
      price: selectedServiceForBooking.price || 0,
      addedAt: new Date().toISOString()
    };

    console.log('✅ Adding appointment to session with date:', {
      originalBookingDate: bookingDate,
      bookingDateType: typeof bookingDate,
      isDateObject: bookingDate instanceof Date,
      finalAppointmentDate: appointmentDate,
      formatDateLocalResult: bookingDate instanceof Date ? formatDateLocal(bookingDate) : 'N/A'
    });
    console.log('✅ Full appointment:', appointment);
    console.log('📊 Current session size BEFORE:', multipleAppointments.length);
    
    const newAppointment = addAppointmentToSessionLocal(appointment);
    console.log('✅ New appointment added:', newAppointment);
    console.log('📊 Session size AFTER:', multipleAppointments.length + 1);

    // Clear the current selection to show empty "Ready to Add" section
    selectService(null);
    selectProfessional(null);
    selectTimeSlot(null);

    // Show success message
    console.log(`✅ "${serviceName}" added to booking session! Total services: ${multipleAppointments.length + 1}`);
    
    console.log('📝 ========== ADD COMPLETE ==========');
    return true;
  }, [
    selectedServiceForBooking,
    selectedProfessionalForBooking,
    selectedTimeSlotForBooking,
    selectedDateForBooking,
    currentDate,
    bookingDefaults,
    multipleAppointments,
    appointments,
    addAppointmentToSessionLocal,
    selectService,
    selectProfessional,
    selectTimeSlot,
    detectProfessionalConflict
  ]);

  // Enhanced next step handler that adds appointment to session at the right time
  const handleNextStep = (payload = null) => {
    const normalizedPayload = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : { timeSlotParam: payload };

    const { timeSlotParam, service: payloadService } = normalizedPayload;
    const effectiveService = payloadService || selectedServiceForBooking;

    console.log(`🔄 HANDLE NEXT STEP - Current step: ${bookingModalStep}`);
    console.log('📊 payload:', normalizedPayload);
    console.log('📊 bookingDefaults:', bookingDefaults);
    console.log('📊 multipleAppointments:', multipleAppointments.length);
    console.log('📊 selectedServiceForBooking:', selectedServiceForBooking);
    console.log('📊 effectiveService:', effectiveService);
    console.log('📊 selectedProfessionalForBooking:', selectedProfessionalForBooking);
    console.log('📊 selectedTimeSlotForBooking:', selectedTimeSlotForBooking);
    
    // Check if we're in GRID BOOKING MODE (bookingDefaults set with professional and time)
    const isGridBooking = bookingDefaults?.professional && bookingDefaults?.time;
    
    // ==============================================
    // GRID BOOKING MODE: Same professional, chained times
    // ==============================================
    if (isGridBooking) {
      console.log('🎯 GRID BOOKING MODE');
      
      // If at step 1 with NO service selected but HAVE appointments
      // User clicked "Proceed to Client Selection"
      if (bookingModalStep === 1 && !selectedServiceForBooking && multipleAppointments.length > 0) {
        console.log('🛒 Proceeding to client selection - skipping to step 4');
        goToStep(4);
        return;
      }
      
      // If at step 1 with service selected - ADD to session and STAY at step 1
      if (bookingModalStep === 1 && effectiveService) {
        console.log('➕ Adding service to session in grid mode');
        
        const serviceToAdd = effectiveService || selectedServiceForBooking;
        if (!serviceToAdd) {
          console.warn('⚠️ No service data available');
          return;
        }

        const prof = bookingDefaults.professional;
        const bookingDate = bookingDefaults.date || selectedDateForBooking || currentDate;
        
        // Calculate start time: first service uses clicked time, subsequent chain from last end time
        let startTime;
        if (multipleAppointments.length === 0) {
          startTime = bookingDefaults.time;
          console.log('⏰ First service - using clicked time:', startTime);
        } else {
          const lastAppointment = multipleAppointments[multipleAppointments.length - 1];
          startTime = addMinutesToTime(lastAppointment.timeSlot, lastAppointment.duration);
          console.log('⏰ Chaining from last service - new start time:', startTime);
        }
        
        const durationToUse = serviceToAdd.duration || 30;
        const endTime = addMinutesToTime(startTime, durationToUse);
        
        // CONFLICT CHECK: Check if this time conflicts with existing appointments
        const professionalId = prof?._id || prof?.id;
        const hasConflictWithExisting = hasConflict(professionalId, bookingDate, startTime, durationToUse);
        
        if (hasConflictWithExisting) {
          console.error('❌ Conflict detected with existing bookings');
          Swal.fire({
            icon: 'warning',
            title: 'Time Slot Conflict',
            text: `Time slot ${startTime} conflicts with an existing booking. This service cannot be added. Please try a different time slot or remove some services.`,
            confirmButtonColor: '#1f2937'
          });
          selectService(null); // Clear selection
          return; // Don't add to session
        }
        
        // BOOKING CUTOFF VALIDATION: Prevent bookings past 23:00
        const startTimeMinutes = timeToMinutes(startTime);
        const endTimeMinutes = startTimeMinutes + durationToUse;
        const MAX_END_TIME_MINUTES = 23 * 60; // 23:00
        
        if (endTimeMinutes > MAX_END_TIME_MINUTES) {
          const maxBookingTimeMinutes = MAX_END_TIME_MINUTES - durationToUse;
          const maxBookingHours = Math.floor(maxBookingTimeMinutes / 60);
          const maxBookingMinutes = maxBookingTimeMinutes % 60;
          const maxBookingTime = `${String(maxBookingHours).padStart(2, '0')}:${String(maxBookingMinutes).padStart(2, '0')}`;
          
          console.error('❌ Booking cutoff exceeded');
          Swal.fire({
            icon: 'warning',
            title: 'Past Closing Time',
            html: `This ${durationToUse}-minute service would end at ${endTime}, past our 23:00 closing time.<br><br>For this service, the last available time is ${maxBookingTime}.`,
            confirmButtonColor: '#1f2937'
          });
          selectService(null);
          return;
        }
        
        // Format date as string
        const dateString = bookingDate instanceof Date 
          ? bookingDate.toISOString().split('T')[0]
          : bookingDate;
        
        // Create appointment
        const appointmentData = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serviceId: serviceToAdd?._id || serviceToAdd?.id,
          serviceName: serviceToAdd?.name,
          serviceDuration: durationToUse,
          servicePrice: serviceToAdd?.price || 0,
          serviceCategory: serviceToAdd?.category || '',
          professionalId: professionalId,
          professionalName: prof?.user?.firstName 
            ? `${prof.user.firstName} ${prof.user.lastName || ''}`.trim()
            : prof?.name || 'Staff',
          professionalPosition: prof?.position || '',
          time: startTime,
          timeSlot: startTime,
          startTime: startTime,
          endTime: endTime,
          date: dateString,
          duration: durationToUse,
          price: serviceToAdd?.price || 0,
          service: serviceToAdd,
          professional: prof,
          addedAt: new Date().toISOString()
        };
        
        console.log('✅ Adding appointment to session:', appointmentData);
        addAppointmentToSessionLocal(appointmentData);
        
        // Update bookingDefaults time for next service
        setBookingDefaults({
          ...bookingDefaults,
          time: endTime
        });
        
        // Clear service selection
        selectService(null);
        
        // STAY at step 1 to allow adding more services
        console.log('✅ Service added, staying at step 1 for more services');
        return; // Don't call goToNextStep()
      }
    }
    
    // ==============================================
    // MANUAL BOOKING MODE: Different professionals, different times
    // ==============================================
    if (!isGridBooking) {
      console.log('📝 MANUAL BOOKING MODE');
      console.log('📝 Current step:', bookingModalStep);
      
      // Step 1: Service selected → Go to step 2 (Professional selection)
      if (bookingModalStep === 1 && effectiveService) {
        console.log('✅ Service selected, going to professional selection');
        goToNextStep();
        return;
      }
      
      // Step 2: Professional selected → Go to step 3 (Time selection)
      if (bookingModalStep === 2 && selectedProfessionalForBooking) {
        console.log('✅ Professional selected, going to time selection');
        goToNextStep();
        return;
      }
      
      // Step 3: Time selected → Add to session, show "Add Another Service" option
      if (bookingModalStep === 3) {
        console.log('📝 Time selected - adding appointment to session');
        
        const slotToAdd = timeSlotParam || selectedTimeSlotForBooking;
        console.log('📝 Using time slot:', slotToAdd);
        
        const added = handleAddToBookingSession(slotToAdd);
        
        if (!added) {
          console.log('❌ Failed to add appointment');
          return;
        }
        
        console.log('✅ Appointment added successfully');
        console.log('📊 Total appointments now:', multipleAppointments.length + 1);
        
        // After adding, stay at step 3 to show "Add Another Service" or "Proceed to Client"
        // Don't advance automatically
        return;
      }
      
      // If user clicks "Proceed to Client Selection" after adding services
      if (bookingModalStep === 3 && multipleAppointments.length > 0 && !selectedServiceForBooking) {
        console.log('🛒 Proceeding to client selection');
        goToStep(4);
        return;
      }
    }
    
    // Default: Just advance to next step
    goToNextStep();
  };

  // Enhanced previous step handler with proper state cleanup
  const handlePreviousStep = () => {
    console.log(`⬅️ Going back from step ${bookingModalStep}`);
    
    const isGridBooking = bookingDefaults?.professional && bookingDefaults?.time;
    
    // From step 5 (confirmation) → step 4 (client) - Just go back
    if (bookingModalStep === 5) {
      console.log('✅ Back to client selection');
      goToPreviousStep();
      return;
    }
    
    // From step 4 (client) → step 1 (service list) - Keep all appointments
    if (bookingModalStep === 4) {
      if (isGridBooking) {
        console.log('⬅️ Grid mode: Back to service selection (step 1)');
        console.log('✅ Keeping all', multipleAppointments.length, 'appointments');
        goToStep(1);
      } else {
        // Manual mode: Back to step 3 to show "Add Another Service"
        console.log('⬅️ Manual mode: Back to step 3');
        console.log('✅ Keeping all', multipleAppointments.length, 'appointments');
        goToStep(3);
      }
      return;
    }
    
    // From step 3 (time) → step 2 (professional) - Just go back, keep professional selected
    if (bookingModalStep === 3) {
      console.log('⬅️ Going back to professional selection (keeping professional selected)');
      // Clear time slot but KEEP professional selected so list shows
      selectTimeSlot(null);
      goToPreviousStep();
      return;
    }
    
    // From step 2 (professional) → step 1 (service) - Just go back, keep service selected
    if (bookingModalStep === 2) {
      console.log('⬅️ Going back to service selection (keeping service selected)');
      // Clear professional but KEEP service selected so list shows
      selectProfessional(null);
      goToPreviousStep();
      return;
    }
    
    // Default
    goToPreviousStep();
  };

  // Handler for adding another service
  const handleAddAnotherService = () => {
    console.log('➕ ========== ADD ANOTHER SERVICE CLICKED ==========');
    console.log('📊 Current appointments:', multipleAppointments.length);
    
    const isGridBooking = bookingDefaults?.professional && bookingDefaults?.time;
    
    if (isGridBooking) {
      // GRID MODE: Just clear service selection, stay at step 1
      console.log('🔗 Grid mode - staying at step 1');
      selectService(null);
      // Already at step 1, just cleared selection
    } else {
      // MANUAL MODE: Go back to step 1 for new service selection
      console.log('📝 Manual mode - going to step 1');
      selectService(null);
      selectProfessional(null);
      selectTimeSlot(null);
      goToStep(1);
    }
    
    console.log('➕ ========== READY FOR NEXT SERVICE ==========');
  };

  // Handler to proceed to client selection after adding all services
  const handleProceedToClientSelection = () => {
    console.log('🛒 ========== PROCEED TO CLIENT SELECTION ==========');
    console.log('📊 Total appointments:', multipleAppointments.length);
    
    if (multipleAppointments.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Services Added',
        text: 'Please add at least one service before proceeding.',
        confirmButtonColor: '#1f2937'
      });
      return;
    }
    
    console.log('✅ Going to step 4 (client selection)');
    goToStep(4);
  };

  const handleTimeSlotClick = ({ employee, date, time }) => {
    // Check if slot is already booked
    const employeeAppts = getEmployeeAppointments(employee._id || employee.id, date);
    const isSlotBooked = employeeAppts.some(apt => apt.time === time);
    
    if (isSlotBooked) {
      console.log('⚠️ Time slot already booked');
      // You can show a message or just return
      // For now, still allow opening the modal but user will see conflict
    }
    
    handleOpenBooking({ date, time, employee });
  };

  const handleAppointmentClick = (appointment) => {
    console.log('Appointment clicked:', appointment);
  };

  const handleConfirmBooking = async (bookingData) => {
    try {
      console.log('🎯 Confirming booking with data:', bookingData);
      console.log('📋 Session appointments:', multipleAppointments);
      console.log('📊 Session appointments count:', multipleAppointments.length);
      console.log('📊 Session appointments details:', JSON.stringify(multipleAppointments, null, 2));
      
      // Use session appointments if available, otherwise use individual selections
      const appointmentsToBook = multipleAppointments.length > 0 
        ? multipleAppointments 
        : [{
            service: selectedServiceForBooking,
            professional: selectedProfessionalForBooking,
            time: selectedTimeSlotForBooking,
            date: selectedDateForBooking,
            client: selectedClientForBooking
          }];

      console.log('📝 Appointments to book:', appointmentsToBook.length);
      console.log('📝 Detailed appointments:', JSON.stringify(appointmentsToBook, null, 2));

      // Check for conflicts before creating bookings
      // Only check against existing appointments in DB, not session appointments
      for (const apt of appointmentsToBook) {
        const professionalId = apt.professionalId || apt.professional?._id || apt.professional?.id;
        const aptTime = apt.time || apt.timeSlot;
        const aptDate = apt.date || selectedDateForBooking;
        const aptDuration = apt.duration || apt.service?.duration || 30;

        console.log('🔍 Checking conflict for:', {
          professionalId,
          time: aptTime,
          date: aptDate,
          duration: aptDuration
        });

        // Get employee appointments from DB (not including session)
        const employeeAppts = getEmployeeAppointments(professionalId, aptDate);
        console.log('📊 Existing appointments for employee:', employeeAppts);
        
        const hasTimeConflict = hasConflict(
          professionalId,
          aptDate,
          aptTime,
          aptDuration
        );

        if (hasTimeConflict) {
          const profName = apt.professionalName || apt.professional?.user?.firstName || 'Professional';
          Swal.fire({
            icon: 'error',
            title: 'Time Slot Conflict',
            text: `Time slot ${aptTime} is already booked for ${profName}. Please go back and select a different time.`,
            confirmButtonColor: '#1f2937'
          });
          return;
        }
      }
      
      console.log('✅ No conflicts detected, proceeding with booking...');

      // Prepare client data
      const clientPayload = selectedClientForBooking?._id 
        ? { email: selectedClientForBooking.email } // Existing client - just send email
        : { 
            name: selectedClientForBooking?.firstName 
              ? `${selectedClientForBooking.firstName} ${selectedClientForBooking.lastName || ''}`.trim()
              : 'Walk-in Client',
            email: selectedClientForBooking?.email || null,
            phone: selectedClientForBooking?.phone || null
          };

      // Validate all appointments have required fields
      console.log('🔍 Validating appointments before API call...');
      for (let i = 0; i < appointmentsToBook.length; i++) {
        const apt = appointmentsToBook[i];
        console.log(`📝 Appointment ${i + 1}:`, {
          hasService: !!(apt.serviceId || apt.service?._id || apt.service?.id),
          hasEmployee: !!(apt.professionalId || apt.professional?._id || apt.professional?.id),
          hasTime: !!(apt.time || apt.timeSlot),
          hasDate: !!(apt.date || selectedDateForBooking),
          duration: apt.duration || apt.service?.duration,
          price: apt.customPrice || apt.price || apt.service?.price
        });

        if (!(apt.serviceId || apt.service?._id || apt.service?.id)) {
          console.error(`❌ Appointment ${i + 1} missing service:`, apt);
          throw new Error(`Appointment ${i + 1} is missing service information`);
        }
        if (!(apt.professionalId || apt.professional?._id || apt.professional?.id)) {
          console.error(`❌ Appointment ${i + 1} missing employee:`, apt);
          throw new Error(`Appointment ${i + 1} is missing professional information`);
        }
        if (!(apt.time || apt.timeSlot)) {
          console.error(`❌ Appointment ${i + 1} missing time:`, apt);
          throw new Error(`Appointment ${i + 1} is missing time slot`);
        }
      }
      console.log('✅ All appointments validated successfully');

      // Prepare booking payload with all services
      const bookingPayload = {
        client: clientPayload,
        appointmentDate: selectedDateForBooking,
        services: appointmentsToBook.map(apt => {
          // TIMEZONE FIX (from old calendar): Create UTC datetime that represents the exact date/time user selected
          // This ensures the appointment appears on the correct date regardless of server timezone
          const timeStr = apt.time || apt.timeSlot;
          const aptDate = apt.date || selectedDateForBooking;
          
          console.log('⏰ Processing appointment for API - timeStr:', timeStr, 'apt.time:', apt.time, 'apt.timeSlot:', apt.timeSlot);
          
          // Get date string in YYYY-MM-DD format
          let dateStr;
          if (typeof aptDate === 'string' && aptDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateStr = aptDate;
          } else {
            const dateObj = new Date(aptDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          }
          
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
          endTime.setUTCMinutes(endTime.getUTCMinutes() + (apt.duration || apt.service?.duration || 30));
          
          // Validate that the dates were created successfully
          if (isNaN(appointmentDateTime.getTime()) || isNaN(endTime.getTime())) {
            console.error('❌ Invalid date created');
            throw new Error('Failed to create valid dates');
          }
          
          console.log(`📅 Booking: ${apt.serviceName || apt.service?.name} on ${dateStr} at ${timeStr}`);
          console.log(`🕐 Created UTC datetime: ${appointmentDateTime.toISOString()}`);
          console.log(`✅ Time will display correctly as: ${timeStr}`);
          
          return {
            service: apt.serviceId || apt.service?._id || apt.service?.id,
            employee: apt.professionalId || apt.professional?._id || apt.professional?.id,
            startTime: appointmentDateTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: apt.duration || apt.service?.duration || 30,
            price: apt.customPrice || apt.price || apt.service?.price || 0
          };
        }),
        paymentMethod: bookingData?.paymentMethod || 'cash',
        notes: bookingData?.notes || '',
        selectionMode: 'admin'
      };

      // Call API to create booking
      console.log('🚀 Sending booking payload:', JSON.stringify(bookingPayload, null, 2));
      console.log('💳 Payment method:', bookingPayload.paymentMethod);
      console.log('📝 Notes:', bookingPayload.notes);
      
      const response = await api.post('/bookings', bookingPayload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Booking created successfully:', response.data);

      // Clear session appointments after successful booking
      dispatch(clearSession());
      
      // Refresh appointments from server to show new bookings
      console.log('🔄 Refreshing calendar data for date:', currentDate);
      await dispatch(fetchCalendarThunk({ currentDate, currentView }));
      console.log('✅ Calendar data refreshed - appointments should now be visible');
      
      // Close modal and reset selections
      closeBookingModal();
      setBookingDefaults(null); // Clear grid booking context
      
      // Show success message with booking details
      const appointmentCount = appointmentsToBook.length;
      const successMsg = appointmentCount > 1 
        ? `Successfully booked ${appointmentCount} appointments!` 
        : 'Booking created successfully!';
      
      Swal.fire({
        icon: 'success',
        title: 'Booking Confirmed',
        text: successMsg,
        confirmButtonColor: '#1f2937'
      });
      
    } catch (err) {
      console.error('❌ Booking failed:', err);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error headers:', err.response?.headers);
      
      let errorMessage = 'Failed to create booking';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Add more context based on error type
      if (err.response?.status === 400) {
        errorMessage = `Validation Error: ${errorMessage}`;
      } else if (err.response?.status === 409) {
        errorMessage = `Conflict Error: ${errorMessage}`;
      } else if (err.response?.status === 500) {
        errorMessage = `Server Error: ${errorMessage}`;
      }
      
      console.error('📢 Showing error to user:', errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: errorMessage,
        confirmButtonColor: '#1f2937'
      });
    }
  };

  const handleToggleDatePicker = () => {
    setShowDatePicker(prev => !prev);
  };

  // Universal navigation handlers that work for all views
  const handlePreviousNavigation = useCallback(() => {
    if (currentView === 'Day') {
      goToPreviousDay();
    } else if (currentView === 'Week') {
      goToPreviousWeek();
    } else if (currentView === 'Month') {
      goToPreviousMonth();
    }
  }, [currentView, goToPreviousDay, goToPreviousWeek, goToPreviousMonth]);

  const handleNextNavigation = useCallback(() => {
    if (currentView === 'Day') {
      goToNextDay();
    } else if (currentView === 'Week') {
      goToNextWeek();
    } else if (currentView === 'Month') {
      goToNextMonth();
    }
  }, [currentView, goToNextDay, goToNextWeek, goToNextMonth]);

  // Employee filter handlers
  const handleToggleEmployee = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAllEmployees = () => {
    const allEmployeeIds = employees.map(emp => emp._id || emp.id);
    setSelectedEmployeeIds(allEmployeeIds);
  };

  const handleDeselectAllEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  // Filter employees based on selection
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => selectedEmployeeIds.includes(emp._id || emp.id));
  }, [employees, selectedEmployeeIds]);

  // Helper function to get calendar days based on view
  const getCalendarDays = useCallback(() => {
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
  }, [currentDate, currentView]);

  const calendarDays = useMemo(() => getCalendarDays(), [getCalendarDays]);

  // Week view renderer
  const renderWeekView = () => {
    return (
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
        {filteredEmployees.map(employee => (
          <div key={employee._id || employee.id} className="week-employee-row">
            <div className="week-staff-cell">
              <div className="staff-avatar" style={{ backgroundColor: employee.avatarColor || '#6366f1' }}>
                {employee.user?.profileImage ? 
                  <img src={employee.user.profileImage} alt={employee.user.firstName} className="avatar-image" /> : 
                  (employee.user?.firstName?.charAt(0) || employee.name?.charAt(0) || 'E')
                }
              </div>
              <div className="staff-info">
                <div className="staff-name">{employee.user?.firstName || employee.name || 'Employee'}</div>
              </div>
            </div>

            {/* Daily appointment cells for this employee */}
            {calendarDays.map(day => {
              const dayKey = formatDateLocal(day);
              const employeeAppointments = getEmployeeAppointments(employee._id || employee.id, day);
              const extraAppointments = employeeAppointments.slice(3);
              const cellKey = `${employee._id || employee.id}-${dayKey}`;
              const isCellExpanded = expandedWeekCell === cellKey;

              return (
                <div 
                  key={cellKey}
                  className="week-day-cell"
                  onClick={() => handleTimeSlotClick(employee, '09:00', day)}
                  title={`Click to add appointment for ${employee.user?.firstName || employee.name} on ${day.toLocaleDateString()}`}
                >
                  <div className="week-appointments-container">
                    {employeeAppointments.slice(0, 3).map((app, index) => (
                      <div 
                        key={index}
                        className="week-appointment-block"
                        style={{ backgroundColor: app.color || '#6366f1' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(app);
                        }}
                      >
                        <div className="appointment-text">
                          <div className="appointment-client">{app.client?.firstName || 'Client'}</div>
                          <div className="appointment-service">{app.service?.name || 'Service'}</div>
                        </div>
                      </div>
                    ))}
                    {extraAppointments.length > 0 && (
                      <>
                        <button
                          type="button"
                          className="week-more-appointments"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWeekCellExpansion(cellKey);
                          }}
                        >
                          {isCellExpanded ? 'Hide slots' : `+${extraAppointments.length} more`}
                        </button>
                        {isCellExpanded && (
                          <div className="week-more-list">
                            {extraAppointments.map((app, index) => (
                              <div key={index} className="week-more-item" onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick(app);
                              }}>
                                <div className="week-more-time">{app?.startTime ? new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                <div className="week-more-details">
                                  <span className="week-more-client">{app.client?.firstName || 'Client'}</span>
                                  <span className="week-more-service">{app.service?.name || 'Service'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Month view renderer
  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayIndex = startOfMonth.getDay();
    const emptyCellsBefore = Array.from({ length: (firstDayIndex === 0 ? 6 : firstDayIndex - 1) });

    return (
      <div className="month-view-container">
        <div className="month-day-names">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => 
            <div key={day} className="month-day-name">{day}</div>
          )}
        </div>
        <div className="month-view-grid">
          {emptyCellsBefore.map((_, index) => 
            <div key={`empty-${index}`} className="month-day-cell empty"></div>
          )}
          {calendarDays.map(day => {
            const dayKey = formatDateLocal(day);
            const dayAppointments = [];

            // Get appointments for this day from all employees
            filteredEmployees.forEach(emp => {
              const empAppointments = getEmployeeAppointments(emp._id || emp.id, day);
              empAppointments.forEach(app => {
                dayAppointments.push({
                  ...app,
                  employeeName: emp.user?.firstName || emp.name,
                  employeeId: emp._id || emp.id
                });
              });
            });

            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayKey}
                className={`month-day-cell ${isToday ? 'is-today' : ''}`}
                onClick={() => {
                  goToSpecificDate(day);
                  setCurrentView('Day');
                }}
                style={{ cursor: 'pointer' }}
                title={`Click to view ${day.toLocaleDateString()}`}
              >
                <div className="month-day-header">
                  <span className="month-day-date">{day.getDate()}</span>
                  <span className="month-add-appointment-hint">+</span>
                </div>
                <div className="month-appointments">
                  {dayAppointments.length > 0 ? (
                    <>
                      {dayAppointments.slice(0, 3).map((app, index) => (
                        <div 
                          key={index}
                          className="month-appointment-entry"
                          style={{ backgroundColor: app.color || '#6366f1' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(app);
                          }}
                        >
                          <span className="appointment-client-name">{app.client?.firstName || 'Client'}</span>
                          <span className="appointment-service-name">{app.service?.name || 'Service'}</span>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="month-more-appointments">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="month-empty-day">
                      <span className="add-appointment-text">No appointments</span>
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

  console.log('📊 State check - currentDate:', currentDate, 'loading:', loading, 'employees:', employees.length);

  // Safety check: Don't render if currentDate is not initialized
  if (!currentDate) {
    console.log('⚠️ Returning early - no currentDate');
    return (
      <div className="calendar-container">
        <div className="loading-spinner-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p>Initializing calendar...</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading && !employees.length) {
    return (
      <div className="calendar-container">
        <div className="loading-spinner-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="calendar-container">
        <div className="error-message-container alert-error">
          <p>{String(error)}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!employees || employees.length === 0) {
    console.log('⚠️ Returning early - no employees');
    return (
      <div className="calendar-container">
        <div className="empty-state">
          <h3>No Staff Members</h3>
          <p>Add staff members to start scheduling appointments.</p>
        </div>
      </div>
    );
  }

  console.log('🎨 About to render main Calendar JSX with CalendarHeader and CalendarGrid');
  console.log('   - currentDate:', currentDate);
  console.log('   - employees count:', employees.length);
  console.log('   - timeSlots count:', timeSlots.length);

  return (
    <div className="calendar-container">
      <CalendarHeader
        currentDate={currentDate}
        currentView={currentView}
        onPreviousWeek={handlePreviousNavigation}
        onNextWeek={handleNextNavigation}
        onToday={goToToday}
        onViewChange={setCurrentView}
        onOpenBooking={handleOpenBooking}
        onToggleDatePicker={handleToggleDatePicker}
        isToday={isToday}
        employees={employees}
        selectedEmployeeIds={selectedEmployeeIds}
        onToggleEmployee={handleToggleEmployee}
        onSelectAllEmployees={handleSelectAllEmployees}
        onDeselectAllEmployees={handleDeselectAllEmployees}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <div className="date-picker-overlay" onClick={handleToggleDatePicker}>
          <div className="date-picker-wrapper" onClick={function(e) { e.stopPropagation(); }}>
            <DatePicker
              selectedDate={currentDate}
              onChange={function(date) {
                goToSpecificDate(date);
                setShowDatePicker(false);
              }}
            />
          </div>
        </div>
      )}

      
      {currentView === 'Week' && renderWeekView()}
      {currentView === 'Month' && renderMonthView()}
      {currentView === 'Day' && (
        <CalendarGrid
          employees={filteredEmployees}
          currentDate={currentDate}
          timeSlots={timeSlots}
          appointments={appointments}
          onTimeSlotClick={handleTimeSlotClick}
          onAppointmentClick={handleAppointmentClick}
          selectedStaff={selectedStaffFilter}
        />
      )}

      <BookingModal
        show={showBookingModal}
        step={bookingModalStep}
        bookingDefaults={bookingDefaults}
        onClose={() => {
          closeBookingModal();
          setBookingDefaults(null); // Clear grid booking context when modal closes
          clearMembership(); // Clear membership on modal close
          clearGiftCard(); // Clear gift card on modal close
          setCustomTotalDiscount(0); // Clear custom discount
        }}
        onNextStep={handleNextStep}
        onPreviousStep={handlePreviousStep}
        onAddAnotherService={handleAddAnotherService}
        onProceedToClientSelection={handleProceedToClientSelection}
        selectedService={selectedServiceForBooking}
        selectedProfessional={selectedProfessionalForBooking}
        selectedTimeSlot={selectedTimeSlotForBooking}
        selectedDate={selectedDateForBooking}
        selectedClient={selectedClientForBooking}
        onSelectService={selectService}
        onSelectProfessional={selectProfessional}
        onSelectTimeSlot={selectTimeSlot}
        onSelectClient={selectClient}
        onConfirmBooking={handleConfirmBooking}
        services={services}
        employees={employees}
        clients={clients}
        appointments={flatAppointments}
        multipleAppointments={multipleAppointments}
        getTotalSessionPrice={getTotalSessionPrice}
        
        // Membership props
        appliedMembership={appliedMembership}
        membershipDiscountAmount={membershipDiscountAmount}
        selectedMembership={selectedMembership}
        availableMemberships={availableMemberships}
        membershipRefreshSignal={membershipRefreshSignal}
        onMembershipApplied={handleMembershipApplied}
        onMembershipRemoved={handleMembershipRemoved}
        onSelectMembership={selectMembership}
        onClearMembership={clearMembership}
        onSetMemberships={setMemberships}
        onRefreshMemberships={refreshMemberships}
        
        // Gift card props
        selectedGiftCard={selectedGiftCard}
        redeemGiftCardAmount={redeemGiftCardAmount}
        giftCardAppliedAmount={giftCardAppliedAmount}
        availableGiftCards={availableGiftCards}
        giftCardCode={giftCardCode}
        giftCardError={giftCardError}
        giftCardLoading={giftCardLoading}
        onGiftCardSelect={handleGiftCardSelect}
        onGiftCardRemove={handleGiftCardRemove}
        onValidateGiftCard={validateGiftCardCode}
        onFetchGiftCards={fetchGiftCardsForClient}
        onSetGiftCards={setGiftCards}
        onClearGiftCard={clearGiftCard}
        onSetGiftCardCode={setGiftCardCode}
        calculateGiftCardValue={calculateGiftCardValue}
        calculateTotalWithGiftCard={calculateTotalWithGiftCard}
        
        // Custom discount props
        customTotalDiscount={customTotalDiscount}
        onSaveCustomDiscount={handleSaveCustomDiscount}
        onClearCustomDiscount={handleClearCustomDiscount}
      />
    </div>
  );
};

export default Calendar;