import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  generateTimeSlotsFromEmployeeShift,
  hasShiftOnDate,
  getFormattedShiftHours 
} from '../../../utils/calendar/shiftUtils';
import { isSlotAvailable } from '../../../utils/calendar/conflictDetection';
import { formatTime } from '../../../utils/calendar/timeUtils';

const TimeSlotSelection = ({ 
  selectedTimeSlot, 
  onSelectTimeSlot, 
  onNext, 
  onBack,
  professional,
  service,
  date,
  appointments = [],
  sessionAppointments = [] // NEW: Support for multiple appointments in session
}) => {
  // Get session appointments from Redux if not passed as prop
  const reduxSessionAppointments = useSelector(state => 
    state.bookingSession?.appointments || []
  );
  const effectiveSessionAppointments = sessionAppointments.length > 0 
    ? sessionAppointments 
    : reduxSessionAppointments;

  // Check if professional has a shift on the selected date
  const hasShift = useMemo(() => {
    if (!professional || !date) return false;
    // If no workSchedule, assume available (shift data not configured)
    if (!professional.workSchedule) return true;
    return hasShiftOnDate(professional, date);
  }, [professional, date]);

  // Get formatted shift hours for display
  const shiftHours = useMemo(() => {
    if (!professional || !date) return null;
    return getFormattedShiftHours(professional, date);
  }, [professional, date]);

  // Generate time slots based on professional's shift schedule
  const timeSlots = useMemo(() => {
    console.log('🔍 TimeSlotSelection - Generating slots with:', {
      professional: professional?.name,
      date: date?.toDateString(),
      hasShift,
      hasWorkSchedule: !!professional?.workSchedule,
      appointments: appointments?.length,
      sessionAppointments: effectiveSessionAppointments?.length,
      service: service?.name
    });

    if (!professional || !date) {
      console.warn('⚠️ Cannot generate slots - missing professional or date');
      return [];
    }

    const professionalId = professional._id || professional.id;
    const serviceDuration = service?.duration || 30;
    const interval = 30; // 30-minute intervals

    let slotTimes = [];

    // Try to generate slots from employee's shift hours first
    if (professional.workSchedule && hasShift) {
      slotTimes = generateTimeSlotsFromEmployeeShift(
        professional,
        date,
        serviceDuration,
        interval
      );
      console.log('✅ Generated slots from shift:', slotTimes);
    }

    // If no slots generated (empty workSchedule or no shift), use default business hours
    if (slotTimes.length === 0) {
      console.log('⚠️ No slots from shift data, using default business hours (9 AM - 6 PM)');
      const defaultSlots = [];
      const startHour = 9;
      const endHour = 18;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += interval) {
          const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          defaultSlots.push(time);
        }
      }
      slotTimes = defaultSlots;
      console.log('✅ Generated default slots:', slotTimes.length);
    }

    // Check availability for each slot (against both DB and session appointments)
    return slotTimes.map(time => {
      const available = isSlotAvailable(
        professionalId,
        date,
        time,
        serviceDuration,
        appointments,
        effectiveSessionAppointments
      );

      return {
        time,
        available,
        formattedTime: formatTime(time, false) // 12-hour format
      };
    });
  }, [professional, date, hasShift, service, appointments, effectiveSessionAppointments]);

  const handleSelect = (slot) => {
    if (slot.available) {
      console.log('⏰ Time slot selected:', {
        time24h: slot.time,
        timeDisplay: slot.formattedTime,
        available: slot.available
      });
      onSelectTimeSlot(slot.time);
      onNext();
    }
  };

  const professionalName = professional?.name || 
    professional?.user?.name || 
    `${professional?.firstName || ''} ${professional?.lastName || ''}`.trim() || 
    'the professional';

  // Show message if no time slots available
  if (timeSlots.length === 0) {
    return (
      <div className="time-slot-selection">
        <div className="selection-header">
          <h2>Select a time</h2>
          <p className="selection-subtitle">
            {service?.name && `For ${service.name} with ${professionalName}`}
            {date && ` on ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
          </p>
        </div>
        
        <div className="no-availability-message">
          <i className="icon-clock-x"></i>
          <p>No time slots available.</p>
          <p className="hint">Please try a different date or professional.</p>
        </div>
        
        <div className="modal-actions">
          <button className="secondary-button" onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="time-slot-selection">
      <div className="selection-header">
        <h2>Select a time</h2>
        <p className="selection-subtitle">
          {service?.name && `For ${service.name} with ${professionalName}`}
          {date && ` on ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
        </p>
        {shiftHours && (
          <p className="shift-info">
            <i className="icon-clock"></i> Shift hours: {shiftHours}
          </p>
        )}
      </div>
      
      <div className="time-slots-container">
        <div className="time-slots-grid">
          {timeSlots.map((slot, idx) => (
            <button
              key={idx}
              className={`time-slot-button ${
                selectedTimeSlot === slot.time ? 'selected' : ''
              } ${!slot.available ? 'unavailable' : ''}`}
              onClick={() => handleSelect(slot)}
              disabled={!slot.available}
              title={!slot.available ? 'Already booked' : 'Available'}
            >
              {slot.formattedTime}
              {!slot.available && <span className="slot-status">Booked</span>}
            </button>
          ))}
        </div>
      </div>
      
      <div className="availability-legend">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot unavailable"></span>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot shift-info"></span>
          <span>Within shift hours</span>
        </div>
      </div>
      
      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default TimeSlotSelection;
