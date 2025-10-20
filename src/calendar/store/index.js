// Calendar Store - Redux files for calendar functionality
export { default as appointmentsSlice } from './appointmentsSlice';
export { default as bookingFormSlice } from './bookingFormSlice';
export { default as bookingSessionSlice } from './bookingSessionSlice';
export { default as calendarSlice } from './calendarSlice';
export { default as datePickerSlice } from './datePickerSlice';

// Export actions
export { 
  setAppointments, 
  setAppointmentsLoading, 
  setAppointmentsError, 
  upsertAppointment, 
  removeAppointment 
} from './appointmentsSlice';

export {
  setBookingStep,
  setShowAddBookingModal,
  setSelectedService,
  setSelectedProfessional,
  setSelectedTimeSlot,
  setAvailableProfessionals,
  setAvailableTimeSlots,
  setSelectedExistingClient,
  setIsAddingNewClient,
  setClientInfo,
  setClientSearchQuery,
  setClientSearchResults,
  setShowClientSearch,
  clearClientSelection,
  setPaymentMethod,
  setGiftCardCode,
  setBookingForm,
  setBookingError,
  setBookingSuccess,
  setBookingLoading,
  clearBookingSelections,
  resetBookingForm,
  setSelectedBookingDate,
  setShowBookingDatePicker,
  setBookingDefaults
} from './bookingFormSlice';

export {
  setMultipleAppointments,
  addAppointmentToSession,
  removeAppointmentFromSession,
  clearSession,
  setShowServiceCatalog
} from './bookingSessionSlice';

export {
  setTimeSlots,
  setCurrentDateISO,
  setLoading,
  setError,
  setSelectedStaff
} from './calendarSlice';

export {
  setCurrentDate,
  setCurrentView,
  setDatePickerView,
  setShowDatePicker,
  setDatePickerCurrentMonth,
  setDatePickerSelectedDate,
  setWeekRanges,
  setSelectedWeekRange,
  goToDatePickerPreviousMonth,
  goToDatePickerNextMonth,
  goToDatePickerToday,
  handleDatePickerDateSelect,
  handleWeekSelect,
  handleMonthSelect,
  goToPrevious,
  goToNext,
  goToToday,
  initializeDatePicker,
  selectCurrentDate,
  selectCurrentView,
  selectShowDatePicker,
  selectDatePickerCurrentMonth,
  selectDatePickerSelectedDate,
  selectDatePickerView,
  selectCalendarDays,
  selectWeeksInMonth,
  selectMonthsInYear
} from './datePickerSlice';

// Export thunks
export {
  fetchCalendarThunk,
  fetchServicesThunk,
  fetchClientsThunk,
  fetchProfessionalsThunk,
  fetchBookingTimeSlotsThunk,
  addAppointmentToBookingSessionThunk
} from './thunks';