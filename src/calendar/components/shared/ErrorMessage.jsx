/**
 * ErrorMessage Component
 * Reusable error display component
 */
import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="error-message-container">
      <div className="error-message-icon">⚠️</div>
      <div className="error-message-content">
        <strong>Error</strong>
        <p>{message}</p>
      </div>
      <div className="error-message-actions">
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button className="error-dismiss-btn" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
