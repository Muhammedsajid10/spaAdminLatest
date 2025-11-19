/**
 * useBookingFlow Hook
 * Manages multi-step booking flow state and navigation
 */

import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addAppointmentToSession,
  removeAppointmentFromSession,
  clearSession,
  setShowServiceCatalog as setShowServiceCatalogAction
} from '../../store/bookingSessionSlice';

export const useBookingFlow = () => {
  const dispatch = useDispatch();

  // Redux state - Updated to match new bookingSessionSlice structure
  const multipleAppointments = useSelector(state => state.bookingSession.appointments || []);
  const currentAppointmentIndex = useSelector(state => state.bookingSession.currentAppointmentIndex || 0);
  const showServiceCatalog = useSelector(state => state.bookingSession.showServiceCatalog || false);
  const isAddingAdditionalService = useSelector(state => state.bookingSession.isAddingAdditionalService || false);

  // Local state for booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingModalStep, setBookingModalStep] = useState(1);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);
  const [selectedProfessionalForBooking, setSelectedProfessionalForBooking] = useState(null);
  const [selectedTimeSlotForBooking, setSelectedTimeSlotForBooking] = useState(null);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState(null);
  const [selectedClientForBooking, setSelectedClientForBooking] = useState(null);

  // Booking modal navigation
  const openBookingModal = useCallback((date = null, time = null, employee = null) => {
    setShowBookingModal(true);
    setBookingModalStep(1);
    if (date) setSelectedDateForBooking(date);
    if (time) setSelectedTimeSlotForBooking(time);
    if (employee) setSelectedProfessionalForBooking(employee);
  }, []);

  const closeBookingModal = useCallback(() => {
    setShowBookingModal(false);
    setBookingModalStep(1);
    setSelectedServiceForBooking(null);
    setSelectedProfessionalForBooking(null);
    setSelectedTimeSlotForBooking(null);
    setSelectedDateForBooking(null);
    setSelectedClientForBooking(null);
  }, []);

  const goToNextStep = useCallback(() => {
    setBookingModalStep(prev => prev + 1);
  }, []);

  const goToPreviousStep = useCallback(() => {
    setBookingModalStep(prev => Math.max(1, prev - 1));
  }, []);

  const goToStep = useCallback((step) => {
    setBookingModalStep(step);
  }, []);

  // Service catalog
  const openServiceCatalog = useCallback(() => {
    dispatch(setShowServiceCatalogAction(true));
  }, [dispatch]);

  const closeServiceCatalog = useCallback(() => {
    dispatch(setShowServiceCatalogAction(false));
  }, [dispatch]);

  // Session management
  const addAppointmentToSessionLocal = useCallback((appointment) => {
    dispatch(addAppointmentToSession(appointment));
  }, [dispatch]);

  const removeAppointmentFromSessionLocal = useCallback((appointmentId) => {
    dispatch(removeAppointmentFromSession(appointmentId));
  }, [dispatch]);

  const clearSessionLocal = useCallback(() => {
    dispatch(clearSession());
  }, [dispatch]);

  const setCurrentAppointmentIndex = useCallback((index) => {
    dispatch({ type: 'bookingSession/setCurrentAppointmentIndex', payload: index });
  }, [dispatch]);

  const setIsAddingAdditionalService = useCallback((value) => {
    dispatch({ type: 'bookingSession/setIsAddingAdditionalService', payload: value });
  }, [dispatch]);

  // Selection helpers
  const selectService = useCallback((service) => {
    setSelectedServiceForBooking(service);
  }, []);

  const selectProfessional = useCallback((professional) => {
    setSelectedProfessionalForBooking(professional);
  }, []);

  const selectTimeSlot = useCallback((timeSlot) => {
    console.log('⏰ selectTimeSlot called with:', timeSlot);
    setSelectedTimeSlotForBooking(timeSlot);
  }, []);

  const selectDate = useCallback((date) => {
    setSelectedDateForBooking(date);
  }, []);

  const selectClient = useCallback((client) => {
    setSelectedClientForBooking(client);
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedServiceForBooking(null);
    setSelectedProfessionalForBooking(null);
    setSelectedTimeSlotForBooking(null);
    setSelectedDateForBooking(null);
    setSelectedClientForBooking(null);
  }, []);

  // Computed values
  const hasAppointments = multipleAppointments.length > 0;
  const appointmentCount = multipleAppointments.length;
  const isFirstStep = bookingModalStep === 1;
  const canGoBack = bookingModalStep > 1;

  return {
    // Redux state
    multipleAppointments,
    currentAppointmentIndex,
    showServiceCatalog,
    isAddingAdditionalService,

    // Local state
    showBookingModal,
    bookingModalStep,
    selectedServiceForBooking,
    selectedProfessionalForBooking,
    selectedTimeSlotForBooking,
    selectedDateForBooking,
    selectedClientForBooking,

    // Computed
    hasAppointments,
    appointmentCount,
    isFirstStep,
    canGoBack,

    // Modal navigation
    openBookingModal,
    closeBookingModal,
    goToNextStep,
    goToPreviousStep,
    goToStep,

    // Service catalog
    openServiceCatalog,
    closeServiceCatalog,

    // Session management
    addAppointmentToSessionLocal,
    removeAppointmentFromSessionLocal,
    clearSessionLocal,
    setCurrentAppointmentIndex,
    setIsAddingAdditionalService,

    // Selection helpers
    selectService,
    selectProfessional,
    selectTimeSlot,
    selectDate,
    selectClient,
    clearSelections
  };
};
