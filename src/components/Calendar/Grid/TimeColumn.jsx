/**
 * TimeColumn Component
 * Left column showing time slots with CSS Grid layout
 */

import React from 'react';
import { formatTime } from '../../../utils/calendar';

const TimeColumn = ({ timeSlots }) => {
  return (
    <div className="time-column">
      <div className="time-column-header">Time</div>
      {timeSlots.map((time, index) => (
        <div key={index} className="time-slot-label">
          {formatTime(time)}
        </div>
      ))}
    </div>
  );
};

export default TimeColumn;
