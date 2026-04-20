import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectServiceThunk } from '@store/adminBookingThunks';
import { removeAppointmentFromSession, setShowServiceCatalog } from '@store/bookingSessionSlice';
import { setStep as setBookingStep } from '@store/adminBookingSlice';

const StepService = () => {
  const dispatch = useDispatch();
  const { available, selection, navigation } = useSelector(state => state.adminBooking);
  const { multipleAppointments, showServiceCatalog } = useSelector(state => state.bookingSession);
  const { currentDate } = useSelector(state => state.calendar);

  const availableServices = available.services;
  const selectedService = selection.service;
  const bookingDefaults = navigation.defaults;

  const handleServiceSelect = (service) => {
    dispatch(selectServiceThunk(service));
  };

  const getSessionSubtotal = () => {
    return multipleAppointments.reduce((sum, a) => sum + Number(a.price || 0), 0);
  };

  return (
    <div className="booking-step-service">
      <h3 className="services-section-title">Services</h3>

      {(bookingDefaults?.professional || multipleAppointments.length > 0) && (
        <div className="service-cards-stack">
          {multipleAppointments.map((apt) => (
            <div key={apt.id} className="service-card-mini">
              <div className="service-card-left-bar" />
              <div className="service-card-body">
                <div className="service-card-row1">
                  <span className="svc-name">{apt.service.name}</span>
                  <span className="svc-price">AED {apt.price}</span>
                </div>
                <div className="service-card-row2">
                  <span className="svc-time">{apt.timeSlot}</span>
                  <span className="svc-dot">•</span>
                  <span className="svc-duration">{Math.round(apt.duration / 60) || 1}h{apt.duration % 60 ? ` ${apt.duration % 60}m` : ''}</span>
                  <span className="svc-dot">•</span>
                  <span className="svc-prof">{apt.professional.user?.firstName || apt.professional.name}</span>
                </div>
              </div>
              <div className="service-card-actions">
                <button className="svc-delete-btn" title="Remove" onClick={() => dispatch(removeAppointmentFromSession(apt.id))}>
                  🗑️
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-service-inline-btn"
            onClick={() => { 
                dispatch(setShowServiceCatalog(true)); 
                setTimeout(() => document.querySelector('.service-catalog-grid')?.scrollIntoView({ behavior: 'smooth' }), 50); 
            }}
            title="Add another service"
          >
            Add service
          </button>
        </div>
      )}

      {showServiceCatalog && (
        <div className="service-catalog-grid pro-theme">
          {availableServices.map(service => {
            const isSelected = selectedService && selectedService._id === service._id;
            return (
              <button
                key={service._id}
                className={`service-catalog-item pro-theme ${isSelected ? 'selected' : ''}`}
                onClick={() => handleServiceSelect(service)}
                type="button"
              >
                <span className="catalog-name">{service.name}</span>
                <span className="catalog-meta">{service.duration}m • AED {service.price}</span>
                <div className="badge-row">
                  <span className="badge"> {service.duration}m</span>
                  <span className="badge"> AED {service.price}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {bookingDefaults?.professional && (
        <div className="services-footer-summary">
          <div className="footer-left">
            <div className="footer-date-line">
              {new Date(currentDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className="footer-total-line">
              <span className="footer-total-label">Total</span>
              <span className="footer-total-value">AED {getSessionSubtotal()}</span>
            </div>
          </div>
          <div className="footer-actions">
            <button type="button" className="footer-btn" disabled={multipleAppointments.length === 0} onClick={() => dispatch(setBookingStep(5))}>Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepService;
