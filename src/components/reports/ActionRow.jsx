import React from 'react';
import { Download } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import Button from '../ui/Button';

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
      
      <div className="report-actions__center">
        {onSearchChange && (
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            size="md"
          />
        )}
      </div>
      
      <div className="report-actions__right">
        {rightSlot}
      </div>
    </div>
  );
};

export default ActionRow;