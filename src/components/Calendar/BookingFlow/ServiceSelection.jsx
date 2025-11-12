/**
 * ServiceSelection Component
 * Step 1: Select a service
 */

import React from 'react';

const ServiceSelection = ({ services, selectedService, onSelectService, onNext }) => {
  const handleSelect = (service) => {
    onSelectService(service);
    onNext();
  };

  return (
    <div className="service-selection">
      <h3>Select a Service</h3>
      <div className="service-grid">
        {services.map(service => (
          <div
            key={service._id}
            className={`service-card ${selectedService?._id === service._id ? 'selected' : ''}`}
            onClick={() => handleSelect(service)}
          >
            <div className="service-name">{service.name}</div>
            <div className="service-duration">{service.duration} min</div>
            <div className="service-price">${service.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelection;
