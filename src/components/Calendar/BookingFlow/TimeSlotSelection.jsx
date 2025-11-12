/**
 * TimeSlotSelection Component
 * Step 3: Select a time slot
 */

import React from 'react';

const TimeSlotSelection = ({ 
  selectedTimeSlot, 
  onSelectTimeSlot, 
  onNext, 
  onBack,
  professional,
  service,
  date
}) => {
  // Placeholder - would generate actual time slots based on professional availability
  const timeSlots = [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: false },
    { time: '10:30', available: true }
  ];

  const handleSelect = (slot) => {
    if (slot.available) {
      onSelectTimeSlot(slot);
      onNext();
    }
  };

  return (
    <div className="time-slot-selection">
      <h3>Select a Time</h3>
      <div className="time-slots-grid">
        {timeSlots.map((slot, idx) => (
          <button
            key={idx}
            className={`time-slot-button ${selectedTimeSlot?.time === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
            onClick={() => handleSelect(slot)}
            disabled={!slot.available}
          >
            {slot.time}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default TimeSlotSelection;
