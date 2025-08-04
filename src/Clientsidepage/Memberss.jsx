import React, { useState } from 'react';
import { CiFilter } from "react-icons/ci";
import './Memberss.css';

const allMemberships = [
  {
    name: 'W residence',
    services: '2 services',
    valid: '2 years',
    sessions: '5 sessions',
    price: 'AED 1,600',
    iconColor: '#0d1b2a',
  },
  {
    name: 'Couple',
    services: '2 services',
    valid: '5 years',
    sessions: '10 sessions',
    price: 'AED 1,500',
    iconColor: '#0d1b2a',
  },
  {
    name: '90min deeptissue 30min scrub',
    services: '2 services',
    valid: '1 month',
    sessions: '5 sessions',
    price: 'AED 1,850',
    iconColor: '#4285F4',
  },
  {
    name: 'mr perfect(sajid)',
    services: '2 services',
    valid: '2 years',
    sessions: '5 sessions',
    price: 'AED 10,6000',
    iconColor: '#0d1b2a',
  },
];

const MembershipTable = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMemberships = allMemberships.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="membership-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h2 className="page-title">Memberships</h2>
        <div className="action-buttons">
          <button className='secondary-button'>Options</button>
          <button className='primary-button'>Add</button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-controls">
        <input
          className='search-input'
          type="text"
          placeholder="Search by membership name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
       
      </div>

      {/* Table Header */}
      <div className="data-table-header">
        <span>Membership name</span>
        <span>Valid for</span>
        <span>Sessions</span>
        <span>Price</span>
      </div>

      {/* Table Rows */}
      {filteredMemberships.map((item, index) => (
        <div className="data-table-row" key={index}>
          <div className="membership-info">
            <div className="membership-icon" style={{ backgroundColor: item.iconColor }}>📅</div>
            <div className="membership-details">
              <div className="membership-title">{item.name}</div>
              <div className="membership-subtitle">{item.services}</div>
            </div>
          </div>
          <span className="validity-period">{item.valid}</span>
          <span className="session-count">{item.sessions}</span>
          <span className="membership-price">{item.price}</span>
        </div>
      ))}

      {/* Empty State */}
      {filteredMemberships.length === 0 && (
        <div className="empty-state">No memberships found.</div>
      )}
    </div>
  );
};

export default MembershipTable;