import React, { useMemo } from 'react';
import { localDateKey, computeAppointmentLayout } from '../../calendar/dateUtils';
import { hasShiftOnDate, getEmployeeShiftHours } from '../../calendar/shiftUtils';
import { getAppointmentColorByStatus } from '../../calendar/uiUtils';

export const StaffColumn = ({
  employee,
  timeSlots,
  appointments,
  currentDate,
  isTimeSlotUnavailable,
  handleTimeSlotClick,
  showBookingTooltipHandler,
  hideBookingTooltip,
  showTimeHoverHandler,
  hideTimeHover,
  setSelectedBookingForStatus,
  setShowBookingStatusModal
}) => {
  // Normalize employee id (backend might use _id or employeeId)
  const employeeId = employee.id || employee._id || employee.employeeId;
  const timeSlotHeightPx =  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--time-slot-height')) || 20;
  const dayKey = localDateKey(currentDate);
  const hasShift = hasShiftOnDate(employee, currentDate);
  const shiftHours = getEmployeeShiftHours(employee, currentDate);
  const hasValidShifts = shiftHours.length > 0;

  const { appointmentBlocks, processedSlots } = useMemo(()=>{
    const employeeAppointments = appointments[employeeId] || {};
    const appointmentBlocks=[]; const processed=new Set();
    const firstVisibleSlot = (timeSlots && timeSlots.length)? timeSlots[0] : '00:00';
    
    Object.entries(employeeAppointments).forEach(([slotKey, appointment])=>{
      if(!slotKey.startsWith(dayKey) || processed.has(slotKey)) return;
      if(!appointment.isMainSlot) return;
      const durationMinutes = Number(appointment.duration)||30;
      const layout = computeAppointmentLayout({
        startTime: appointment.startTime || appointment.timeSlot,
        endTime: appointment.endTime,
        durationMinutes
      }, firstVisibleSlot, 30, timeSlotHeightPx);
      layout.coveredSlots.forEach(cs=> processed.add(`${dayKey}_${cs}`));
      appointmentBlocks.push({
        startSlot: layout.startLabel,
        durationMinutes: layout.durationMins,
        durationSlots: Math.ceil(layout.durationMins/30),
        height: layout.heightPx,
        topPx: layout.topPx,
        appointment: { ...appointment, startTime: layout.startLabel, endTime: layout.endLabel },
        coveredSlots: layout.coveredSlots
      });
    });
    return { appointmentBlocks, processedSlots: processed };
  }, [appointments, employee.id, currentDate, timeSlots, timeSlotHeightPx, dayKey]);

  return (
    <div key={employeeId} className={`staff-column ${!hasShift ? 'staff-absent' : ''} ${!hasValidShifts ? 'no-shifts' : ''}`}>
      <div className="staff-header">
        <div className="staff-avatar" style={{
          backgroundColor: hasShift && hasValidShifts ? employee.avatarColor : '#9ca3af',
          opacity: hasShift && hasValidShifts ? 1 : 0.5
        }}>
          {employee.avatar ?
            <img src={employee.avatar} alt={employee.name} className="avatar-image" style={{ opacity: hasShift && hasValidShifts ? 1 : 0.5 }} /> :
            employee.name.charAt(0)
          }
        </div>
        <div className="staff-info">
          <div className="staff-name" style={{ color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af' }}>{employee.name}</div>
          <div className="staff-position" style={{ color: hasShift && hasValidShifts ? 'inherit' : '#9ca3af' }}>{employee.position}</div>
        </div>
      </div>
      <div className="time-slots-column" style={{ position: 'relative' }}>
  {timeSlots.map(slot=>{
          const slotKey = `${dayKey}_${slot}`;
          const unavailableReason = isTimeSlotUnavailable(employeeId, slot);
          const [slotHour, slotMinute] = slot.split(':').map(Number);
          const slotStartMinutes = slotHour*60 + slotMinute;
          const slotEndMinutes = slotStartMinutes + 30;
          let isWithinShift=false, isFullyCoveredByShift=false, isPartialShift=false;
          let partialGradientStyle, partialOverlapLabel='';
          let overlapStartsAtSlotStart=false, overlapEndsAtSlotEnd=false, overlapMinutes=0;
          let percentStart=0, percentEnd=0;
          if(hasShift && hasValidShifts){
            for(const shift of shiftHours){
              const [shH,shM]=shift.startTime.split(':').map(Number);
              const [ehH,ehM]=shift.endTime.split(':').map(Number);
              const shiftStart = shH*60 + shM;
              const shiftEnd = ehH*60 + ehM;
              const overlapStart = Math.max(slotStartMinutes, shiftStart);
              const overlapEnd = Math.min(slotEndMinutes, shiftEnd);
              const thisOverlap = Math.max(0, overlapEnd - overlapStart);
              if(thisOverlap>0){
                if(slotStartMinutes>=shiftStart && slotStartMinutes<shiftEnd) isWithinShift=true;
                if(thisOverlap>=30){ isFullyCoveredByShift=true; }
                else { isPartialShift=true; overlapMinutes=thisOverlap; overlapStartsAtSlotStart= overlapStart===slotStartMinutes; overlapEndsAtSlotEnd = overlapEnd===slotEndMinutes; percentStart = ((overlapStart-slotStartMinutes)/30)*100; percentEnd=((overlapEnd-slotStartMinutes)/30)*100; partialGradientStyle={background:'#f3f4f6'}; const toLabel=(mins)=>{ const h=Math.floor(mins/60).toString().padStart(2,'0'); const m=(mins%60).toString().padStart(2,'0'); return `${h}:${m}`; }; partialOverlapLabel=`${toLabel(overlapStart)}-${toLabel(overlapEnd)}`; }
                if(isFullyCoveredByShift) break;
              }
            }
          }
          if(isFullyCoveredByShift){ isWithinShift=true; isPartialShift=false; }
          // Determine appointment coverage granularity (supports non-30m durations like 45m)
          const isCoveredByAppointment = processedSlots.has(slotKey);
          // If an appointment ends exactly at slot + 15 (e.g., 10:00-10:45 covering first half of 10:45-11:15 slot? actually spans 10:00-10:45)
          // We need to allow clicking second half after a 45m booking that starts on the hour and ends at :45.
          // Strategy: compute active appointments covering this slot and derive per-half coverage.
          let firstHalfBlocked = false; let secondHalfBlocked = false;
          if(isCoveredByAppointment){
            // A coarse full-slot block already exists from previous 30m logic. We'll refine using appointmentBlocks.
            for(const block of appointmentBlocks){
              // Block times in minutes
              const [bStartH,bStartM]=block.appointment.startTime.split(':').map(Number);
              const [bEndH,bEndM]=block.appointment.endTime.split(':').map(Number);
              let bStart = bStartH*60 + bStartM; let bEnd = bEndH*60 + bEndM; if(bEnd<=bStart) bEnd+=24*60;
              // current slot halves
              const half1Start = slotStartMinutes; const half1End = slotStartMinutes+15;
              const half2Start = slotStartMinutes+15; const half2End = slotStartMinutes+30;
              const overlaps = (s1,e1,s2,e2)=> s1<e2 && s2<e1;
              if(overlaps(bStart,bEnd,half1Start,half1End)) firstHalfBlocked=true;
              if(overlaps(bStart,bEnd,half2Start,half2End)) secondHalfBlocked=true;
              if(firstHalfBlocked && secondHalfBlocked) break;
            }
          }
          const baseClickHandler = (()=>{ const minBookable=10; if(!hasShift||!hasValidShifts||isCoveredByAppointment) return undefined; if(!isPartialShift && isWithinShift) return ()=>handleTimeSlotClick(employee.id, slot, currentDate); if(isPartialShift && overlapStartsAtSlotStart && overlapMinutes>=minBookable && overlapMinutes>=30) return ()=>handleTimeSlotClick(employee.id, slot, currentDate); return undefined; })();
          // 15-minute subdivision (two halves) with independent shift validation
          const halfHeight = timeSlotHeightPx/2;
          const firstHalfTime = slot; // e.g. 10:00
          const secondHalfTime = (()=>{ const [h,m]=slot.split(':').map(Number); const total=m+15; const nh=h + Math.floor(total/60); const nm= total%60; return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`; })();
          const toMinutes=(t)=>{ const [H,M]=t.split(':').map(Number); return H*60+M; };
          const firstHalfStart=slotStartMinutes;
          const firstHalfEnd=slotStartMinutes+15;
          const secondHalfStart=slotStartMinutes+15;
          const secondHalfEnd=slotStartMinutes+30;
          let firstHalfCovered=false, secondHalfCovered=false;
          if(hasShift && hasValidShifts){
            for(const shift of shiftHours){
              const [shH,shM]=shift.startTime.split(':').map(Number); const [ehH,ehM]=shift.endTime.split(':').map(Number);
              let sM=shH*60+shM, eM=ehH*60+ehM; if(eM<=sM) eM+=24*60; // overnight safeguard
              if(firstHalfStart>=sM && firstHalfEnd<=eM) firstHalfCovered=true;
              if(secondHalfStart>=sM && secondHalfEnd<=eM) secondHalfCovered=true;
              if(firstHalfCovered && secondHalfCovered) break;
            }
          }
          // Allow half click only if that half fully inside a shift & not covered by appointment
          const canClickFirst = firstHalfCovered && !firstHalfBlocked;
          const canClickSecond = secondHalfCovered && !secondHalfBlocked;
          return (
            <div key={slot} className="time-slot-wrapper" style={{ height:`${timeSlotHeightPx}px`, position:'relative'}}>
              <div className={`time-slot ${(!hasShift || !hasValidShifts ? 'no-shift' : (isPartialShift ? 'partial-shift' : (!isWithinShift ? 'outside-shift' : (unavailableReason ? 'unavailable' : 'empty'))))}`}
                onClick={baseClickHandler}
                onMouseEnter={(e)=> !isCoveredByAppointment && showTimeHoverHandler(e, slot)}
                onMouseLeave={hideTimeHover}
                style={{ cursor: (!hasShift||!hasValidShifts||isCoveredByAppointment)?'not-allowed':(!isPartialShift && isWithinShift)?'pointer':(isPartialShift && overlapStartsAtSlotStart && overlapMinutes>=10? 'pointer':'default'), opacity: (!hasShift||!hasValidShifts||(!isWithinShift && !isPartialShift))?0.3:1, backgroundColor: (!hasShift||!hasValidShifts)?'gray':(isPartialShift? '#f3f4f6':(!isWithinShift? 'gray':'#ffffff')), ...(isPartialShift && partialGradientStyle? partialGradientStyle:{}) }}>
                {unavailableReason && isWithinShift && (<div className="unavailable-text">{unavailableReason.includes('Day Off')? 'DAY OFF': (unavailableReason.includes('Block')? 'BLOCKED':'UNAVAIL')}</div>)}
                {isPartialShift && partialOverlapLabel && (
                  <div className="partial-shift-available" style={{ top:`${percentStart}%`, height:`${percentEnd-percentStart}%`, width:'100%', cursor: overlapStartsAtSlotStart? 'pointer':'default'}} title={`Shift: ${partialOverlapLabel}`} onClick={(e)=>{ e.stopPropagation(); const minBookable=10; if(overlapStartsAtSlotStart && overlapMinutes>=minBookable && !isCoveredByAppointment){ handleTimeSlotClick(employee.id, slot, currentDate);} }}>
                    <span className="partial-shift-label">{partialOverlapLabel}</span>
                  </div>
                )}
                {/* 15-min subdivision overlay */}
        <div className="slot-subdivision" style={{position:'absolute', inset:0, pointerEvents:'none'}}>
                  <div className="half-slot first-half" style={{position:'absolute', top:0, left:0, right:0, height:halfHeight, borderBottom:'1px dashed #e2e8f0'}}></div>
                  <div className="half-slot second-half" style={{position:'absolute', top:halfHeight, left:0, right:0, height:halfHeight}}></div>
                  {/* Click targets */}
                  {canClickFirst && (
                    <button
                      type="button"
                      className="half-slot-click first"
          style={{position:'absolute', top:0, left:0, right:0, height:halfHeight, background:'transparent', border:'none', cursor:'pointer', pointerEvents:'auto', opacity:firstHalfBlocked?0.25:1}}
                      title={`Book ${firstHalfTime}`}
                      data-time={firstHalfTime}
                      onMouseEnter={(e)=> showTimeHoverHandler(e, firstHalfTime)}
                      onMouseLeave={hideTimeHover}
                      onClick={(e)=>{ e.stopPropagation(); handleTimeSlotClick(employee.id, firstHalfTime, currentDate); }}
                    />
                  )}
                  {canClickSecond && (
                    <button
                      type="button"
                      className="half-slot-click second"
          style={{position:'absolute', top:halfHeight, left:0, right:0, height:halfHeight, background:'transparent', border:'none', cursor:'pointer', pointerEvents:'auto', opacity:secondHalfBlocked?0.25:1}}
                      title={`Book ${secondHalfTime}`}
                      data-time={secondHalfTime}
                      onMouseEnter={(e)=> showTimeHoverHandler(e, secondHalfTime)}
                      onMouseLeave={hideTimeHover}
                      onClick={(e)=>{ e.stopPropagation(); handleTimeSlotClick(employee.id, secondHalfTime, currentDate); }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {appointmentBlocks.map((block,i)=> (
          <div key={`block-${i}`} className="appointment-block fresha-style" style={{ position:'absolute', top:`${block.topPx}px`, left:'4px', right:'4px', height:`${block.height}px`, backgroundColor: getAppointmentColorByStatus(block.appointment.status, block.appointment.color), borderRadius:'12px', display:'flex', flexDirection:'column', justifyContent:'center', padding:'8px 12px', boxShadow:'0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)', cursor:'pointer', zIndex:10, border:'2px solid rgba(255,255,255,0.2)', transition:'all 0.2s ease', overflow:'hidden'}}
            onClick={()=>{ const details={ ...block.appointment, employeeId: employee.id, employeeName: employee.name, slotTime:block.startSlot, date:dayKey, slotKey:`${dayKey}_${block.startSlot}` }; setSelectedBookingForStatus(details); setShowBookingStatusModal(true); }}
            onMouseEnter={(e)=> showBookingTooltipHandler(e,{ client:block.appointment.client, service:block.appointment.service, time:block.appointment.startTime, professional: employee.name, status:block.appointment.status||'Confirmed', notes:block.appointment.notes })}
            onMouseLeave={hideBookingTooltip}>
            <div className="appointment-client" style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{block.appointment.client}</div>
            <div className="appointment-service" style={{ color:'#fff', fontSize:13, opacity:0.95 }}>{block.appointment.service}</div>
            <div className="appointment-time" style={{ fontSize:11, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{block.appointment.startTime} - {block.appointment.endTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

