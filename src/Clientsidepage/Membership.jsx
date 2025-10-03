import React, { useState, useEffect } from 'react';
import './Membership.css';
import api from '../Service/Api';
import { SearchCheck, SearchXIcon } from 'lucide-react';
import Loading from '../states/Loading';
import Error500Page from '../states/ErrorPage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51RpSYD5FOF6KgbFpVgzOspHQuZYVwLuawvNXCAI60gDNuyEFdfvwd9UnhHMqal5RfWh3N4WPv5uzLn3GEFiRTm1D00rpI5BXPQ');

// Spinner component
const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

// Stripe Payment Form Component
const MembershipPaymentForm = ({ assignForm, templates = [], clients = [], onSuccess, onCancel, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTemplate = templates.find(t => t._id === assignForm.templateId);
  const selectedClient = clients.find(c => c._id === assignForm.clientId) || { _id: assignForm.clientId };
  const finalPrice = assignForm.price && assignForm.price !== '' ? Number(assignForm.price) : selectedTemplate?.price;

  // Safety check
  if (!assignForm?.templateId || !assignForm?.clientId) {
    return (
      <div className="membership-payment-error">
        <p>Missing required information for payment processing.</p>
        <button onClick={onCancel} className="btn btn-secondary">Go Back</button>
      </div>
    );
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      onError('Stripe not loaded. Please try again.');
      return;
    }

    if (!finalPrice || finalPrice <= 0) {
      onError('Invalid price amount.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create a temporary booking ID for membership purchase
      const tempBookingId = `membership-purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment intent through existing payment API
      const paymentPayload = {
        bookingId: tempBookingId,
        amount: finalPrice,
        currency: 'AED',
        paymentMethod: 'card',
        gateway: 'stripe',
        metadata: {
          type: 'membership_purchase',
          templateId: selectedTemplate?._id || assignForm.templateId,
          clientId: selectedClient?._id || assignForm.clientId
        }
      };

      console.log('🔄 Creating payment intent for membership...', paymentPayload);

      // Helper: try a list of possible endpoints with optional payload tweaks
      const tryCreatePayment = async (payload) => {
        // First, try asking the memberships endpoint to create a payment intent for membership purchases.
        // Some backends embed payment creation into the membership purchase flow and will return a clientSecret.
        try {
          const memPayload = { templateId: payload.metadata.templateId, clientId: payload.metadata.clientId, amount: payload.amount, currency: payload.currency, paymentMethod: payload.paymentMethod, gateway: payload.gateway, createPaymentIntent: true };
          const memRes = await api.post('/memberships/purchase', memPayload);
          // If server handled creation and returned a membership immediately (no clientSecret), treat as success
          if (memRes?.data?.data?.membership) {
            return { data: { success: true, data: { membership: memRes.data.data.membership } } };
          }
          // If server returned a clientSecret to confirm on the client, return it
          if (memRes?.data?.data?.clientSecret) {
            return { data: { success: true, data: { clientSecret: memRes.data.data.clientSecret } } };
          }
        } catch (memErr) {
          // If memberships endpoint doesn't support client-side payment intent creation, continue to other endpoints.
          const status = memErr?.response?.status;
          if (status === 404) {
            console.info('Memberships purchase endpoint not usable for payment-intent creation, falling back to payments endpoints');
          } else {
            console.warn('Memberships purchase attempt returned error, falling back:', memErr?.response?.data || memErr.message);
          }
        }

        const tried = [];
        // Primary endpoint
        try {
          tried.push('/payments/create');
          const res = await api.post('/payments/create', payload);
          return res;
        } catch (errPrimary) {
          const status = errPrimary?.response?.status;
          const serverMsg = errPrimary?.response?.data?.message || errPrimary.message || '';
          console.warn('Primary payments/create failed', { status, serverMsg });

          // If booking not found, try again without bookingId (some backends expect no booking)
          if (status === 404 && /booking not found/i.test(serverMsg)) {
            try {
              tried.push('/payments/create (no bookingId)');
              const clone = { ...payload, bookingId: null };
              const res2 = await api.post('/payments/create', clone);
              return res2;
            } catch (err2) {
              console.warn('Retry without bookingId failed', err2?.response?.data || err2.message);
            }
          }

          // Try alternative endpoints commonly used in different backends
          const fallbacks = ['/payments', '/payments/intent', '/payments/charge', '/payments/create-payment-intent'];
          for (const u of fallbacks) {
            try {
              tried.push(u);
              const resf = await api.post(u, payload);
              return resf;
            } catch (ef) {
              // continue trying
              console.warn(`Fallback ${u} failed`, ef?.response?.data?.message || ef.message || ef);
            }
          }

          // nothing worked — rethrow primary error for outer catch
          const err = new Error(errPrimary?.response?.data?.message || errPrimary.message || 'Failed to create payment intent');
          err._tried = tried;
          throw errPrimary;
        }
      };

      const paymentResponse = await tryCreatePayment(paymentPayload);
      
      if (!paymentResponse?.data?.success) {
        throw new Error(paymentResponse?.data?.message || 'Failed to create payment intent');
      }

      // If server already created the membership and returned it, treat as success
      const maybeMembership = paymentResponse.data.data?.membership || paymentResponse.data?.membership;
      if (maybeMembership) {
        console.log('✅ Server returned completed membership; skipping client-side Stripe confirm');
        onSuccess(maybeMembership);
        return;
      }

      const clientSecret = paymentResponse.data.data?.clientSecret || paymentResponse.data?.clientSecret;
      if (!clientSecret) {
        throw new Error('Missing clientSecret from payment-intent creation response');
      }
      console.log('✅ Payment intent created, client secret received');

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful, now create membership
        const membershipPayload = { 
          templateId: assignForm.templateId, 
          clientId: assignForm.clientId,
          paymentIntentId: paymentIntent.id
        };
        if (assignForm.startDate) membershipPayload.startDate = assignForm.startDate;
        if (assignForm.paymentType) membershipPayload.paymentType = assignForm.paymentType;
        if (assignForm.price !== '' && assignForm.price != null) membershipPayload.price = Number(assignForm.price);
        
        const membershipResponse = await api.post('/memberships/purchase', membershipPayload);
        onSuccess(membershipResponse.data.data.membership);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error) {
      console.error('Payment error:', error);
      // If axios error, extract useful info
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message || error?.message || 'Payment failed';
      const userMsg = status === 404 ? `Payment service not found (404). ${serverMsg}` : serverMsg;
      onError(userMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="payment-form">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="summary-row">
          <span>Membership: {selectedTemplate?.name}</span>
          <span>AED {finalPrice}</span>
        </div>
      </div>
      
      <div className="card-element-container">
        <label>Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <div className="payment-actions">
        <button type="button" className="mem-btn-secondary" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </button>
        <button type="submit" className="mem-btn-primary" disabled={isProcessing || !stripe}>
          {isProcessing ? 'Processing...' : `Pay AED ${finalPrice}`}
        </button>
      </div>
    </form>
  );
};

const Membership = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [memberships, setMemberships] = useState([]); // purchased memberships
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({ templateId: '', clientId: '', startDate: '', price: '', paymentType: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignStep, setAssignStep] = useState('details'); // 'details' or 'payment'
  const [paymentError, setPaymentError] = useState(null);

  const fetchMemberships = async () => {
    setLoading(true);
    setError(null);
    try {
      // Purchased memberships
      const purchasedRes = await api.get('/memberships/purchased');
      let purchased = purchasedRes.data.data.memberships || [];
      console.log('DEBUG purchased memberships raw:', purchased);
      // If some memberships lack populated client, attempt to fetch individually (lightweight enrichment)
      const unenriched = purchased.filter(m => m.client && (typeof m.client === 'string' || (m.client && !m.client.firstName)) );
      if (unenriched.length) {
        // Attempt batch fetch via hypothetical admin users endpoint; fallback skip
        try {
          const ids = unenriched.map(u => typeof u.client === 'string' ? u.client : u.client._id).join(',');
          const clientsRes = await api.get(`/admin/clients?ids=${ids}`);
          const clientList = clientsRes.data.data?.clients || clientsRes.data.data?.users || [];
          const clientMap = Object.fromEntries(clientList.map(c => [c._id, c]));
          purchased = purchased.map(m => {
            const id = m.client && (typeof m.client === 'string' ? m.client : m.client._id);
            if (id && clientMap[id]) {
              return { ...m, client: clientMap[id] };
            }
            return m;
          });
        } catch (e) {
          console.warn('Client enrichment skipped:', e.message);
        }
      }
      setMemberships(purchased);
      // Templates
      const templateRes = await api.get('/memberships/templates');
      setTemplates(templateRes.data.data.memberships || []);
      // Clients (reuse employees or users endpoint?) -> assume admin users endpoint exists
      try {
        const usersRes = await api.get('/admin/clients');
        setClients(usersRes.data.data?.clients || usersRes.data.data?.users || []);
      } catch (e) {
        console.warn('Could not load clients list:', e.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const filteredMemberships = memberships.filter(m =>
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.client?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.client?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getStatusClass = status => status === 'Active' ? 'mem-status-active' : 'mem-status-used';

  // const SearchIcon = () => (
  //   <svg className="mem-search-icon mem-icon" viewBox="0 0 24 24">
  //     <circle cx="6" cy="3" r="2"></circle>
    
  //     <path d="m21 21-4.35-4.35"></path>
  //   </svg>
  // );

  const FilterIcon = () => (
    <svg className="mem-icon" viewBox="0 0 24 24">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg className="mem-icon" viewBox="0 0 24 24">
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  );

  const DownloadIcon = () => (
    <svg className="mem-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const toggleFilters = () => setShowFilters(!showFilters);
  const toggleExportDropdown = () => setShowExportDropdown(!showExportDropdown);

  const handleExportCSV = () => {
    const headers = ['Name', 'Client', 'Type', 'Sessions Remaining', 'Start Date', 'End Date', 'Status', 'Total Charged'];
    const csvContent = [
      headers.join(','),
      ...filteredMemberships.map(m => [
        m.name,
        m.client?.firstName + ' ' + m.client?.lastName,
        m.type || m.serviceType || m.paymentType || '-',
        m.serviceType === 'Unlimited' 
          ? 'Unlimited' 
          : `${(m.numberOfSessions || 0) - (m.usedSessions || 0)}/${m.numberOfSessions || 0}`,
        m.startDate ? new Date(m.startDate).toLocaleDateString() : '',
        m.endDate ? new Date(m.endDate).toLocaleDateString() : '',
        m.status,
        'AED ' + (m.totalCharged ?? m.price ?? '-')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'memberships.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Memberships Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1e293b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; }
          .status-active { background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 12px; }
          .status-used { background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 12px; }
          .total { font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>Memberships Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Client</th>
              <th>Type</th>
              <th>Sessions Remaining</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Total Charged</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMemberships.map(m => `
              <tr>
                <td>${m.name}</td>
                <td>${m.client?.firstName} ${m.client?.lastName}</td>
                <td>${m.type || m.serviceType || m.paymentType || '-'}</td>
                <td>${m.serviceType === 'Unlimited' 
                  ? 'Unlimited' 
                  : `${(m.numberOfSessions || 0) - (m.usedSessions || 0)}/${m.numberOfSessions || 0}`}</td>
                <td>${m.startDate ? new Date(m.startDate).toLocaleDateString() : ''}</td>
                <td>${m.endDate ? new Date(m.endDate).toLocaleDateString() : ''}</td>
                <td><span class="status-${m.status.toLowerCase()}">${m.status}</span></td>
                <td class="total">AED ${m.totalCharged ?? m.price ?? '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create a new window and print to PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    // Create worksheet data
    const wsData = [
      ['Name', 'Client', 'Type', 'Sessions Remaining', 'Start Date', 'End Date', 'Status', 'Total Charged'],
      ...filteredMemberships.map(m => [
        m.name,
        m.client?.firstName + ' ' + m.client?.lastName,
        m.type || m.serviceType || m.paymentType || '-',
        m.serviceType === 'Unlimited' 
          ? 'Unlimited' 
          : `${(m.numberOfSessions || 0) - (m.usedSessions || 0)}/${m.numberOfSessions || 0}`,
        m.startDate ? new Date(m.startDate).toLocaleDateString() : '',
        m.endDate ? new Date(m.endDate).toLocaleDateString() : '',
        m.status,
        'AED ' + (m.totalCharged ?? m.price ?? '-')
      ])
    ];

    // Convert to CSV format for Excel compatibility
    const csvContent = wsData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create Excel file with proper MIME type
    const blob = new Blob(['\ufeff' + csvContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'memberships.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    
    setShowExportDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.mem-export-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  return (
    <div className="mem-container">
      <div className="mem-max-width">
        <div className="mem-header">
          <div className="mem-header-content">
            <h1 className="mem-title">Memberships sold</h1>
            <p className="mem-subtitle">
              View and filter memberships purchased by your clients.{' '}
              {/* <a href="#" className="mem-learn-more">Read more</a> */}
            </p>
          </div>
          <div className="mem-export-container">
            <button
              className="mem-export-btn primary"
              onClick={() => {
                setAssignForm({ templateId: '', clientId: '', startDate: '', price: '', paymentType: '' });
                setAssignStep('details');
                setPaymentError(null);
                setShowAssignModal(true);
              }}
            >
              Assign Membership
            </button>
           
            <button 
              className="mem-export-btn dropdown"
              onClick={toggleExportDropdown}
            >
              <DownloadIcon />
              <span>Export</span>
              <ChevronDownIcon />
            </button>
            
            {showExportDropdown && (
              <div className="mem-export-dropdown">
                <button onClick={handleExportCSV} className="mem-export-option">
                  Export to CSV
                </button>
                <button onClick={handleExportPDF} className="mem-export-option">
                  Export to PDF
                </button>
                <button onClick={handleExportExcel} className="mem-export-option">
                  Export to Excel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mem-search-container">
          <div className="mem-search-wrapper">
            {/* <SearchCheck /> */}
            <input
              type="text"
              className="mem-search-input"
              
              placeholder="Search by client or membership"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
<Error500Page/>        ) : (
          <>
            <div className="mem-table-container">
              <div className="mem-table-wrapper">
                <table className="mem-table">
                  <thead className="mem-table-header">
                    <tr>
                      <th>Name</th>
                      <th>Client</th>
                      <th>Type</th>
                      <th>Sessions</th>
                      <th>Start date</th>
                      <th>End date</th>
                      <th>Status</th>
                      <th>Total charged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMemberships.map((membership, index) => (
                      <tr key={membership._id || index} className="mem-table-row">
                        <td className="mem-table-cell">
                          <a href="#" className="mem-link-text">{membership.name}</a>
                        </td>
                        <td className="mem-table-cell">
                          <a href="#" className="mem-link-text">{membership.client?.firstName} {membership.client?.lastName}</a>
                        </td>
                        <td className="mem-table-cell">{membership.type || membership.serviceType || membership.paymentType || '-'}</td>
                        <td className="mem-table-cell">
                          {membership.serviceType === 'Unlimited' 
                            ? 'Unlimited' 
                            : `${(membership.numberOfSessions || 0) - (membership.usedSessions || 0)}/${membership.numberOfSessions || 0}`
                          }
                        </td>
                        <td className="mem-table-cell mem-date-text">{membership.startDate ? new Date(membership.startDate).toLocaleDateString() : ''}</td>
                        <td className="mem-table-cell mem-date-text">{membership.endDate ? new Date(membership.endDate).toLocaleDateString() : ''}</td>
                        <td className="mem-table-cell">
                          <span className={`mem-status-badge ${getStatusClass(membership.status)}`}>
                            {membership.status}
                          </span>
                        </td>
                        <td className="mem-table-cell mem-total-amount">AED {membership.totalCharged ?? membership.price ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mem-cards-container">
              {filteredMemberships.map((membership, index) => (
                <div key={membership._id || index} className="mem-card">
                  <div className="mem-card-header">
                    <div className="mem-card-info">
                      <a href="#" className="mem-card-title">{membership.name}</a>
                      <div className="mem-card-client">{membership.client?.firstName} {membership.client?.lastName}</div>
                    </div>
                    <span className={`mem-status-badge ${getStatusClass(membership.status)}`}>
                      {membership.status}
                    </span>
                  </div>

                  <div className="mem-card-grid">
                    <div className="mem-card-field">
                      <div className="mem-card-label">Type</div>
                      <div className="mem-card-value">{membership.type || membership.serviceType || membership.paymentType || '-'}</div>
                    </div>
                    <div className="mem-card-field">
                      <div className="mem-card-label">Sessions Remaining</div>
                      <div className="mem-card-value">
                        {membership.serviceType === 'Unlimited' 
                          ? 'Unlimited' 
                          : `${(membership.numberOfSessions || 0) - (membership.usedSessions || 0)}/${membership.numberOfSessions || 0}`
                        }
                      </div>
                    </div>
                    <div className="mem-card-field">
                      <div className="mem-card-label">Start date</div>
                      <div className="mem-card-value mem-date-text">{membership.startDate ? new Date(membership.startDate).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="mem-card-field">
                      <div className="mem-card-label">End date</div>
                      <div className="mem-card-value mem-date-text">{membership.endDate ? new Date(membership.endDate).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="mem-card-field mem-card-total">
                      <div className="mem-card-label">Total charged</div>
                      <div className="mem-card-value">AED {membership.totalCharged ?? membership.price ?? '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredMemberships.length === 0 && !loading && !error && (
              <div className="mem-no-results">
                <p>No memberships found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
      {showAssignModal && (
        <Elements stripe={stripePromise}>
          <div className="mem-modal-overlay">
            <div className="mem-modal">
              <div className="mem-modal-header">
                <h2>
                  {assignStep === 'details' ? 'Assign Membership' : 'Payment'}
                </h2>
                <button className="mem-modal-close" onClick={()=> {
                  setShowAssignModal(false);
                  setAssignStep('details');
                  setPaymentError(null);
                }}>×</button>
              </div>
              
              <div className="mem-modal-body">
                {assignStep === 'details' ? (
                  <>
                    <div className="mem-form-group">
                      <label>Client</label>
                      <select value={assignForm.clientId} onChange={e=> setAssignForm(f=>({...f, clientId:e.target.value}))}>
                        <option value="">Select client</option>
                        {clients.map(c=> (
                          <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>
                        ))}
                      </select>
                    </div>
                    <div className="mem-form-group">
                      <label>Template</label>
                      <select value={assignForm.templateId} onChange={e=> setAssignForm(f=>({...f, templateId:e.target.value, price: templates.find(t=> t._id===e.target.value)?.price || '' }))}>
                        <option value="">Select template</option>
                        {templates.map(t=> (
                          <option key={t._id} value={t._id}>{t.name} - AED {t.price}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mem-form-group">
                      <label>Start date</label>
                      <input type="date" value={assignForm.startDate} onChange={e=> setAssignForm(f=>({...f, startDate:e.target.value}))} />
                    </div>
                    <div className="mem-form-group">
                      <label>Payment type</label>
                      <select value={assignForm.paymentType} onChange={e=> setAssignForm(f=>({...f, paymentType:e.target.value}))}>
                        <option value="">Default (template)</option>
                        <option value="One-time">One-time</option>
                        <option value="Recurring">Recurring</option>
                      </select>
                    </div>
                    <div className="mem-form-group">
                      <label>Price (override)</label>
                      <input type="number" placeholder="Leave blank to use template price" value={assignForm.price} onChange={e=> setAssignForm(f=>({...f, price:e.target.value}))} />
                    </div>
                  </>
                ) : (
                  <>
                    {paymentError && (
                      <div className="payment-error">
                        <p>Payment Error: {paymentError}</p>
                      </div>
                    )}
                    <MembershipPaymentForm
                      assignForm={assignForm}
                      templates={templates}
                      onSuccess={(membership) => {
                        setMemberships(m => [membership, ...m]);
                        setShowAssignModal(false);
                        setAssignStep('details');
                        setPaymentError(null);
                      }}
                      onCancel={() => {
                        setAssignStep('details');
                        setPaymentError(null);
                      }}
                      onError={(error) => {
                        setPaymentError(error);
                      }}
                    />
                  </>
                )}
              </div>
              
              {assignStep === 'details' && (
                <div className="mem-modal-footer">
                  <button className="mem-btn-secondary" onClick={()=> {
                    setShowAssignModal(false);
                    setAssignStep('details');
                  }} disabled={assignSubmitting}>Cancel</button>
                  <button className="mem-btn-primary" 
                          disabled={assignSubmitting || !assignForm.clientId || !assignForm.templateId} 
                          onClick={() => {
                            setAssignStep('payment');
                            setPaymentError(null);
                          }}>
                    Continue to Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </Elements>
      )}
    </div>
  );
};

export default Membership;