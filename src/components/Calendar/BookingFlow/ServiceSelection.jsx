/**
 * ServiceSelection Component
 * Step 1: Select a service
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ServiceSelection = ({ 
  services, 
  selectedService, 
  onSelectService, 
  onNext,
  multipleAppointments = [],
  onRemoveAppointment,
  isGridBooking = false,
  onProceedToClient
}) => {
  console.log('🔍 ServiceSelection - services:', services);
  console.log('🔍 ServiceSelection - services count:', services?.length);
  console.log('🔍 ServiceSelection - multipleAppointments:', multipleAppointments.length);
  console.log('🔍 ServiceSelection - isGridBooking:', isGridBooking);
  
  const handleSelect = (service) => {
    console.log('🔍 Service selected:', service.name);
    onSelectService(service);
    // In grid booking, onNext will add to session and stay on step 1
    // In manual booking, onNext will advance to professional selection
    onNext();
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Other Services';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  // Calculate total
  const getTotalPrice = () => {
    return multipleAppointments.reduce((sum, apt) => sum + (apt.price || apt.service?.price || 0), 0);
  };

  if (!services || services.length === 0) {
    return (
      <div className="service-selection">
        <div className="service-selection-header">
          <h2>Select a service</h2>
        </div>
        <div className="empty-state-modal">
          <p>No services available. Please add services first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-selection">
      <div className="service-selection-header">
        <h2>Select a service</h2>
        <div className="service-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search by service name" />
        </div>
      </div>

      {/* Show stacked service cards for grid booking */}
      {isGridBooking && multipleAppointments.length > 0 && (
        <div className="stacked-services-section">
          <h3 className="stacked-services-title">Selected Services ({multipleAppointments.length})</h3>
          <div className="stacked-services-list">
            {multipleAppointments.map((apt, idx) => (
              <div key={apt.id} className="stacked-service-card">
                <div className="stacked-service-number">{idx + 1}</div>
                <div className="stacked-service-info">
                  <div className="stacked-service-name">{apt.serviceName || apt.service?.name}</div>
                  <div className="stacked-service-details">
                    <span className="detail-item">⏰ {apt.timeSlot || apt.time}</span>
                    <span className="detail-item">⏱ {apt.duration}min</span>
                    <span className="detail-item">👤 {apt.professionalName || apt.professional?.name}</span>
                  </div>
                </div>
                <div className="stacked-service-price">AED {apt.price || apt.service?.price || 0}</div>
                {onRemoveAppointment && (
                  <button 
                    className="remove-service-btn"
                    onClick={() => onRemoveAppointment(apt.id)}
                    title="Remove service"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="stacked-services-footer">
            <div className="stacked-total">
              <span>Total:</span>
              <span className="total-amount">AED {getTotalPrice()}</span>
            </div>
            {onProceedToClient && (
              <button 
                className="proceed-checkout-btn"
                onClick={onProceedToClient}
              >
                Proceed to Checkout →
              </button>
            )}
          </div>
        </div>
      )}

      <div className="service-categories">
        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className="service-category">
            <div className="service-category-header">
              <h3>{category}</h3>
              <span className="service-count">{categoryServices.length}</span>
            </div>
            <div className="service-list">
              {categoryServices.map(service => (
                <div
                  key={service._id || service.id}
                  className={`service-item ${
                    selectedService?._id === service._id ? 'selected' : ''
                  }`}
                  onClick={() => handleSelect(service)}
                >
                  <div className="service-item-info">
                    <div className="service-item-name">{service.name}</div>
                    <div className="service-item-duration">
                      {service.type || 'Service'} {service.duration && `• ${service.duration}min`}
                    </div>
                  </div>
                  <div className="service-item-price">
                    AED {service.price || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelection;
