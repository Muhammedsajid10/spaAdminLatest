// Pure time helpers extracted from Selectcalander.jsx

export const toMinutes = (hhmm='00:00') => {
  const [h='0',m='0']=String(hhmm).split(':');
  return (parseInt(h,10)||0)*60 + (parseInt(m,10)||0);
};

export const minutesToLabel = (mins=0) => {
  mins=((mins%(24*60))+(24*60))%(24*60);
  const h=Math.floor(mins/60).toString().padStart(2,'0');
  const m=(mins%60).toString().padStart(2,'0');
  return `${h}:${m}`;
};

export const addMinutesLabel = (hhmm, add) => minutesToLabel(toMinutes(hhmm)+add);

export const rangesOverlap = (aStart,aEnd,bStart,bEnd) => aStart < bEnd && bStart < aEnd;

export const generateRangeSlots = (startLabel,endLabel,interval=30) => {
  const out=[]; let cur=toMinutes(startLabel); const end=toMinutes(endLabel);
  while(cur<=end){ out.push(minutesToLabel(cur)); cur+=interval; }
  return out;
};
