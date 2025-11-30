import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Calendar, Clock, FileText, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { PiGenderFemale, PiGenderMale, PiGenderNeuter } from "react-icons/pi";


const ClientProfileSidebar = ({ client, onEdit, onDelete, onAddNote, onAddAllergy }) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!client) return null;

  // Extract client data with fallbacks
  const clientName = client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name || 'Unknown';
  const clientPhone = client.phone || client.mobile || '';
  const clientEmail = client.email || '';
  const clientInitial = client.initial || (client.firstName ? client.firstName.charAt(0).toUpperCase() : '?');

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActionsOpen(false);
      }
    };

    if (isActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsOpen]);

  return (
    <div className="client-profile-sidebar">
      {/* Profile Header */}
      <div className="sidebar-profile-header">
        <div 
          className="sidebar-avatar" 
          style={{ backgroundColor: client.color || '#6366f1' }}
        >
          {clientInitial}
        </div>
        <h3 className="sidebar-name">{clientName}</h3>
        <p className="sidebar-phone">{clientPhone}</p>
      </div>

      {/* Actions */}
      <div className="sidebar-actions" ref={dropdownRef}>
        <button 
          className="btn-action-dropdown"
          onClick={() => setIsActionsOpen(!isActionsOpen)}
        >
          Actions
          <ChevronDown size={16} style={{ transform: isActionsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isActionsOpen && (
          <div className="actions-dropdown-menu">
            <button 
              className="action-item"
              onClick={() => {
                setIsActionsOpen(false);
                if (onAddNote) onAddNote();
              }}
            >
              <FileText size={16} />
              Add Simple Note
            </button>
            <button 
              className="action-item"
              onClick={() => {
                setIsActionsOpen(false);
                if (onAddAllergy) onAddAllergy();
              }}
            >
              <AlertCircle size={16} />
              Add Allergy
            </button>
         
            <button 
              className="action-item delete"
              onClick={() => {
                setIsActionsOpen(false);
                if (onDelete) onDelete(client._id || client.id);
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Additional Info List */}
      <div className="sidebar-info-list">
        <div className="info-item">
          {client.gender === 'male' ? (
            <PiGenderMale size={20} className="info-icon" />
          ) : client.gender === 'female' ? (
            <PiGenderFemale size={20} className="info-icon" />
          ) : (
            <PiGenderNeuter size={20} className="info-icon" />
          )}
          <span>{client.pronouns || client.gender || 'Add pronouns'}</span>
        </div>
        
        <div className="info-item">
          <Calendar size={20} className="info-icon" />
          <span>{client.dob ? formatDate(client.dob) : 'Add date of birth'}</span>
        </div>

        <div className="info-item" style={{ cursor: 'default' }}>
          <Clock size={20} className="info-icon" />
          <span>Created {formatDate(client.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default ClientProfileSidebar;
