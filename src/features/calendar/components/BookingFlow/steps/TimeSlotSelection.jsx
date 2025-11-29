/**
 * TimeSlotSelection Component
 * Step 3 of Booking Flow
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { formatTime12Hour } from '../../../utils/time';
import { generateSlotsFromShift, getAvailableSlots } from '../../../utils/slots';
import { useSelector } from 'react-redux';
import styles from './TimeSlotSelection.module.css';

const TimeSlotSelection = ({ 
  onSelect, 
  selectedTime, 
  selectedDate, 
  professional, 
  service 
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [slots, setSlots] = useState({ morning: [], afternoon: [], evening: [] });
  
  // Get appointments from Redux for conflict checking
  const appointments = useSelector(state => state.appointments?.byEmployee || {});

  useEffect(() => {
    if (!professional || !service) return;

    // Generate slots
    const allSlots = generateSlotsFromShift(professional, currentDate, service.duration);
    
    // Filter available slots
    const available = getAvailableSlots(allSlots, {
      appointments: Object.values(appointments).flat(),
      employee: professional,
      date: currentDate,
      employeeId: professional._id || professional.id,
      requiredDuration: service.duration
    });

    // Group by time of day
    const grouped = {
      morning: [],
      afternoon: [],
      evening: []
    };

    available.forEach(slot => {
      const hour = parseInt(slot.label.split(':')[0]);
      if (hour < 12) grouped.morning.push(slot);
      else if (hour < 17) grouped.afternoon.push(slot);
      else grouped.evening.push(slot);
    });

    setSlots(grouped);
  }, [currentDate, professional, service, appointments]);

  const handleDateChange = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  return (
    <div className={styles.container}>
      {/* Date Navigation */}
      <div className={styles.dateHeader}>
        <button onClick={() => handleDateChange(-1)} className={styles.navButton}>
          <ChevronLeft size={20} />
        </button>
        <div className={styles.dateDisplay}>
          <span className={styles.dayName}>
            {currentDate.toLocaleDateString(undefined, { weekday: 'long' })}
          </span>
          <span className={styles.fullDate}>
            {currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </span>
        </div>
        <button onClick={() => handleDateChange(1)} className={styles.navButton}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Slots Grid */}
      <div className={styles.slotsContainer}>
        {/* Morning */}
        {slots.morning.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Sun size={18} className={styles.iconMorning} />
              <span>Morning</span>
            </div>
            <div className={styles.grid}>
              {slots.morning.map(slot => (
                <button
                  key={slot.label}
                  className={`${styles.slot} ${selectedTime === slot.label ? styles.selected : ''}`}
                  onClick={() => onSelect(slot.label, currentDate)}
                >
                  {formatTime12Hour(slot.label)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Afternoon */}
        {slots.afternoon.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Sun size={18} className={styles.iconAfternoon} />
              <span>Afternoon</span>
            </div>
            <div className={styles.grid}>
              {slots.afternoon.map(slot => (
                <button
                  key={slot.label}
                  className={`${styles.slot} ${selectedTime === slot.label ? styles.selected : ''}`}
                  onClick={() => onSelect(slot.label, currentDate)}
                >
                  {formatTime12Hour(slot.label)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Evening */}
        {slots.evening.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Moon size={18} className={styles.iconEvening} />
              <span>Evening</span>
            </div>
            <div className={styles.grid}>
              {slots.evening.map(slot => (
                <button
                  key={slot.label}
                  className={`${styles.slot} ${selectedTime === slot.label ? styles.selected : ''}`}
                  onClick={() => onSelect(slot.label, currentDate)}
                >
                  {formatTime12Hour(slot.label)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Slots */}
        {Object.values(slots).every(arr => arr.length === 0) && (
          <div className={styles.noSlots}>
            <p>No available slots for this date.</p>
            <button onClick={() => handleDateChange(1)} className={styles.nextDayButton}>
              Check Next Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotSelection;
