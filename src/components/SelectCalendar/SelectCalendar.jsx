import React from 'react';
import styles from './SelectCalendar.module.css';

/**
 * Placeholder SelectCalendar component intended to orchestrate the legacy calendar logic.
 * Once the new folder structure is populated with the extracted views, this component will
 * wire together the header, grid, booking flow, and session sidebar without changing behavior.
 */
const SelectCalendar = () => {
  return (
    <div className={styles.container}>
      {/* TODO: Import and compose DateNavigator, CalendarGrid, SessionSidebar, BookingFlow, etc. */}
      <p>Reusable SelectCalendar shell – content will be moved here in future iterations.</p>
    </div>
  );
};

export default SelectCalendar;
