import React from 'react';
import { Download } from 'lucide-react';

const ActionRow = ({
  leftSlot,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  rightSlot,
  className = ''
}) => {
  return (
    <div className={`report-actions ${className}`}>
      <div className="report-actions__left">
        {leftSlot}
      </div>
      
     
      
      <div className="report-actions__right">
        {rightSlot}
      </div>
    </div>
  );
};

export default ActionRow;