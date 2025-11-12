/**
 * QuickActions Component
 * Quick action buttons (New Booking, etc.)
 */

import React from 'react';
import { Plus } from 'lucide-react';

const QuickActions = ({ onOpenBooking }) => {
  return (
    <div className="quick-actions">
      <button
        className="new-booking-button primary-button"
        onClick={onOpenBooking}
      >
        <Plus size={18} />
        <span>New Booking</span>
      </button>
    </div>
  );
};

export default QuickActions;
