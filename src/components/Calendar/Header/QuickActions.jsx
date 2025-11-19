/**
 * QuickActions Component
 * Quick action buttons (New Booking, etc.)
 */

import React from 'react';
import { Plus } from 'lucide-react';

const QuickActions = ({ onOpenBooking }) => {
  return (
    <button
      className="primary-button add-button"
      onClick={onOpenBooking}
      aria-label="Add new booking"
    >
      <Plus size={16} />
      <span>Add</span>
    </button>
  );
};

export default QuickActions;
