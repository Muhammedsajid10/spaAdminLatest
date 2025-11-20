/**
 * ServiceSelection Component
 * Step 1: Select a service - Old Calendar Style
 */

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

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
  const [showServiceList, setShowServiceList] = useState(true);
  
  // Track when multipleAppointments changes
  useEffect(() => {
    console.log('🔔 multipleAppointments changed! New count:', multipleAppointments.length);
    console.log('🔔 Appointments:', multipleAppointments.map(a => ({
      id: a.id,
      service: a.serviceName || a.service?.name
    })));
  }, [multipleAppointments]);
  
  console.log('🔍 ServiceSelection RENDER');
  console.log('🔍 ServiceSelection - multipleAppointments:', multipleAppointments.length);
  console.log('🔍 ServiceSelection - isGridBooking:', isGridBooking);
  console.log('🔍 ServiceSelection - appointments:', multipleAppointments.map(a => ({
    id: a.id,
    service: a.serviceName || a.service?.name
  })));
  
  const handleSelect = (service) => {
    console.log('🔍 Service selected:', service.name);
    onSelectService(service);
    onNext();
    
    // In grid booking mode, hide the service list after selection
    if (isGridBooking) {
      setShowServiceList(false);
    }
  };
  
  const handleAddServiceClick = () => {
    setShowServiceList(true);
  };

  // Calculate total
  const getTotalPrice = () => {
    return multipleAppointments.reduce((sum, apt) => sum + (apt.price || apt.service?.price || 0), 0);
  };

  if (!services || services.length === 0) {
    return (
      <div className="service-selection">
        <h3 className="service-section-title">Services</h3>
        <div className="empty-state-modal">
          <p>No services available. Please add services first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-selection">
      <h3 className="service-section-title">Services</h3>

      {/* Show stacked service cards when services are added */}
      {isGridBooking && multipleAppointments.length > 0 && (
        <div className="stacked-services-section">
          <div className="stacked-services-list">
            {multipleAppointments.map((apt, idx) => (
              <div key={apt.id} className="stacked-service-card">
                <div className="stacked-service-info">
                  <div className="stacked-service-name">{apt.serviceName || apt.service?.name}</div>
                  <div className="stacked-service-details">
                    {apt.timeSlot || apt.time} • {apt.duration}min • {apt.professionalName || apt.professional?.name}
                  </div>
                </div>
                <div className="stacked-service-price">AED {apt.price || apt.service?.price || 0}</div>
                {onRemoveAppointment && (
                  <button 
                    className="remove-service-btn"
                    onClick={() => onRemoveAppointment(apt.id)}
                    title="Remove service"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Add service button - toggle service list visibility */}
          <button className="add-service-button" onClick={handleAddServiceClick}>
            Add service
          </button>
        </div>
      )}

      {/* Service list - Show when: 
          1. Not in grid booking mode, OR
          2. In grid booking with no appointments yet, OR  
          3. In grid booking and "Add service" button was clicked
      */}
      {(!isGridBooking || multipleAppointments.length === 0 || showServiceList) && (
        <div className="service-grid">
          {services.map(service => (
            <div
              key={service._id || service.id}
              className="service-card"
              onClick={() => handleSelect(service)}
            >
              <div className="service-card-header">
                <div className="service-card-name">{service.name}</div>
                <div className="service-card-price">AED {service.price || 0}</div>
              </div>
              <div className="service-card-details">
                <span className="service-card-duration">{service.duration}min</span>
                <span className="service-card-tag">{service.duration}min</span>
                <span className="service-card-tag">AED {service.price || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;
