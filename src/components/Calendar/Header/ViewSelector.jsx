/**
 * ViewSelector Component
 * Toggle between different calendar views
 */

import React from 'react';
import { CalendarDays } from 'lucide-react';

const ViewSelector = ({ currentView, onViewChange }) => {
  const views = ['Day', 'Week', 'Month'];

  return (
    <div className="view-selector">
      <div className="view-buttons">
        {views.map(view => (
          <button
            key={view}
            className={`view-button ${currentView === view ? 'active' : ''}`}
            onClick={() => onViewChange(view)}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewSelector;
