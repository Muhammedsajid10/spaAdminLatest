import React, { useState, useEffect, useRef } from 'react';
import './Giftcard.css';
import api from "../Service/Api";
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoDataState from "../states/NoData";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Giftcards = () => {
  const [search, setSearch] = useState('');
  const [giftCards, setGiftCards] = useState([]); // purchased gift cards
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Assign (purchase) modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [form, setForm] = useState({
    templateId: '',
    purchasedBy: '',
    recipientName: '',
    recipientEmail: '',
    personalMessage: ''
  });

  // Helper function to derive gift card status
  const deriveStatus = (gc) => {
    const value = gc.value ?? 0;
    const now = Date.now();
    const expTs = gc.expiryDate ? new Date(gc.expiryDate).getTime() : null;
    if (expTs && expTs < now) return 'Expired';
    const remaining = (gc.remainingValue !== undefined && gc.remainingValue !== null) ? gc.remainingValue : value;
    // Treat any fully used, partially used, cancelled or negative remaining as Redeemed for simplified UI
    const rawStatus = (gc.status || '').toLowerCase();
    if (remaining <= 0 || ['used','partially used','cancelled'].includes(rawStatus)) return 'Redeemed';
    return 'Active';
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [purchasedRes, templatesRes, clientsRes] = await Promise.all([
        api.get('/giftcards/purchased'),
        api.get('/giftcards/templates'),
        api.get('/admin/clients?fields=firstName,lastName,email')
      ]);

      const rawList = purchasedRes.data?.data?.giftCards || [];
      // Debug: log raw backend status vs computed for diagnostics
      if (rawList.length) {
        console.debug('[Giftcards] Raw fetched gift cards:', rawList.map(r => ({ code: r.code, status: r.status, remainingValue: r.remainingValue, value: r.value })));
      }
      const purchased = rawList.map(gc => {
        const value = gc.value ?? 0;
        const remainingValue = (gc.remainingValue !== undefined && gc.remainingValue !== null) ? gc.remainingValue : value;
        const redeemed = value - remainingValue;
        const status = deriveStatus(gc);
        return {
          id: gc._id,
          code: gc.code,
          status, // derived status (Active, Redeemed, Expired)
          purchaser: gc.purchasedBy ? `${gc.purchasedBy.firstName || ''} ${gc.purchasedBy.lastName || ''}`.trim() : '-',
          owner: gc.recipientName || (gc.purchasedBy ? `${gc.purchasedBy.firstName || ''} ${gc.purchasedBy.lastName || ''}`.trim() : '-'),
          total: value,
          redeemed,
          remaining: remainingValue,
          expiryDate: gc.expiryDate,
          purchaseDate: gc.purchaseDate
        };
      });

      setGiftCards(purchased);
      const rawTemplates = templatesRes.data?.data?.giftCards || [];
      const normalizedTemplates = rawTemplates.map(t => {
        const numericValue = Number(t.value);
        const numericPrice = Number(t.price);
        const invalid = (
          t.value == null || t.price == null ||
          t.value === '' || t.price === '' ||
          Number.isNaN(numericValue) || Number.isNaN(numericPrice) ||
          numericValue < 1 || numericPrice < 0
        );
        return {
          ...t,
            // Mark templates that are missing/invalid pricing so they can't be selected
          __isLegacyMissingValue: invalid,
          value: numericValue,
          price: numericPrice
        };
      });
      const invalidCount = normalizedTemplates.filter(t => t.__isLegacyMissingValue).length;
      if (invalidCount > 0) {
        console.warn(`⚠️ ${invalidCount} gift card template(s) are invalid (missing or bad value/price) and will be hidden from assignment.`);
      }
      setTemplates(normalizedTemplates);
      const clientList = clientsRes.data?.data?.clients || [];
      setClients(clientList);
    } catch (err) {
      console.error('Failed to fetch gift card data', err);
      setError(err.response?.data?.message || err.message || 'Failed to load gift cards');
    } finally {
      setLoading(false);
    }
  };

  // (Removed misplaced template normalization block)
  useEffect(() => {
    fetchAll();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const filteredCards = giftCards.filter(card =>
    card.code?.toLowerCase().includes(search.toLowerCase()) ||
    card.purchaser?.toLowerCase().includes(search.toLowerCase()) ||
    card.owner?.toLowerCase().includes(search.toLowerCase())
  );

  const calculateRemaining = (total, redeemed) => {
    return (total - redeemed).toFixed(2);
  };

  const openAssign = () => {
    setAssignError('');
    const validTemplate = templates.find(t => !t.__isLegacyMissingValue);
    if (!validTemplate) {
      setAssignError('No valid gift card templates with value & price. Please recreate templates.');
    }
    setForm(prev => ({
      ...prev,
      templateId: prev.templateId || (validTemplate?._id || ''),
      purchasedBy: prev.purchasedBy || (clients[0]?._id || ''),
      recipientName: prev.recipientName || (clients[0] ? `${clients[0].firstName || ''} ${clients[0].lastName || ''}`.trim() : ''),
      recipientEmail: prev.recipientEmail || (clients[0]?.email || '')
    }));
    setShowAssignModal(true);
  };

  const closeAssign = () => {
    setShowAssignModal(false);
  };

  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleClientChange = (e) => {
    const selectedId = e.target.value;
    const client = clients.find(c => c._id === selectedId);
    setForm(f => ({
      ...f,
      purchasedBy: selectedId,
      recipientName: client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : '',
      recipientEmail: client?.email || ''
    }));
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSubmitting(true);
    try {
      if (!form.templateId) throw new Error('Template is required');
      if (!form.purchasedBy) throw new Error('Client is required');

      const payload = {
        templateId: form.templateId,
        purchasedBy: form.purchasedBy,
        recipientName: form.recipientName,
        recipientEmail: form.recipientEmail,
        personalMessage: form.personalMessage
      };
      const selectedTemplate = templates.find(t => t._id === form.templateId);
      if (selectedTemplate && selectedTemplate.__isLegacyMissingValue) {
        throw new Error('Selected template is missing value/price. Please recreate it.');
      }
      console.log('🧪 Submitting gift card purchase', {
        payload,
        selectedTemplateSimplified: selectedTemplate ? {
          id: selectedTemplate._id,
          value: selectedTemplate.value,
          price: selectedTemplate.price,
          legacyFlag: selectedTemplate.__isLegacyMissingValue
        } : null
      });
      const res = await api.post('/giftcards/purchase', payload);
      const newCard = res.data?.data?.giftCard;
      if (newCard) {
        setGiftCards(prev => {
          const value = newCard.value ?? 0;
          const remainingValue = (newCard.remainingValue !== undefined && newCard.remainingValue !== null) ? newCard.remainingValue : value;
          const redeemed = value - remainingValue;
          const status = deriveStatus(newCard);
          const mapped = {
            id: newCard._id,
            code: newCard.code,
            status,
            purchaser: newCard.purchasedBy ? `${newCard.purchasedBy.firstName || ''} ${newCard.purchasedBy.lastName || ''}`.trim() : '-',
            owner: newCard.recipientName || (newCard.purchasedBy ? `${newCard.purchasedBy.firstName || ''} ${newCard.purchasedBy.lastName || ''}`.trim() : '-'),
            total: value,
            redeemed,
            remaining: remainingValue,
            expiryDate: newCard.expiryDate,
            purchaseDate: newCard.purchaseDate
          };
          return [mapped, ...prev];
        });
      }
      setShowAssignModal(false);
    } catch (err) {
      console.error('Assign gift card failed', err);
      const msg = err.response?.data?.message || err.message || 'Failed to assign gift card';
      const detail = err.response?.data?.error;
      const validation = err.response?.data?.validationErrors;
      const combined = [msg, detail, validation?.join?.(', ')].filter(Boolean).join(' — ');
      setAssignError(combined);
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Export Functions
  const exportToCSV = () => {
    const csvData = filteredCards.map(card => ({
      'Gift Card': card.code,
      Status: card.status,
      'Sale #': card.sale,
      Purchaser: card.purchaser,
      Owner: card.owner,
      'Total (AED)': card.total.toFixed(2),
      'Redeemed (AED)': card.redeemed.toFixed(2),
      'Remaining (AED)': calculateRemaining(card.total, card.redeemed)
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gift_cards_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Gift Cards Report", 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

    // Prepare table data
    const tableColumn = ["Gift Card", "Status", "Sale #", "Purchaser", "Owner", "Total (AED)", "Redeemed (AED)", "Remaining (AED)"];
    const tableRows = filteredCards.map(card => [
      card.code,
      card.status,
      card.sale,
      card.purchaser,
      card.owner,
      card.total.toFixed(2),
      card.redeemed.toFixed(2),
      calculateRemaining(card.total, card.redeemed)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`gift_cards_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const excelData = filteredCards.map(card => ({
      'Gift Card': card.code,
      Status: card.status,
      'Sale #': card.sale,
      Purchaser: card.purchaser,
      Owner: card.owner,
      'Total (AED)': card.total.toFixed(2),
      'Redeemed (AED)': card.redeemed.toFixed(2),
      'Remaining (AED)': calculateRemaining(card.total, card.redeemed)
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    ws['!cols'] = [
      { width: 12 }, // Gift Card
      { width: 10 }, // Status
      { width: 10 }, // Sale #
      { width: 15 }, // Purchaser
      { width: 15 }, // Owner
      { width: 12 }, // Total
      { width: 12 }, // Redeemed
      { width: 12 }  // Remaining
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Gift Cards");
    XLSX.writeFile(wb, `gift_cards_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportClick = (e) => {
    e.stopPropagation();
    if (filteredCards.length > 0) {
      setShowExportMenu(!showExportMenu);
    }
  };

  // Check if we have no data
  const hasNoData = !loading && !error && giftCards.length === 0;
  const hasNoResults = !loading && !error && giftCards.length > 0 && filteredCards.length === 0;

  // Show loading state
  if (loading) {
    return (
      <div className="gift-container">
        <div className="header-section">
          <h1>Gift cards sold</h1>
          <div className="header-actions">
            <button className="primary-btn" onClick={openAssign} disabled={templates.filter(t=>!t.__isLegacyMissingValue).length === 0 || clients.length === 0}>Assign gift card</button>
          </div>
        </div>
        <p className="desc">View, filter and export gift cards purchased by your clients.</p>
        <Loading />
        {showAssignModal && (
          <div className="modal-overlay" onClick={closeAssign}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Assign Gift Card</h2>
              <p>Loading data...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="gift-container">
        <div className="header-section">
          <h1>Gift cards sold</h1>
          <div className="header-actions">
            <button className="primary-btn" onClick={openAssign} disabled>Assign gift card</button>
          </div>
        </div>
        <p className="desc">View, filter and export gift cards purchased by your clients.</p>
        <Error500Page />
      </div>
    );
  }

  // Show no data state
  if (hasNoData) {
    return (
      <div className="gift-container">
        <div className="header-section">
          <h1>Gift cards sold</h1>
          <div className="header-actions">
            <button className="primary-btn" onClick={openAssign} disabled={templates.filter(t=>!t.__isLegacyMissingValue).length === 0 || clients.length === 0}>Assign gift card</button>
          </div>
        </div>
        <p className="desc">View, filter and export gift cards purchased by your clients.</p>
        <NoDataState
          message="No gift cards found"
          description="There are no gift cards sold yet. Assign one to a client to get started."
          icon="🎁"
        />
        {showAssignModal && (
          <div className="modal-overlay" onClick={closeAssign}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              {/** Modal content duplicated for no-data state */}
              <h2>Assign Gift Card</h2>
              <form onSubmit={submitAssign} className="assign-form">
                {assignError && <div className="form-error">{assignError}</div>}
                <label>
                  Template
                  <select name="templateId" value={form.templateId} onChange={handleAssignChange} required>
                    <option value="" disabled>Select template</option>
                    {templates.filter(t=>!t.__isLegacyMissingValue).map(t => <option key={t._id} value={t._id}>{t.name} - {t.value} {t.currency}</option>)}
                  </select>
                </label>
                <label>
                  Client
                  <select name="purchasedBy" value={form.purchasedBy} onChange={handleClientChange} required>
                    <option value="" disabled>Select client</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} - {c.email}</option>)}
                  </select>
                </label>
                <label>
                  Recipient name
                  <input name="recipientName" value={form.recipientName} onChange={handleAssignChange} placeholder="Recipient full name" />
                </label>
                <label>
                  Recipient email
                  <input type="email" name="recipientEmail" value={form.recipientEmail} onChange={handleAssignChange} placeholder="Recipient email" />
                </label>
                <label>
                  Personal message
                  <textarea name="personalMessage" value={form.personalMessage} onChange={handleAssignChange} placeholder="Optional message" rows={3} />
                </label>
                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeAssign}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={assignSubmitting}>{assignSubmitting ? 'Assigning...' : 'Assign gift card'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="gift-container">
      <div className="header-section">
        <h1>Gift cards sold</h1>
        <div className="header-actions">
          <button className="primary-btn" onClick={openAssign} disabled={templates.filter(t=>!t.__isLegacyMissingValue).length === 0 || clients.length === 0}>Assign gift card</button>
        </div>
        <div className="export-wrapper" ref={exportMenuRef}>
          {/* <button 
            className="options-btn"
            onClick={handleExportClick}
            disabled={filteredCards.length === 0}
          >
            Export
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showExportMenu && filteredCards.length > 0 && (
            <div className="export-dropdown">
              <button className="export-item" onClick={exportToCSV}>
                Export as CSV
              </button>
              <button className="export-item" onClick={exportToPDF}>
                Export as PDF
              </button>
              <button className="export-item" onClick={exportToExcel}>
                Export as Excel
              </button>
            </div>
          )} */}
        </div>
      </div>
      <p className="desc">
        View, filter and export gift cards purchased by your clients. 
      </p>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Search by Code, Purchaser or Owner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {hasNoResults ? (
        <NoDataState
          message="No gift cards match your search"
          description={`No gift cards found matching "${search}". Try adjusting your search terms.`}
          icon="🔍"
        />
      ) : (
        <div className="table-responsive">
          <table className="gift-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Purchaser</th>
                <th>Owner</th>
                <th>Total</th>
                <th>Redeemed</th>
                <th>Remaining</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card, index) => (
                <tr key={card.id || index}>
                  <td>
                    <div className="code-cell">
                      <span className="code-badge" title="Gift card code">{card.code}</span>
                      <button
                        type="button"
                        className="copy-code-btn"
                        aria-label="Copy code"
                        onClick={() => navigator.clipboard && navigator.clipboard.writeText(card.code)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={card.status.toLowerCase()}>
                      {card.status}
                    </span>
                  </td>
                  <td>
                    <span className="link">{card.purchaser}</span>
                  </td>
                  <td>
                    <span className="link">{card.owner}</span>
                  </td>
                  <td>AED {card.total.toFixed(2)}</td>
                  <td>AED {card.redeemed.toFixed(2)}</td>
                  <td>AED {calculateRemaining(card.total, card.redeemed)}</td>
                  <td>{card.expiryDate ? new Date(card.expiryDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAssignModal && (
        <div className="modal-overlay" onClick={closeAssign}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Assign Gift Card</h2>
            <form onSubmit={submitAssign} className="assign-form">
              {assignError && <div className="form-error">{assignError}</div>}
              <label>
                Template
                <select name="templateId" value={form.templateId} onChange={handleAssignChange} required>
                  <option value="" disabled>Select template</option>
                  {templates.filter(t=>!t.__isLegacyMissingValue).map(t => <option key={t._id} value={t._id}>{t.name} - {t.value} {t.currency}</option>)}
                </select>
              </label>
              <label>
                Client
                <select name="purchasedBy" value={form.purchasedBy} onChange={handleClientChange} required>
                  <option value="" disabled>Select client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} - {c.email}</option>)}
                </select>
              </label>
              <label>
                Recipient name
                <input name="recipientName" value={form.recipientName} onChange={handleAssignChange} placeholder="Recipient full name" />
              </label>
              <label>
                Recipient email
                <input type="email" name="recipientEmail" value={form.recipientEmail} onChange={handleAssignChange} placeholder="Recipient email" />
              </label>
              <label>
                Personal message
                <textarea name="personalMessage" value={form.personalMessage} onChange={handleAssignChange} placeholder="Optional message" rows={3} />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeAssign}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={assignSubmitting}>{assignSubmitting ? 'Assigning...' : 'Assign gift card'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Giftcards;





