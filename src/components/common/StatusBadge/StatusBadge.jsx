import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, variant, children, className = '' }) => {
  // Auto-determine variant based on status if not provided
  const getVariant = () => {
    if (variant) return variant;
    
    const statusStr = String(status).toLowerCase();
    if (['completed', 'paid', 'success', 'active'].includes(statusStr)) {
      return 'success';
    }
    if (['pending', 'processing', 'warning'].includes(statusStr)) {
      return 'warning';
    }
    if (['failed', 'error', 'cancelled', 'declined'].includes(statusStr)) {
      return 'error';
    }
    return 'neutral';
  };

  const displayText = children || status;
  const badgeVariant = getVariant();

  return (
    <span className={`status-badge status-badge--${badgeVariant} ${className}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;