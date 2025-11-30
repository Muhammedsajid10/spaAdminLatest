import React, { useState, useMemo } from 'react';
import { FileText, Calendar, Pin, Trash2 } from 'lucide-react';
import './ClientNotesTab.css';

const ClientNotesTab = ({ client, notes, onAddNote, onDeleteNote, onPinNote }) => {
  const [activeSubTab, setActiveSubTab] = useState('client');

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    
    // Filter by type
    const filtered = notes.filter(note => note.type === activeSubTab);
    
    // Sort: pinned first, then by date (newest first)
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [notes, activeSubTab]);

  const clientNotesCount = useMemo(() => {
    if (!notes) return 0;
    return notes.filter(note => note.type === 'client').length;
  }, [notes]);

  const appointmentNotesCount = useMemo(() => {
    if (!notes) return 0;
    return notes.filter(note => note.type === 'appointment').length;
  }, [notes]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notes-tab-container">
      <div className="notes-header">
        <h2 className="notes-title">Notes</h2>
        <button className="btn-add-note" onClick={onAddNote}>
          Add
        </button>
      </div>

      <div className="notes-subtabs">
        <button 
          className={`subtab-btn ${activeSubTab === 'client' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('client')}
        >
          Client notes ({clientNotesCount})
        </button>
        <button 
          className={`subtab-btn ${activeSubTab === 'appointment' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('appointment')}
        >
          Appointment notes ({appointmentNotesCount})
        </button>
      </div>

      <div className="notes-content">
        {filteredNotes.length === 0 ? (
          <>
            {activeSubTab === 'client' && (
              <div className="empty-state-container">
                <div className="empty-icon-wrapper">
                  <FileText size={32} />
                </div>
                <h3 className="empty-title">No notes</h3>
                <p className="empty-description">
                  No notes have been created for this client
                </p>
              </div>
            )}

            {activeSubTab === 'appointment' && (
              <div className="empty-state-container">
                <div className="empty-icon-wrapper">
                  <Calendar size={32} />
                </div>
                <h3 className="empty-title">No appointment notes</h3>
                <p className="empty-description">
                  No appointment notes have been created for this client
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="notes-list">
            {filteredNotes.map((note) => (
              <div key={note._id} className={`note-card ${note.isPinned ? 'pinned' : ''}`}>
                <div className="note-card-header">
                  <div className="note-meta">
                    <span className="note-author">
                      {/* {note.createdBy?.firstName} {note.createdBy?.lastName} */}
                    </span>
                    <span className="note-date">{formatDate(note.createdAt)}</span>
                    {note.isPrivate && <span className="private-badge">🔒 Private</span>}
                  </div>
                  <div className="note-actions">
                    <button 
                      className={`action-btn pin-btn ${note.isPinned ? 'pinned' : ''}`}
                      onClick={() => onPinNote(note._id)}
                      title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                      <Pin size={16} />
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => onDeleteNote(note._id)}
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {note.booking && (
                  <div className="note-booking-info">
                    <span className="booking-label">Appointment:</span>
                    <span className="booking-services">
                      {note.booking.services?.map(s => s.service?.name).filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="note-content">
                  {note.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotesTab;
