import React from 'react';

export const TimeHoverTooltip = ({ data, position }) => {
  if(!data) return null;
  
  const isRestricted = data.isRestricted;
  const bgColor = isRestricted ? '#dc2626' : '#1f2937';
  const borderColor = isRestricted ? '#ef4444' : '#374151';
  
  return (
    <div className="time-hover-tooltip" style={{ position:'fixed', top:position?.y, left:position?.x, zIndex:10000, background:bgColor, color:'#fff', padding:'8px 12px', borderRadius:'6px', fontSize:'12px', maxWidth:'220px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', pointerEvents:'none', transform:'translate(-50%, -100%)', marginTop:'-8px', border:`1px solid ${borderColor}` }}>
      <div style={{ fontWeight:'bold', marginBottom:4 }}>Slot: {data.timeSlot}</div>
      {isRestricted && data.restrictionMessage && (
        <div style={{ marginBottom:4, color:'#fecaca', fontWeight:'600', fontSize:'11px', borderTop:'1px solid #ef4444', paddingTop:4 }}>
          ⚠️ {data.restrictionMessage}
        </div>
      )}
      <div style={{ marginBottom:2, color:'#e5e7eb' }}>Current Time: {data.currentTime}</div>
      <div style={{ fontSize:11, color:'#9ca3af' }}>{data.date}</div>
    </div>
  );
};
