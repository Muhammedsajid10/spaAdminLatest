import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { 
  addAppointmentToBookingSessionThunk 
} from '../calendar/store/thunks';
import {
  // Booking form actions
  setBookingStep,
  setSelectedService,
  setSelectedProfessional,
  setSelectedTimeSlot,
  setAvailableProfessionals,
  setAvailableTimeSlots,
  setBookingError,
  setBookingSuccess,
  setBookingLoading,
  clearBookingSelections,
  resetBookingForm,
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
  setSelectedBookingDate,
  setShowBookingDatePicker,
  setBookingDefaults,
  setShowAddBookingModal
} from '../calendar/store/bookingFormSlice';
import {
  removeAppointmentFromSession,
  clearSession as clearBookingSession,
  setShowServiceCatalog
} from '../calendar/store/bookingSessionSlice';

export const useBookingSession = () => {
  const dispatch = useDispatch();
  
  // Selectors for booking form state
  const bookingFormState = useSelector(state => state.bookingForm);
  const bookingSessionState = useSelector(state => state.bookingSession);
  const currentDateISO = useSelector(state => state.datePicker.currentDate);
  const appointments = useSelector(state => state.appointments.byEmployee);
  
  // Convert ISO string to Date object for currentDate
  const currentDate = useMemo(() => new Date(currentDateISO), [currentDateISO]);
  
  // Destructure commonly used state
  const {
    bookingStep,
    showAddBookingModal,
    selectedService,
    selectedProfessional,
    selectedTimeSlot,
    availableProfessionals,
    availableTimeSlots,
    selectedExistingClient,
    isAddingNewClient,
    clientInfo,
    clientSearchQuery,
    clientSearchResults,
    showClientSearch,
    paymentMethod,
    giftCardCode,
    bookingForm,
    selectedBookingDate,
    showBookingDatePicker,
    bookingDefaults,
    bookingLoading,
    bookingError,
    bookingSuccess
  } = bookingFormState;
  
  const {
    multipleAppointments,
    showServiceCatalog,
    isAddingAdditionalService
  } = bookingSessionState;

  // Action creators
  const actions = {
    // Step management
    setBookingStep: useCallback((step) => dispatch(setBookingStep(step)), [dispatch]),
    setShowAddBookingModal: useCallback((show) => dispatch(setShowAddBookingModal(show)), [dispatch]),
    
    // Selection management
    setSelectedService: useCallback((service) => dispatch(setSelectedService(service)), [dispatch]),
    setSelectedProfessional: useCallback((professional) => dispatch(setSelectedProfessional(professional)), [dispatch]),
    setSelectedTimeSlot: useCallback((timeSlot) => dispatch(setSelectedTimeSlot(timeSlot)), [dispatch]),
    setAvailableProfessionals: useCallback((professionals) => dispatch(setAvailableProfessionals(professionals)), [dispatch]),
    setAvailableTimeSlots: useCallback((timeSlots) => dispatch(setAvailableTimeSlots(timeSlots)), [dispatch]),
    
    // Error and success management
    setBookingError: useCallback((error) => dispatch(setBookingError(error)), [dispatch]),
    setBookingSuccess: useCallback((success) => dispatch(setBookingSuccess(success)), [dispatch]),
    setBookingLoading: useCallback((loading) => dispatch(setBookingLoading(loading)), [dispatch]),
    
    // Client management
    setSelectedExistingClient: useCallback((client) => dispatch(setSelectedExistingClient(client)), [dispatch]),
    setIsAddingNewClient: useCallback((adding) => dispatch(setIsAddingNewClient(adding)), [dispatch]),
    setClientInfo: useCallback((info) => dispatch(setClientInfo(info)), [dispatch]),
    setClientSearchQuery: useCallback((query) => dispatch(setClientSearchQuery(query)), [dispatch]),
    setClientSearchResults: useCallback((results) => dispatch(setClientSearchResults(results)), [dispatch]),
    setShowClientSearch: useCallback((show) => dispatch(setShowClientSearch(show)), [dispatch]),
    clearClientSelection: useCallback(() => dispatch(clearClientSelection()), [dispatch]),
    
    // Payment management
    setPaymentMethod: useCallback((method) => dispatch(setPaymentMethod(method)), [dispatch]),
    setGiftCardCode: useCallback((code) => dispatch(setGiftCardCode(code)), [dispatch]),
    setBookingForm: useCallback((form) => dispatch(setBookingForm(form)), [dispatch]),
    
    // Date management
    setSelectedBookingDate: useCallback((date) => dispatch(setSelectedBookingDate(date)), [dispatch]),
    setShowBookingDatePicker: useCallback((show) => dispatch(setShowBookingDatePicker(show)), [dispatch]),
    setBookingDefaults: useCallback((defaults) => dispatch(setBookingDefaults(defaults)), [dispatch]),
    
    // Session management
    setShowServiceCatalog: useCallback((show) => dispatch(setShowServiceCatalog(show)), [dispatch]),
    removeAppointmentFromSession: useCallback((id) => dispatch(removeAppointmentFromSession(id)), [dispatch]),
    clearBookingSession: useCallback(() => dispatch(clearBookingSession()), [dispatch]),
    
    // Form reset
    clearBookingSelections: useCallback(() => dispatch(clearBookingSelections()), [dispatch]),
    resetBookingForm: useCallback(() => dispatch(resetBookingForm()), [dispatch])
  };

  // Business logic methods
  const handleAddToBookingSession = useCallback(async (overrideSlot = null) => {
    const slotToUse = overrideSlot || selectedTimeSlot;
    
    console.log('🚀 handleAddToBookingSession called with:', {
      slotToUse,
      selectedService,
      selectedProfessional,
      selectedTimeSlot,
      currentDate
    });
    
    // Validate inputs before proceeding
    if (!selectedService) {
      const error = 'Please select a service first';
      console.error('❌ Validation failed:', error);
      actions.setBookingError(error);
      return false;
    }
    
    if (!selectedProfessional) {
      const error = 'Please select a professional first';
      console.error('❌ Validation failed:', error);
      actions.setBookingError(error);
      return false;
    }
    
    if (!slotToUse) {
      const error = 'Please select a time slot first';
      console.error('❌ Validation failed:', error);
      actions.setBookingError(error);
      return false;
    }
    
    try {
      console.log('🔄 Dispatching addAppointmentToBookingSessionThunk...');
      
      const result = await dispatch(addAppointmentToBookingSessionThunk({
        selectedService,
        selectedProfessional,
        selectedTimeSlot: slotToUse,
        bookingDefaults,
        selectedBookingDate,
        currentDate
      })).unwrap();
      
      console.log('✅ Thunk completed successfully:', result);
      
      // Clear selections after successful addition
      actions.clearBookingSelections();
      
      // Show success message
      actions.setBookingSuccess(result.message);
      setTimeout(() => actions.setBookingSuccess(null), 4000);
      
      return true;
    } catch (error) {
      console.error('❌ Thunk failed with error:', error);
      actions.setBookingError(error);
      return false;
    }
  }, [
    dispatch, 
    selectedService, 
    selectedProfessional, 
    selectedTimeSlot, 
    bookingDefaults, 
    selectedBookingDate, 
    currentDate,
    actions
  ]);

  const getTotalSessionPrice = useCallback(() => {
    return multipleAppointments.reduce((total, apt) => {
      return total + (apt.service?.price || apt.price || 0);
    }, 0);
  }, [multipleAppointments]);

  const closeBookingModal = useCallback(() => {
    actions.setShowAddBookingModal(false);
    actions.setBookingStep(1);
    actions.clearBookingSelections();
    actions.setBookingError(null);
    actions.setBookingSuccess(null);
  }, [actions]);

  const startAdditionalService = useCallback(() => {
    actions.setBookingStep(1);
    actions.setShowServiceCatalog(true);
    actions.clearBookingSelections();
  }, [actions]);

  return {
    // State
    state: {
      bookingStep,
      showAddBookingModal,
      selectedService,
      selectedProfessional,
      selectedTimeSlot,
      availableProfessionals,
      availableTimeSlots,
      selectedExistingClient,
      isAddingNewClient,
      clientInfo,
      clientSearchQuery,
      clientSearchResults,
      showClientSearch,
      paymentMethod,
      giftCardCode,
      bookingForm,
      selectedBookingDate,
      showBookingDatePicker,
      bookingDefaults,
      bookingLoading,
      bookingError,
      bookingSuccess,
      multipleAppointments,
      showServiceCatalog,
      isAddingAdditionalService
    },
    
    // Actions
    actions,
    
    // Business logic methods
    handleAddToBookingSession,
    getTotalSessionPrice,
    closeBookingModal,
    startAdditionalService
  };
};