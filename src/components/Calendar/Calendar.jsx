/**
 * Calendar Component
 * Main orchestrator component for the calendar system
 * Replaces the monolithic Selectcalander.jsx
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  useCalendarState, 
  useBookingFlow, 
  useAppointments,
  useTeamManagement 
} from '../../hooks/calendar';
import { fetchServicesThunk, fetchClientsThunk } from '../../store/thunks';
import CalendarHeader from './Header/CalendarHeader';
import CalendarGrid from './Grid/CalendarGrid';
import BookingModal from './BookingFlow/BookingModal';
import LoadingSpinner from './Shared/LoadingSpinner';
import ErrorMessage from './Shared/ErrorMessage';
import EmptyState from './Shared/EmptyState';
import { generateTimeSlots } from '../../utils/calendar';
import './Calendar.css';

const Calendar = () => {
  const dispatch = useDispatch();

  // Custom hooks
  const {
    currentDate,
    currentView,
    selectedStaffFilter,
    teamFilter,
    isToday,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    setCurrentView,
    goToSpecificDate
  } = useCalendarState();

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

  const {
    appointments,
    employees,
    getEmployeeAppointments
  } = useAppointments(currentDate);

  const { teamMode, selectedTeamMembers } = useTeamManagement();

  // Redux state
  const loading = useSelector(state => state.calendar.loading);
  const error = useSelector(state => state.calendar.error);
  const services = useSelector(state => state.services?.services || []);
  const clients = useSelector(state => state.clients?.clients || []);

  // Local state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlots] = useState(generateTimeSlots('00:00', '23:30', 30));

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchServicesThunk());
    dispatch(fetchClientsThunk());
  }, [dispatch]);

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
    // Could open appointment details modal
  };

  const handleConfirmBooking = async (bookingData) => {
    try {
      // TODO: Implement booking API call
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

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleToggleDatePicker = () => {
    setShowDatePicker(prev => !prev);
  };

  // Render loading state
  if (loading && !employees.length) {
    return <LoadingSpinner message="Loading calendar..." />;
  }

  // Render error state
  if (error) {
    return (
      <div className="calendar-container">
        <ErrorMessage message={error} type="error" />
      </div>
    );
  }

  // Render empty state
  if (!employees || employees.length === 0) {
    return (
      <div className="calendar-container">
        <EmptyState
          title="No Staff Members"
          message="Add staff members to start scheduling appointments."
        />
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <CalendarHeader
        currentDate={currentDate}
        currentView={currentView}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onViewChange={handleViewChange}
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
        teamFilter={teamMode ? selectedTeamMembers : null}
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
