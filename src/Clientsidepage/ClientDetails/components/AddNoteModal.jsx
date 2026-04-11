import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddNoteModal.css';

const AddNoteModal = ({ isOpen, onClose, onSave }) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (note.trim()) {
      onSave(note);
      setNote(''); // Clear after save
      onClose();
    }
  };

  return (
    <div className="add-note-overlay" onClick={onClose}>
      <div className="add-note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-note-header">
          <h3 className="add-note-title">Add a note</h3>
          <button className="add-note-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="add-note-body">
          <textarea
            className="add-note-textarea"
            placeholder="Add a note here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="add-note-footer">
          {/* <button className="btn-cancel-note" onClick={onClose}>Cancel</button> */}
          <button 
            className="btn-save-note" 
            onClick={handleSave}
            disabled={!note.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
