/**
 * ServiceSelectionStep Component
 * Step 1 of booking flow - Service selection and appointment management
 */
import React from 'react';
import { AppointmentCard, ServiceCatalogItem } from '../../shared';
import './ServiceSelectionStep.css';

const ServiceSelectionStep = ({
  // Data
  availableServices,
  multipleAppointments,
  selectedService,
  bookingDefaults,
  currentDate,
  showServiceCatalog,
  
  // Calculated values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
  totalPrice,
  
  // Callbacks
  onServiceSelect,
  onRemoveAppointment,
  onShowServiceCatalog,                                                                                                                                                                                                                                         
  onCheckout,
  onCancel,
}) => {
  return (
    <>
      <h3 className="services-section-title">Services</h3>

      {/* APPOINTMENT CARDS */}
      {(bookingDefaults?.professional || multipleAppointments.length > 0) && (
        <div className="service-cards-stack">
          {multipleAppointments.map((apt, idx) => {                                                                                                                                     
            console.log('🎯 Rendering appointment card:', { id: apt.id, service: apt.service?.name, index: idx });
            return (
              <AppointmentCard
                key={apt.id}                                                                                    
                appointment={apt}
                onRemove={onRemoveAppointment}
              />
            );
          })}

          <button
            type="button"
            className="add-service-inline-btn"
            onClick={() => { 
              onShowServiceCatalog(true); 
              setTimeout(() => document.querySelector('.service-catalog-grid')?.scrollIntoView({ behavior: 'smooth' }), 50); 
            }}
            title="Add another service"
          >
            Add service
          </button>
        </div>
      )}

      {/* Service catalog list for selection */}
      {showServiceCatalog && (
        <div className="service-catalog-grid pro-theme">
          {availableServices.map(service => {
            const isSelected = selectedService && selectedService._id === service._id;
            return (
              <ServiceCatalogItem
                key={service._id}
                service={service}
                isSelected={isSelected}
                onSelect={onServiceSelect}
              />
            );
          })}
        </div>
      )}

      {/* Footer summary (total + actions) */}
      {bookingDefaults?.professional && (
        <div className="services-footer-summary">
          <div className="footer-left">
            <div className="footer-date-line">
              {currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className="footer-total-line">
              <span className="footer-total-label">Total</span>
              <span className="footer-total-value">AED {totalPrice}</span>
            </div>
          </div>
          <div className="footer-actions">
            <button type="button" className="footer-btn secondary" onClick={onCancel}>
              Cancel
            </button>
            <button 
              type="button" 
              className="footer-btn" 
              disabled={multipleAppointments.length === 0} 
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
