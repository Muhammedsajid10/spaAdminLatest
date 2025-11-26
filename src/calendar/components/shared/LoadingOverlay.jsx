/**
 * LoadingOverlay Component
 * Reusable loading overlay with spinner
 */
import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ message = 'Loading...', fullScreen = false }) => {
  return (
    <div className={`loading-overlay ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        <div className="loading-spinner"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay;
