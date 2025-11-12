/**
 * BookingModal Component
 * Multi-step booking modal
 */

import React from 'react';
import { X } from 'lucide-react';
import ServiceSelection from './ServiceSelection';
import ProfessionalSelection from './ProfessionalSelection';
import TimeSlotSelection from './TimeSlotSelection';
import ClientSelection from './ClientSelection';
import BookingSummary from './BookingSummary';
import BookingProgress from './BookingProgress';

const BookingModal = ({
  show,
  step,
  onClose,
  onNextStep,
  onPreviousStep,
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
  services,
  employees,
  clients,
  multipleAppointments
}) => {
  if (!show) return null;

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
            multipleAppointments={multipleAppointments}
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
        <div className="modal-header">
          <h2>New Booking</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <BookingProgress currentStep={step} totalSteps={5} />

        <div className="modal-body">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
