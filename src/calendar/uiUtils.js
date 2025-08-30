// UI helper functions extracted from Selectcalander

export const minutesToLabel = (mins)=>{
  mins=((mins%(24*60))+(24*60))%(24*60);
  const h=Math.floor(mins/60).toString().padStart(2,'0');
  const m=(mins%60).toString().padStart(2,'0');
  return `${h}:${m}`;
};

export const getAppointmentColorByStatus = (status, fallback='#6366f1') => {
  if(!status) return fallback;
  const s=status.toLowerCase();
  if(s.includes('confirm')) return '#97a79dff';
  if(s.includes('cancel')) return '#dc2626';
  if(s.includes('pending')) return '#f59e0b';
  return fallback;
};
