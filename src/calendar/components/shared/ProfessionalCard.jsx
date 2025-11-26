/**
 * ProfessionalCard Component
 * Displays a professional option in the booking flow
 */
import React from 'react';
import './ProfessionalCard.css';

const ProfessionalCard = ({ 
  professional, 
  isSelected, 
  hasConflicts, 
  shiftInfo, 
  onSelect 
}) => {
  return (
    <button
      className={`professional-card ${isSelected ? 'selected' : ''} ${hasConflicts ? 'has-conflicts' : ''}`}
      onClick={() => onSelect(professional)}
    >
      <div className="professional-card-name">
        {professional.name}
        <span className="professional-shift-indicator">
          Available
        </span>
      </div>
      <div className="professional-card-position">
        {professional.position}
      </div>
    </button>
  );
};

export default ProfessionalCard;
