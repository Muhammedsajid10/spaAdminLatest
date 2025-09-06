// Centralized date helpers used across calendar components
export const formatDateLocal = (d) => {
  if(!(d instanceof Date)) d = new Date(d);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};

export const localDateKey = (date) => formatDateLocal(date instanceof Date? date : new Date(date));

export const getDayName = (date) => {
  const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  return days[(date instanceof Date? date : new Date(date)).getDay()];
};

// Appointment layout computation extracted from monolith
export const computeAppointmentLayout = (
  { startTime, endTime, durationMinutes },
  timeSlotsOrFirstVisible = '00:00',
  slotInterval = 30,
  slotHeightPx = 80
) => {
  const parseHM = (t='00:00') => {
    if(!t) return 0;
    if(typeof t!=='string') return 0;
    if(t.includes('T')||t.includes('-')||t.endsWith('Z')) { 
      const d=new Date(t); 
      return d.getUTCHours()*60+d.getUTCMinutes(); 
    }
    const [hh='0',mm='0']=t.split(':');
    return (Number(hh)||0)*60 + (Number(mm)||0);
  };
  const minutesToLabel=(mins)=>{ mins=((mins%(24*60))+(24*60))%(24*60); const h=Math.floor(mins/60).toString().padStart(2,'0'); const m=(mins%60).toString().padStart(2,'0'); return `${h}:${m}`; };
  const startM=parseHM(startTime);
  let endM = endTime? parseHM(endTime) : startM + (Number(durationMinutes)||slotInterval);
  if(endM<=startM) endM = startM + (Number(durationMinutes)||slotInterval);
  const durationMins=Math.max(1,endM-startM);
  let refM;
  if(Array.isArray(timeSlotsOrFirstVisible)){
    const slotMs=timeSlotsOrFirstVisible.map(s=>parseHM(s)).filter(Number.isFinite).sort((a,b)=>a-b);
    const candidate=slotMs.slice().reverse().find(m=>m<=startM);
    refM = (typeof candidate==='number')? candidate : (slotMs.length? slotMs[0]:0);
  } else refM = parseHM(timeSlotsOrFirstVisible||'00:00');
  if(!Number.isFinite(refM)) refM=0;
  const topPx=Math.max(0, ((startM-refM)/slotInterval)*slotHeightPx);
  // Use proportional height (allows 45m = 1.5 * slotHeight) while keeping a sensible minimum
  const proportionalHeight = (durationMins/slotInterval)*slotHeightPx;
  const heightPx=Math.max(proportionalHeight, slotHeightPx*0.5);
  const coveredSlots=[];
  for(let s=startM; s<endM; s+=slotInterval){ if(s>=startM && s<endM) coveredSlots.push(minutesToLabel(s)); }
  return { topPx, heightPx, durationMins, startLabel:minutesToLabel(startM), endLabel:minutesToLabel(endM), coveredSlots };
};
