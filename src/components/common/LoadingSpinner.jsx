import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({
  label = 'Connecting to network…',
  className = ''
}) => (
  <div className={`loading-range ${className}`}>
    <div className="loading-range__bars">
      <span />
      <span />
      <span />
      <span />
    </div>
    <p className="loading-range__label">{label}</p>
  </div>
);

export default LoadingSpinner;