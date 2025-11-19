/**
 * ClientSelection Component
 * Step 4: Select or add client
 */

import React, { useState } from 'react';
import { User, Plus, UserPlus } from 'lucide-react';

const ClientSelection = ({ 
  clients, 
  selectedClient, 
  onSelectClient, 
  onNext, 
  onBack 
}) => {
  console.log('🔍 ClientSelection - clients:', clients);
  console.log('🔍 ClientSelection - clients count:', clients?.length);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const filteredClients = clients.filter(client => {
    const name = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    const phone = (client.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  const handleSelect = (client) => {
    onSelectClient(client);
    onNext();
  };

  const handleAddNew = () => {
    if (isWalkIn || (newClient.firstName && newClient.lastName)) {
      const clientData = isWalkIn ? {
        firstName: 'Walk-in',
        lastName: 'Customer',
        email: '',
        phone: '',
        isWalkIn: true
      } : newClient;
      
      onSelectClient(clientData);
      onNext();
    }
  };

  const handleWalkInToggle = () => {
    setIsWalkIn(!isWalkIn);
    if (!isWalkIn) {
      setNewClient({
        firstName: 'Walk-in',
        lastName: 'Customer',
        email: '',
        phone: ''
      });
    } else {
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
    }
  };

  if (showAddNew) {
    return (
      <div className="client-selection add-new-client">
        <h3>Add New Client</h3>
        
        <div className="walk-in-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isWalkIn}
              onChange={handleWalkInToggle}
            />
            <span className="toggle-text">Walk-in Customer (Skip details)</span>
          </label>
        </div>

        {!isWalkIn && (
          <div className="new-client-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                placeholder="client@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone (Optional)</label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        )}

        {isWalkIn && (
          <div className="walk-in-info">
            <p>✓ Walk-in customer selected. Click "Add Client" to continue.</p>
          </div>
        )}

        <div className="modal-actions">
          <button className="secondary-button" onClick={() => setShowAddNew(false)}>Cancel</button>
          <button 
            className="primary-button" 
            onClick={handleAddNew}
            disabled={!isWalkIn && (!newClient.firstName || !newClient.lastName)}
          >
            Add Client
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-selection">
      <h3>Select a Client</h3>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search clients by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <button 
        className="add-new-client-btn"
        onClick={() => setShowAddNew(true)}
      >
        <Plus size={20} /> Add New Client or Walk-in
      </button>

      <div className="clients-list">
        {filteredClients.map(client => (
          <div
            key={client._id}
            className={`client-card ${selectedClient?._id === client._id ? 'selected' : ''}`}
            onClick={() => handleSelect(client)}
          >
            <div className="client-avatar">
              <User size={24} />
            </div>
            <div className="client-info">
              <div className="client-name">
                {client.firstName} {client.lastName}
              </div>
              <div className="client-contact">
                {client.email} | {client.phone}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default ClientSelection;
