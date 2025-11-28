import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Calendar, Clock, FileText, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { PiGenderFemale, PiGenderMale, PiGenderNeuter } from "react-icons/pi";
import AddNoteModal from './AddNoteModal';
import AddAllergyModal from './AddAllergyModal';

const ClientProfileSidebar = ({ client, onEdit, onDelete }) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!client) return null;

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

  const handleSaveNote = (note) => {
    console.log('Saving note for client:', client.id, note);
    // Here you would typically call an API to save the note
    // e.g., onSaveNote(client.id, note);
  };

  const handleSaveAllergy = (allergyData) => {
    console.log('Saving allergy for client:', client.id, allergyData);
    // API call placeholder
  };

  return (
    <div className="client-profile-sidebar">
      {/* Profile Header */}
      <div className="sidebar-profile-header">
        <div 
          className="sidebar-avatar" 
          style={{ backgroundColor: client.color || '#ccc' }}
        >
          {client.initial || '?'}
        </div>
        <h3 className="sidebar-name">{client.name}</h3>
        <p className="sidebar-phone">{client.mobile}</p>
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
                setIsAddNoteOpen(true);
              }}
            >
              <FileText size={16} />
              Add Simple Note
            </button>
            <button 
              className="action-item"
              onClick={() => {
                setIsActionsOpen(false);
                setIsAddAllergyOpen(true);
              }}
            >
              <AlertCircle size={16} />
              Add Allergy
            </button>
            <button 
              className="action-item"
              onClick={() => {
                setIsActionsOpen(false);
                if (onEdit) onEdit(client);
              }}
            >
              <Edit size={16} />
              Edit Client Details
            </button>
            <button 
              className="action-item delete"
              onClick={() => {
                setIsActionsOpen(false);
                if (onDelete) onDelete(client.id);
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
          <PiGenderNeuter size={20} className="info-icon" />
          <span>Add pronouns</span>
        </div>
        
        <div className="info-item">
          <Calendar size={20} className="info-icon" />
          <span>Add date of birth</span>
        </div>

        <div className="info-item" style={{ cursor: 'default' }}>
          <Clock size={20} className="info-icon" />
          <span>Created {formatDate(client.createdAt)}</span>
        </div>
      </div>

      {/* Add Note Modal */}
      <AddNoteModal 
        isOpen={isAddNoteOpen} 
        onClose={() => setIsAddNoteOpen(false)} 
        onSave={handleSaveNote}
      />

      {/* Add Allergy Modal */}
      <AddAllergyModal
        isOpen={isAddAllergyOpen}
        onClose={() => setIsAddAllergyOpen(false)}
        onSave={handleSaveAllergy}
      />
    </div>
  );
};

export default ClientProfileSidebar;
