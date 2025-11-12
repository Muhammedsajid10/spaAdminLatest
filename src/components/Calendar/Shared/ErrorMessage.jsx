/**
 * ErrorMessage Component
 * Displays error messages
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss, type = 'error' }) => {
  if (!message) return null;

  const getTypeClass = () => {
    switch (type) {
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      case 'success':
        return 'alert-success';
      default:
        return 'alert-error';
    }
  };

  return (
    <div className={`error-message-container ${getTypeClass()}`}>
      <div className="error-content">
        <AlertCircle size={20} className="error-icon" />
        <span className="error-text">{message}</span>
      </div>
      {onDismiss && (
        <button className="dismiss-button" onClick={onDismiss}>
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
