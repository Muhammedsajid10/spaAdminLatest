/**
 * ClientSelection Component
 * Step 4: Select or add client
 */

import React, { useState, useEffect } from 'react';
import { User, Plus, UserPlus } from 'lucide-react';

const ClientSelection = ({ 
  clients, 
  selectedClient, 
  onSelectClient, 
  onNext, 
  onBack 
}) => {
  console.log('🔍 ClientSelection RENDER');
  console.log('🔍 ClientSelection - RAW clients prop:', clients);
  console.log('🔍 ClientSelection - Type of clients:', typeof clients);
  console.log('🔍 ClientSelection - Is Array?:', Array.isArray(clients));
  console.log('🔍 ClientSelection - clients count:', clients?.length);
  
  // Log first 3 clients if available
  if (Array.isArray(clients) && clients.length > 0) {
    console.log('🔍 First 3 clients:', clients.slice(0, 3));
  }
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [activeClientId, setActiveClientId] = useState(selectedClient?._id || null);

  useEffect(() => {
    setActiveClientId(selectedClient?._id || null);
  }, [selectedClient]);

  // Ensure clients is always an array
  const clientsList = Array.isArray(clients) ? clients : [];
  
  // Filter clients based on search query
  const filteredClients = clientsList.filter(client => {
    if (!searchQuery.trim()) return true; // Show all when no search query
    
    const name = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    const phone = (client.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  // Sort filtered clients alphabetically by first name, then last name
  const sortedClients = [...filteredClients].sort((a, b) => {
    const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
    const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  console.log('🔍 Total clients:', clientsList.length);
  console.log('🔍 Filtered clients:', filteredClients.length);
  console.log('🔍 Sorted clients:', sortedClients.length);

  const handleSelect = (client) => {
    setActiveClientId(client._id || null);
    onSelectClient(client);
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

  const handleWalkInNow = () => {
    const walkInClient = {
      firstName: 'Walk-in',
      lastName: 'Customer',
      email: '',
      phone: '',
      isWalkIn: true
    };
    onSelectClient(walkInClient);
    onNext();
  };

  const handleContinue = () => {
    if (!activeClientId && !selectedClient) return;
    onNext();
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
        {sortedClients.length > 0 ? (
          sortedClients.map(client => (
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
                  {client.email}{client.email && client.phone ? ' | ' : ''}{client.phone}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>{searchQuery ? 'No clients found matching your search.' : 'No clients available. Add a new client to get started.'}</p>
            <div className="walk-in-cta">
              <p>Prefer to continue quickly? Use a walk-in customer.</p>
              <button className="primary-button" onClick={handleWalkInNow}>
                Continue as Walk-in
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="secondary-button" onClick={onBack}>Back</button>
        <button className="secondary-button" onClick={handleWalkInNow}>
          Continue as Walk-in
        </button>
        <button
          className="primary-button"
          onClick={handleContinue}
          disabled={!activeClientId && !selectedClient}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ClientSelection;
