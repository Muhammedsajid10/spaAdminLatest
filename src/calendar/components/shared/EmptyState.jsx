/**
 * EmptyState Component
 * Displays an empty state message when no data is available
 */
import React from 'react';
import './EmptyState.css';

const EmptyState = ({ title, message, icon, action }) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      <div className="empty-state-message">
        {Array.isArray(message) ? (
          message.map((msg, idx) => <p key={idx}>{msg}</p>)
        ) : (
          <p>{message}</p>
        )}
      </div>
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
