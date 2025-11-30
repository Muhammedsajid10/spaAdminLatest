import React from 'react';
import { Heart, AlertCircle, Trash2 } from 'lucide-react';
import './ClientAllergiesTab.css';

const ClientAllergiesTab = ({ client, allergies = [], onAddAllergy, onDeleteAllergy }) => {
  // Format allergies for display
  const formattedAllergies = allergies.map(allergy => {
    const createdBy = allergy.createdBy 
      ? `${allergy.createdBy.firstName || ''} ${allergy.createdBy.lastName || ''}`.trim()
      : 'Unknown';
    
    const createdDate = allergy.createdAt 
      ? new Date(allergy.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '';

    return {
      id: allergy._id,
      type: allergy.type,
      name: allergy.name,
      reaction: allergy.reaction,
      severity: allergy.severity,
      note: allergy.note,
      status: allergy.status,
      createdBy,
      createdDate
    };
  });

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'mild': return 'severity-badge-mild';
      case 'moderate': return 'severity-badge-moderate';
      case 'severe': return 'severity-badge-severe';
      case 'fatal': return 'severity-badge-fatal';
      default: return 'severity-badge-unknown';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'drug': return 'type-badge-drug';
      case 'non-drug': return 'type-badge-non-drug';
      case 'no-known': return 'type-badge-no-known';
      default: return 'type-badge-default';
    }
  };

  const handleDelete = (allergyId) => {
    if (window.confirm('Are you sure you want to delete this allergy?')) {
      onDeleteAllergy(allergyId);
    }
  };

  return (
    <div className="allergies-tab-container">
      <div className="allergies-header">
        <h2 className="allergies-title">Allergies</h2>
        <button className="btn-add-allergy" onClick={onAddAllergy}>
          Add
        </button>
      </div>

      <div className="allergies-content">
        {formattedAllergies.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-icon-wrapper">
              <Heart size={32} fill="#6366f1" />
            </div>
            <h3 className="empty-title">No allergies</h3>
            <p className="empty-description">
              No allergies have been added for this client
            </p>
          </div>
        ) : (
          <div className="allergies-list">
            {formattedAllergies.map((allergy) => (
              <div key={allergy.id} className="allergy-card">
                <div className="allergy-card-header">
                  <div className="allergy-badges">
                    <span className={`type-badge ${getTypeBadgeClass(allergy.type)}`}>
                      {allergy.type === 'non-drug' ? 'Non-Drug' : 
                       allergy.type === 'drug' ? 'Drug' : 'No Known Allergies'}
                    </span>
                    {allergy.severity && (
                      <span className={`severity-badge ${getSeverityBadgeClass(allergy.severity)}`}>
                        {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                      </span>
                    )}
                  </div>
                  <button 
                    className="btn-delete-allergy" 
                    onClick={() => handleDelete(allergy.id)}
                    title="Delete allergy"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {allergy.type !== 'no-known' && (
                  <>
                    <div className="allergy-info">
                      <div className="allergy-field">
                        <span className="allergy-label">Name:</span>
                        <span className="allergy-value">{allergy.name || '-'}</span>
                      </div>
                      <div className="allergy-field">
                        <span className="allergy-label">Reaction:</span>
                        <span className="allergy-value">{allergy.reaction || '-'}</span>
                      </div>
                    </div>
                  </>
                )}

                {allergy.note && (
                  <div className="allergy-note">
                    <AlertCircle size={14} />
                    <span>{allergy.note}</span>
                  </div>
                )}

                <div className="allergy-footer">
                  <span className="allergy-meta">
                    Added by {allergy.createdBy} on {allergy.createdDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAllergiesTab;
