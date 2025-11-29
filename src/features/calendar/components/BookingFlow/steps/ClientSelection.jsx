/**
 * ClientSelection Component
 * Step 4 of Booking Flow
 */

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, User, Phone, Mail, X } from 'lucide-react';
import { Base_url } from '../../../../../Service/Base_url';
import styles from './ClientSelection.module.css';

const ClientSelection = ({ onSelect, selectedClient }) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchClients(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchClients = async (query) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${Base_url}/clients?search=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    // Validate
    if (!newClient.firstName || !newClient.phone) {
      alert('First Name and Phone are required');
      return;
    }

    // Pass new client data to parent
    onSelect({
      ...newClient,
      isNew: true,
      name: `${newClient.firstName} ${newClient.lastName}`.trim()
    });
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles.active : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={16} />
          Search Client
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <UserPlus size={16} />
          New Client
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className={styles.searchContent}>
          <div className={styles.searchContainer}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          <div className={styles.resultsList}>
            {loading && <div className={styles.loading}>Searching...</div>}
            
            {!loading && searchResults.map(client => (
              <div
                key={client._id || client.id}
                className={`${styles.clientCard} ${selectedClient?._id === client._id ? styles.selected : ''}`}
                onClick={() => onSelect(client)}
              >
                <div className={styles.avatar}>
                  <User size={20} />
                </div>
                <div className={styles.clientInfo}>
                  <h4 className={styles.clientName}>
                    {client.firstName} {client.lastName}
                  </h4>
                  <div className={styles.clientMeta}>
                    {client.phone && (
                      <span className={styles.metaItem}>
                        <Phone size={12} /> {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className={styles.metaItem}>
                        <Mail size={12} /> {client.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className={styles.noResults}>
                No clients found. <button onClick={() => setActiveTab('create')} className={styles.linkBtn}>Create new?</button>
              </div>
            )}
            
            {/* Walk-in Option */}
            {!searchQuery && (
              <div
                className={`${styles.clientCard} ${selectedClient?.isWalkIn ? styles.selected : ''}`}
                onClick={() => onSelect({ firstName: 'Walk-in', lastName: 'Guest', isWalkIn: true })}
              >
                <div className={styles.avatar}>
                  <User size={20} />
                </div>
                <div className={styles.clientInfo}>
                  <h4 className={styles.clientName}>Walk-in Guest</h4>
                  <p className={styles.clientMeta}>Anonymous booking</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className={styles.createContent}>
          <div className={styles.formGroup}>
            <label>First Name *</label>
            <input
              type="text"
              value={newClient.firstName}
              onChange={e => setNewClient({...newClient, firstName: e.target.value})}
              placeholder="Enter first name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input
              type="text"
              value={newClient.lastName}
              onChange={e => setNewClient({...newClient, lastName: e.target.value})}
              placeholder="Enter last name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Phone *</label>
            <input
              type="tel"
              value={newClient.phone}
              onChange={e => setNewClient({...newClient, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={newClient.email}
              onChange={e => setNewClient({...newClient, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          
          <button 
            className={styles.createButton}
            onClick={handleCreateClient}
            disabled={!newClient.firstName || !newClient.phone}
          >
            Create & Select Client
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientSelection;
