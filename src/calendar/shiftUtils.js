import { toMinutes, minutesToLabel } from './timeUtils';

export const parseShiftsFromSchedule = (schedule) => {
  if(!schedule) return [];
  const result=[];
  const push=(s,e)=>{ if(!s||!e) return; result.push({startTime:s,endTime:e}); };
  if(typeof schedule==='string'){
    schedule.split(',').forEach(seg=>{
      const [a,b]=seg.split('-').map(s=>s.trim());
      if(a&&b){
        const norm=(t)=> t.includes(':')? t.padStart(5,'0'): `${String(t).padStart(2,'0')}:00`;
        push(norm(a),norm(b));
      }
    });
  } else if(Array.isArray(schedule)){
    schedule.forEach(s=>{
      if(typeof s==='string'){ const [a,b]=s.split('-'); if(a&&b) push(a.padStart(5,'0'),b.padStart(5,'0')); }
      else if(s && (s.startTime||s.start) && (s.endTime||s.end)) push(String(s.startTime||s.start).padStart(5,'0'), String(s.endTime||s.end).padStart(5,'0'));
    });
  } else if(schedule.shiftsData){
    schedule.shiftsData.forEach(p=> push(p.startTime,p.endTime));
    // Fallback to single start/end if defined on same object (common in workSchedule day objects)
    if(result.length===0 && schedule.startTime && schedule.endTime){
      push(String(schedule.startTime).trim().padStart(5,'0'), String(schedule.endTime).trim().padStart(5,'0'));
    }
    // Also parse legacy "shifts" string if present
    if(schedule.shifts && typeof schedule.shifts==='string'){
      schedule.shifts.split(',').forEach(seg=>{
        const [a,b]=seg.split('-').map(s=>s.trim());
        if(a&&b) push(a.padStart(5,'0'), b.padStart(5,'0'));
      });
    }
  } else if(schedule.periods){
    schedule.periods.forEach(p=> push(p.from,p.to));
  } else if(schedule && typeof schedule==='object') {
    // Generic object day (like workSchedule.monday = {isWorking,startTime,endTime,shifts})
    if(schedule.startTime && schedule.endTime){
      push(String(schedule.startTime).trim().padStart(5,'0'), String(schedule.endTime).trim().padStart(5,'0'));
    }
    if(schedule.shifts && typeof schedule.shifts==='string'){
      schedule.shifts.split(',').forEach(seg=>{
        const [a,b]=seg.split('-').map(s=>s.trim());
        if(a&&b) push(a.padStart(5,'0'), b.padStart(5,'0'));
      });
    }
  }
  // dedupe & sort
  const seen=new Set();
  return result.filter(s=>{
    const key=`${s.startTime}-${s.endTime}`;
    if(seen.has(key)) return false; seen.add(key); return true;
  }).sort((a,b)=> toMinutes(a.startTime)-toMinutes(b.startTime));
};

export const getEmployeeShiftHours = (employee,date)=>{
  if(!employee?.workSchedule) return [];
  const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayName=days[date.getDay()];
  const schedule=employee.workSchedule[dayName];
  if(!schedule) return [];
  return parseShiftsFromSchedule(schedule).map(s=>({startTime:s.startTime,endTime:s.endTime}));
};

export const hasShiftOnDate = (employee,date) => getEmployeeShiftHours(employee,date).length>0;

export const withinAnyShift = (label, shifts)=>{
  const m=toMinutes(label);
  return shifts.some(sh=> m>=toMinutes(sh.startTime) && m<toMinutes(sh.endTime));
};
