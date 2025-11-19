/**
 * BookingSummary Component
 * Step 5: Confirm booking details
 */

import React from 'react';
import PricingSummary from '../Shared/PricingSummary';
import { usePriceEditing } from '../../../hooks/calendar';

const BookingSummary = ({
  service,
  professional,
  timeSlot,
  date,
  client,
  multipleAppointments = [],
  onConfirm,
  onBack
}) => {
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

  console.log('📋 BookingSummary appointments:', appointments);

  const originalTotal = calculateOriginalTotal(appointments);
  const finalTotal = calculateFinalTotal(appointments);

  const handleConfirm = () => {
    console.log('✅ Confirming booking with appointments:', appointments);
    onConfirm({
      customDiscount: customTotalDiscount,
      appointments
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
              {apt.time && <span className="detail-time">🕐 {apt.time}</span>}
            </div>
            {apt.discount > 0 && (
              <div className="item-discount">
                Discount: -${apt.discount.toFixed(2)}
              </div>
            )}
          </div>
        ))}
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
              Starting at {appointments[0].time}
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
