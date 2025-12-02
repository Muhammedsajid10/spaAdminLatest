import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger' // danger, warning, info
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-content">
          <div className="confirmation-icon-wrapper">
            <AlertTriangle size={24} />
          </div>
          <h3 className="confirmation-title">{title}</h3>
          <p className="confirmation-message">{message}</p>
        </div>
        <div className="confirmation-actions">
          <button className="btn-confirm-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className="btn-confirm-delete" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              backgroundColor: type === 'danger' ? '#ef4444' : '#6366f1',
              borderColor: type === 'danger' ? '#ef4444' : '#6366f1'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
