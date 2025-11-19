/**
 * ServiceSelection Component
 * Step 1: Select a service
 */

import React from 'react';

const ServiceSelection = ({ services, selectedService, onSelectService, onNext }) => {
  console.log('🔍 ServiceSelection - services:', services);
  console.log('🔍 ServiceSelection - services count:', services?.length);
  
  const handleSelect = (service) => {
    onSelectService(service);
    onNext();
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Other Services';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

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
