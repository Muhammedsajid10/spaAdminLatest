import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import './ClientDetails.css';
import ClientProfileSidebar from './components/ClientProfileSidebar';
import ClientOverviewTab from './components/ClientOverviewTab';
import ClientAppointmentsTab from './components/ClientAppointmentsTab';
import useClientDetails from './hooks/useClientDetails';
import Loading from '../../states/Loading';

const ClientDetailsModal = ({ isOpen, onClose, clientId, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const { client, stats, loading, error } = useClientDetails(clientId);

  if (!isOpen) return null;

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Close documents dropdown if clicking other main tabs, optional
    if (tab !== 'documents' && tab !== 'notes' && tab !== 'allergy') {
      setIsDocumentsOpen(false);
    }
  };

  return (
    <div className="client-details-overlay" onClick={onClose}>
      <div className="client-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="client-details-close" onClick={onClose}>
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loading />
          </div>
        ) : error ? (
          <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>
        ) : client ? (
          <>
            {/* Left Sidebar */}
            <ClientProfileSidebar 
              client={client} 
              onEdit={onEdit}
              onDelete={onDelete}
            />

            {/* Right Content */}
            <div className="client-details-content">
              {/* Tabs (Vertical Sidebar) */}
              <div className="content-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => handleTabClick('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => handleTabClick('appointments')}
                >
                  Appointments
                  <span className="tab-badge">{stats.appointmentsCount || 0}</span>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                  onClick={() => handleTabClick('sales')}
                >
                  Sales
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => handleTabClick('details')}
                >
                  Client details
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                  onClick={() => handleTabClick('items')}
                >
                  Items
                </button>
                
                {/* Documents Dropdown */}
                <div className="nav-dropdown-container">
                  <button 
                    className={`tab-btn ${['documents', 'notes', 'allergy'].includes(activeTab) ? 'active' : ''}`}
                    onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
                  >
                    Documents
                    <ChevronDown 
                      size={12} 
                      style={{ 
                        marginLeft: 4, 
                        transform: isDocumentsOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </button>
                  
                  {isDocumentsOpen && (
                    <div className="nav-dropdown-items">
                      <button 
                        className={`tab-btn sub-item ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => handleTabClick('notes')}
                      >
                        Notes
                      </button>
                      <button 
                        className={`tab-btn sub-item ${activeTab === 'allergy' ? 'active' : ''}`}
                        onClick={() => handleTabClick('allergy')}
                      >
                        Allergy notes
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                  onClick={() => handleTabClick('wallet')}
                >
                  Wallet
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => handleTabClick('reviews')}
                >
                  Reviews
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content-area">
                {activeTab === 'overview' && (
                  <div className="tab-scrollable-content">
                    <h2 className="overview-section-title" style={{ fontSize: 24, marginBottom: 24 }}>Overview</h2>
                    <ClientOverviewTab stats={stats} />
                  </div>
                )}
                {activeTab === 'appointments' && (
                  <ClientAppointmentsTab client={client} />
                )}
                {activeTab === 'notes' && (
                   <div className="tab-scrollable-content">
                     <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
                       <h3>Notes</h3>
                       <p>No notes found.</p>
                     </div>
                   </div>
                )}
                {activeTab === 'allergy' && (
                   <div className="tab-scrollable-content">
                     <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
                       <h3>Allergy Notes</h3>
                       <p>No allergy notes found.</p>
                     </div>
                   </div>
                )}
                {activeTab !== 'overview' && activeTab !== 'appointments' && activeTab !== 'notes' && activeTab !== 'allergy' && (
                  <div className="tab-scrollable-content">
                    <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ClientDetailsModal;
