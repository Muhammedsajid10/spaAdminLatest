import { toMinutes, rangesOverlap } from './timeUtils';

export const detectConflict = (appointmentsForEmployee, startLabel, duration) => {
  const start=toMinutes(startLabel); const end=start+duration;
  return appointmentsForEmployee.some(ap=>{
    const apStart=toMinutes(ap.startTime); const apEnd=apStart + (ap.duration||30);
    return rangesOverlap(start,end,apStart,apEnd);
  });
};

export const buildSessionAccumulated = (sessionAppointments, dateKey) => {
  return sessionAppointments.filter(a=> a.dateKey===dateKey).map(a=> ({
    startTime:a.timeSlot,
    duration:a.service.duration
  }));
};
