/**
 * BookingSummary Component
 * Step 5: Confirm booking details
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import PricingSummary from '../Shared/PricingSummary';
import { usePriceEditing } from '../../../hooks/calendar';
import { formatTime } from '../../../utils/calendar/timeUtils';

const BookingSummary = ({
  service,
  professional,
  timeSlot,
  date,
  client,
  multipleAppointments = [],
  onConfirm,
  onBack,
  onAddAnotherService
}) => {
  // Payment and notes state
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const {
    editingTotalPrice,
    tempTotalPrice,
    customTotalDiscount,
    startEditingTotalPrice,
    cancelEditingTotalPrice,
    saveEditedTotalPrice,
    clearCustomDiscount,
    updateTempPrice,
    calculateOriginalTotal,
    calculateFinalTotal
  } = usePriceEditing();

  // Use session appointments if available, otherwise create single appointment
  const appointments = multipleAppointments.length > 0 
    ? multipleAppointments 
    : service ? [{
        service,
        professional,
        time: timeSlot,
        date,
        price: service?.price,
        duration: service?.duration
      }] : [];

  console.log('📋 ========== BOOKING SUMMARY RENDER ==========');
  console.log('📋 multipleAppointments prop:', multipleAppointments);
  console.log('📋 multipleAppointments.length:', multipleAppointments.length);
  console.log('📋 Final appointments to display:', appointments.length);
  console.log('📋 Appointments:', appointments.map(a => ({
    id: a.id,
    service: a.serviceName || a.service?.name,
    professional: a.professionalName,
    time: a.time || a.timeSlot
  })));
  console.log('📋 ========== END BOOKING SUMMARY ==========');

  const originalTotal = calculateOriginalTotal(appointments);
  const finalTotal = calculateFinalTotal(appointments);

  const handleConfirm = () => {
    console.log('✅ Confirming booking with appointments:', appointments);
    onConfirm({
      customDiscount: customTotalDiscount,
      appointments,
      paymentMethod,
      notes
    });
  };

  // Helper to get professional name
  const getProfessionalName = (apt) => {
    if (apt.professionalName) return apt.professionalName;
    if (apt.professional?.user?.firstName) {
      return `${apt.professional.user.firstName} ${apt.professional.user.lastName || ''}`.trim();
    }
    if (apt.professional?.name) return apt.professional.name;
    return 'Staff Member';
  };

  // Helper to get service name
  const getServiceName = (apt) => {
    return apt.serviceName || apt.service?.name || 'Service';
  };

  // Helper to get price
  const getPrice = (apt) => {
    return apt.customPrice || apt.price || apt.service?.price || 0;
  };

  // Helper to get duration
  const getDuration = (apt) => {
    return apt.duration || apt.service?.duration || 30;
  };

  if (appointments.length === 0) {
    return (
      <div className="booking-summary">
        <h3>Booking Summary</h3>
        <div className="empty-state">
          <p>No services selected</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-summary">
      <h3>Booking Summary</h3>

      <div className="summary-section">
        <h4>Services ({appointments.length})</h4>
        {appointments.map((apt, idx) => (
          <div key={apt.id || idx} className="summary-item">
            <div className="item-header">
              <div className="item-name">{getServiceName(apt)}</div>
              <div className="item-price">${getPrice(apt).toFixed(2)}</div>
            </div>
            <div className="item-details">
              <span className="detail-professional">👤 {getProfessionalName(apt)}</span>
              <span className="detail-duration">⏱ {getDuration(apt)} min</span>
              {apt.time && <span className="detail-time">🕐 {formatTime(apt.time, false)}</span>}
            </div>
            {apt.discount > 0 && (
              <div className="item-discount">
                Discount: -${apt.discount.toFixed(2)}
              </div>
            )}
          </div>
        ))}
        
        {onAddAnotherService && (
          <button 
            className="add-another-service-btn"
            onClick={onAddAnotherService}
          >
            <Plus size={18} /> Add Another Service
          </button>
        )}
      </div>

      <div className="summary-section">
        <h4>Client</h4>
        <div className="summary-item">
          {client ? (
            <>
              <div className="item-name">
                {client.firstName || client.name} {client.lastName || ''}
              </div>
              <div className="item-details">
                {client.email && <span>📧 {client.email}</span>}
                {client.phone && <span>📱 {client.phone}</span>}
              </div>
            </>
          ) : (
            <div className="item-name">Walk-in Customer</div>
          )}
        </div>
      </div>

      <div className="summary-section">
        <h4>Date & Time</h4>
        <div className="summary-item">
          <div className="item-name">
            {date ? new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Not set'}
          </div>
          {appointments.length === 1 && appointments[0].time && (
            <div className="item-details">
              Starting at {formatTime(appointments[0].time, false)}
            </div>
          )}
          {appointments.length > 1 && (
            <div className="item-details">
              Multiple time slots (see services above)
            </div>
          )}
        </div>
      </div>

      <div className="summary-section">
        <PricingSummary
          originalTotal={originalTotal}
          customDiscount={customTotalDiscount}
          finalTotal={finalTotal}
          isEditing={editingTotalPrice}
          tempPrice={tempTotalPrice}
          onStartEdit={() => startEditingTotalPrice(finalTotal)}
          onCancelEdit={cancelEditingTotalPrice}
          onSaveEdit={() => saveEditedTotalPrice(originalTotal)}
          onUpdateTemp={updateTempPrice}
          onClearDiscount={clearCustomDiscount}
        />
      </div>

      <div className="summary-section">
        <h4>Payment Method</h4>
        <div className="payment-methods">
          <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span className="payment-label">💵 Cash</span>
          </label>
          <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span className="payment-label">💳 Card</span>
          </label>
          <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === 'online'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span className="payment-label">🌐 UPI/Online</span>
          </label>
        </div>
      </div>

      <div className="summary-section">
        <h4>Notes (Optional)</h4>
        <textarea
          className="booking-notes"
          placeholder="Add any special requests or notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
        <button className="primary-button" onClick={handleConfirm}>
          Confirm {appointments.length > 1 ? `${appointments.length} Bookings` : 'Booking'}
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
