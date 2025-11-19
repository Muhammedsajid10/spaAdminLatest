/**
 * ClientSelection Component
 * Step 4: Select or add client
 */

import React, { useState } from 'react';
import { User } from 'lucide-react';

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
