import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import './ClientInfoTab.css';

const ClientInfoTab = ({ client, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  console.log('📋 ClientInfoTab received:', {
    clientProp: client,
    firstName: client?.firstName,
    lastName: client?.lastName,
    email: client?.email,
    phone: client?.phone
  });

  // Safety check - if client is null/undefined, show loading or error
  if (!client) {
    return (
      <div className="client-info-container">
        <p>Loading client data...</p>
      </div>
    );
  }

  // Initialize form data when entering edit mode
  const handleEditClick = () => {
    setFormData({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      dob: client.dob || '', // Assuming format YYYY-MM-DD or similar
      gender: client.gender || '',
      pronouns: client.pronouns || '',
      clientSource: client.clientSource || '',
      referredBy: client.referredBy || '',
      preferredLanguage: client.preferredLanguage || '',
      country: client.country || '',
      occupation: client.occupation || '',
      additionalEmail: client.additionalEmail || '',
      additionalPhone: client.additionalPhone || '',
      address: client.address || '',
      city: client.city || '',
      zipCode: client.zipCode || '',
      state: client.state || ''
    });
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update client:", error);
      // Optionally handle error state here (e.g., show toast)
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Simple formatter, adjust based on actual date format
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderField = (label, name, value, type = 'text', options = []) => {
    const displayValue = value || '-';
    const isValueEmpty = !value;

    return (
      <div className="info-field">
        <label className="field-label">{label}</label>
        {isEditing ? (
          type === 'select' ? (
            <select
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="edit-select"
            >
              <option value="">Select {label}</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="edit-input"
              placeholder={label}
            />
          )
        ) : (
          <div className={`field-value ${isValueEmpty ? 'empty' : ''}`}>
            {name === 'dob' || name === 'joined' ? formatDate(value) : displayValue}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="client-info-container">
      <div className="client-info-header">
        <h2 className="client-info-title">Client details</h2>
        {!isEditing ? (
          <button className="btn-edit-client" onClick={handleEditClick}>
            Edit <Pencil size={14} />
          </button>
        ) : (
          <div className="edit-actions">
            <button className="btn-cancel-edit" onClick={handleCancelClick} disabled={loading}>
              Cancel
            </button>
            <button className="btn-edit-client btn-save-client" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'} <Check size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="client-info-section">
        <h3 className="section-title">Profile</h3>
        <div className="info-grid">
          {console.log('🔍 Rendering fields:', {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            dob: client.dob,
            gender: client.gender,
            createdAt: client.createdAt
          })}
          {renderField('First name', 'firstName', client.firstName)}
          {renderField('Last name', 'lastName', client.lastName)}
          {renderField('Email', 'email', client.email, 'text')}
          {renderField('Phone number', 'phone', client.phone, 'tel')}
          {renderField('Date of birth', 'dob', client.dob, 'date')}
          {renderField('Gender', 'gender', client.gender, 'select', ['Male', 'Female', 'Non-binary', 'Prefer not to say'])}
          {renderField('Pronouns', 'pronouns', client.pronouns, 'select', ['He/Him', 'She/Her', 'They/Them', 'Not specified'])}
          <div className="info-field">
            <label className="field-label">Joined</label>
            <div className="field-value">{formatDate(client.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      {/* <div className="client-info-section">
        <h3 className="section-title">Additional info</h3>
        <div className="info-grid">
          {renderField('Client source', 'clientSource', client.clientSource, 'select', ['Walk-In', 'Google', 'Social Media', 'Referral'])}
          {renderField('Referred by', 'referredBy', client.referredBy)}
          {renderField('Preferred language', 'preferredLanguage', client.preferredLanguage)}
          {renderField('Country', 'country', client.country)}
          {renderField('Occupation', 'occupation', client.occupation)}
          {renderField('Additional email', 'additionalEmail', client.additionalEmail, 'text')}
          {renderField('Additional phone', 'additionalPhone', client.additionalPhone, 'tel')}
        </div>
      </div> */}

      {/* Addresses Section */}
      {/* <div className="client-info-section">
        <h3 className="section-title">Addresses</h3>
        <div className="info-grid">
          {renderField('Address', 'address', client.address)}
          {renderField('City', 'city', client.city)}
          {renderField('Zip Code', 'zipCode', client.zipCode)}
          {renderField('State', 'state', client.state)}
        </div>
      </div> */}
    </div>
  );
};

export default ClientInfoTab;
