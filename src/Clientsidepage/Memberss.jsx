import React, { useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import { FaCalendarAlt } from "react-icons/fa";
import api from '../Service/Api';
import './Memberss.css';
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoData from "../states/NoData";

const parseValidFor = (validForStr) => {
  if (!validForStr) return { validityPeriod: null, validityUnit: null };
  const parts = validForStr.trim().split(/\s+/);
  const num = Number(parts[0]) || null;
  const unit = (parts[1] || '').toLowerCase();
  if (!num) return { validityPeriod: null, validityUnit: null };
  if (unit.startsWith('month')) return { validityPeriod: num, validityUnit: 'months' };
  if (unit.startsWith('year')) return { validityPeriod: num, validityUnit: 'years' };
  if (unit.startsWith('day')) return { validityPeriod: num, validityUnit: 'days' };
  return { validityPeriod: num, validityUnit: unit || 'months' };
};

// moved to module scope so all components can reuse it
const saveOrUpdateMembership = async (payload, id = null) => {
  if (id) {
    // Try common update routes/verbs in order until one succeeds.
    // Some servers expose PUT /memberships/:id, others PATCH, some use /memberships/template/:id
    const candidates = [
      { method: 'put', url: `/memberships/${id}` },
      { method: 'patch', url: `/memberships/${id}` },
      { method: 'put', url: `/memberships/template/${id}` },
      { method: 'patch', url: `/memberships/template/${id}` }
    ];

    let lastError = null;
    for (const c of candidates) {
      try {
        // helpful debug log (remove in production)
        console.debug(`[Membership] attempt ${c.method.toUpperCase()} ${c.url}`, payload);
        const res = await api[c.method](c.url, payload);
        return res;
      } catch (err) {
        lastError = err;
        // if route not found, try next candidate; otherwise bubble up immediately
        const status = err?.response?.status;
        if (status && status !== 404 && status !== 405) {
          throw err;
        }
        // continue trying other candidate routes
      }
    }
    // none succeeded
    throw lastError;
  }

  // create new membership template
  return api.post('/memberships/template', payload);
};

const CreateMembershipModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedServices: [], // array of service objects
    sessionType: 'limited',
    sessionCount: '1',
    paymentType: 'one-time',
    validFor: '1 month',
    price: '',
    currency: 'USD',
    notes: ''
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showServiceModal) fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showServiceModal]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      const servicesData = res.data?.data?.services || [];
      setServices(servicesData.filter(s => s.isActive !== false));
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category?.displayName || service.category?.name || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  const filteredServices = Object.keys(groupedServices).reduce((acc, category) => {
    const categoryServices = groupedServices[category].filter(service =>
      service.name.toLowerCase().includes(serviceSearch.toLowerCase())
    );
    if (categoryServices.length > 0) acc[category] = categoryServices;
    return acc;
  }, {});

  const handleServiceToggle = (service) => {
    setFormData(prev => {
      const exists = prev.selectedServices.some(s => s._id === service._id);
      return {
        ...prev,
        selectedServices: exists
          ? prev.selectedServices.filter(s => s._id !== service._id)
          : [...prev.selectedServices, service]
      };
    });
  };

  const parseValidFor = (str) => {
    if (!str) return { validityPeriod: 1, validityUnit: 'months' };
    const parts = str.trim().split(/\s+/);
    const num = Number(parts[0]);
    const unit = (parts[1] || '').toLowerCase();
    
    if (!num || num <= 0) return { validityPeriod: 1, validityUnit: 'months' };
    
    if (unit.startsWith('month')) return { validityPeriod: num, validityUnit: 'months' };
    if (unit.startsWith('year')) return { validityPeriod: num, validityUnit: 'years' };
    if (unit.startsWith('day')) return { validityPeriod: num, validityUnit: 'days' };
    
    return { validityPeriod: num, validityUnit: 'months' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { validityPeriod, validityUnit } = parseValidFor(formData.validFor);

      // Validation
      if (!formData.name.trim()) {
        alert('Membership name is required');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        alert('Membership description is required');
        setLoading(false);
        return;
      }

      if (!formData.selectedServices || formData.selectedServices.length === 0) {
        alert('Please select at least one service');
        setLoading(false);
        return;
      }

      if (formData.sessionType === 'limited' && (!formData.sessionCount || formData.sessionCount < 1)) {
        alert('Please enter valid number of sessions');
        setLoading(false);
        return;
      }

      if (!formData.price || formData.price <= 0) {
        alert('Please enter valid price');
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        serviceType: formData.sessionType === 'limited' ? 'Limited' : 'Unlimited',
        services: formData.selectedServices.map(s => typeof s === 'string' ? s : s._id),
        numberOfSessions: formData.sessionType === 'limited' ? Number(formData.sessionCount) : undefined,
        paymentType: formData.paymentType === 'one-time' ? 'One-time' : 'Recurring',
        price: parseFloat(formData.price),
        currency: formData.currency || 'USD',
        validityPeriod: validityPeriod,
        validityUnit: validityUnit,
        status: 'Draft',
        notes: formData.notes?.trim() || '',
        isTemplate: true
      };

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
      console.log('📤 Selected service details:', formData.selectedService);

      const res = await saveOrUpdateMembership(payload); // uses module-level helper

      if (res?.data?.success) {
        if (typeof onSuccess === 'function') onSuccess(res.data.data?.membership || null);
        if (typeof onClose === 'function') onClose();
      } else {
        throw new Error(res?.data?.message || 'Create failed');
      }
    } catch (err) {
      console.error('Failed to create membership template:', err);
      
      // Better error handling
      let errorMessage = 'Failed to create membership. Please try again.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modern-modal-overlay" onClick={onClose}>
        <div className="modern-membership-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modern-modal-header">
            <h2 className="modern-modal-title">Create Membership</h2>
            <button className="modern-close-btn" onClick={onClose} aria-label="Close">
              <IoClose />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modern-membership-form">
            <div className="modern-form-section">
              <h3 className="modern-section-title">
                <span className="section-dot section-dot-blue"></span>
                Basic Info
              </h3>
              <div className="modern-form-group">
                <label className="modern-label">Membership Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="Enter membership name" 
                  required 
                  className="modern-input"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Membership Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Describe this membership" 
                  rows="3"
                  className="modern-textarea"
                />
              </div>
            </div>

            <div className="modern-form-section">
              <h3 className="modern-section-title">
                <span className="section-dot section-dot-green"></span>
                Services and Sessions
              </h3>

              <div className="modern-form-group">
                <label className="modern-label">Included Services</label>
                <div className="modern-services-selection">
                  {formData.selectedServices.length > 0 ? (
                    <div className="modern-selected-services-list">
                      {formData.selectedServices.map(s => (
                        <div key={s._id} className="modern-selected-service">
                          <div className="modern-selected-service-info">
                            <span className="modern-service-name">{s.name}</span>
                            <span className="modern-service-details">{s.duration} mins • AED {s.price}</span>
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="modern-change-service-btn" 
                        onClick={() => setShowServiceModal(true)}
                      >
                        Change Services
                      </button>
                    </div>
                  ) : (
                    <div className="modern-no-service-container">
                      <p className="modern-no-services-text">No services selected</p>
                      <button 
                        type="button" 
                        className="modern-select-services-btn" 
                        onClick={() => setShowServiceModal(true)}
                      >
                        Select Services
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label className="modern-label">Sessions</label>
                  <select 
                    value={formData.sessionType} 
                    onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value }))}
                    className="modern-select"
                  >
                    <option value="limited">Limited</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>

                {formData.sessionType === 'limited' && (
                  <div className="modern-form-group">
                    <label className="modern-label">Number of Sessions</label>
                    <input 
                      type="number" 
                      value={formData.sessionCount} 
                      onChange={(e) => setFormData(prev => ({ ...prev, sessionCount: e.target.value }))} 
                      min="1" 
                      required 
                      className="modern-input"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modern-form-section">
              <h3 className="modern-section-title">
                <span className="section-dot section-dot-yellow"></span>
                Pricing and Payment
              </h3>
              <div className="modern-form-row" style={{ marginBottom: '20px' }}>
                <div className="modern-form-group">
                  <label className="modern-label">Valid For</label>
                  <select 
                    value={formData.validFor} 
                    onChange={(e) => setFormData(prev => ({ ...prev, validFor: e.target.value }))}
                    className="modern-select"
                  >
                    <option value="1 month">1 Month</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                    <option value="2 years">2 Years</option>
                  </select>
                </div>

                <div className="modern-form-group">
                  <label className="modern-label">Price</label>
                  <div className="modern-price-input">
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01" 
                      required 
                      className="modern-price-number"
                    />
                    <input 
                      type="text" 
                      value={formData.currency} 
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))} 
                      className="modern-currency-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
                  rows={2}
                  className="modern-notes-textarea"
                />
              </div>
            </div>

            <div className="modern-modal-actions">
              <button 
                type="button" 
                className="modern-secondary-button" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="modern-primary-button" 
                disabled={loading || formData.selectedServices.length === 0}
              >
                {loading ? 'Creating...' : 'Create Membership'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showServiceModal && (
        <div className="service-modal-overlay-modern" onClick={() => setShowServiceModal(false)}>
          <div className="service-modal-modern" onClick={(e) => e.stopPropagation()}>
            <div className="service-modal-header-modern">
              <h2 className="service-modal-title-modern">
                <span className="service-modal-title-dot"></span>
                Select Services
              </h2>
              <button className="service-modal-close-modern" onClick={() => setShowServiceModal(false)} aria-label="Close">
                <IoClose />
              </button>
            </div>

            <div className="service-search-modern">
              <input 
                type="text" 
                placeholder="🔍 Search services by name..." 
                value={serviceSearch} 
                onChange={(e) => setServiceSearch(e.target.value)}
                className="service-search-input-modern"
              />
            </div>

            <div className="service-list-modern">
              {Object.keys(filteredServices).length === 0 ? (
                <div className="empty-services-modern">
                  <div className="empty-services-icon">🔍</div>
                  <div className="empty-services-title">No services found</div>
                  <div className="empty-services-text">Try adjusting your search terms</div>
                </div>
              ) : (
                Object.keys(filteredServices).map(category => (
                  <div key={category} className="service-category-modern">
                    <div className="category-header-modern">
                      <span className="category-name-modern">
                        <span className="category-line-modern"></span>
                        {category}
                      </span>
                    </div>

                    <div className="category-services-modern">
                      {filteredServices[category].map(s => {
                        const checked = formData.selectedServices.some(sel => sel._id === s._id);
                        return (
                          <div key={s._id || s.id} className={`service-item-modern${checked ? ' selected' : ''}`}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleServiceToggle(s)}
                                style={{ marginRight: 8 }}
                              />
                              <div className="service-details-modern" style={{ flex: 1 }}>
                                <span className={`service-name-modern${checked ? ' selected' : ''}`}>{s.name}</span>
                                <span className={`service-duration-modern${checked ? ' selected' : ''}`}>
                                  <span className="service-duration-dot"></span>
                                  {s.duration} minutes
                                </span>
                              </div>
                              <div className="service-price-container">
                                <span className={`service-price-modern${checked ? ' selected' : ''}`}>AED {s.effectivePrice || s.price}</span>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="service-modal-actions-modern">
              <button 
                className="service-modal-close-btn" 
                onClick={() => setShowServiceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Professional Membership Details Modal - View Only
const ProfessionalMembershipModal = ({ isOpen, onClose, membership, onEdit }) => {
  if (!isOpen || !membership) return null;

  // Helper functions for formatting data
  const formatPrice = (price, currency = 'AED') => {
    if (!price) return 'Not specified';
    return `${currency} ${parseFloat(price).toFixed(2)}`;
  };

  const formatValidity = (period, unit) => {
    if (!period || !unit) return 'Not specified';
    return `${period} ${unit}`;
  };

  const formatSessions = (type, total, used = 0, remaining = null) => {
    if (type === 'Unlimited') return 'Unlimited Sessions';
    if (remaining !== null) return `${remaining} sessions remaining (${used}/${total} used)`;
    if (total) return `${total} sessions total`;
    return 'Not specified';
  };

  const formatStatus = (status) => {
    return status || 'Draft';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch ((status || 'draft').toLowerCase()) {
      case 'active': return '#22c55e';
      case 'expired': return '#ef4444';
      case 'draft': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="professional-modal-overlay" onClick={onClose}>
      <div className="professional-membership-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header Section */}
        <div className="professional-modal-header">
          <div className="header-content">
            <div className="membership-badge">
              <FaCalendarAlt />
            </div>
            <div className="header-info">
              <h2 className="membership-name">{membership.name}</h2>
              <p className="membership-type">{membership.serviceType || 'Membership Plan'}</p>
            </div>
          </div>
          <button className="professional-close-btn" onClick={onClose} aria-label="Close">
            <IoClose />
          </button>
        </div>

        {/* Main Content */}
        <div className="professional-modal-content">
          {/* Description Section */}
          {membership.description && (
            <div className="content-section">
              <h3 className="section-title">About This Membership</h3>
              <p className="section-text">{membership.description}</p>
            </div>
          )}

          {/* Key Details Grid */}
          <div className="content-section">
            <h3 className="section-title">Membership Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Price</span>
                <span className="detail-value">{formatPrice(membership.price, membership.currency)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Valid For</span>
                <span className="detail-value">{formatValidity(membership.validityPeriod, membership.validityUnit)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sessions</span>
                <span className="detail-value">
                  {formatSessions(
                    membership.serviceType, 
                    membership.numberOfSessions, 
                    membership.usedSessions, 
                    membership.remainingSessions
                  )}
                </span>
              </div>
           
            </div>
          </div>

          {/* Service Information */}
          <div className="content-section">
            <h3 className="section-title">Included Services</h3>
            {Array.isArray(membership.serviceNames) && membership.serviceNames.length > 0 ? (
              <div className="service-list">
                {membership.serviceNames.map((name, idx) => (
                  <div key={idx} className="service-card">
                    <div className="service-info">
                      <h4 className="service-name">{name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-service">
                <p>No specific service assigned to this membership</p>
              </div>
            )}
          </div>

          {/* Validity & Usage Information */}
          {(membership.startDate || membership.endDate || membership.daysRemaining) && (
            <div className="content-section">
              <h3 className="section-title">Validity Period</h3>
              <div className="timeline-grid">
                {membership.startDate && (
                  <div className="timeline-item">
                    <span className="timeline-label">Start Date</span>
                    <span className="timeline-value">{formatDate(membership.startDate)}</span>
                  </div>
                )}
                {membership.endDate && (
                  <div className="timeline-item">
                    <span className="timeline-label">End Date</span>
                    <span className="timeline-value">{formatDate(membership.endDate)}</span>
                  </div>
                )}
                {membership.daysRemaining !== undefined && (
                  <div className="timeline-item">
                    <span className="timeline-label">Days Remaining</span>
                    <span className="timeline-value" style={{ 
                      color: membership.daysRemaining < 7 ? '#ef4444' : membership.daysRemaining < 30 ? '#f59e0b' : '#22c55e',
                      fontWeight: '600'
                    }}>
                      {membership.daysRemaining} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          {membership.paymentType && (
            <div className="content-section">
              <h3 className="section-title">Payment Information</h3>
              <div className="info-item">
                <span className="info-label">Payment Type:</span>
                <span className="info-value">{membership.paymentType}</span>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {membership.notes && membership.notes.trim() && (
            <div className="content-section">
              <h3 className="section-title">Additional Notes</h3>
              <div className="info-item notes-item">
                <p className="notes-text">{membership.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="professional-modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
        
        </div>
      </div>
    </div>
  );
};



// Membership detail / edit modal (50vh, scrollable body, left icon, Update + Close + Delete)
const MembershipDetailModal = ({ isOpen, onClose, membership, onUpdateSuccess }) => {
  const [editable, setEditable] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && membership) {
      setEditable({
        ...membership,
        selectedServices: Array.isArray(membership.selectedServices) ? membership.selectedServices : [],
        validityPeriod: membership.validityPeriod ?? membership.numberOfSessions ?? null,
        validityUnit: membership.validityUnit ?? (membership.validFor?.includes('month') ? 'months' : '')
      });
    } else setEditable(null);
  }, [isOpen, membership]);

  if (!isOpen || !editable) return null;

  const handleChange = (k, v) => setEditable(prev => ({ ...prev, [k]: v }));

  // Replace MembershipDetailModal.doUpdate to use helper
  const doUpdate = async () => {
    setUpdating(true);
    try {
      const id = editable._id || editable.id;
      const payload = {
        name: editable.name,
        description: editable.description,
        price: editable.price ? parseFloat(editable.price) : 0,
        currency: editable.currency || 'USD',
        validityPeriod: editable.validityPeriod ? Number(editable.validityPeriod) : undefined,
        validityUnit: editable.validityUnit || undefined,
        numberOfSessions: editable.numberOfSessions ? Number(editable.numberOfSessions) : undefined,
        services: (editable.selectedServices || []).map(s => s._id || s.id || s.service).filter(Boolean),
        status: editable.status,
        isActive: typeof editable.isActive === 'boolean' ? editable.isActive : undefined
      };

      const res = await saveOrUpdateMembership(payload, id); // update
      if (!res?.data?.success) throw new Error(res?.data?.message || 'Update failed');

      if (typeof onUpdateSuccess === 'function') onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update membership:', err);
      alert(err?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const doDelete = async () => {
    if (!window.confirm('Delete this membership template? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      const id = editable._id || editable.id;
      await api.delete(`/memberships/${id}`);
      if (typeof onUpdateSuccess === 'function') onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete membership:', err);
      alert(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay detail-modal-overlay" onClick={onClose}>
      <div className="membership-detail-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="detail-modal-header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="detail-left-icon" aria-hidden><FaCalendarAlt /></div>
            <div>
              <h3 className="detail-title" style={{ margin: 0 }}>{editable.name}</h3>
              <div className="detail-sub" style={{ marginTop: 4 }}>{editable.serviceType || editable.description}</div>
            </div>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="detail-body">
          <div className="detail-row">
            <label className="label-compact">Name</label>
            <input type="text" value={editable.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
          </div>

          <div className="detail-row">
            <label className="label-compact">Description</label>
            <textarea value={editable.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
          </div>

          <div className="detail-row">
            <label className="label-compact">Price</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" value={editable.price ?? ''} onChange={(e) => handleChange('price', e.target.value)} step="0.01" />
              <input type="text" value={editable.currency ?? 'USD'} onChange={(e) => handleChange('currency', e.target.value)} style={{ width: 80 }} />
            </div>
          </div>

          <div className="detail-row">
            <label className="label-compact">Validity</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={editable.validityPeriod ?? ''} onChange={(e) => handleChange('validityPeriod', e.target.value)} style={{ width: 100 }} />
              <select value={editable.validityUnit || 'months'} onChange={(e) => handleChange('validityUnit', e.target.value)}>
                <option value="days">days</option>
                <option value="months">months</option>
                <option value="years">years</option>
              </select>
            </div>
          </div>

          <div className="detail-row">
            <label className="label-compact">Sessions</label>
            <input type="number" value={editable.numberOfSessions ?? ''} onChange={(e) => handleChange('numberOfSessions', e.target.value)} />
          </div>

          <div className="detail-section">
            <strong>Included Service</strong>
            <div className="service-info">
              {editable.service || editable.serviceName ? (
                <div className="service-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{editable.serviceName || 'Service'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {editable.numberOfSessions ? `${editable.numberOfSessions} sessions` : 'Unlimited sessions'}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{editable.service}</div>
                </div>
              ) : (<div className="no-services">No service assigned</div>)}
            </div>
          </div>

          <div className="detail-section">
            <strong>Notes</strong>
            <div className="notes-area">
              <textarea value={editable.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} rows={4} />
            </div>
          </div>

          <div className="detail-meta">
            <div>Created: {editable.createdAt ? new Date(editable.createdAt).toLocaleString() : '-'}</div>
            <div>Start: {editable.startDate ? new Date(editable.startDate).toLocaleString() : '-'}</div>
            <div>End: {editable.endDate ? new Date(editable.endDate).toLocaleString() : '-'}</div>
          </div>
        </div>

        <div className="detail-footer">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="delete-button" onClick={doDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary-button" onClick={onClose} disabled={updating || deleting}>Close</button>
            <button className="primary-button" onClick={doUpdate} disabled={updating || deleting}>{updating ? 'Updating...' : 'Update'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MembershipTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noData, setNoData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  


  const fetchMemberships = async () => {
    setLoading(true);
    setError(null);
    setNoData(false);
    try {
      const res = await api.get('/memberships/templates');
      const payload = res?.data;
      const arr = payload?.data?.memberships ?? [];
      if (payload && payload.success === true && Array.isArray(arr)) {
        setMemberships(arr);
        setNoData(arr.length === 0);
      } else {
        setMemberships([]);
        setNoData(true);
      }
    } catch (err) {
      console.error('Failed to load memberships:', err);
      setError(err.response?.data?.message || err.message || 'Network or server error');
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemberships(); }, []);

  const filteredMemberships = memberships.filter(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateSuccess = () => fetchMemberships();
  const handleDetailUpdateSuccess = () => fetchMemberships();

  const handleMembershipClick = (membership) => {
    setSelectedMembership(membership);
    setShowProfessionalModal(true);
  };

  const handleEditMembership = (membership) => {
    setShowProfessionalModal(false);
    setShowDetailModal(true);
  };

  if (loading) return (<div className="membership-dashboard"><div className="dashboard-header"><h2 className="page-title">Memberships</h2></div><Loading/></div>);
  if (error) return (<div className="membership-dashboard"><div className="dashboard-header"><h2 className="page-title">Memberships</h2></div><Error500Page message={error}/></div>);

  if (noData) {
    return (
      <div className="membership-dashboard" style={{ padding: 24, textAlign: 'center' }}>
        <div className="dashboard-header" style={{ marginBottom: 16 }}>
          <h2 className="page-title">Memberships</h2>
          <div className="action-buttons">
            <button className='primary-button' onClick={() => setShowCreateModal(true)}>Add</button>
          </div>
        </div>

        <div className="search-controls">
          <input className='search-input' type="text" placeholder="Search by membership name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="data-table-header">
          <span>Membership name</span><span>Valid for</span><span>Sessions</span><span>Price</span>
        </div>

        <NoData />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="primary-button" onClick={() => setShowCreateModal(true)}>Add Membership</button>
          <button className="secondary-button" onClick={fetchMemberships}>Retry</button>
        </div>

        <CreateMembershipModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
      </div>
    );
  }

  return (
    <div className="membership-dashboard">
      <div className="dashboard-header">
        <h2 className="page-title">Memberships</h2>
        <div className="action-buttons">
          <button className='primary-button' onClick={() => setShowCreateModal(true)}>Add</button>
        </div>
      </div>

      <div className="search-controls">
        <input className='search-input' type="text" placeholder="Search by membership name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="data-table-header">
        <span>Membership name</span><span>Valid for</span><span>Sessions</span><span>Price</span>
      </div>

      {filteredMemberships.map((item, index) => (
        <div key={item._id || index} className="data-table-row clickable-row" role="button" tabIndex={0}
          onClick={() => handleMembershipClick(item)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleMembershipClick(item); } }}
        >
          <div className="membership-info">
            <div className="membership-icon"><FaCalendarAlt /></div>
            <div className="membership-details">
              <div className="membership-title">{item.name}</div>
              <div className="membership-subtitle">{item.description || ''}</div>
            </div>
          </div>
          <span className="validity-period">{item.validityPeriod ? `${item.validityPeriod} ${item.validityUnit || ''}` : ''}</span>
          <span className="session-count">{item.serviceType ? item.serviceType : (typeof item.numberOfSessions !== 'undefined' ? item.numberOfSessions : (item.remainingSessions || ''))}</span>
          <span className="membership-price">{item.price ? `${item.currency ? item.currency + ' ' : ''}${item.price}` : ''}</span>
        </div>
      ))}

      <CreateMembershipModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />

      <ProfessionalMembershipModal 
        isOpen={showProfessionalModal} 
        onClose={() => { setShowProfessionalModal(false); setSelectedMembership(null); }} 
        membership={selectedMembership} 
        onEdit={handleEditMembership}
      />

      <MembershipDetailModal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedMembership(null); }} membership={selectedMembership} onUpdateSuccess={handleDetailUpdateSuccess} />
    </div>
  );
};

export default MembershipTable;