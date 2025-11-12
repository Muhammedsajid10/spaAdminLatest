/**
 * ProfessionalSelection Component
 * Step 2: Select a professional
 */

import React from 'react';

const ProfessionalSelection = ({ 
  professionals, 
  selectedProfessional, 
  onSelectProfessional, 
  onNext, 
  onBack,
  service,
  date 
}) => {
  const handleSelect = (professional) => {
    onSelectProfessional(professional);
    onNext();
  };

  return (
    <div className="professional-selection">
      <h3>Select a Professional</h3>
      <div className="professional-grid">
        {professionals.map(prof => (
          <div
            key={prof._id}
            className={`professional-card ${selectedProfessional?._id === prof._id ? 'selected' : ''}`}
            onClick={() => handleSelect(prof)}
          >
            <div className="professional-avatar">
              {prof.avatar ? (
                <img src={prof.avatar} alt={prof.firstName} />
              ) : (
                <div className="avatar-placeholder">
                  {(prof.firstName || 'U')[0]}
                </div>
              )}
            </div>
            <div className="professional-name">
              {prof.firstName} {prof.lastName}
            </div>
            <div className="professional-position">{prof.position}</div>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default ProfessionalSelection;
