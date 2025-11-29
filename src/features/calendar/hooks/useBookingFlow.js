/**
 * useBookingFlow Hook
 * Manages booking modal state and multi-step flow
 */

import { useState, useCallback, useMemo } from 'react';

const STEPS = {
  SERVICE: 1,
  PROFESSIONAL: 2,
  TIME_SLOT: 3,
  CLIENT: 4,
  PAYMENT: 5,
};

/**
 * Custom hook for managing booking flow state
 * @returns {Object} Booking flow state and functions
 */
export const useBookingFlow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(STEPS.SERVICE);
  const [bookingData, setBookingData] = useState({
    service: null,
    professional: null,
    timeSlot: null,
    date: null,
    client: null,
    payment: null,
  });

  /**
   * Open booking modal
   * @param {Object} defaults - Default values to pre-fill
   */
  const openModal = useCallback((defaults = {}) => {
    setIsOpen(true);
    setCurrentStep(STEPS.SERVICE);
    setBookingData(prev => ({ ...prev, ...defaults }));
  }, []);

  /**
   * Close booking modal and reset
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(STEPS.SERVICE);
    setBookingData({
      service: null,
      professional: null,
      timeSlot: null,
      date: null,
      client: null,
      payment: null,
    });
  }, []);

  /**
   * Go to next step
   */
  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.PAYMENT));
  }, []);

  /**
   * Go to previous step
   */
  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, STEPS.SERVICE));
  }, []);

  /**
   * Go to specific step
   * @param {number} step - Step number
   */
  const goToStep = useCallback((step) => {
    if (step >= STEPS.SERVICE && step <= STEPS.PAYMENT) {
      setCurrentStep(step);
    }
  }, []);

  /**
   * Update booking data for a specific field
   * @param {string} field - Field name
   * @param {any} value - Field value
   */
  const updateBookingData = useCallback((field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Update multiple fields at once
   * @param {Object} data - Object with field-value pairs
   */
  const updateMultipleFields = useCallback((data) => {
    setBookingData(prev => ({ ...prev, ...data }));
  }, []);

  /**
   * Validate current step
   * @returns {boolean} True if current step is valid
   */
  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case STEPS.SERVICE:
        return !!bookingData.service;
      case STEPS.PROFESSIONAL:
        return !!bookingData.professional;
      case STEPS.TIME_SLOT:
        return !!bookingData.timeSlot && !!bookingData.date;
      case STEPS.CLIENT:
        return !!bookingData.client;
      case STEPS.PAYMENT:
        return !!bookingData.payment;
      default:
        return false;
    }
  }, [currentStep, bookingData]);

  /**
   * Check if can proceed to next step
   */
  const canProceed = useMemo(() => {
    return validateCurrentStep() && currentStep < STEPS.PAYMENT;
  }, [validateCurrentStep, currentStep]);

  /**
   * Check if can go back
   */
  const canGoBack = useMemo(() => {
    return currentStep > STEPS.SERVICE;
  }, [currentStep]);

  /**
   * Check if on final step
   */
  const isFinalStep = useMemo(() => {
    return currentStep === STEPS.PAYMENT;
  }, [currentStep]);

  /**
   * Get step progress percentage
   */
  const progress = useMemo(() => {
    return (currentStep / STEPS.PAYMENT) * 100;
  }, [currentStep]);

  return {
    isOpen,
    currentStep,
    bookingData,
    openModal,
    closeModal,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateBookingData,
    updateMultipleFields,
    validateCurrentStep,
    canProceed,
    canGoBack,
    isFinalStep,
    progress,
    STEPS,
  };
};
