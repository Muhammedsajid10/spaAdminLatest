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
import { generateTimeSlots } from '../../utils/calendar/timeHelpers';

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
    console.log('🔄 Checking clients... current count:', clients.length);
    if (clients.length === 0) {
      console.log('🔄 Fetching clients...');
      dispatch(fetchClientsThunk());
    }
  }, [dispatch, clients.length]);

  // Handlers
  const handleOpenBooking = (options = {}) => {
    // Clear any existing session when opening new booking
    dispatch(clearSession());
    
    openBookingModal(
      options.date || currentDate,
      options.time,
      options.employee
    );
  };

  // Enhanced next step handler that adds appointment to session at the right time
  const handleNextStep = () => {
    console.log(`🔄 Moving from step ${bookingModalStep} to ${bookingModalStep + 1}`);
    
    // If moving from step 3 (time selection) to step 4 (client selection)
    // Add the current appointment to the session IMMEDIATELY
    if (bookingModalStep === 3 && selectedTimeSlotForBooking) {
      console.log('📝 Adding appointment to session after time selection');
      
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
        timeSlot: selectedTimeSlotForBooking, // Add both for compatibility
        date: selectedDateForBooking,
        duration: selectedServiceForBooking?.duration || 30,
        price: selectedServiceForBooking?.price || 0,
        addedAt: new Date().toISOString()
      };

      console.log('✅ Adding appointment to session:', appointmentData);
      addAppointmentToSessionLocal(appointmentData);
      
      // Clear selections to allow adding another service
      selectService(null);
      selectProfessional(null);
      selectTimeSlot(null);
    }
    
    goToNextStep();
  };

  // Enhanced previous step handler with proper state cleanup
  const handlePreviousStep = () => {
    console.log(`⬅️ Going back from step ${bookingModalStep} to ${bookingModalStep - 1}`);
    
    // If going back from step 5 (confirmation) to step 4 (client)
    // Don't remove appointments, just allow editing
    if (bookingModalStep === 5) {
      console.log('✅ Going back to client selection - keeping appointments');
    }
    
    // If going back from step 4 (client) to step 3 (time)
    // Remove the last appointment that was auto-added
    if (bookingModalStep === 4 && multipleAppointments.length > 0) {
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
    console.log('➕ Adding another service to session');
    // Clear current selections but keep session
    selectService(null);
    selectProfessional(null);
    selectTimeSlot(null);
    // Go back to service selection
    goToStep(1);
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
        onClose={closeBookingModal}
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