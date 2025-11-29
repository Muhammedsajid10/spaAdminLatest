/**
 * ProfessionalSelection Component
 * Step 2 of Booking Flow
 */

import React, { useState, useMemo } from 'react';
import { Search, User, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import styles from './ProfessionalSelection.module.css';

const ProfessionalSelection = ({ onSelect, selectedProfessional, service }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get employees from Redux
  const employees = useSelector(state => state.employees?.list || []);
  const loading = useSelector(state => state.employees?.loading || false);

  // Filter employees who can perform the selected service
  // This logic might need adjustment based on your data structure
  const availableProfessionals = useMemo(() => {
    let filtered = employees;
    
    // Filter by service capability if needed
    // if (service) {
    //   filtered = filtered.filter(emp => emp.services.includes(service.id));
    // }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        (emp.name || emp.user?.firstName).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [employees, searchQuery, service]);

  if (loading) {
    return <div className={styles.loading}>Loading professionals...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          autoFocus
        />
      </div>

      <div className={styles.grid}>
        {/* "Any Professional" Option */}
        <div
          className={`${styles.card} ${!selectedProfessional ? styles.selected : ''}`}
          onClick={() => onSelect(null)} // null means "Any"
        >
          <div className={styles.avatarPlaceholder}>
            <Star size={24} />
          </div>
          <div className={styles.info}>
            <h4 className={styles.name}>Any Professional</h4>
            <p className={styles.role}>Maximum Availability</p>
          </div>
          <div className={styles.radioOuter}>
            {!selectedProfessional && <div className={styles.radioInner} />}
          </div>
        </div>

        {availableProfessionals.map(emp => {
          const empId = emp._id || emp.id;
          const isSelected = selectedProfessional?._id === empId || selectedProfessional?.id === empId;
          const name = emp.name || `${emp.user?.firstName} ${emp.user?.lastName}`;
          
          return (
            <div
              key={empId}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(emp)}
            >
              <div className={styles.avatar}>
                {emp.avatar ? (
                  <img src={emp.avatar} alt={name} />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className={styles.info}>
                <h4 className={styles.name}>{name}</h4>
                <p className={styles.role}>{emp.position || 'Staff'}</p>
              </div>
              <div className={styles.radioOuter}>
                {isSelected && <div className={styles.radioInner} />}
              </div>
            </div>
          );
        })}

        {availableProfessionals.length === 0 && (
          <div className={styles.noResults}>
            No professionals found
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalSelection;
