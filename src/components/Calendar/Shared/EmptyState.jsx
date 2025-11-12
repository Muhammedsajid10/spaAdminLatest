/**
 * EmptyState Component
 * Displays when no data is available
 */

import React from 'react';
import { Calendar } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Calendar, 
  title = 'No Data', 
  message = 'There is no data to display.',
  action,
  actionLabel 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={64} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && actionLabel && (
        <button className="empty-state-action primary-button" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
