import React from 'react';

export const BookingTooltip = ({ tooltipData, position }) => {
  if(!tooltipData) return null;
  return (
    <div className="booking-tooltip" style={{ position:'fixed', top:position?.y, left:position?.x, zIndex:10000, background:'#333', color:'#fff', padding:'8px 12px', borderRadius:'6px', fontSize:'12px', maxWidth:'200px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', pointerEvents:'none', transform:'translate(-50%, -100%)', marginTop:'-8px' }}>
      <div style={{ fontWeight:'bold', marginBottom:4 }}>{tooltipData.client}</div>
      <div style={{ marginBottom:2 }}>{tooltipData.service}</div>
      <div style={{ marginBottom:2 }}>Time: {tooltipData.time || 'TBD'}</div>
      <div style={{ marginBottom:2 }}>Professional: {tooltipData.professional}</div>
      <div style={{ fontSize:11, color:'#ccc' }}>Status: {tooltipData.status}</div>
      {tooltipData.notes && <div style={{ fontSize:11, color:'#ccc', marginTop:4 }}>Notes: {tooltipData.notes}</div>}
    </div>
  );
};
