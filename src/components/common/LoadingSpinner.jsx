import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  color = 'primary' 
}) => {
  return (
    <div className={`loading-spinner loading-spinner--${size} ${className}`}>
      <div className={`loading-spinner__circle loading-spinner__circle--${color}`} />
    </div>
  );
};

export default LoadingSpinner;