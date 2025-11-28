import React, { useState } from 'react';
import { User } from 'lucide-react';
import './ClientItemsTab.css';

const MOCK_SERVICES = [
  {
    id: 1,
    name: 'Relaxing Massage',
    date: 'Fri 28 Nov',
    location: 'Allora Spa Dubai',
    price: 400
  },
  {
    id: 2,
    name: 'Relaxing Massage',
    date: 'Fri 28 Nov',
    location: 'Allora Spa Dubai',
    price: 400
  }
];

const ClientItemsTab = ({ client }) => {
  const [activeSubTab, setActiveSubTab] = useState('memberships');

  return (
    <div className="items-tab-container">
      <div className="items-header">
        <h2 className="items-title">Items</h2>
        <div className="items-subtabs">
          <button 
            className={`subtab-btn ${activeSubTab === 'memberships' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('memberships')}
          >
            Memberships
          </button>
          <button 
            className={`subtab-btn ${activeSubTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('services')}
          >
            Services
            <span className="subtab-count">{MOCK_SERVICES.length}</span>
          </button>
        </div>
      </div>

      <div className="items-content">
        {activeSubTab === 'memberships' && (
          <div className="empty-state-container">
            <div className="empty-icon-wrapper">
              <User size={32} />
            </div>
            <h3 className="empty-title">No memberships</h3>
            <p className="empty-description">
              No memberships have been sold to this client
            </p>
          </div>
        )}

        {activeSubTab === 'services' && (
          <div className="services-list">
            {MOCK_SERVICES.map(service => (
              <div key={service.id} className="item-card">
                <div className="item-card-content">
                  <div className="item-info">
                    <span className="item-name">{service.name}</span>
                    <span className="item-meta">{service.date} • with {service.location}</span>
                  </div>
                  <span className="item-price">AED {service.price}</span>
                </div>
                <button className="btn-view-sale">View sale</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientItemsTab;
