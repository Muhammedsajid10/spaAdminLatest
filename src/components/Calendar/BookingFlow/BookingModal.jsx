/**
 * BookingModal Component
 * Multi-step booking modal with support for multiple appointments in session
 */

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Calendar, Clock, User, DollarSign, Plus, Trash2 } from 'lucide-react';
import ServiceSelection from './ServiceSelection';
import ProfessionalSelection from './ProfessionalSelection';
import TimeSlotSelection from './TimeSlotSelection';
import ClientSelection from './ClientSelection';
import BookingSummary from './BookingSummary';
import BookingProgress from './BookingProgress';
import { 
  selectSessionAppointments, 
  selectSessionTotal,
  selectAppointmentCount,
  removeAppointmentFromSession,
  setAddingAdditionalService
} from '../../../store/bookingSessionSlice';
import { formatTime } from '../../../utils/calendar/timeUtils';

const BookingModal = ({
  show,
  step,
  bookingDefaults,
  onClose,
  onNextStep,
  onPreviousStep,
  onAddAnotherService,
  selectedService,
  selectedProfessional,
  selectedTimeSlot,
  selectedDate,
  selectedClient,
  onSelectService,
  onSelectProfessional,
  onSelectTimeSlot,
  onSelectClient,
  onConfirmBooking,
  services = [],
  employees = [],
  clients = [],
  appointments = []
}) => {
  const dispatch = useDispatch();
  
  // Get session appointments from Redux
  const sessionAppointments = useSelector(selectSessionAppointments);
  const sessionTotal = useSelector(selectSessionTotal);
  const appointmentCount = useSelector(selectAppointmentCount);
  
  console.log('🔷 BookingModal RENDER');
  console.log('🔷 sessionAppointments from Redux:', sessionAppointments.length);
  console.log('🔷 sessionAppointments:', sessionAppointments.map(a => ({
    id: a.id,
    service: a.serviceName || a.service?.name
  })));
  console.log('🔷 selectedTimeSlot:', selectedTimeSlot);
  console.log('🔷 selectedProfessional:', selectedProfessional);
  console.log('🔷 bookingDefaults:', bookingDefaults);

  // Detect if this is a grid booking:
  // 1. bookingDefaults has professional and time (original grid click)
  // 2. OR we have appointments in session (continuing grid booking)
  const isGridBooking = !!(bookingDefaults?.professional && bookingDefaults?.time) || sessionAppointments.length > 0;
  
  console.log('🔷 isGridBooking:', isGridBooking);

  // Helper to map actual steps to virtual steps for grid booking
  // Grid booking: Step 1 (Service) → Step 2 (Client) → Step 3 (Confirm)
  // Actual steps:  Step 1 (Service) → Step 4 (Client) → Step 5 (Confirm)
  const getVirtualStep = (actualStep) => {
    if (!isGridBooking) return actualStep;
    
    switch (actualStep) {
      case 1: return 1; // Service
      case 4: return 2; // Client
      case 5: return 3; // Confirm
      default: return actualStep;
    }
  };

  const virtualStep = getVirtualStep(step);

  // Calculate subtotal with discounts
  const subtotal = useMemo(() => {
    return sessionAppointments.reduce((sum, apt) => {
      const price = apt.customPrice || apt.price || apt.service?.price || 0;
      return sum + price;
    }, 0);
  }, [sessionAppointments]);

  const totalDiscount = useMemo(() => {
    return sessionAppointments.reduce((sum, apt) => {
      const discount = apt.discount || 0;
      const giftCard = apt.giftCardValue || 0;
      return sum + discount + giftCard;
    }, 0);
  }, [sessionAppointments]);

  if (!show) return null;

  const handleRemoveAppointment = (appointmentId) => {
    dispatch(removeAppointmentFromSession(appointmentId));
  };

  const handleAddAnotherService = () => {
    dispatch(setAddingAdditionalService(true));
    // Call parent handler if provided
    if (onAddAnotherService) {
      onAddAnotherService();
    }
  };

  const getStepTitle = () => {
    const serviceCount = appointmentCount > 0 ? ` (${appointmentCount})` : '';
    
    if (isGridBooking) {
      // Use virtual steps for grid booking
      switch (virtualStep) {
        case 1: return `Select Service${serviceCount}`;
        case 2: return 'Select Client';
        case 3: return 'Confirm Booking';
        default: return 'New Booking';
      }
    }
    
    // For manual bookings: all 5 steps
    switch (step) {
      case 1: return `Select Service${serviceCount}`;
      case 2: return 'Choose Professional';
      case 3: return 'Pick Time Slot';
      case 4: return 'Select Client';
      case 5: return 'Confirm Booking';
      default: return 'New Booking';
    }
  };

  const renderStepContent = () => {
    // For grid bookings, map actual steps to content
    if (isGridBooking) {
      // Step 1: Service Selection
      if (step === 1) {
        return (
          <ServiceSelection
            services={services}
            selectedService={selectedService}
            onSelectService={onSelectService}
            onNext={onNextStep}
            multipleAppointments={sessionAppointments}
            onRemoveAppointment={handleRemoveAppointment}
            isGridBooking={true}
            onProceedToClient={() => {
              console.log('🛒 Proceed to client clicked');
              // Navigate to step 4 (client selection)
              // We need to call a handler that will navigate
              if (sessionAppointments.length > 0) {
                // Trigger navigation by calling onNextStep in a way that navigates to step 4
                // Since we're at step 1, we need to jump to step 4
                // We'll use a custom approach
                onNextStep(); // This will be intercepted in Calendar.jsx
              }
            }}
          />
        );
      }
      // Step 4: Client Selection (virtual step 2)
      if (step === 4) {
        return (
          <ClientSelection
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={onSelectClient}
            onNext={onNextStep}
            onBack={onPreviousStep}
          />
        );
      }
      // Step 5: Confirmation (virtual step 3)
      if (step === 5) {
        return (
          <BookingSummary
            service={selectedService}
            professional={selectedProfessional}
            timeSlot={selectedTimeSlot}
            date={selectedDate}
            client={selectedClient}
            multipleAppointments={sessionAppointments}
            onConfirm={onConfirmBooking}
            onBack={onPreviousStep}
            onAddAnotherService={onAddAnotherService}
          />
        );
      }
      return null;
    }
    
    // For manual bookings, render all steps normally
    switch (step) {
      case 1:
        return (
          <ServiceSelection
            services={services}
            selectedService={selectedService}
            onSelectService={onSelectService}
            onNext={onNextStep}
          />
        );
      case 2:
        return (
          <ProfessionalSelection
            professionals={employees}
            selectedProfessional={selectedProfessional}
            onSelectProfessional={onSelectProfessional}
            onNext={onNextStep}
            onBack={onPreviousStep}
            service={selectedService}
            date={selectedDate}
          />
        );
      case 3:
        return (
          <TimeSlotSelection
            selectedTimeSlot={selectedTimeSlot}
            onSelectTimeSlot={onSelectTimeSlot}
            onNext={onNextStep}
            onBack={onPreviousStep}
            professional={selectedProfessional}
            service={selectedService}
            date={selectedDate}
            appointments={appointments}
            sessionAppointments={sessionAppointments}
          />
        );
      case 4:
        return (
          <ClientSelection
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={onSelectClient}
            onNext={onNextStep}
            onBack={onPreviousStep}
          />
        );
      case 5:
        return (
          <BookingSummary
            service={selectedService}
            professional={selectedProfessional}
            timeSlot={selectedTimeSlot}
            date={selectedDate}
            client={selectedClient}
            multipleAppointments={sessionAppointments}
            onConfirm={onConfirmBooking}
            onBack={onPreviousStep}
            onAddAnotherService={onAddAnotherService}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="booking-modal-header">
          <h2 className="booking-modal-title">{getStepTitle()}</h2>
          <button className="booking-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="booking-modal-content">
          {renderStepContent()}
        </div>

        {/* Modal Footer */}
        <div className="booking-modal-footer">
          <div className="booking-modal-footer-left">
            <div className="footer-date">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) || 'Select date'}
            </div>
            <div className="footer-total">
              Total AED {sessionTotal.toFixed(0)}
            </div>
          </div>
          <div className="booking-modal-footer-right">
            <button className="footer-btn secondary" onClick={onClose}>
              Cancel
            </button>
            {isGridBooking && step === 1 && sessionAppointments.length > 0 && (
              <button className="footer-btn primary" onClick={() => onNextStep()}>
                Checkout
              </button>
            )}
            {step === 5 && (
              <button className="footer-btn primary" onClick={onConfirmBooking}>
                Confirm Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
