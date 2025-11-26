/**
 * UnavailablePopup Component
 * Simple modal to display unavailability messages
 */
import React from 'react';
import './UnavailablePopup.css';

const UnavailablePopup = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="unavailable-popup-overlay" onClick={onClose}>
      <div className="unavailable-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="unavailable-popup-header">
          <h3>Slot Unavailable</h3>
        </div>
        <div className="unavailable-popup-body">
          <p>{message}</p>
        </div>
        <div className="unavailable-popup-actions">
          <button 
            className="unavailable-popup-close-btn" 
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnavailablePopup;
