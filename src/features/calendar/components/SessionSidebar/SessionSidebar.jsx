/**
 * SessionSidebar Component
 * Displays multiple appointments in current session
 */

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { formatDuration } from '../../utils/time';
import styles from './SessionSidebar.module.css';

/**
 * Session Sidebar Component
 * @param {Object} props - Component props
 */
const SessionSidebar = ({
  appointments,
  totalPrice,
  totalDuration,
  onRemoveAppointment,
  onClearSession,
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>Session ({appointments.length})</h3>
        <button className={styles.clearButton} onClick={onClearSession}>
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className={styles.appointmentsList}>
        {appointments.map((appointment, index) => (
          <div key={appointment.id || index} className={styles.appointmentCard}>
            <div className={styles.appointmentHeader}>
              <span className={styles.serviceName}>
                {appointment.service?.name || 'Service'}
              </span>
              <button
                className={styles.removeButton}
                onClick={() => onRemoveAppointment(appointment.id)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.appointmentDetails}>
              <div className={styles.detail}>
                <span className={styles.label}>Professional:</span>
                <span className={styles.value}>
                  {appointment.professional?.user?.firstName || 'N/A'}
                </span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Time:</span>
                <span className={styles.value}>{appointment.timeSlot || 'N/A'}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Duration:</span>
                <span className={styles.value}>
                  {formatDuration(appointment.duration || 0)}
                </span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>Price:</span>
                <span className={styles.value}>
                  ${appointment.service?.price || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Total Duration:</span>
            <span className={styles.summaryValue}>{formatDuration(totalDuration)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Price:</span>
            <span className={styles.summaryValue}>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button className={styles.proceedButton}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default SessionSidebar;
