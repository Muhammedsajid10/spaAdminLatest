import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './Calendar.css';

// Import hooks
import { useCalendarState } from '../../hooks/calendar/useCalendarState';
import { useBookingFlow } from '../../hooks/calendar/useBookingFlow';
import { useAppointments } from '../../hooks/calendar/useAppointments';

// Import components
import CalendarHeader from './Header/CalendarHeader';
import CalendarGrid from './Grid/CalendarGrid';
import BookingModal from './BookingFlow/BookingModal';
import TeamFilter from './Header/TeamFilter';

// Import utilities
import { generateTimeSlots, addMinutesToTime } from '../../utils/calendar/timeHelpers';

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
  
  console.log('✅ useBookingFlow completed');

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

  // Enhanced next step handler that adds appointment to session at the right time
  const handleNextStep = () => {
    console.log(`🔄 HANDLE NEXT STEP - Current step: ${bookingModalStep}`);
    console.log('📊 bookingDefaults:', bookingDefaults);
    console.log('📊 multipleAppointments:', multipleAppointments.length);
    console.log('📊 selectedServiceForBooking:', selectedServiceForBooking);
    
    // Check if we're in GRID BOOKING MODE (bookingDefaults set with professional and time)
    const isGridBooking = bookingDefaults?.professional && bookingDefaults?.time;
    
    // GRID BOOKING: If at step 1 with appointments but NO selected service
    // This means "Proceed to Checkout" was clicked - go to client selection
    if (isGridBooking && bookingModalStep === 1 && !selectedServiceForBooking && multipleAppointments.length > 0) {
      console.log('🛒 Proceeding to checkout - going to client selection (step 4)');
      goToStep(4);
      return;
    }
    
    // GRID BOOKING: After selecting service at step 1, add to session IMMEDIATELY
    if (isGridBooking && bookingModalStep === 1 && selectedServiceForBooking) {
      console.log('🎯 Grid booking mode - adding service to session');
      
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
        console.log('⏰ Chaining from last appointment - new start time:', startTime);
      }
      
      const endTime = addMinutesToTime(startTime, selectedServiceForBooking.duration);
      
      // Create appointment and add to session
      const appointmentData = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        serviceId: selectedServiceForBooking?._id || selectedServiceForBooking?.id,
        serviceName: selectedServiceForBooking?.name,
        service: selectedServiceForBooking,
        professionalId: prof?._id || prof?.id,
        professionalName: prof?.user?.firstName 
          ? `${prof.user.firstName} ${prof.user.lastName || ''}`.trim()
          : prof?.name || 'Staff',
        professional: prof,
        time: startTime,
        timeSlot: startTime,
        startTime: startTime,
        endTime: endTime,
        date: bookingDate,
        duration: selectedServiceForBooking?.duration || 30,
        price: selectedServiceForBooking?.price || 0,
        addedAt: new Date().toISOString()
      };
      
      console.log('✅ Adding appointment to session:', appointmentData);
      addAppointmentToSessionLocal(appointmentData);
      
      // Update bookingDefaults time for next service (chain continuation)
      setBookingDefaults({
        ...bookingDefaults,
        time: endTime // Next service will start when this one ends
      });
      
      // Clear service selection to show it was added
      selectService(null);
      
      // STAY at step 1 - showing stacked services
      console.log('✅ Service added, staying at step 1');
      
      return; // Don't advance step
    }
    
    // MANUAL BOOKING: Normal flow through all steps
    if (!isGridBooking) {
      // If moving from step 3 (time selection) to step 4 (client)
      if (bookingModalStep === 3 && selectedTimeSlotForBooking && selectedServiceForBooking) {
        console.log('📝 Manual booking - adding appointment to session after time selection');
        
        const appointmentData = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serviceId: selectedServiceForBooking?._id || selectedServiceForBooking?.id,
          serviceName: selectedServiceForBooking?.name,
          service: selectedServiceForBooking,
          professionalId: selectedProfessionalForBooking?._id || selectedProfessionalForBooking?.id,
          professionalName: selectedProfessionalForBooking?.user?.firstName 
            ? `${selectedProfessionalForBooking.user.firstName} ${selectedProfessionalForBooking.user.lastName || ''}`.trim()
            : selectedProfessionalForBooking?.name || 'Staff',
          professional: selectedProfessionalForBooking,
          time: selectedTimeSlotForBooking,
          timeSlot: selectedTimeSlotForBooking,
          date: selectedDateForBooking,
          duration: selectedServiceForBooking?.duration || 30,
          price: selectedServiceForBooking?.price || 0,
          addedAt: new Date().toISOString()
        };

        console.log('✅ Adding appointment to session:', appointmentData);
        addAppointmentToSessionLocal(appointmentData);
        
        // Clear selections
        selectService(null);
        selectProfessional(null);
        selectTimeSlot(null);
      }
    }
    
    goToNextStep();
  };

  // Enhanced previous step handler with proper state cleanup
  const handlePreviousStep = () => {
    console.log(`⬅️ Going back from step ${bookingModalStep} to ${bookingModalStep - 1}`);
    
    // Check if we're in grid booking mode
    const isGridBooking = bookingDefaults?.professional && bookingDefaults?.time;
    
    // If going back from step 5 (confirmation) to step 4 (client)
    // Don't remove appointments, just allow editing
    if (bookingModalStep === 5) {
      console.log('✅ Going back to client selection - keeping appointments');
      goToPreviousStep();
      return;
    }
    
    // If going back from step 4 (client) in grid booking mode
    // DON'T remove appointments - user may want to change client for all services
    // Just go back to step 1 to show the "Add Another Service" option
    if (bookingModalStep === 4 && isGridBooking) {
      console.log('⬅️ Grid booking - going back to allow adding more services');
      console.log('✅ Keeping all', multipleAppointments.length, 'appointments in session');
      goToStep(1);
      return;
    }
    
    // If going back from step 4 (client) to step 3 (time) in manual flow
    // Remove the last appointment that was auto-added
    if (bookingModalStep === 4 && !isGridBooking && multipleAppointments.length > 0) {
      const lastAppointment = multipleAppointments[multipleAppointments.length - 1];
      console.log('🗑️ Removing last auto-added appointment:', lastAppointment.id);
      dispatch(removeAppointmentFromSession(lastAppointment.id));
    }
    
    // If going back from step 3 (time) to step 2 (professional)
    // Clear time slot selection
    if (bookingModalStep === 3) {
      console.log('🧹 Clearing time slot selection');
      selectTimeSlot(null);
    }
    
    // If going back from step 2 (professional) to step 1 (service)
    // Clear professional selection
    if (bookingModalStep === 2) {
      console.log('🧹 Clearing professional selection');
      selectProfessional(null);
    }
    
    goToPreviousStep();
  };

  // Handler for adding another service - go back to step 1 but keep session
  const handleAddAnotherService = () => {
    console.log('➕ ========== ADD ANOTHER SERVICE CLICKED ==========');
    console.log('📊 Current session appointments:', multipleAppointments.length);
    console.log('📊 Appointments:', multipleAppointments);
    console.log('📊 bookingDefaults:', bookingDefaults);
    console.log('📊 selectedServiceForBooking:', selectedServiceForBooking);
    console.log('📊 selectedProfessionalForBooking:', selectedProfessionalForBooking);
    console.log('📊 selectedTimeSlotForBooking:', selectedTimeSlotForBooking);
    
    // Check if we're in grid booking mode or manual mode
    const isGridBooking = bookingDefaults?.professional && bookingDefaults?.time;
    
    if (isGridBooking) {
      // GRID BOOKING MODE: bookingDefaults contains professional and time
      // Time will be automatically chained when selecting next service
      // Professional stays the same from bookingDefaults
      console.log('🔗 Grid booking mode - bookingDefaults preserved for time chaining');
      console.log('✅ Keeping', multipleAppointments.length, 'appointments in session');
      
      // Clear only service selection
      selectService(null);
      
      // Go back to service selection (step 1)
      // bookingDefaults is NOT cleared - it keeps professional and updated time
      // multipleAppointments is NOT cleared - they stay in the session
      console.log('🔄 Going to step 1 - Service selection');
      goToStep(1);
    } else {
      // MANUAL BOOKING MODE: Full flexibility
      console.log('🔄 Manual booking mode - full flexibility');
      console.log('✅ Keeping', multipleAppointments.length, 'appointments in session');
      
      // Clear all selections to allow choosing different professional and time
      selectService(null);
      selectProfessional(null);
      selectTimeSlot(null);
      
      // Go back to service selection (step 1)
      console.log('🔄 Going to step 1 - Service selection');
      goToStep(1);
    }
    
    console.log('➕ ========== ADD ANOTHER SERVICE COMPLETE ==========');
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
          alert(`⚠️ Time slot ${aptTime} is already booked for ${profName}. Please go back and select a different time.`);
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
      
      alert(successMsg);
      
    } catch (err) {
      console.error('❌ Booking failed:', err);
      console.error('❌ Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create booking';
      alert(`Booking failed: ${errorMessage}`);
    }
  };

  const handleToggleDatePicker = () => {
    setShowDatePicker(prev => !prev);
  };

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
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
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

      <CalendarGrid
        employees={filteredEmployees}
        currentDate={currentDate}
        timeSlots={timeSlots}
        appointments={appointments}
        onTimeSlotClick={handleTimeSlotClick}
        onAppointmentClick={handleAppointmentClick}
        selectedStaff={selectedStaffFilter}
      />

      <BookingModal
        show={showBookingModal}
        step={bookingModalStep}
        onClose={() => {
          closeBookingModal();
          setBookingDefaults(null); // Clear grid booking context when modal closes
        }}
        onNextStep={handleNextStep}
        onPreviousStep={handlePreviousStep}
        onAddAnotherService={handleAddAnotherService}
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
      />
    </div>
  );
};

export default Calendar;