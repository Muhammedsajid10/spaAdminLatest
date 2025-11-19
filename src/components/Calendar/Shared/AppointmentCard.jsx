/**
 * AppointmentCard Component
 * Displays a single appointment in the calendar grid with hover tooltip
 */

import React, { useState } from 'react';
import { getAppointmentColorByStatus } from '../../../utils/calendar';
import AppointmentTooltip from './AppointmentTooltip';

const AppointmentCard = ({ appointment, height, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const backgroundColor = appointment.color || getAppointmentColorByStatus(appointment.status);
  
  const getStatusClass = () => {
    const status = appointment.status?.toLowerCase() || 'pending';
    return `status-${status}`;
  };

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div
        className={`appointment-card ${getStatusClass()}`}
        style={{
          height: `${height}px`,
          backgroundColor,
          minHeight: '40px'
        }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="appointment-content">
          <div className="appointment-time">
            {appointment.time || appointment.displayStartTime || new Date(appointment.startTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          <div className="appointment-service">
            {appointment.serviceName || appointment.service?.name || appointment.service || 'Service'}
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

      <AppointmentTooltip 
        appointment={appointment}
        position={tooltipPosition}
        isVisible={showTooltip}
      />
    </>
  );
};

export default AppointmentCard;
