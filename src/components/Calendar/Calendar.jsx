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

// Import utilities
import { generateTimeSlots } from '../../utils/calendar/timeHelpers';

// Import Redux actions and API
import { setEmployees, setEmployeesLoading, setEmployeesError } from '../../store/employeesSlice';
import { ReportsAPI } from '../../Service/api/reportsApi';

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
    getEmployeeAppointments
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
  
  const services = useSelector(state => state.services?.services || [], (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
    return left.length === right.length && left.every((val, idx) => val === right[idx]);
  });
  
  const clients = useSelector(state => state.clients?.clients || [], (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
    return left.length === right.length && left.every((val, idx) => val === right[idx]);
  });

  // Local state
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  // Handlers
  const handleOpenBooking = (options = {}) => {
    openBookingModal(
      options.date || currentDate,
      options.time,
      options.employee
    );
  };

  const handleTimeSlotClick = ({ employee, date, time }) => {
    handleOpenBooking({ date, time, employee });
  };

  const handleAppointmentClick = (appointment) => {
    console.log('Appointment clicked:', appointment);
  };

  const handleConfirmBooking = async (bookingData) => {
    try {
      console.log('Confirming booking:', bookingData);
      
      const newAppointment = {
        service: selectedServiceForBooking,
        professional: selectedProfessionalForBooking,
        timeSlot: selectedTimeSlotForBooking,
        date: selectedDateForBooking,
        client: selectedClientForBooking,
        customDiscount: bookingData.customDiscount
      };

      addAppointmentToSessionLocal(newAppointment);
      closeBookingModal();
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  const handleToggleDatePicker = () => {
    setShowDatePicker(prev => !prev);
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
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onViewChange={setCurrentView}
        onOpenBooking={handleOpenBooking}
        onToggleDatePicker={handleToggleDatePicker}
        isToday={isToday}
      />

      <CalendarGrid
        employees={employees}
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
        onNextStep={goToNextStep}
        onPreviousStep={goToPreviousStep}
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
        multipleAppointments={multipleAppointments}
      />
    </div>
  );
};

export default Calendar;