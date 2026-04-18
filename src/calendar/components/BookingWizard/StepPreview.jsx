import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBookingPreviewThunk, createBookingThunk } from '../../../store/adminBookingThunks';
import AdminMembershipChecker from '../AdminMembershipChecker';
import { setStep } from '../../../store/adminBookingSlice';

const StepPreview = () => {
  const dispatch = useDispatch();
  const { payment, status, client, isWalkIn } = useSelector(state => state.adminBooking);
  const { multipleAppointments } = useSelector(state => state.bookingSession);
  
  const bookingPreview = payment.preview;
  const selectedClient = client.selected;

  useEffect(() => {
    // Auto-fetch preview when entering this step
    dispatch(fetchBookingPreviewThunk());
  }, [dispatch]);

  const handleConfirm = () => {
    dispatch(createBookingThunk());
  };

  return (
    <div className="booking-step-preview">
      <h3> Confirm Booking</h3>
      
      <div className="preview-layout">
        <div className="preview-main">
          <div className="appointment-summary-card">
            <h4>Appointments ({multipleAppointments.length})</h4>
            {multipleAppointments.map(apt => (
              <div key={apt.id} className="summary-item">
                <span>{apt.service.name} with {apt.professional.name}</span>
                <span>AED {apt.price}</span>
              </div>
            ))}
          </div>

          {selectedClient && (
            <div className="benefits-section">
              <AdminMembershipChecker 
                clientId={selectedClient._id} 
                bookingPreview={bookingPreview}
              />
            </div>
          )}
        </div>

        <div className="payment-summary-panel">
          <h4>Payment Details</h4>
          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>AED {bookingPreview?.pricing?.subtotal || 0}</span>
            </div>
            {bookingPreview?.pricing?.membershipDiscount > 0 && (
              <div className="price-row discount">
                <span>Membership Discount</span>
                <span>-AED {bookingPreview.pricing.membershipDiscount}</span>
              </div>
            )}
            <div className="price-row total">
              <span>Grand Total</span>
              <span>AED {bookingPreview?.pricing?.finalAmount || 0}</span>
            </div>
          </div>
          
          <button 
            className="confirm-booking-btn" 
            onClick={handleConfirm}
            disabled={status.loading}
          >
            {status.loading ? 'Booking...' : 'Confirm & Complete'}
          </button>
        </div>
      </div>

      <div className="booking-modal-actions">
        <button className="booking-modal-back" onClick={() => dispatch(setStep(5))}>← Back</button>
      </div>
    </div>
  );
};

export default StepPreview;
