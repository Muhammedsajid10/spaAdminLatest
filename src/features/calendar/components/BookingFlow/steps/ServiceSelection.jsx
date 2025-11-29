/**
 * ServiceSelection Component
 * Step 1 of Booking Flow
 */

import React, { useState, useMemo } from 'react';
import { Search, Clock, DollarSign } from 'lucide-react';
import { useSelector } from 'react-redux';
import styles from './ServiceSelection.module.css';

const ServiceSelection = ({ onSelect, selectedService }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get services from Redux
  // Assuming state structure based on Selectcalander.jsx usage
  const services = useSelector(state => state.services?.list || []);
  const loading = useSelector(state => state.services?.loading || false);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const query = searchQuery.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(query) ||
      service.category?.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups = {};
    filteredServices.forEach(service => {
      const category = service.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });
    return groups;
  }, [filteredServices]);

  if (loading) {
    return <div className={styles.loading}>Loading services...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          autoFocus
        />
      </div>

      <div className={styles.listContainer}>
        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.servicesGrid}>
              {categoryServices.map(service => (
                <div
                  key={service._id || service.id}
                  className={`${styles.serviceCard} ${
                    selectedService?._id === service._id ? styles.selected : ''
                  }`}
                  onClick={() => onSelect(service)}
                >
                  <div className={styles.serviceInfo}>
                    <h4 className={styles.serviceName}>{service.name}</h4>
                    <div className={styles.serviceMeta}>
                      <span className={styles.metaItem}>
                        <Clock size={14} />
                        {service.duration} min
                      </span>
                      <span className={styles.metaItem}>
                        <DollarSign size={14} />
                        {service.price}
                      </span>
                    </div>
                  </div>
                  <div className={styles.selectionIndicator}>
                    <div className={styles.radioOuter}>
                      {selectedService?._id === service._id && (
                        <div className={styles.radioInner} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className={styles.noResults}>
            No services found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;
