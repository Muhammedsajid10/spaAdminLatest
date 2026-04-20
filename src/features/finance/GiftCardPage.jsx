import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { IoClose } from "react-icons/io5";
import { FaGift } from "react-icons/fa";
import api from '@api';
import "./GiftCardPage.css";
import Loading from "@components/ui/Loading";
import Error500Page from "@components/ui/ErrorPage";
import NoData from "@components/ui/NoData";
import { CiSearch } from "react-icons/ci";

const CreateGiftCardModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    validFor: "6 months",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let expiryDate = null;
      const now = new Date();
      if (formData.validFor === "6 months") {
        expiryDate = new Date(now);
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      } else if (formData.validFor === "1 year") {
        expiryDate = new Date(now);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (formData.validFor === "2 years") {
        expiryDate = new Date(now);
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      }

      const amountNum = parseFloat(formData.amount);
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Amount must be a positive number");
      }

      const templatePayload = {
        name: formData.name.trim(),
        description: `${formData.name.trim()} gift card`,
        value: amountNum,
        price: amountNum,
        remainingValue: amountNum,
        purchasePrice: amountNum,
        currency: "AED",
        expiryDate,
        isTemplate: true,
      };

      const createRes = await api.post("/giftcards/template", templatePayload);
      const created = createRes.data?.data?.giftCard;
      onSuccess(created);
      onClose();
      setFormData({ name: "", amount: "", validFor: "6 months" });
    } catch (err) {
      console.error("Failed to create gift card:", err);
      const serverMsg = err.response?.data?.message;
      const serverDetail = err.response?.data?.error;
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: serverMsg || serverDetail || err.message || "Failed to create gift card.",
        confirmButtonColor: '#1f2937'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gc-modal-overlay">
      <div className="gc-modal-small">
        <div className="gc-modal-header">
          <h2>Create Gift Card</h2>
          <button className="gc-close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gc-form">
          <div className="gc-form-group">
            <label>Gift Card Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Relaxation Package"
              required
            />
          </div>

          <div className="gc-form-group">
            <label>Amount</label>
            <div className="gc-price-input">
              <span className="gc-currency">AED</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="100"
                min="1"
                step="1"
                required
              />
            </div>
          </div>

          <div className="gc-form-group">
            <label>Valid For</label>
            <select
              value={formData.validFor}
              onChange={(e) => setFormData((prev) => ({ ...prev, validFor: e.target.value }))}
              required
            >
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
              <option value="2 years">2 Years</option>
            </select>
          </div>

          <div className="gc-modal-actions">
            <button type="button" className="gc-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="gc-create-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Gift Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GiftCardPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const templatesRes = await api.get("/giftcards/templates");
      const tpl = templatesRes?.data?.data?.giftCards || [];
      setTemplates(tpl);
    } catch (err) {
      console.error("Failed to load gift card templates:", err);
      setError(err.response?.data?.message || err.message || "Error loading gift card templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredGiftCards = templates.filter(
    (card) =>
      (card.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSuccess = (created) => {
    if (created) setTemplates((prev) => [created, ...prev]);
    else fetchTemplates();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="gc-dashboard">
        <div className="gc-dashboard-header">
          <h2 className="gc-page-title">Gift Cards</h2>
        </div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="gc-dashboard">
        <div className="gc-dashboard-header">
          <h2 className="gc-page-title">Gift Cards</h2>
        </div>
        <Error500Page message={error} />
      </div>
    );
  }

  return (
    <div className="gc-dashboard">
      <div className="gc-dashboard-header">
        <div className="gc-header-content">
          <h2 className="gc-page-title">Gift Cards</h2>
          <p className="gc-page-subtitle">Create, assign and redeem gift cards</p>
        </div>
        <div className="gc-action-buttons">
          <button className="gc-add-btn" onClick={() => setShowCreateModal(true)}>Add</button>
        </div>
      </div>

      <div className="gc-search">
        <CiSearch className="gc-search-icon" strokeWidth={2.5} />
        <input
          className="gc-search-input"
          type="text"
          placeholder="Search gift cards"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="gc-cards-grid">
        {filteredGiftCards.map((card) => (
          <div className="gc-card" key={card._id}>
            <div className="gc-card-header">
              <div className="gc-card-icon">
                <FaGift />
              </div>
            </div>
            <div className="gc-card-body">
              <h3 className="gc-card-name">{card.name}</h3>
              <div className="gc-card-code">Code: {card.code}</div>
              <div className="gc-card-value">Value: AED {card.value}</div>
              <div className="gc-card-price">Price: AED {card.price}</div>
              <div className="gc-card-expiry">Expiry: {formatDate(card.expiryDate)}</div>
              <div className="gc-card-status">Template</div>
            </div>
          </div>
        ))}
      </div>

      {filteredGiftCards.length === 0 && (
        <div className="gc-empty">
          <FaGift className="gc-empty-icon" />
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
