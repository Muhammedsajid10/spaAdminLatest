import React from 'react';

export const BookingTooltip = ({ data, position, onClose }) => {
  if(!data) return null;
  
  // Display finalAmount if available (custom price), otherwise show regular price
  const displayPrice = data.finalAmount ?? data.price ?? data.totalAmount;
  const hasCustomPrice = data.finalAmount !== undefined && data.finalAmount !== data.price;
  
  return (
    <div className="booking-tooltip" style={{ position:'fixed', top:position?.y, left:position?.x, zIndex:10000, background:'#333', color:'#fff', padding:'8px 12px', borderRadius:'6px', fontSize:'12px', maxWidth:'220px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', pointerEvents:'none', transform:'translate(-50%, -100%)', marginTop:'-8px' }}>
      <div style={{ fontWeight:'bold', marginBottom:4 }}>{data.client}</div>
      <div style={{ marginBottom:2 }}>{data.service}</div>
      <div style={{ marginBottom:2 }}>Time: {data.time || 'TBD'}</div>
      <div style={{ marginBottom:2 }}>Professional: {data.professional}</div>
      {displayPrice !== undefined && (
        <div style={{ marginBottom:2, fontWeight: hasCustomPrice ? 'bold' : 'normal' }}>
          {hasCustomPrice && <span style={{ textDecoration: 'line-through', marginRight: 6, opacity: 0.6 }}>AED {data.price}</span>}
          <span style={{ color: hasCustomPrice ? '#4ade80' : '#fff' }}>AED {Number(displayPrice).toFixed(2)}</span>
        </div>
      )}
      <div style={{ fontSize:11, color:'#ccc' }}>Status: {data.status}</div>
      {data.notes && <div style={{ fontSize:11, color:'#ccc', marginTop:4 }}>Notes: {data.notes}</div>}
    </div>
  );
};
