/**
 * AppointmentTooltip Component
 * Shows appointment details on hover
 */

import React from 'react';
import './AppointmentTooltip.css';

const AppointmentTooltip = ({ appointment, position, isVisible }) => {
  if (!isVisible || !appointment) return null;

  const getClientName = () => {
    if (typeof appointment.client === 'string') return appointment.client;
    if (appointment.client?.firstName) {
      return `${appointment.client.firstName} ${appointment.client.lastName || ''}`.trim();
    }
    return 'Client';
  };

  const getServiceName = () => {
    if (typeof appointment.service === 'string') return appointment.service;
    return appointment.service?.name || 'Service';
  };

  const getProfessionalName = () => {
    if (typeof appointment.employee === 'string') return appointment.employee;
    if (appointment.professional?.user?.firstName) {
      return `${appointment.professional.user.firstName} ${appointment.professional.user.lastName || ''}`.trim();
    }
    if (appointment.employee?.user?.firstName) {
      return `${appointment.employee.user.firstName} ${appointment.employee.user.lastName || ''}`.trim();
    }
    return appointment.employee || appointment.professional || 'Staff';
  };

  const getStatusBadge = () => {
    const status = appointment.status || 'confirmed';
    const statusConfig = {
      confirmed: { label: 'Confirmed', color: '#10b981' },
      pending: { label: 'Pending', color: '#f59e0b' },
      completed: { label: 'Completed', color: '#6366f1' },
      cancelled: { label: 'Cancelled', color: '#ef4444' },
      'no-show': { label: 'No Show', color: '#94a3b8' }
    };

    const config = statusConfig[status] || statusConfig.confirmed;
    return (
      <span 
        className="tooltip-status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div 
      className="appointment-tooltip"
      style={{
        position: 'fixed',
        top: position?.y || 0,
        left: position?.x || 0,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px'
      }}
    >
      <div className="tooltip-header">
        <span className="tooltip-client">{getClientName()}</span>
        {getStatusBadge()}
      </div>
      
      <div className="tooltip-body">
        <div className="tooltip-row">
          <span className="tooltip-icon">💼</span>
          <span className="tooltip-text">{getServiceName()}</span>
        </div>
        
        <div className="tooltip-row">
          <span className="tooltip-icon">🕐</span>
          <span className="tooltip-text">
            {appointment.displayStartTime || appointment.startTime || appointment.time || 'TBD'}
            {appointment.displayEndTime && ` - ${appointment.displayEndTime}`}
          </span>
        </div>
        
        <div className="tooltip-row">
          <span className="tooltip-icon">👤</span>
          <span className="tooltip-text">{getProfessionalName()}</span>
        </div>
        
        {appointment.duration && (
          <div className="tooltip-row">
            <span className="tooltip-icon">⏱️</span>
            <span className="tooltip-text">{appointment.duration} minutes</span>
          </div>
        )}

        {appointment.notes && (
          <div className="tooltip-notes">
            <span className="tooltip-icon">📝</span>
            <span className="tooltip-text">{appointment.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentTooltip;
