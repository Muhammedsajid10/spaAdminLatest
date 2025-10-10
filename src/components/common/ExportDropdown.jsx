import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import './ExportDropdown.css';

const ExportDropdown = ({ 
  onExport, 
  loading = false, 
  reportType = '',
  disabled = false,
  className = '' 
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportOptions = [
    {
      value: 'csv',
      label: 'CSV',
      icon: <FileText size={16} />,
    },
    {
      value: 'excel',
      label: 'Excel',
      icon: <FileSpreadsheet size={16} />,
    },
    {
      value: 'pdf',
      label: 'PDF',
      icon: <FileText size={16} />,
    }
  ];

  const handleExport = (option) => {
    onExport?.(option.value, reportType);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`export-dropdown-unique ${className}`}>
      <button
        type="button"
        className="export-dropdown__trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled || loading}
      >
        <Download size={16} />
        {loading ? 'Preparing...' : 'Export'}
      </button>

      {open && (
        <div className="export-dropdown__menu">
          {exportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="export-dropdown__option"
              onClick={() => handleExport(option)}
            >
              <div className="export-dropdown__option-content">
                <div className="export-dropdown__option-main">
                  <span className="export-dropdown__option-icon">{option.icon}</span>
                  <span className="export-dropdown__option-label">{option.label}</span>
                </div>
                <span className="export-dropdown__option-desc">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;