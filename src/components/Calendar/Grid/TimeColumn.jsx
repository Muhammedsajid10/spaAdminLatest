/**
 * TimeColumn Component
 * Left column showing time slots
 */

import React from 'react';
import { formatTime } from '../../../utils/calendar';

const TimeColumn = ({ timeSlots }) => {
  return (
    <div className="time-column">
      <div className="time-header">Time</div>
      <div className="time-slots">
        {timeSlots.map((time, index) => (
          <div key={index} className="time-slot-label">
            {formatTime(time)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeColumn;
