/**
 * WeekView Component
 * Displays calendar in week view with time slots
 */

import React from 'react';
import { formatTime12Hour } from '../../utils/time';
import styles from './WeekView.module.css';

/**
 * Week View Component
 * @param {Object} props - Component props
 */
const WeekView = ({
  currentDate,
  dateRange,
  employees,
  availableSlots,
  onTimeSlotClick,
  onAppointmentClick,
}) => {
  // Generate time slots for the day (8 AM to 8 PM)
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  // Get days in the week
  const getDaysInWeek = () => {
    const days = [];
    const start = new Date(dateRange.start);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const days = getDaysInWeek();

  return (
    <div className={styles.weekView}>
      {/* Header with day labels */}
      <div className={styles.header}>
        <div className={styles.timeColumn}></div>
        {days.map((day, index) => (
          <div key={index} className={styles.dayHeader}>
            <div className={styles.dayName}>
              {day.toLocaleDateString(undefined, { weekday: 'short' })}
            </div>
            <div className={styles.dayDate}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Grid with time slots */}
      <div className={styles.gridContainer}>
        <div className={styles.timeLabels}>
          {timeSlots.map((time, index) => (
            <div key={index} className={styles.timeLabel}>
              {index % 2 === 0 ? formatTime12Hour(time) : ''}
            </div>
          ))}
        </div>

        {days.map((day, dayIndex) => (
          <div key={dayIndex} className={styles.dayColumn}>
            {timeSlots.map((time, timeIndex) => {
              // Check if any employee has this slot available
              const hasAvailableSlot = employees.some(emp => {
                const employeeId = emp._id || emp.id;
                const slots = availableSlots[employeeId] || [];
                return slots.some(slot => slot.label === time);
              });

              return (
                <div
                  key={timeIndex}
                  className={`${styles.timeSlot} ${hasAvailableSlot ? styles.available : ''}`}
                  onClick={() => {
                    if (hasAvailableSlot) {
                      // Find first available employee
                      const employee = employees.find(emp => {
                        const employeeId = emp._id || emp.id;
                        const slots = availableSlots[employeeId] || [];
                        return slots.some(slot => slot.label === time);
                      });
                      
                      if (employee) {
                        onTimeSlotClick({
                          employeeId: employee._id || employee.id,
                          time,
                          date: day,
                        });
                      }
                    }
                  }}
                >
                  {/* Appointments will be rendered here */}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
