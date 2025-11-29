/**
 * MonthView Component
 * Displays calendar in month view
 */

import React from 'react';
import styles from './MonthView.module.css';

/**
 * Month View Component (Placeholder)
 * @param {Object} props - Component props
 */
const MonthView = ({ currentDate, onDayClick }) => {
  return (
    <div className={styles.monthView}>
      <div className={styles.placeholder}>
        <p>Month View - Coming Soon</p>
        <p className={styles.date}>
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default MonthView;
