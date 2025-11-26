/**
 * TimeSlotCard Component
 * Displays a time slot option in the booking flow
 */
import React from 'react';
import { formatUTCToLocal } from '../../utils';
import './TimeSlotCard.css';

const TimeSlotCard = ({ slot, isSelected, serviceDuration, professionalName, onSelect }) => {
  const startTimeFormatted = formatUTCToLocal(slot.startTime, { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  
  const endTimeFormatted = formatUTCToLocal(slot.endTime, { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  return (
    <button
      className={`time-slot-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(slot)}
    >
      <div className="time-slot-card-time">
        {startTimeFormatted} - {endTimeFormatted}
      </div>
      <div className="time-slot-card-details">
        {serviceDuration} minutes with {professionalName}
      </div>
    </button>
  );
};

export default TimeSlotCard;
