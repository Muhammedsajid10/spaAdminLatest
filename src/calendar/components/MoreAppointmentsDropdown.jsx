import React from 'react';

export const MoreAppointmentsDropdown = ({ visible, appointments, dayDate, position, positionedAbove, onClose }) => {
  if(!visible) return null;
  return (
    <>
      <div className="more-appointments-backdrop" onClick={onClose}></div>
      <div className={`more-appointments-dropdown ${positionedAbove ? 'positioned-above' : ''}`} style={{ top:position.top, left:position.left }}>
        <div className="more-appointments-dropdown-header">
          <span>All Appointments</span>
          <span className="more-appointments-date">{dayDate?.toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
        </div>
        <div className="more-appointments-dropdown-list">
          {appointments.map((app,i)=> (
            <div key={i} className="more-appointment-dropdown-item">
              <div className="more-appointment-color" style={{ backgroundColor: app.color }}></div>
              <div className="more-appointment-details">
                <div className="more-appointment-client">{app.client}</div>
                <div className="more-appointment-service">{app.service}</div>
              </div>
              <div className="more-appointment-time">{app.time || 'Time TBD'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
