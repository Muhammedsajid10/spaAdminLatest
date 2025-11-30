import React from 'react';
import { getAppointmentColorByStatus } from '../../utils/ui';

export const AppointmentCard = ({
  block,
  employee,
  dayKey,
  setSelectedBookingForStatus,
  setShowBookingStatusModal,
  showBookingTooltipHandler,
  hideBookingTooltip
}) => {
  const { appointment, topPx, height } = block;

  const handleClick = (e) => {
    e.stopPropagation();
    const details = {
      ...appointment,
      employeeId: employee.id,
      employeeName: employee.name,
      slotTime: block.startSlot,
      date: dayKey,
      slotKey: `${dayKey}_${block.startSlot}`
    };
    setSelectedBookingForStatus(details);
    setShowBookingStatusModal(true);
  };

  const handleMouseEnter = (e) => {
    showBookingTooltipHandler(e, {
      client: appointment.client,
      service: appointment.service,
      time: appointment.startTime,
      professional: employee.name,
      status: appointment.status || 'Confirmed',
      notes: appointment.notes,
      price: appointment.price,
      finalAmount: appointment.finalAmount,
      totalAmount: appointment.totalAmount
    });
  };

  return (
    <div
      className="appointment-block fresha-style"
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        left: '4px',
        right: '4px',
        height: `${height}px`,
        backgroundColor: getAppointmentColorByStatus(appointment.status, appointment.color),
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        zIndex: 10,
        border: '2px solid rgba(255,255,255,0.2)',
        transition: 'all 0.2s ease',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideBookingTooltip}
    >
      <div className="appointment-client" style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
        {appointment.client}
      </div>
      <div className="appointment-service" style={{ color: '#fff', fontSize: 13, opacity: 0.95 }}>
        {appointment.service}
      </div>
      <div className="appointment-time" style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
        {appointment.startTime} - {appointment.endTime}
      </div>
    </div>
  );
};
