/**
 * ServiceCatalogItem Component
 * Displays a service option in the catalog/selection grid
 */
import React from 'react';
import './ServiceCatalogItem.css';

const ServiceCatalogItem = ({ service, isSelected, onSelect }) => {
  return (
    <button
      className={`service-catalog-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(service)}
      type="button"
    >
      <span className="service-catalog-name">{service.name}</span>
      <span className="service-catalog-meta">
        {service.duration}m • AED {service.price}
      </span>
      <div className="service-catalog-badges">
        <span className="service-badge">{service.duration}m</span>
        <span className="service-badge">AED {service.price}</span>
      </div>
    </button>
  );
};

export default ServiceCatalogItem;
