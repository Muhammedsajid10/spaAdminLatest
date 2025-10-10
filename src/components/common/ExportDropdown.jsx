import React, { useState } from 'react';
import { Download, FileText, File, Image } from 'lucide-react';
import Button from '../../components/ui/Button';
import Dropdown from '../../components/ui/DropDown';
import './ExportDropdown.css';

const ExportDropdown = ({ 
  onExport, 
  loading = false, 
  reportType = '',
  disabled = false,
  className = '' 
}) => {
  const exportOptions = [
    { 
      value: 'csv', 
      label: 'CSV', 
      icon: <FileText size={16} />,
      description: 'Comma-separated values'
    },
    { 
      value: 'excel', 
      label: 'Excel', 
      icon: <File size={16} />,
      description: 'Microsoft Excel format'
    },
    { 
      value: 'pdf', 
      label: 'PDF', 
      icon: <FileText size={16} />,
      description: 'Portable document format'
    },
  ];

  const handleExport = (option) => {
    if (onExport) {
      onExport(option.value);
    }
  };

  const renderOption = (option) => (
    <div className="export-dropdown__option-content">
      <div className="export-dropdown__option-main">
        <span className="export-dropdown__option-icon">{option.icon}</span>
        <span className="export-dropdown__option-label">{option.label}</span>
      </div>
      <span className="export-dropdown__option-desc">{option.description}</span>
    </div>
  );

  return (
    <div className={`export-dropdown ${className}`}>
      <Dropdown
        options={exportOptions}
        onChange={handleExport}
        placeholder="Export"
        disabled={disabled || loading}
        renderOption={renderOption}
        renderSelected={() => (
          <div className="export-dropdown__trigger">
            <Download size={16} />
            <span>Export</span>
          </div>
        )}
      />
      
      {loading && (
        <div className="export-dropdown__loading">
          <div className="export-dropdown__spinner" />
          <span>Preparing export...</span>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;