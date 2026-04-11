import React, { useState, useEffect } from "react";
import api from "../Service/Api"; // Your API service
import "./Paymentclient.css";
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoDataState from "../states/NoData";
import DatePicker from "../components/DatePicker/DatePicker";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
// import './Membership.css/mem-export-bbtn';


// import{mem-export-bbtn} from './'

import { FiSearch, FiCalendar, FiFilter, FiMoreVertical, FiRefreshCw, FiDownload, FiChevronDown, FiChevronUp, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const Spinner = () => (<div className="spinner-container"><div className="spinner"></div></div>);

const PaymentClient = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for new UI controls
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30; // Show 30 items per page

  useEffect(() => {
    // This effect can be used to close the dropdown if you click outside of it
    const handleClickOutside = () => setIsOptionsOpen(false);
    if (isOptionsOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOptionsOpen]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch ALL payments by using a very high limit - backend sorts by createdAt desc (newest first)
      const page = 1;
      const limit = 10000; // High limit to get all records
      const res = await api.get(`/payments/admin/all?page=${page}&limit=${limit}`);

      const paymentsData = res.data?.data?.payments || [];
      const mapped = paymentsData.map((p) => ({
        id: p._id,
        date: p.createdAt ? new Date(p.createdAt) : new Date(),
          // bookingNumber populated as 'bookingNumber' in booking select
        reference: p.booking?.bookingNumber || p._id || "-",
        amount: typeof p.amount === 'number' ? p.amount : 0,
        status: p.status || "-",
        paymentMethod: p.paymentMethod || "-",
        user: `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || "-",
        gateway: p.paymentGateway || "-",
        bookingStatus: p.booking?.status || "-",
        refundAmount: p.refundAmount ? p.refundAmount : 0,
      }));

      setPayments(mapped);
      if (mapped.length === 0) {}
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(err.response?.data?.message || err.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Logic for sorting and filtering
  const sortedAndFilteredPayments = payments
    .filter(p => {
      const matchesSearch = 
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedDate) {
        const paymentDate = new Date(p.date);
        const selected = new Date(selectedDate);
        return matchesSearch && 
          paymentDate.getDate() === selected.getDate() &&
          paymentDate.getMonth() === selected.getMonth() &&
          paymentDate.getFullYear() === selected.getFullYear();
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'date') {
        const aValue = a.date.getTime();
        const bValue = b.date.getTime();
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'amount') {
        const aValue = a.amount;
        const bValue = b.amount;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // String comparison for other fields
      const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
      const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
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

  // Export Functions
  const exportToCSV = () => {
    const csvData = sortedAndFilteredPayments.map(payment => ({
      Date: payment.date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      Reference: payment.reference,
      User: payment.user,
      'Payment Method': payment.paymentMethod,
      Status: payment.status,
      'Amount (AED)': payment.amount.toFixed(2)
    }));

    // Add total row
    csvData.push({
      Date: '',
      Reference: '',
      User: '',
      'Payment Method': '',
      Status: 'TOTAL',
      'Amount (AED)': totalAmount.toFixed(2)
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsOptionsOpen(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text("Payment Transactions Report", 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

    // Prepare table data
    const tableColumn = ["Date", "Reference", "User", "Payment Method", "Status", "Amount (AED)"];
    const tableRows = sortedAndFilteredPayments.map(payment => [
      payment.date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      payment.reference,
      payment.user,
      payment.paymentMethod,
      payment.status,
      payment.amount.toFixed(2)
    ]);

    // Add total row
    tableRows.push(['', '', '', '', 'TOTAL', totalAmount.toFixed(2)]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      footStyles: { fillColor: [245, 245, 245], fontStyle: 'bold' }
    });

    doc.save(`payments_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsOptionsOpen(false);
  };

  const exportToExcel = () => {
    const excelData = sortedAndFilteredPayments.map(payment => ({
      Date: payment.date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      Reference: payment.reference,
      User: payment.user,
      'Payment Method': payment.paymentMethod,
      Status: payment.status,
      'Amount (AED)': payment.amount.toFixed(2)
    }));

    // Add total row
    excelData.push({
      Date: '',
      Reference: '',
      User: '',
      'Payment Method': '',
      Status: 'TOTAL',
      'Amount (AED)': totalAmount.toFixed(2)
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    ws['!cols'] = [
      { width: 12 }, // Date
      { width: 15 }, // Reference
      { width: 20 }, // User
      { width: 15 }, // Payment Method
      { width: 12 }, // Status
      { width: 12 }  // Amount
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `payments_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsOptionsOpen(false);
  };

  // Check if we have no data
  const hasNoData = !loading && !error && payments.length === 0;
  const hasNoResults = !loading && !error && payments.length > 0 && sortedAndFilteredPayments.length === 0;

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAndFilteredPayments.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Scroll to top when page changes
  };

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, selectedDate]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage + 2 >= totalPages) {
        startPage = totalPages - 4;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pay-pagination">
        <button 
          className="pay-pagination-btn"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button 
              className={`pay-pagination-btn ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => paginate(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="pay-pagination-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <button
            key={number}
            className={`pay-pagination-btn ${currentPage === number ? 'active' : ''}`}
            onClick={() => paginate(number)}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pay-pagination-ellipsis">...</span>}
            <button 
              className={`pay-pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
              onClick={() => paginate(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button 
          className="pay-pagination-btn"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  const renderTable = () => (
    <div className="pay-table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <table className="pay-table" style={{ width: '100%', tableLayout: 'auto' }}>
        <thead>
          <tr style={{ width: '100%' }}>
            {[
              { key: 'date', label: 'Date', width: '15%' },
              { key: 'reference', label: 'Reference', width: '20%' },
              { key: 'user', label: 'User', width: '25%' },
              { key: 'paymentMethod', label: 'Payment Method', width: '25%' },
              { key: 'amount', label: 'Amount', width: '15%' },
            ].map(column => (
              <th className="pay-th" key={column.key} style={{ width: column.width }}>
                <button className="pay-sort-btn" onClick={() => handleSort(column.key)} style={{ width: '100%', justifyContent: 'space-between' }}>
                  {column.label}
                  {sortConfig.key === column.key ? (
                    sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                  ) : (
                    <span style={{ opacity: 0.3 }}><FiArrowUp /></span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentItems.map((payment) => (
            <tr key={payment.id} className="pay-row" style={{ width: '100%' }}>
              <td className="pay-td" style={{ width: '15%', padding: '12px 8px' }}>
                {payment.date.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
              <td className="pay-td" style={{ width: '20%', padding: '12px 8px' }}>{payment.reference}</td>
              <td className="pay-td" style={{ width: '25%', padding: '12px 8px' }}>{payment.user}</td>
              <td className="pay-td" style={{ width: '25%', padding: '12px 8px' }}>{payment.paymentMethod}</td>
              <td className="pay-td pay-td-bold" style={{ width: '15%', padding: '12px 8px' }}>AED {payment.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="pay-total-row">
            <td colSpan="4" className="pay-td-bold">Total</td>
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
            <div className="pay-card-row">
              <span>Ref:</span> 
              <span className="pay-link">{payment.reference}</span>
            </div>
            <div className="pay-card-row">
              <span>Method:</span> 
              <span>{payment.paymentMethod}</span>
            </div>
            <div className="pay-card-row">
              <span>Date:</span> 
              <span>
                {payment.date.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
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
            <h1 className="pay-sub-title">View, filter and export the history of your payments</h1>
          </div>
          <div className="pay-options">
           
            <button 
              className="pay-refresh-btn mem-export-bbtn" 
              onClick={() => fetchPayments(true)}
              disabled={isRefreshing || loading}
              style={{ marginRight: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiRefreshCw className={isRefreshing ? "spin-animation" : ""} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button 
              className="pay-options-btn mem-export-bbtn" 
              onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }}
              disabled={sortedAndFilteredPayments.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
               Export <FiChevronDown />
            </button>

            {isOptionsOpen && sortedAndFilteredPayments.length > 0 && (
              <div className="pay-options-dropdown" onClick={(e) => e.stopPropagation()}>
                <button className="pay-dropdown-item" onClick={exportToCSV}>CSV</button>
                <button className="pay-dropdown-item" onClick={exportToPDF}>PDF</button>
                <button className="pay-dropdown-item" onClick={exportToExcel}>Excel</button>
              </div>
            )}
          </div>
        </div>
        <div className="payControls">
          <div className="pay-controls-left">
            <div className="pay-date-picker">
              <DatePicker 
                selectedDate={selectedDate}
                onChange={setSelectedDate}
                placeholder="Filter by date..."
              />
            </div>
            <div className="pay-search">
              <span className="pay-search-icon"><FiSearch /></span>
              <input 
                type="text" 
                placeholder="Search by reference, name, or payment method..." 
                className="pay-search-input" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="pay-table-container">
        {loading ? (
          <Loading />
        ) : error ? (
          <Error500Page />
        ) : hasNoData ? (
          <NoDataState
            message="No completed payments found"
            description="Payment transactions will appear here only after bookings are marked as 'completed'. Currently, there are no completed bookings with payments."
            icon="💳"
          />
        ) : hasNoResults ? (
          <NoDataState
            message="No payments match your search"
            description={`No payments found matching "${searchTerm}". Try adjusting your search terms.`}
            icon="🔍"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="pay-desktop-table">
              {renderTable()}
              {renderPagination()}
            </div>
            {/* Mobile Cards */}
            <div className="pay-mobile-table">
              {renderMobileCards()}
              {renderPagination()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentClient;