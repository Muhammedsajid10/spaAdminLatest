import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Calendar, Clock, FileText, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { PiGenderFemale, PiGenderMale, PiGenderNeuter } from "react-icons/pi";


const ClientProfileSidebar = ({ client, allergies = [], notes = [], memberships = [], onEdit, onDelete, onAddNote, onAddAllergy }) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!client) return null;

  // Extract client data with fallbacks
  const clientName = client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name || 'Unknown';
  const clientPhone = client.phone || client.mobile || '';
  const clientEmail = client.email || '';
  const clientInitial = client.initial || (client.firstName ? client.firstName.charAt(0).toUpperCase() : '?');

  // Get most recent note
  const mostRecentNote = notes.length > 0 ? notes[0] : null;

  // Get active membership (case-insensitive, trimmed)
  const activeMembership = memberships.find(m => m.status?.toLowerCase()?.trim() === 'active');

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: '2-digit',
      year: '2-digit'
    }); // e.g., 11/26
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
        
        <div className="sidebar-header-actions">
          <div style={{ position: 'relative' }}>
            <button 
              className="simple-actions-trigger"
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              ref={dropdownRef}
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
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-scroll-content">
        {/* Allergies (New Style) */}
        {allergies && allergies.length > 0 && (
          <>
            {allergies.map((allergy, index) => {
               // Determine severity class
               let severityClass = 'severity-mild'; // default
               if (allergy.severity === 'moderate') severityClass = 'severity-moderate';
               if (allergy.severity === 'severe') severityClass = 'severity-severe';
               if (allergy.severity === 'fatal') severityClass = 'severity-fatal';
  
               return (
                <div key={allergy._id || index} className="sidebar-allergy-card">
                  <div className="allergy-icon-wrapper">
                     {/* Dot pattern icon matching AddAllergyModal style */}
                     <div className={`allergy-severity-icon ${severityClass}`}>
                       {/* CSS radial-gradient handles the pattern */}
                     </div>
                  </div>
                  <div className="allergy-info">
                    <div className="allergy-name">{allergy.name}</div>
                    <div className="allergy-meta">
                      {allergy.severity ? `${allergy.severity} allergy` : 'Allergy'} 
                      {allergy.reaction ? ` • ${allergy.reaction}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="sidebar-divider" />
          </>
        )}
  
        {/* Active Membership (if any) */}
        {activeMembership && (
          <>
            <div className="sidebar-membership-card">
              <div className="membership-icon">
                {/* Using a simple div or icon for the card representation */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div className="membership-info">
                <div className="membership-name">{activeMembership.name}</div>
                <div className="membership-meta">
                  {activeMembership.remainingSessions !== undefined && activeMembership.numberOfSessions !== undefined ? (
                    <>
                      {activeMembership.remainingSessions}/{activeMembership.numberOfSessions} sessions • Expires {formatShortDate(activeMembership.endDate || activeMembership.expiryDate)}
                    </>
                  ) : (
                    <>
                      Expires {formatShortDate(activeMembership.endDate || activeMembership.expiryDate)}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="sidebar-divider" />
          </>
        )}
  
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
  
          {/* Most Recent Note */}
          {mostRecentNote && (
            <div className="info-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <FileText size={20} className="info-icon" />
                <span style={{ fontWeight: 600 }}>Recent Note</span>
              </div>
              <div style={{ paddingLeft: '28px', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                {mostRecentNote.content?.substring(0, 100)}
                {mostRecentNote.content?.length > 100 ? '...' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfileSidebar;
