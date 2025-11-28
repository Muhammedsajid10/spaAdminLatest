import React from 'react';
import { Heart } from 'lucide-react';
import './ClientAllergiesTab.css';

const ClientAllergiesTab = ({ client, onAddAllergy }) => {
  return (
    <div className="allergies-tab-container">
      <div className="allergies-header">
        <h2 className="allergies-title">Allergies</h2>
        <button className="btn-add-allergy" onClick={onAddAllergy}>
          Add
        </button>
      </div>

      <div className="allergies-content">
        <div className="empty-state-container">
          <div className="empty-icon-wrapper">
            <Heart size={32} fill="#6366f1" />
          </div>
          <h3 className="empty-title">No allergies</h3>
          <p className="empty-description">
            No allergies have been added for this client
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientAllergiesTab;
