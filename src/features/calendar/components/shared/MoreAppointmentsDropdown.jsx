import React from 'react';

export const MoreAppointmentsDropdown = ({ visible = true, appointments, date, position, positionedAbove, onClose }) => {
  if(!visible) return null;
  return (
    <>
      <div className="more-appointments-backdrop" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998 }}></div>
      <div className={`more-appointments-dropdown ${positionedAbove ? 'positioned-above' : ''}`} style={{ top:position.top, left:position.left, position: 'absolute', zIndex: 9999, background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '300px', maxHeight: '300px', overflowY: 'auto' }}>
        <div className="more-appointments-dropdown-header" style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          <span>All Appointments</span>
          <span className="more-appointments-date" style={{ fontSize: '12px', color: '#6b7280' }}>{date?.toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
        </div>
        <div className="more-appointments-dropdown-list" style={{ padding: '8px' }}>
          {appointments.map((app,i)=> (
            <div key={i} className="more-appointment-dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div className="more-appointment-color" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: app.color, marginRight: '10px' }}></div>
              <div className="more-appointment-details" style={{ flex: 1 }}>
                <div className="more-appointment-client" style={{ fontSize: '13px', fontWeight: 500 }}>{app.client}</div>
                <div className="more-appointment-service" style={{ fontSize: '11px', color: '#6b7280' }}>{app.service}</div>
              </div>
              <div className="more-appointment-time" style={{ fontSize: '11px', color: '#9ca3af' }}>{app.time || 'Time TBD'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
