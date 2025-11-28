import React, { useState } from 'react';
import { FileText, Calendar } from 'lucide-react';
import './ClientNotesTab.css';

const ClientNotesTab = ({ client, onAddNote }) => {
  const [activeSubTab, setActiveSubTab] = useState('client');

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
          Client notes
        </button>
        <button 
          className={`subtab-btn ${activeSubTab === 'appointment' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('appointment')}
        >
          Appointment notes
        </button>
      </div>

      <div className="notes-content">
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
      </div>
    </div>
  );
};

export default ClientNotesTab;
