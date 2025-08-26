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
    selectedServices: [], // objects: { _id, id, name, service, sessionsAllowed }
    sessionType: 'limited', // 'limited'|'unlimited'
    sessionCount: '',
    paymentType: 'one-time',
    validFor: '1 month',
    price: '',
    currency: 'USD',
    notes: ''
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
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

  const handleCategorySelect = (category, isSelected) => {
    const ids = groupedServices[category].map(s => s._id || s.id);
    const newSet = new Set(selectedServiceIds);
    if (isSelected) ids.forEach(i => newSet.add(i)); else ids.forEach(i => newSet.delete(i));
    setSelectedServiceIds(newSet);
  };

  const handleServiceSelect = (id, isSelected) => {
    const newSet = new Set(selectedServiceIds);
    if (isSelected) newSet.add(id); else newSet.delete(id);
    setSelectedServiceIds(newSet);
  };

  const saveSelectedServices = () => {
    const selected = services
      .filter(s => selectedServiceIds.has(s._id || s.id))
      .map(s => ({
        _id: s._id,
        id: s._id || s.id,
        service: s._id || s.id,
        name: s.name,
        sessionsAllowed: 1 // default, editable in form
      }));
    setFormData(prev => ({ ...prev, selectedServices: selected }));
    setShowServiceModal(false);
  };

  const updateServiceSessions = (serviceId, sessionsAllowed) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: (prev.selectedServices || []).map(s => s._id === serviceId || s.id === serviceId ? { ...s, sessionsAllowed: Number(sessionsAllowed) || 0 } : s)
    }));
  };

  const parseValidFor = (str) => {
    if (!str) return { validityPeriod: undefined, validityUnit: undefined };
    const parts = str.split(/\s+/);
    const num = Number(parts[0]) || undefined;
    const unit = (parts[1] || '').toLowerCase();
    if (!num) return { validityPeriod: undefined, validityUnit: undefined };
    if (unit.startsWith('month')) return { validityPeriod: num, validityUnit: 'months' };
    if (unit.startsWith('year')) return { validityPeriod: num, validityUnit: 'years' };
    if (unit.startsWith('day')) return { validityPeriod: num, validityUnit: 'days' };
    return { validityPeriod: num, validityUnit: unit || 'months' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { validityPeriod, validityUnit } = parseValidFor(formData.validFor);

      const payload = {
        name: formData.name,
        description: formData.description,
        serviceType: formData.sessionType === 'limited' ? 'Limited' : 'Unlimited',
        selectedServices: (formData.selectedServices || []).map(s => ({
          service: s.service || s._id || s.id,
          name: s.name,
          sessionsAllowed: Number(s.sessionsAllowed) || 0
        })),
        numberOfSessions: formData.sessionType === 'limited' ? (Number(formData.sessionCount) || undefined) : undefined,
        paymentType: formData.paymentType === 'one-time' ? 'One-time' : formData.paymentType,
        price: formData.price ? parseFloat(formData.price) : 0,
        currency: formData.currency || 'USD',
        validityPeriod,
        validityUnit,
        status: 'Draft',
        notes: formData.notes || '',
        isTemplate: true
      };

      const res = await saveOrUpdateMembership(payload); // uses module-level helper

      if (res?.data?.success) {
        if (typeof onSuccess === 'function') onSuccess(res.data.data?.membership || null);
        if (typeof onClose === 'function') onClose();
      } else {
        throw new Error(res?.data?.message || 'Create failed');
      }
    } catch (err) {
      console.error('Failed to create membership template:', err);
      alert(err?.response?.data?.message || err.message || 'Failed to create membership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="membership-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create Membership</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close"><IoClose /></button>
          </div>

          <form onSubmit={handleSubmit} className="membership-form">
            <div className="form-section">
              <h3>Basic Info</h3>
              <div className="form-group">
                <label>Membership Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter membership name" required />
              </div>

              <div className="form-group">
                <label>Membership Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this membership" rows="3" />
              </div>
            </div>

            <div className="form-section">
              <h3>Services and Sessions</h3>

              <div className="form-group">
                <label>Included Services</label>
                <div className="services-selection">
                  {formData.selectedServices.length > 0 ? (
                    <div className="selected-services">
                      {formData.selectedServices.map(s => (
                        <div key={s._id || s.id || s.service} className="selected-service-row">
                          <span className="service-name">{s.name}</span>
                          <label className="service-sessions">
                            Sessions:
                            <input type="number" min="0" value={s.sessionsAllowed ?? 0} onChange={(e) => updateServiceSessions(s._id || s.id || s.service, e.target.value)} style={{ width: 80, marginLeft: 8 }} />
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (<p className="no-services">No services selected</p>)}
                  <button type="button" className="select-services-btn" onClick={() => setShowServiceModal(true)}>Select Services</button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sessions</label>
                  <select value={formData.sessionType} onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value }))}>
                    <option value="limited">Limited</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>

                {formData.sessionType === 'limited' && (
                  <div className="form-group">
                    <label>Number of Sessions</label>
                    <input type="number" value={formData.sessionCount} onChange={(e) => setFormData(prev => ({ ...prev, sessionCount: e.target.value }))} min="1" required />
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Pricing and Payment</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Valid For</label>
                  <select value={formData.validFor} onChange={(e) => setFormData(prev => ({ ...prev, validFor: e.target.value }))}>
                    <option value="1 month">1 Month</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                    <option value="2 years">2 Years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <div className="price-input">
                    <input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="0.00" min="0" step="0.01" required />
                    <input type="text" value={formData.currency} onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))} className="currency-input" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Creating...' : 'Create Membership'}</button>
            </div>
          </form>
        </div>
      </div>

      {showServiceModal && (
        <div className="modal-overlay service-modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Services</h2>
              <button className="close-btn" onClick={() => setShowServiceModal(false)} aria-label="Close"><IoClose /></button>
            </div>

            <div className="service-search">
              <input type="text" placeholder="Search services" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} />
            </div>

            <div className="service-list">
              {Object.keys(filteredServices).map(category => (
                <div key={category} className="service-category">
                  <label className="category-header">
                    <input type="checkbox" checked={(() => {
                      const ids = groupedServices[category].map(s => s._id || s.id);
                      return ids.length > 0 && ids.every(id => selectedServiceIds.has(id));
                    })()} onChange={(e) => handleCategorySelect(category, e.target.checked)} />
                    <span className="category-name">{category}</span>
                  </label>

                  <div className="category-services">
                    {filteredServices[category].map(s => (
                      <label key={s._id || s.id} className="service-item">
                        <input type="checkbox" checked={selectedServiceIds.has(s._id || s.id)} onChange={(e) => handleServiceSelect(s._id || s.id, e.target.checked)} />
                        <div className="service-details">
                          <span className="service-name">{s.name}</span>
                          <span className="service-duration">{s.duration} mins</span>
                        </div>
                        <span className="service-price">{s.effectivePrice || s.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setShowServiceModal(false)}>Close</button>
              <button className="primary-button" onClick={saveSelectedServices}>Select ({selectedServiceIds.size})</button>
            </div>
          </div>
        </div>
      )}
    </>
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
            <strong>Included Services</strong>
            <div className="services-list">
              {(editable.selectedServices || []).length > 0 ? (
                (editable.selectedServices || []).map((s, idx) => (
                  <div className="service-item" key={s._id || s.id || idx}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{s.sessionsAllowed ? `${s.sessionsAllowed} sessions` : ''}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{s._id || s.id}</div>
                  </div>
                ))
              ) : (<div className="no-services">No services assigned</div>)}
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
          onClick={() => { setSelectedMembership(item); setShowDetailModal(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedMembership(item); setShowDetailModal(true); } }}
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

      <MembershipDetailModal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedMembership(null); }} membership={selectedMembership} onUpdateSuccess={handleDetailUpdateSuccess} />
    </div>
  );
};

export default MembershipTable;