import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import './AddAllergyModal.css';

const REACTION_OPTIONS = [
  "Acute kidney failure", "Altered mental state", "Anaphylaxis", "Angioedema", 
  "Arthralgia", "Chills", "Cough", "Diarrhea", "Dizziness", "Fever", 
  "Gastrointestinal irritation", "Headache", "Hives", "Itching", "Myalgia", 
  "Nasal congestion", "Nausea", "Pain in injection site", "Palpitations", 
  "Rash", "Respiratory distress", "Rhinorrhea", "Shortness of breath", 
  "Sneezing", "Sore throat", "Swelling", "Vomiting"
];

const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild', colorClass: 'severity-mild' },
  { id: 'moderate', label: 'Moderate', colorClass: 'severity-moderate' },
  { id: 'severe', label: 'Severe', colorClass: 'severity-severe' },
  { id: 'fatal', label: 'Fatal', colorClass: 'severity-fatal' }
];

const AddAllergyModal = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('non-drug'); // 'non-drug', 'drug', 'no-known'
  const [formData, setFormData] = useState({
    name: '',
    reaction: '',
    severity: '',
    note: ''
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      type: activeTab,
      ...formData
    });
    onClose();
    // Reset form
    setFormData({ name: '', reaction: '', severity: '', note: '' });
    setActiveTab('non-drug');
  };

  const renderFormContent = () => {
    if (activeTab === 'no-known') {
      return (
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="form-label">Note</label>
            <span className="char-count">{formData.note.length}/1000</span>
          </div>
          <textarea
            className="allergy-textarea"
            placeholder="Enter allergy notes here"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            maxLength={1000}
          />
        </div>
      );
    }

    return (
      <>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter allergy name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div className="form-group" ref={dropdownRef}>
            <label className="form-label">Reaction</label>
            <div 
              className={`custom-select-trigger ${isDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={formData.reaction ? '' : 'placeholder'}>
                {formData.reaction || "Select an option"}
              </span>
              <ChevronDown size={16} />
            </div>
            {isDropdownOpen && (
              <div className="custom-select-options">
                {REACTION_OPTIONS.map(option => (
                  <div 
                    key={option} 
                    className={`custom-option ${formData.reaction === option ? 'selected' : ''}`}
                    onClick={() => {
                      handleInputChange('reaction', option);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Severity</label>
          <p className="form-sublabel">Leave empty if severity unknown</p>
          <div className="severity-grid">
            {SEVERITY_LEVELS.map(level => (
              <div
                key={level.id}
                className={`severity-card ${formData.severity === level.id ? 'selected' : ''}`}
                onClick={() => handleInputChange('severity', level.id)}
              >
                <div className={`severity-icon ${level.colorClass}`}>
                  {/* Dot pattern simulated by CSS radial-gradient */}
                </div>
                <span className="severity-label">{level.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="form-label">Note</label>
            <span className="char-count">{formData.note.length}/1000</span>
          </div>
          <textarea
            className="allergy-textarea"
            placeholder="Enter allergy notes here"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            maxLength={1000}
          />
        </div>
      </>
    );
  };

  return (
    <div className="add-allergy-overlay" onClick={onClose}>
      <div className="add-allergy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-allergy-header">
          <h3 className="add-allergy-title">Add allergy</h3>
          <button className="add-allergy-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="add-allergy-body">
          <div className="allergy-tabs">
            <button
              className={`allergy-tab ${activeTab === 'non-drug' ? 'active' : ''}`}
              onClick={() => setActiveTab('non-drug')}
            >
              Non-drug allergy
            </button>
            <button
              className={`allergy-tab ${activeTab === 'drug' ? 'active' : ''}`}
              onClick={() => setActiveTab('drug')}
            >
              Drug allergy
            </button>
            <button
              className={`allergy-tab ${activeTab === 'no-known' ? 'active' : ''}`}
              onClick={() => setActiveTab('no-known')}
            >
              No known allergies
            </button>
          </div>

          {renderFormContent()}
        </div>

        <div className="add-allergy-footer">
          <button className="btn-save-allergy" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAllergyModal;
