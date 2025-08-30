import React from 'react';
import './ProfessionalList.css';

const ProfessionalList = ({
  availableProfessionals,
  currentDate,
  multipleAppointments,
  selectedProfessional,
  setSelectedProfessional,
  setBookingStep,
  selectedService,
  appointments,
  getValidTimeSlotsForProfessional
}) => {
  return (
    <>
      <h3 className={styles.heading}>Choose Your Professional</h3>
      {availableProfessionals.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No professionals are available for this service on {currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}.</p>
          <p>Please select a different date or service.</p>
        </div>
      ) : (
        <div className={styles.professionalList}>
          {availableProfessionals.map(prof => {
            const sessionConflicts = multipleAppointments.filter(apt =>
              apt.professional._id === prof._id &&
              formatDateLocal(new Date(apt.date)) === formatDateLocal(currentDate)
            );

            const hasConflict = sessionConflicts.length > 0;

            return (
              <button
                key={prof._id}
                className={`${styles.professionalItem} ${selectedProfessional && selectedProfessional._id === prof._id ? styles.selected : ''} ${hasConflict ? styles.hasConflicts : ''}`}
                onClick={() => {
                  setSelectedProfessional(prof);
                  setBookingStep(3);
                  // These functions (getValidTimeSlotsForProfessional, formatDateLocal) are not provided,
                  // so they are assumed to be available in the parent component.
                  const slots = getValidTimeSlotsForProfessional(prof, currentDate, selectedService.duration, appointments);
                  // The setAvailableTimeSlots state setter is not in this component,
                  // so it would need to be handled in the parent.
                  // For example, by passing it as a prop or moving this logic up.
                  // For this minimal component, let's assume the parent handles it.
                }}
              >
                <div className={styles.professionalName}>
                  {prof.name}
                  <span className={hasConflict ? styles.conflictIndicator : styles.availableIndicator}>
                    {hasConflict ? 'Busy' : 'Available'}
                  </span>
                </div>
                <div className={styles.professionalPosition}>
                  {prof.position}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className={styles.actions}>
        <button className={styles.backButton} onClick={() => setBookingStep(1)}>← Back</button>
      </div>
    </>
  );
};

// This is a dummy function. In your real code, you would import it.
const formatDateLocal = (date) => date.toISOString().split('T')[0];

export default ProfessionalList;