/**
 * ServiceSelectionStep Component
 * Step 1 of booking flow - Service selection and appointment management
 */
import React, { useCallback } from 'react';
import { AppointmentCard, ServiceCatalogItem } from '../../shared';
import './ServiceSelectionStep.css';

// Helper: Format date for footer
const formatFooterDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
};

// Helper: Scroll to catalog
const scrollToCatalog = () => {
  setTimeout(() => {
    document.querySelector('.service-catalog-grid')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }, 50);
};

const ServiceSelectionStep = ({
  // Data
  availableServices,
  multipleAppointments,
  selectedService,
  bookingDefaults,
  currentDate,
  showServiceCatalog,
  totalPrice,
  
  // Callbacks
  onServiceSelect,
  onRemoveAppointment,
  onShowServiceCatalog,
  onCheckout,
  onCancel,
}) => {
  const hasAppointments = bookingDefaults?.professional || multipleAppointments.length > 0;
  const canCheckout = multipleAppointments.length > 0;

  const handleShowCatalog = useCallback(() => {
    onShowServiceCatalog(true);
    scrollToCatalog();
  }, [onShowServiceCatalog]);

  return (
    <>
      <h3 className="services-section-title">Services</h3>

      {/* Appointment Cards Section */}
      {hasAppointments && (
        <div className="service-cards-stack">
          {multipleAppointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onRemove={onRemoveAppointment}
            />
          ))}

          <button
            type="button"
            className="add-service-inline-btn"
            onClick={handleShowCatalog}
            title="Add another service"
          >
            Add service
          </button>
        </div>
      )}

      {/* Service Catalog Grid */}
      {showServiceCatalog && (
        <div className="service-catalog-grid pro-theme">
          {availableServices.map((service) => (
            <ServiceCatalogItem
              key={service._id}
              service={service}
              isSelected={selectedService?._id === service._id}
              onSelect={onServiceSelect}
            />
          ))}
        </div>
      )}

      {/* Footer Summary */}
      {bookingDefaults?.professional && (
        <div className="services-footer-summary">
          <div className="footer-left">
            <div className="footer-date-line">
              {formatFooterDate(currentDate)}
            </div>
            <div className="footer-total-line">
              <span className="footer-total-label">Total</span>
              <span className="footer-total-value">AED {totalPrice}</span>
            </div>
          </div>
          <div className="footer-actions">
            <button 
              type="button" 
              className="footer-btn secondary" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="footer-btn"
              disabled={!canCheckout}
              onClick={onCheckout}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceSelectionStep;
