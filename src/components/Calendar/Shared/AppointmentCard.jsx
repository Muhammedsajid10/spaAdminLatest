/**
 * AppointmentCard Component
 * Displays a single appointment in the calendar grid
 */

import React from 'react';
import { getAppointmentColorByStatus } from '../../../utils/calendar';

const AppointmentCard = ({ appointment, height, onClick }) => {
  const backgroundColor = appointment.color || getAppointmentColorByStatus(appointment.status);
  
  const getStatusClass = () => {
    const status = appointment.status?.toLowerCase() || 'pending';
    return `status-${status}`;
  };

  return (
    <div
      className={`appointment-card ${getStatusClass()}`}
      style={{
        height: `${height}px`,
        backgroundColor,
        minHeight: '40px'
      }}
      onClick={onClick}
    >
      <div className="appointment-content">
        <div className="appointment-time">
          {appointment.time || new Date(appointment.startTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        <div className="appointment-service">
          {appointment.serviceName || appointment.service?.name || 'Service'}
        </div>
        <div className="appointment-client">
          {appointment.clientName || appointment.client || 'Client'}
        </div>
        {appointment.duration && (
          <div className="appointment-duration">
            {appointment.duration} min
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
