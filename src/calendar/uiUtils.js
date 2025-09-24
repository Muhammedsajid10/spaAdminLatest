// UI helper functions extracted from Selectcalander

export const minutesToLabel = (mins)=>{
  mins=((mins%(24*60))+(24*60))%(24*60);
  const h=Math.floor(mins/60).toString().padStart(2,'0');
  const m=(mins%60).toString().padStart(2,'0');
  return `${h}:${m}`;
};

export const getAppointmentColorByStatus = (status, fallback='#e0e7ff') => {
  if(!status) return fallback;
  const s = status.toLowerCase();
  // Define a light palette for appointment cards
  const map = {
    booked: '#e0e7ff',        // Light indigo
    pending: '#e0e7ff',       // Light indigo
    confirmed: '#e0f2fe',     // Light sky blue
    arrived: '#cffafe',       // Light cyan
    started: '#fef3c7',       // Light amber
    'in-progress': '#fef3c7', // Light amber
    completed: '#dcfce7',     // Light green
    cancelled: '#fee2e2',     // Light red
    'no-show': '#f3e8ff',     // Light purple
    rescheduled: '#fce7f3'    // Light rose
  };
  // fuzzy contains fallbacks
  if(map[s]) return map[s];
  if(s.includes('confirm')) return map.confirmed;
  if(s.includes('cancel')) return map.cancelled;
  if(s.includes('progress') || s.includes('start')) return map.started;
  if(s.includes('complete')) return map.completed;
  if(s.includes('show')) return map['no-show'];
  if(s.includes('book')) return map.booked;
  return fallback;
};
