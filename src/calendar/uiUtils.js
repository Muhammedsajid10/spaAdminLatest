// UI helper functions extracted from Selectcalander

export const minutesToLabel = (mins)=>{
  mins=((mins%(24*60))+(24*60))%(24*60);
  const h=Math.floor(mins/60).toString().padStart(2,'0');
  const m=(mins%60).toString().padStart(2,'0');
  return `${h}:${m}`;
};

export const getAppointmentColorByStatus = (status, fallback='#6366f1') => {
  if(!status) return fallback;
  const s = status.toLowerCase();
  // Define a stable palette (WCAG mindful contrast on light background)
  const map = {
    booked: '#6366f1',        // Indigo
    pending: '#6366f1',       // Treat legacy pending same as booked
    confirmed: '#0ea5e9',     // Sky blue
    arrived: '#0891b2',       // Teal / darker cyan
    started: '#f59e0b',       // Amber indicates in-progress
    'in-progress': '#f59e0b', // Legacy synonym
    completed: '#16a34a',     // Green
    cancelled: '#dc2626',     // Red
    'no-show': '#9333ea',     // Purple distinct
    rescheduled: '#fb7185'    // Rose
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
