import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setModalOpen, setStep } from '@store/adminBookingSlice';
import StepService from './StepService';
import StepProfessional from './StepProfessional';
import StepTimeSlot from './StepTimeSlot';
import StepClient from './StepClient';
import StepPreview from './StepPreview';

const BookingWizardModal = () => {
  const dispatch = useDispatch();
  const { 
    showModal, 
    step, 
    status,
    selection,
    navigation
  } = useSelector(state => state.adminBooking);

  if (!showModal) return null;

  const closeBookingModal = () => dispatch(setModalOpen(false));

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepService />;
      case 2:
        return <StepProfessional />;
      case 3: 
        return <StepTimeSlot />;
      case 5: 
        return <StepClient />;
      case 6: 
        return <StepPreview />;
      default:
        return <div className="step-placeholder">Managing services... (Step 4)</div>;
    }
  };

  return (
    <div className="modern-booking-modal">
      <div className="booking-modal-overlay booking-modal-fade-in" onClick={closeBookingModal}>
        <div 
          className={`booking-modal booking-modal-animate-in pro-theme ${step === 6 ? 'final-step' : ''}`} 
          onClick={e => e.stopPropagation()}
        >
          <button className="booking-modal-close" onClick={closeBookingModal}>×</button>
          <h2>New Appointment</h2>

          {status.error && <div className="booking-modal-error">{status.error}</div>}
          {status.loading && <div className="booking-modal-loading">Processing...</div>}
          {status.success && <div className="booking-modal-success">{status.success}</div>}

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default BookingWizardModal;
