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
  multipleAppointments,
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

  const appointments = multipleAppointments.length > 0 
    ? multipleAppointments 
    : [{ service, professional, timeSlot, date, price: service?.price }];

  const originalTotal = calculateOriginalTotal(appointments);
  const finalTotal = calculateFinalTotal(appointments);

  const handleConfirm = () => {
    onConfirm({
      customDiscount: customTotalDiscount
    });
  };

  return (
    <div className="booking-summary">
      <h3>Booking Summary</h3>

      <div className="summary-section">
        <h4>Services</h4>
        {appointments.map((apt, idx) => (
          <div key={idx} className="summary-item">
            <div className="item-name">{apt.service?.name}</div>
            <div className="item-details">
              {apt.professional?.firstName} {apt.professional?.lastName} • {apt.service?.duration} min
            </div>
            <div className="item-price">${apt.service?.price}</div>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h4>Client</h4>
        <div className="summary-item">
          <div className="item-name">
            {client?.firstName} {client?.lastName}
          </div>
          <div className="item-details">
            {client?.email} | {client?.phone}
          </div>
        </div>
      </div>

      <div className="summary-section">
        <h4>Date & Time</h4>
        <div className="summary-item">
          <div className="item-name">
            {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="item-details">{timeSlot?.time}</div>
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
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
