import React, { useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useBookingFlow } from '../../hooks/useBookingFlow';
import { useBookingSubmission } from '../../hooks/useBookingSubmission';
import {
  ServiceSelection,
  ProfessionalSelection,
  TimeSlotSelection,
  ClientSelection,
  PaymentDetails
} from './steps';
import styles from './BookingModal.module.css';

const BookingModal = ({ isOpen, onClose, initialData = {} }) => {
  const {
    currentStep,
    bookingData,
    goToNextStep,
    goToPreviousStep,
    updateBookingData,
    canProceed,
    isFinalStep,
    STEPS,
    openModal,
    closeModal
  } = useBookingFlow();

  const { submitBooking, isSubmitting, error } = useBookingSubmission({
    onSuccess: (data) => {
      console.log('Booking successful:', data);
      onClose();
      // Trigger refresh if needed
      window.dispatchEvent(new CustomEvent('calendar-refresh'));
    },
    onError: (err) => {
      console.error('Booking submission failed:', err);
    }
  });

  // Sync external open state with internal hook state
  useEffect(() => {
    if (isOpen) {
      openModal(initialData);
    } else {
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openModal, closeModal]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isFinalStep) {
      handleSubmit();
    } else {
      goToNextStep();
    }
  };

  const handleSubmit = async () => {
    await submitBooking(bookingData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.SERVICE:
        return (
          <ServiceSelection
            selectedService={bookingData.service}
            onSelect={(service) => {
              updateBookingData('service', service);
              goToNextStep();
            }}
          />
        );
      case STEPS.PROFESSIONAL:
        return (
          <ProfessionalSelection
            service={bookingData.service}
            selectedProfessional={bookingData.professional}
            onSelect={(professional) => {
              updateBookingData('professional', professional);
              goToNextStep();
            }}
          />
        );
      case STEPS.TIME_SLOT:
        return (
          <TimeSlotSelection
            service={bookingData.service}
            professional={bookingData.professional}
            selectedTime={bookingData.timeSlot}
            selectedDate={bookingData.date}
            onSelect={(time, date) => {
              updateBookingData('timeSlot', time);
              updateBookingData('date', date);
              goToNextStep();
            }}
          />
        );
      case STEPS.CLIENT:
        return (
          <ClientSelection
            selectedClient={bookingData.client}
            onSelect={(client) => {
              updateBookingData('client', client);
              goToNextStep();
            }}
          />
        );
      case STEPS.PAYMENT:
        return (
          <PaymentDetails
            totalAmount={bookingData.service?.price || 0}
            selectedPaymentMethod={bookingData.payment}
            onPaymentMethodChange={(method) => updateBookingData('payment', method)}
            onGiftCardApply={(code) => console.log('Apply gift card:', code)}
            giftCardError={null}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case STEPS.SERVICE: return 'Select Service';
      case STEPS.PROFESSIONAL: return 'Select Professional';
      case STEPS.TIME_SLOT: return 'Select Time';
      case STEPS.CLIENT: return 'Select Client';
      case STEPS.PAYMENT: return 'Payment Details';
      default: return 'Booking';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {currentStep > STEPS.SERVICE && (
              <button onClick={goToPreviousStep} className={styles.backButton}>
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className={styles.title}>{getStepTitle()}</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className={styles.content}>
          {renderStep()}
          {error && <div className={styles.errorBanner}>{error}</div>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.summary}>
            {bookingData.service && (
              <span className={styles.summaryItem}>
                {bookingData.service.name} (${bookingData.service.price})
              </span>
            )}
          </div>
          <button
            className={styles.nextButton}
            onClick={handleNext}
            disabled={(!canProceed && !isFinalStep) || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (isFinalStep ? 'Confirm Booking' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
