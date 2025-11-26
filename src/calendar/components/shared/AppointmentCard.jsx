/**
 * AppointmentCard Component
 * Displays a selected appointment with service details
 */
import React from 'react';
import { addMinutesToTime } from '../../utils';
import './AppointmentCard.css';

const AppointmentCard = ({ appointment, onRemove }) => {
  const start = appointment.timeSlot;
  const end = addMinutesToTime(appointment.timeSlot, appointment.duration);
  
  // Format duration
  const hours = Math.floor(appointment.duration / 60);
  const minutes = appointment.duration % 60;
  const durationText = hours > 0 
    ? `${hours}h${minutes ? ` ${minutes}m` : ''}` 
    : `${minutes}m`;

  // Get professional name
  const professionalName = appointment.professional.user?.firstName || appointment.professional.name;

  return (
    <div className="appointment-card">
      <div className="appointment-card-left-bar" />
      <div className="appointment-card-body">
        <div className="appointment-card-row1">
          <span className="appointment-service-name">{appointment.service.name}</span>
          <span className="appointment-price">AED {appointment.price}</span>
        </div>
        <div className="appointment-card-row2">
          <span className="appointment-time">{start}</span>
          <span className="appointment-dot">•</span>
          <span className="appointment-duration">{durationText}</span>
          <span className="appointment-dot">•</span>
          <span className="appointment-professional">{professionalName}</span>
        </div>
      </div>
      {onRemove && (
        <div className="appointment-card-actions">
          <button 
            className="appointment-delete-btn" 
            title="Remove" 
            onClick={() => onRemove(appointment.id)}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
