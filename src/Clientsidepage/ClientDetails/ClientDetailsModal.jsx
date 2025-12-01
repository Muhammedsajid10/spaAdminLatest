import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import './ClientDetails.css';
import ClientProfileSidebar from './components/ClientProfileSidebar';
import ClientOverviewTab from './components/ClientOverviewTab';
import ClientAppointmentsTab from './components/ClientAppointmentsTab';
import ClientSalesTab from './components/ClientSalesTab';
import ClientInfoTab from './components/ClientInfoTab';
import ClientItemsTab from './components/ClientItemsTab';
import ClientNotesTab from './components/ClientNotesTab';
import AddNoteModal from './components/AddNoteModal';
import useClientDetails from './hooks/useClientDetails';
import AddAllergyModal from './components/AddAllergyModal';
import ClientAllergiesTab from './components/ClientAllergiesTab';
import ClientGiftCardsTab from './components/ClientGiftCardsTab';
import ClientReviewsTab from './components/ClientReviewsTab';
import Loading from '../../states/Loading';
import clientService from './services/clientService';



// ... (existing imports)

const ClientDetailsModal = ({ isOpen, onClose, clientId, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const { client, stats, allBookings, bookings, sales, giftCards, reviews, memberships, servicesMap, employeesMap, allergies, notes, loading, error, updateClient, refetch } = useClientDetails(clientId);

  if (!isOpen) return null;

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Close documents dropdown if clicking other main tabs, optional
    if (tab !== 'documents' && tab !== 'notes' && tab !== 'allergy') {
      setIsDocumentsOpen(false);
    }
  };

  const handleSaveNote = async (noteContent) => {
    try {
      await clientService.createNote(clientId, { 
        content: noteContent, 
        type: 'client' 
      });
      refetch(); // Reload all data including new note
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await clientService.deleteNote(noteId);
        refetch(); // Reload data
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  const handlePinNote = async (noteId) => {
    try {
      await clientService.togglePinNote(noteId);
      refetch(); // Reload data to update pin status
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      alert('Failed to toggle pin. Please try again.');
    }
  };

  const handleSaveAllergy = async (allergyData) => {
    try {
      await clientService.createAllergy(clientId, allergyData);
      // Refresh client data to show new allergy
      refetch();
    } catch (error) {
      console.error('Failed to save allergy:', error);
      alert('Failed to save allergy. Please try again.');
    }
  };

  const handleDeleteAllergy = async (allergyId) => {
    try {
      await clientService.deleteAllergy(allergyId);
      // Refresh client data to remove deleted allergy
      refetch();
    } catch (error) {
      console.error('Failed to delete allergy:', error);
      alert('Failed to delete allergy. Please try again.');
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
              allergies={allergies}
              notes={notes}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddNote={() => setIsAddNoteOpen(true)}
              onAddAllergy={() => setIsAddAllergyOpen(true)}
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
                        Allergies
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  className={`tab-btn ${activeTab === 'giftcards' ? 'active' : ''}`}
                  onClick={() => handleTabClick('giftcards')}
                >
                  Gift cards
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
                    <ClientOverviewTab stats={stats} giftCards={giftCards} bookings={bookings} />
                  </div>
                )}
                {activeTab === 'appointments' && (
                  <ClientAppointmentsTab 
                    client={client} 
                    bookings={allBookings}
                    servicesMap={servicesMap}
                    employeesMap={employeesMap}
                  />
                )}
                {activeTab === 'sales' && (
                  <ClientSalesTab 
                    client={client} 
                    sales={sales}
                    servicesMap={servicesMap}
                  />
                )}
                {activeTab === 'details' && (
                  <ClientInfoTab 
                    client={client} 
                    onUpdate={updateClient}
                  />
                )}
                {activeTab === 'items' && (
                  <ClientItemsTab 
                    client={client} 
                    bookings={bookings}
                    memberships={memberships}
                    servicesMap={servicesMap}
                  />
                )}
                {activeTab === 'notes' && (
                  <ClientNotesTab 
                    client={client} 
                    notes={notes}
                    onAddNote={() => setIsAddNoteOpen(true)}
                    onDeleteNote={handleDeleteNote}
                    onPinNote={handlePinNote}
                  />
                )}
                {activeTab === 'allergy' && (
                   <ClientAllergiesTab 
                     client={client}
                     allergies={allergies}
                     onAddAllergy={() => setIsAddAllergyOpen(true)}
                     onDeleteAllergy={handleDeleteAllergy}
                   />
                )}
                {activeTab === 'giftcards' && (
                   <ClientGiftCardsTab client={client} giftCards={giftCards} />
                )}
                {activeTab === 'reviews' && (
                   <ClientReviewsTab client={client} reviews={reviews} />
                )}
                {activeTab !== 'overview' && activeTab !== 'appointments' && activeTab !== 'sales' && activeTab !== 'details' && activeTab !== 'items' && activeTab !== 'notes' && activeTab !== 'allergy' && activeTab !== 'giftcards' && activeTab !== 'reviews' && (
                  <div className="tab-scrollable-content">
                    <div className="coming-soon-message">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modals */}
            <AddNoteModal 
              isOpen={isAddNoteOpen} 
              onClose={() => setIsAddNoteOpen(false)} 
              onSave={handleSaveNote}
            />
            <AddAllergyModal
              isOpen={isAddAllergyOpen}
              onClose={() => setIsAddAllergyOpen(false)}
              onSave={handleSaveAllergy}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ClientDetailsModal;
