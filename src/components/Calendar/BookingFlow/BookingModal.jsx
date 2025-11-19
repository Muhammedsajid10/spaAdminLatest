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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="booking-modal-header">
          <div className="booking-modal-logo">
            <h2 className="booking-modal-title">{getStepTitle()}</h2>
          </div>
          <button className="booking-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with Sidebar */}
        <div className="booking-modal-body">
          {/* Left Sidebar */}
          <div className="booking-modal-sidebar">
            <div className="booking-sidebar-date">
              <button className="sidebar-nav-btn" onClick={onPreviousStep} disabled={step === 1}>
                ←
              </button>
              <div className="sidebar-date-info">
                <div className="sidebar-day">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'short' }) || 'Today'}
                </div>
                <div className="sidebar-date">
                  {selectedDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) || ''}
                </div>
              </div>
              <button className="sidebar-nav-btn" onClick={onNextStep} disabled={step === 5}>
                →
              </button>
            </div>

            {/* Session Appointments Summary */}
            {appointmentCount > 0 && (
              <div className="booking-session-summary">
                <div className="session-header">
                  <span className="session-title">
                    <Calendar size={16} />
                    Services ({appointmentCount})
                  </span>
                </div>
                
                <div className="session-appointments-list">
                  {sessionAppointments.map((apt, index) => (
                    <div key={apt.id} className="session-appointment-item">
                      <div className="appointment-number">{index + 1}</div>
                      <div className="appointment-details">
                        <div className="appointment-service">
                          {apt.serviceName || apt.service?.name}
                        </div>
                        <div className="appointment-meta">
                          <span className="appointment-professional">
                            <User size={12} />
                            {apt.professionalName || apt.professional?.name || 'Staff'}
                          </span>
                          <span className="appointment-time">
                            <Clock size={12} />
                            {apt.time ? formatTime(apt.time, false) : 'TBD'}
                          </span>
                        </div>
                        <div className="appointment-price">
                          <DollarSign size={12} />
                          ${apt.customPrice || apt.price || apt.service?.price || 0}
                          {apt.discount > 0 && (
                            <span className="discount-badge">-${apt.discount}</span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="appointment-remove-btn"
                        onClick={() => handleRemoveAppointment(apt.id)}
                        title="Remove service"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Another Service Button */}
                {step < 5 && (
                  <button 
                    className="add-service-btn"
                    onClick={handleAddAnotherService}
                  >
                    <Plus size={16} />
                    Add Another Service
                  </button>
                )}

                {/* Session Total */}
                <div className="session-total">
                  {totalDiscount > 0 && (
                    <div className="session-subtotal">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <div className="session-discount">
                      <span>Discounts:</span>
                      <span className="discount-value">-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="session-total-row">
                    <span>Total:</span>
                    <span className="total-value">${sessionTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="booking-sidebar-client">
              {selectedClient ? (
                <div className="selected-client-info">
                  <span className="client-icon">👤</span>
                  <div className="client-info">
                    <div className="client-label">{selectedClient.name}</div>
                    <div className="client-sublabel">{selectedClient.email || selectedClient.phone}</div>
                  </div>
                </div>
              ) : (
                <button className="sidebar-client-btn" onClick={() => step < 4 && onNextStep()}>
                  <span className="client-icon">👤</span>
                  <div className="client-info">
                    <div className="client-label">Add client</div>
                    <div className="client-sublabel">Or leave empty for walk-ins</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="booking-modal-content">
            <BookingProgress currentStep={step} totalSteps={5} />
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
