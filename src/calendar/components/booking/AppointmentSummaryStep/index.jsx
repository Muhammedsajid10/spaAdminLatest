/**
 * AppointmentSummaryStep Component
 * Step 4 of booking flow - Review and manage multiple appointments
 */
import React, { useMemo } from 'react';
import './AppointmentSummaryStep.css';

// Helper: Calculate totals
const calculateTotals = (appointments) => {
  return {
    count: appointments.length,
    duration: appointments.reduce((sum, apt) => sum + apt.service.duration, 0),
  };
};

// Helper: Get professional name
const getProfessionalName = (professional) => {
  return professional.user?.firstName || professional.name;
};

// Sub-component: Empty State
const EmptyState = () => (
  <div className="empty-service-selection">
    <div className="empty-service-message">
      <div className="empty-icon">➕</div>
      <h4>No services added yet</h4>
      <p>Select a service to begin. When you pick a time it will be added automatically.</p>
    </div>
  </div>
);

// Sub-component: Service Item
const ServiceItem = ({ appointment, index, onRemove }) => (
  <div className="service-session-item">
    <div className="service-number">{index + 1}</div>
    <div className="service-session-details">
      <div className="service-session-name">{appointment.service.name}</div>
      <div className="service-session-meta">
        {getProfessionalName(appointment.professional)} •
        {appointment.timeSlot} • {appointment.service.duration}min • AED {appointment.service.price}
      </div>
    </div>
    <button
      className="remove-service-btn"
      onClick={() => onRemove(appointment.id)}
      title="Remove this service"
      aria-label={`Remove ${appointment.service.name}`}
    >
      ✕
    </button>
  </div>
);

// Sub-component: Summary Totals
const SummaryTotals = ({ totalCount, totalDuration, totalPrice }) => (
  <div className="session-summary-totals">
    <div className="summary-total-row">
      <span>Total Services:</span>
      <span className="total-count">{totalCount}</span>
    </div>
    <div className="summary-total-row">
      <span>Total Duration:</span>
      <span className="total-duration">{totalDuration} minutes</span>
    </div>
    <div className="summary-total-row total-price-row">
      <span>Total Amount:</span>
      <span className="total-amount">AED {totalPrice}</span>
    </div>
  </div>
);

// Main Component
const AppointmentSummaryStep = ({
  // Data
  multipleAppointments,
  selectedService,
  selectedProfessional,
  selectedTimeSlot,
  bookingLoading,
  totalPrice,
  
  // Callbacks
  onRemoveAppointment,
  onAddAnother,
  onProceedToClient,
  onBack,
}) => {
  const hasAppointments = multipleAppointments.length > 0;
  const hasNoSelection = !selectedService || !selectedProfessional || !selectedTimeSlot;
  const showEmptyState = hasNoSelection && !hasAppointments;

  const totals = useMemo(() => calculateTotals(multipleAppointments), [multipleAppointments]);

  return (
    <>
      {/* Empty State */}
      {showEmptyState && <EmptyState />}

      {/* Appointments Summary */}
      {hasAppointments && (
        <div className="services-session-summary">
          <h4>Services in Your Booking Session ({totals.count})</h4>
          <div className="services-list">
            {multipleAppointments.map((apt, index) => (
              <ServiceItem
                key={apt.id}
                appointment={apt}
                index={index}
                onRemove={onRemoveAppointment}
              />
            ))}
          </div>

          <SummaryTotals
            totalCount={totals.count}
            totalDuration={totals.duration}
            totalPrice={totalPrice}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="multi-service-actions">
        <button
          className="add-another-service-btn"
          onClick={onAddAnother}
          disabled={bookingLoading}
        >
          Add Another Service
        </button>

        {hasAppointments ? (
          <button
            className="proceed-to-client-btn"
            onClick={onProceedToClient}
            disabled={bookingLoading}
          >
            Proceed to Client Information →
          </button>
        ) : (
          <div className="no-services-message">
            <p>Please add at least one service to proceed to client information.</p>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="booking-modal-actions">
        <button className="booking-modal-back" onClick={onBack}>
          ← Back to Time
        </button>
      </div>
    </>
  );
};

export default AppointmentSummaryStep;
