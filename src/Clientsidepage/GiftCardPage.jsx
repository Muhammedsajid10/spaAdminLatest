import React, { useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import { FaGift } from "react-icons/fa";
import api from '../Service/Api';
import './GiftCardPage.css';
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoData from "../states/NoData";

const CreateGiftCardModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    validFor: '6 months',
    code: ''
  });
  const [loading, setLoading] = useState(false);

  // Generate unique code when modal opens
  useEffect(() => {
    if (isOpen) {
      generateUniqueCode();
    }
  }, [isOpen]);

  const generateUniqueCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        code: formData.code,
        validFor: formData.validFor,
        status: 'Available', // Not assigned to any client yet
        assignedTo: null,
        purchaseDate: null,
        expiryDate: null // Will be set when assigned to client
      };

      // Replace with your actual API endpoint
      await api.post('/giftcards/admin/create', payload);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        amount: '',
        validFor: '6 months',
        code: ''
      });
    } catch (err) {
      console.error('Failed to create gift card:', err);
      alert('Failed to create gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="giftcard-modal-small">
        <div className="modal-header">
          <h2>Create Gift Card</h2>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="giftcard-form-compact">
          <div className="form-group">
            <label>Gift Card Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Relaxation Package"
              required
            />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <div className="price-input">
              <span className="currency">AED</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="100"
                min="1"
                step="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Valid For</label>
            <select
              value={formData.validFor}
              onChange={(e) => setFormData(prev => ({ ...prev, validFor: e.target.value }))}
              required
            >
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
              <option value="2 years">2 Years</option>
            </select>
          </div>

          <div className="form-group">
            <label>Unique Code</label>
            <div className="code-input">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Generated code"
                maxLength="8"
                required
              />
              <button 
                type="button" 
                className="regenerate-btn"
                onClick={generateUniqueCode}
              >
                Generate
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Gift Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GiftCardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Updated mock data to reflect new structure
  // const mockGiftCards = [
  //   {
  //     _id: '1',
  //     name: 'Relaxation Package',
  //     amount: 150,
  //     code: 'RELAX150',
  //     status: 'Available',
  //     validFor: '1 year',
  //     assignedTo: null,
  //     purchaseDate: null,
  //     expiryDate: null,
  //     createdAt: '2025-01-15'
  //   },
  //   {
  //     _id: '2',
  //     name: 'Spa Day Special',
  //     amount: 300,
  //     code: 'SPA300',
  //     status: 'Active',
  //     validFor: '6 months',
  //     assignedTo: 'John Doe',
  //     purchaseDate: '2025-01-10',
  //     expiryDate: '2025-07-10',
  //     createdAt: '2025-01-05'
  //   },
  //   {
  //     _id: '3',
  //     name: 'Weekend Treat',
  //     amount: 75,
  //     code: 'WEEKEND75',
  //     status: 'Expired',
  //     validFor: '1 year',
  //     assignedTo: 'Jane Smith',
  //     purchaseDate: '2023-12-01',
  //     expiryDate: '2024-12-01',
  //     createdAt: '2023-11-25'
  //   }
  // ];

  const fetchGiftCards = async () => {
    setLoading(true);
    setError(null);
    try {
      // real API call
      const res = await api.get('/giftcards/admin/all');
      // normalized extraction: backend may nest differently
      const payload = res?.data || {};
      const successFlag = payload?.success;
      const candidate = payload?.data?.giftCards ?? payload?.data ?? payload?.giftCards ?? [];

      // If API explicitly returned an error
      if (successFlag === false) {
        const msg = payload?.message || 'No gift cards available';
        setGiftCards([]);
        setError(msg);
        return;
      }

      // Accept only arrays as valid list
      if (!Array.isArray(candidate)) {
        console.warn('Unexpected giftcards response shape — treating as no data', candidate);
        setGiftCards([]);
      } else {
        setGiftCards(candidate);
      }
    } catch (err) {
      console.error('Failed to load gift cards:', err);
      setError(err.response?.data?.message || err.message || 'Network or server error while loading gift cards');
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const filteredGiftCards = giftCards.filter(card =>
    (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSuccess = () => {
    fetchGiftCards(); // Refresh the list
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#3b82f6'; // Blue for available
      case 'active': return '#10b981'; // Green for active (assigned)
      case 'expired': return '#ef4444'; // Red for expired
      case 'redeemed': return '#6b7280'; // Gray for redeemed
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // --- Global states handling ---
  if (loading) {
    return (
      <div className="giftcard-dashboard">
        <div className="dashboard-header">
          <h2 className="page-title">Gift Cards</h2>
        </div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="giftcard-dashboard">
        <div className="dashboard-header">
          <h2 className="page-title">Gift Cards</h2>
        </div>
        <Error500Page message={error} />
      </div>
    );
  }

  if (!loading && giftCards.length === 0) {
    return (
      <div className="giftcard-dashboard" style={{ padding: 24, textAlign: 'center' }}>
        <div className="dashboard-header">
          <h2 className="page-title">Gift Cards</h2>
        </div>

        <NoData message="No gift cards available." />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            className='add-button'
            onClick={() => setShowCreateModal(true)}
            style={{ background: '#111', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
          >
            Add Gift Card
          </button>
          <button
            className='retry-button'
            onClick={fetchGiftCards}
            style={{ background: '#fff', color: '#111', padding: '8px 12px', borderRadius: 6, border: '1px solid #111', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>

        <CreateGiftCardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  return (
    <div className="giftcard-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="page-title">Gift Cards</h2>
          <p className="page-subtitle">Create gift cards here</p>
        </div>
        <div className="action-buttons">
          <button 
            className='add-button'
            onClick={() => setShowCreateModal(true)}
          >
            Add
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-controls">
        <input
          className='search-input'
          type="text"
          placeholder="Search gift cards"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Gift Cards Grid */}
      <div className="giftcards-grid">
        {filteredGiftCards.map((card) => (
          <div className="giftcard-item" key={card._id}>
            <div className="giftcard-header">
              <div className="giftcard-icon">
                <FaGift />
              </div>
            
            </div>
            
            <div className="giftcard-content">
              <h3 className="giftcard-name">{card.name}</h3>
              <div className="giftcard-code">Code: {card.code}</div>
              <div className="giftcard-amount">AED {card.amount}</div>
              <div className="giftcard-validity">Valid for: {card.validFor}</div>
              
              {/* Only show expiry date if card is assigned to client */}
         
              
        
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGiftCards.length === 0 && (
        <div className="empty-state">
          <FaGift className="empty-icon" />
          <h3>No gift cards found</h3>
          <p>Create your first gift card to get started</p>
        </div>
      )}

      <CreateGiftCardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default GiftCardPage;





