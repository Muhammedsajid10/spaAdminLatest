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
      // Derive expiryDate from selection (templates need an expiry)
      let expiryDate = null;
      const now = new Date();
      if (formData.validFor === '6 months') {
        expiryDate = new Date(now);
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      } else if (formData.validFor === '1 year') {
        expiryDate = new Date(now);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (formData.validFor === '2 years') {
        expiryDate = new Date(now);
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      }

      const amountNum = parseFloat(formData.amount);
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Amount must be a positive number');
      }

      let attempts = 0;
      let created = null;
      let currentCode = formData.code.trim().toUpperCase();

      while (attempts < 3 && !created) {
        const templatePayload = {
          name: formData.name.trim(),
          description: `${formData.name.trim()} gift card`,
          value: amountNum,
          price: amountNum,
            // Ensure template has starting remainingValue & purchasePrice (though model pre-save should handle)
          remainingValue: amountNum,
          purchasePrice: amountNum,
          currency: 'AED',
          code: currentCode,
          expiryDate,
          isTemplate: true
        };
        try {
          const createRes = await api.post('/giftcards/template', templatePayload);
          created = createRes.data?.data?.giftCard;
        } catch (errInner) {
          const msg = errInner.response?.data?.message || errInner.message || '';
          const detail = errInner.response?.data?.error || '';
          const combined = `${msg} ${detail}`.toLowerCase();
          // Detect duplicate code error and retry with new code
          if (combined.includes('duplicate') || combined.includes('code') && combined.includes('exists')) {
            // generate new code and retry
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let newCode = '';
            for (let i = 0; i < 8; i++) newCode += characters.charAt(Math.floor(Math.random()*characters.length));
            currentCode = newCode;
            attempts += 1;
            if (attempts >= 3) {
              throw new Error('Failed after multiple code attempts (duplicate codes). Please try again.');
            }
            continue; // retry loop
          }
          // Non-duplicate error: rethrow
          throw errInner;
        }
      }

      if (!created) {
        throw new Error('Could not create gift card (unknown error)');
      }

      onSuccess(created);
      onClose();
      setFormData({ name: '', amount: '', validFor: '6 months', code: '' });
    } catch (err) {
      console.error('Failed to create gift card:', err);
      const serverMsg = err.response?.data?.message;
      const serverDetail = err.response?.data?.error;
      alert(serverMsg || serverDetail || err.message || 'Failed to create gift card.');
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

  const fetchGiftCards = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch template gift cards ONLY (creation scope)
      const res = await api.get('/giftcards/templates');
      const payload = res?.data || {};
      const list = payload?.data?.giftCards || [];
      setGiftCards(list);
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

  const handleCreateSuccess = (created) => {
    if (created) {
      setGiftCards(prev => [created, ...prev]);
    } else {
      fetchGiftCards();
    }
  };

  // Unified date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  };

  // --- Global states handling ---
  if (loading) {
    return (
      <div className="giftcard-dashboard">
        <div className="dashboard-header">
          <h2 className="page-title">Gift Cards</h2>
        </div>
        <Loading />
  <div className="giftcard-fab" onClick={() => setShowCreateModal(true)}>+</div>
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
  <div className="giftcard-fab" onClick={() => setShowCreateModal(true)}>+</div>
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
  <div className="giftcard-fab" onClick={() => setShowCreateModal(true)}>+</div>
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
              <div className="giftcard-amount">Value: AED {card.value}</div>
              <div className="giftcard-amount" style={{opacity:.8}}>Price: AED {card.price}</div>
              <div className="giftcard-validity">Expiry: {formatDate(card.expiryDate)}</div>
              <div className="giftcard-status" style={{marginTop:4,fontSize:12,color:'#555'}}>{card.isTemplate ? 'Template' : card.status}</div>
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
  <div className="giftcard-fab" onClick={() => setShowCreateModal(true)}>+</div>
    </div>
  );
};

export default GiftCardPage;





