import React, { useState, useEffect } from "react";
// import api from "../Service/Api"; // Your API service
import "./Paymentclient.css";

// --- Mock API for demonstration ---
const api = { get: () => new Promise(resolve => resolve({ data: { data: { payments: [
    {_id: '1', createdAt: new Date(), booking: { bookingNumber: 'BK-1024' }, amount: 25000, status: 'Completed', paymentMethod: 'Card', paymentGateway: 'Stripe', user: {firstName: 'Sarah', lastName: 'Johnson'}, bookingStatus: 'Completed'},
    {_id: '2', createdAt: new Date(), booking: { bookingNumber: 'BK-1023' }, amount: 12000, status: 'Completed', paymentMethod: 'Cash', paymentGateway: 'N/A', user: {firstName: 'Mike', lastName: 'Chen'}, bookingStatus: 'Completed'},
    {_id: '3', createdAt: new Date(), booking: { bookingNumber: 'BK-1022' }, amount: 7550, status: 'Pending', paymentMethod: 'Online', paymentGateway: 'Stripe', user: {firstName: 'Emma', lastName: 'Davis'}, bookingStatus: 'Confirmed'}
]}}})) };


// --- SVG Icons for UI ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h16M3 10h10M3 16h5" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>;


const Spinner = () => (<div className="spinner-container"><div className="spinner"></div></div>);

const PaymentClient = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for new UI controls
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    // This effect can be used to close the dropdown if you click outside of it
    const handleClickOutside = () => setIsOptionsOpen(false);
    if (isOptionsOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOptionsOpen]);


  useEffect(() => {
    const fetchPayments = async () => {
      // ... (your existing data fetching logic is preserved here) ...
       setLoading(true);
      setError(null);
      try {
        const res = await api.get("/payments/admin/all");
        const paymentsData = res.data.data.payments || [];
        const mapped = paymentsData.map((p) => ({
          id: p._id,
          date: new Date(p.createdAt),
          reference: p.booking?.bookingNumber || p._id,
          amount: p.amount / 100,
          status: p.status || "-",
          paymentMethod: p.paymentMethod || "-",
          user: `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || "-",
        }));
        setPayments(mapped);
      } catch (err) {
        setError(err.message || "Failed to load payments");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);
  
  // Logic for sorting and filtering
  const sortedAndFilteredPayments = payments
    .filter(p => p.reference.toLowerCase().includes(searchTerm.toLowerCase()) || p.user.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const totalAmount = sortedAndFilteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const renderTable = () => (
    <div className="pay-table-wrapper">
      <table className="pay-table">
        <thead>
          <tr>
            {['date', 'reference', 'user', 'paymentMethod', 'status', 'amount'].map(key => (
              <th className="pay-th" key={key}>
                <button className="pay-sort-btn" onClick={() => handleSort(key)}>
                  {key.replace(/([A-Z])/g, ' $1')} {/* Add space before capital letters */}
                  <SortIcon />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredPayments.map((payment) => (
            <tr key={payment.id} className="pay-row">
              <td className="pay-td">{payment.date.toLocaleDateString()}</td>
              <td className="pay-td pay-link">{payment.reference}</td>
              <td className="pay-td">{payment.user}</td>
              <td className="pay-td">{payment.paymentMethod}</td>
              <td className="pay-td"><span className={`status-badge status-${payment.status.toLowerCase()}`}>{payment.status}</span></td>
              <td className="pay-td pay-td-bold">AED {payment.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
            <tr className="pay-total-row">
                <td colSpan="5">Total</td>
                <td className="pay-td-bold">AED {totalAmount.toFixed(2)}</td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
  
  const renderMobileCards = () => (
    <div className="pay-mobile-cards">
       {sortedAndFilteredPayments.map((payment) => (
         <div key={payment.id} className="pay-card">
           <div className="pay-card-header">
             <div className="pay-card-user">{payment.user}</div>
             <div className="pay-card-amount">AED {payment.amount.toFixed(2)}</div>
           </div>
           <div className="pay-card-body">
             <div className="pay-card-row"><span>Ref:</span> <span className="pay-link">{payment.reference}</span></div>
             <div className="pay-card-row"><span>Method:</span> <span>{payment.paymentMethod}</span></div>
             <div className="pay-card-row"><span>Date:</span> <span>{payment.date.toLocaleDateString()}</span></div>
           </div>
           <div className="pay-card-footer">
             <span className={`status-badge status-${payment.status.toLowerCase()}`}>{payment.status}</span>
           </div>
         </div>
       ))}
       <div className="pay-total-card">
           <span>Total</span>
           <span>AED {totalAmount.toFixed(2)}</span>
       </div>
    </div>
  );

  return (
    <div className="pay-container">
      <div className="pay-header">
        <div className="pay-header-top">
          <div className="pay-header-info">
            <h1 className="pay-title">Payments transactions</h1>
            <h1 className="pay-sub-title">View,filter and export the history of your payments</h1>

          </div>
          <div className="pay-options">
            <button className="pay-options-btn" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }}>
              <OptionsIcon /> Options
            </button>
            {isOptionsOpen && (
              <div className="pay-options-dropdown" onClick={(e) => e.stopPropagation()}>
                <button className="pay-dropdown-item">Export</button>
                <button className="pay-dropdown-item">Print</button>
              </div>
            )}
          </div>
        </div>
        <div className="pay-controls">
            <div className="pay-search">
                <span className="pay-search-icon"><SearchIcon /></span>
                <input type="text" placeholder="Search by reference or name..." className="pay-search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="pay-filters">
                <button className="pay-filter-btn"><CalendarIcon /> Date range</button>
                <button className="pay-filter-btn"><FilterIcon /> Filters</button>
            </div>
        </div>
      </div>
      
      <div className="pay-table-container">
        {loading ? <Spinner /> : error ? <div className="error-message">Error: {error}</div> 
          : (
            <>
              {/* Desktop Table */}
              <div className="pay-desktop-table">{renderTable()}</div>
              {/* Mobile Cards */}
              <div className="pay-mobile-table">{renderMobileCards()}</div>
            </>
          )
        }
        {!loading && !error && sortedAndFilteredPayments.length === 0 && (
          <div className="no-results-message">No payments found.</div>
        )}
      </div>
    </div>
  );
};

export default PaymentClient;