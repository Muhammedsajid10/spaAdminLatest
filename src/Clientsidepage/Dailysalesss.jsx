import React, { useState, useEffect, useRef } from "react";
import "./Dailysalesss.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Calendar, Users, XSquare, Tag, DollarSign } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import api from "../Service/Api";
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoDataState from "../states/NoData";

const DailySales = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const calendarRef = useRef(null);
  const addMenuRef = useRef(null);
  const exportMenuRef = useRef(null);

  // State for both summaries
  const [transactionSummary, setTransactionSummary] = useState([]);
  const [cashMovementSummary, setCashMovementSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to format date as YYYY-MM-DD for API
  const formatApiDate = (date) => {
    return date.toISOString().slice(0, 10);
  };

  // Helper to check if date is today
  const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  };

  // Process payments data to create transaction summary
  const processPaymentsData = (payments) => {
    const transactionTypes = ['Services', 'Membership card', 'Gift cards'];
    
    // Count transactions by type
    const processedTransactions = transactionTypes.map(type => {
      let salesQty = 0;
      let refundQty = 0;
      let grossTotal = 0;

      if (type === 'Services') {
        // Count completed payments as sales
        const completedPayments = payments.filter(p => 
          p.status === 'completed' || p.status === 'paid' || p.status === 'success'
        );
        salesQty = completedPayments.length;
        
        // Count refunds - check multiple possible refund indicators
        refundQty = payments.filter(p => 
          (p.refundAmount && p.refundAmount > 0) || 
          p.status === 'refunded' || 
          p.status === 'cancelled'
        ).length;
        
        // Calculate gross total from completed payments
        grossTotal = completedPayments.reduce((sum, p) => {
          // Handle different possible amount formats
          const amount = p.amount || p.totalAmount || p.finalAmount || 0;
          // Check if amount is in cents or regular format
          const actualAmount = amount > 1000 ? amount / 100 : amount;
          return sum + actualAmount;
        }, 0);
      }

      return {
        itemType: type,
        salesQty,
        refundQty,
        grossTotal: grossTotal > 0 ? `AED ${grossTotal.toFixed(2)}` : "AED 0.00"
      };
    });

    return processedTransactions;
  };

  // Fetch both cash movement summary and payments data
  useEffect(() => {
    const fetchDailySalesData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatApiDate(currentDate);
        console.log('📅 Fetching data for date:', dateStr);
        
        // Try different API endpoints and approaches
        let cashMovementRes, paymentsRes;
        
        try {
          // Fetch cash movement data
          cashMovementRes = await api.get(`/admin/cash-movement-summary?date=${dateStr}`);
        } catch (cashErr) {
          console.warn('Cash movement API failed, trying alternative:', cashErr);
          // Try alternative endpoint or create empty response
          cashMovementRes = { data: { data: {} } };
        }
        
        try {
          // Fetch payments data - try multiple possible endpoints
          paymentsRes = await api.get(`/payments/admin/all?page=1&limit=1000&date=${dateStr}`);
        } catch (paymentsErr) {
          console.warn('Payments API with date failed, trying without date filter:', paymentsErr);
          try {
            // Try without date filter and filter client-side
            paymentsRes = await api.get(`/payments/admin/all?page=1&limit=1000`);
          } catch (paymentsErr2) {
            console.warn('Alternative payments API also failed:', paymentsErr2);
            paymentsRes = { data: { data: { payments: [] } } };
          }
        }

        // Process cash movement summary
        const cashMovementData = cashMovementRes.data?.data || {};
        
        const paymentTypes = ['Card', 'Cash', 'Upi', 'GiftCard Redemption', 'Membership Card'];
        const processedCashMovement = paymentTypes.map(type => {
          const typeData = cashMovementData[type] || {};
          const paymentsCollected = typeData.paymentsCollected || 0;
          const refundsPaid = typeData.refundsPaid || 0;
          
          return {
            paymentType: type,
            paymentsCollected: paymentsCollected > 0 
              ? `AED ${(paymentsCollected / 100).toFixed(2)}` 
              : "AED 0.00",
            refundsPaid: refundsPaid > 0 
              ? `AED ${(refundsPaid / 100).toFixed(2)}` 
              : "AED 0.00"
          };
        });

        // Process payments data for transaction summary
        let paymentsData = paymentsRes.data?.data?.payments || paymentsRes.data?.payments || [];
        
        // If we got all payments, filter by current date
        if (paymentsData.length > 0) {
          const currentDateStr = formatApiDate(currentDate);
          paymentsData = paymentsData.filter(payment => {
            if (!payment.createdAt) return false;
            
            // Handle different date formats
            let paymentDate;
            if (typeof payment.createdAt === 'string') {
              paymentDate = payment.createdAt.slice(0, 10); // YYYY-MM-DD
            } else {
              paymentDate = new Date(payment.createdAt).toISOString().slice(0, 10);
            }
            
            return paymentDate === currentDateStr;
          });
          console.log(`💰 Filtered ${paymentsData.length} payments for ${currentDateStr}`);
        }
        
        const processedTransactions = processPaymentsData(paymentsData);

        console.log('✅ Data processing completed:', {
          transactionsSummary: processedTransactions,
          cashMovementSummary: processedCashMovement
        });

        setTransactionSummary(processedTransactions);
        setCashMovementSummary(processedCashMovement);
      } catch (err) {
        console.error('Failed to fetch daily sales data:', err);
        console.error('Error details:', err.response?.data); // More detailed error logging
        setError(err.response?.data?.message || err.message || "Failed to load daily sales data");
        // Set empty arrays on error
        setTransactionSummary([]);
        setCashMovementSummary([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDailySalesData();
  }, [currentDate]);

  // Check if data is empty
  const hasTransactionData = transactionSummary.some(
    (item) => item.salesQty > 0 || item.refundQty > 0 || item.grossTotal !== "AED 0.00"
  );

  const hasCashMovementData = cashMovementSummary.some(
    (item) => item.paymentsCollected !== "AED 0.00" || item.refundsPaid !== "AED 0.00"
  );

  // Debug logs for data state (only log once when data changes)
  useEffect(() => {
    console.log('🔄 Data State Updated:');
    console.log('Transaction Summary:', transactionSummary);
    console.log('Has Transaction Data:', hasTransactionData);
    console.log('Cash Movement Summary:', cashMovementSummary);
    console.log('Has Cash Movement Data:', hasCashMovementData);
  }, [transactionSummary, cashMovementSummary, hasTransactionData, hasCashMovementData]);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleExportPDF = () => {
    if (!hasTransactionData && !hasCashMovementData) {
      alert("No data available to export");
      return;
    }

    const doc = new jsPDF();
    doc.text(`Daily Sales Report - ${formatDate(currentDate)}`, 14, 10);

    if (hasTransactionData) {
      doc.text("Transaction Summary", 14, 25);
      autoTable(doc, {
        startY: 30,
        head: [["Item type", "Sales qty", "Refund qty", "Gross total"]],
        body: transactionSummary.map((item) => [item.itemType, item.salesQty, item.refundQty, item.grossTotal]),
      });
    }

    if (hasCashMovementData) {
      const startY = hasTransactionData ? doc.lastAutoTable.finalY + 10 : 25;
      doc.text("Cash Movement Summary", 14, startY);
      autoTable(doc, {
        startY: startY + 5,
        head: [["Payment type", "Payments collected", "Refunds paid"]],
        body: cashMovementSummary.map((item) => [item.paymentType, item.paymentsCollected, item.refundsPaid]),
      });
    }

    doc.save(`DailySales_${formatApiDate(currentDate)}.pdf`);
  };

  const handleExportCSV = () => {
    if (!hasTransactionData && !hasCashMovementData) {
      alert("No data available to export");
      return;
    }

    const csvData = [[`Daily Sales Report - ${formatDate(currentDate)}`], []];

    if (hasTransactionData) {
      csvData.push(
        ["Transaction Summary"],
        ["Item type", "Sales qty", "Refund qty", "Gross total"],
        ...transactionSummary.map((item) => [item.itemType, item.salesQty, item.refundQty, item.grossTotal]),
        []
      );
    }

    if (hasCashMovementData) {
      csvData.push(
        ["Cash Movement Summary"],
        ["Payment type", "Payments collected", "Refunds paid"],
        ...cashMovementSummary.map((item) => [item.paymentType, item.paymentsCollected, item.refundsPaid])
      );
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DailySales_${formatApiDate(currentDate)}.csv`;
    link.click();
  };

  const handleExportExcel = () => {
    if (!hasTransactionData && !hasCashMovementData) {
      alert("No data available to export");
      return;
    }

    const wb = XLSX.utils.book_new();

    if (hasTransactionData) {
      const wsData1 = [
        [`Transaction Summary - ${formatDate(currentDate)}`],
        [],
        ["Item type", "Sales qty", "Refund qty", "Gross total"],
        ...transactionSummary.map((item) => [item.itemType, item.salesQty, item.refundQty, item.grossTotal]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(wsData1);
      XLSX.utils.book_append_sheet(wb, ws1, "Transaction Summary");
    }

    if (hasCashMovementData) {
      const wsData2 = [
        [`Cash Movement Summary - ${formatDate(currentDate)}`],
        [],
        ["Payment type", "Payments collected", "Refunds paid"],
        ...cashMovementSummary.map((item) => [item.paymentType, item.paymentsCollected, item.refundsPaid]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(wsData2);
      XLSX.utils.book_append_sheet(wb, ws2, "Cash Movement Summary");
    }

    XLSX.writeFile(wb, `DailySales_${formatApiDate(currentDate)}.xlsx`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="ds-container">
        <div className="ds-top-bar">
          <div>
            <h1 className="ds-title">Daily sales</h1>
            <p className="ds-subtitle">View, filter and export the transactions and cash movement for the day.</p>
          </div>
        </div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-container">
        <div className="ds-top-bar">
          <div>
            <h1 className="ds-title">Daily sales</h1>
            <p className="ds-subtitle">View, filter and export the transactions and cash movement for the day.</p>
          </div>
        </div>
        <Error500Page />
      </div>
    );
  }

  return (
    <div className="ds-container">
      <div className="ds-top-bar">
        <div>
          <h1 className="ds-title">Daily sales</h1>
          <p className="ds-subtitle">View, filter and export the transactions and cash movement for the day.</p>
        </div>
        <div className="ds-actions">
          {/* Export Dropdown */}
          <div className="ds-export-dropdown-container" ref={exportMenuRef}>
            <button
              className="ds-export-btn mem-export-bbtn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              // disabled={!hasTransactionData && !hasCashMovementData}
            >
              Export
            </button>
            {showExportMenu && (
              <div className="ds-export-dropdown">
                <div className="ds-dropdown-item" onClick={handleExportPDF}>Export PDF</div>
                <div className="ds-dropdown-item" onClick={handleExportCSV}>Export CSV</div>
                <div className="ds-dropdown-item" onClick={handleExportExcel}>Export Excel</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ds-date-section" ref={calendarRef}>
        <div className="ds-date-controls">
          <div className="ds-today-btn" onClick={() => { setCurrentDate(new Date()); setShowCalendar(false); }}>
            Today
          </div>
          <div className="ds-date-display-wrapper" onClick={() => setShowCalendar(!showCalendar)}>
            <span className="ds-arrow-icon" onClick={(e) => { e.stopPropagation(); changeDate(-1); }}>
              <IoIosArrowBack />
            </span>
            <div className="ds-date-display">{formatDate(currentDate)}</div>
            <span className="ds-arrow-icon" onClick={(e) => { e.stopPropagation(); changeDate(1); }}>
              <IoIosArrowForward />
            </span>
          </div>
        </div>

        {showCalendar && (
          <div className="ds-calendar-popup">
            <DatePicker
              selected={currentDate}
              onChange={(date) => {
                setCurrentDate(date);
                setShowCalendar(false);
              }}
              inline
              calendarClassName="ds-datepicker"
            />
          </div>
        )}
      </div>

      <div className="ds-tables">
        <div className="ds-table-card">
          <h2 className="ds-table-title">
            Transaction summary 
            <small style={{fontSize: '12px', color: '#666', marginLeft: '10px'}}>
              (Has Data: {hasTransactionData ? 'Yes' : 'No'}, Items: {transactionSummary.length})
            </small>
          </h2>
          <div className="ds-table-wrapper">
            {!hasTransactionData ? (
              <NoDataState
                message="No transactions found"
                description={`No transaction data available for ${formatDate(currentDate)}.`}
                icon="💳"
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Item type</th>
                    <th>Sales qty</th>
                    <th>Refund qty</th>
                    <th>Gross total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionSummary.map((item, index) => {
                    console.log(`🎯 Rendering transaction row ${index}:`, item);
                    return (
                      <tr key={index}>
                        <td>{item.itemType}</td>
                        <td>{item.salesQty}</td>
                        <td>{item.refundQty}</td>
                        <td>{item.grossTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ds-table-card">
          <h2 className="ds-table-title">Cash movement summary</h2>
          <div className="ds-table-wrapper">
            {!hasCashMovementData ? (
              <NoDataState
                message="No cash movements found"
                description={`No cash movement data available for ${formatDate(currentDate)}.`}
                icon="💰"
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Payment type</th>
                    <th>Payments collected</th>
                    <th>Refunds paid</th>
                  </tr>
                </thead>
                <tbody>
                  {cashMovementSummary.map((item, index) => (
                    <tr key={index}>
                      <td>{item.paymentType}</td>
                      <td>{item.paymentsCollected}</td>
                      <td>{item.refundsPaid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySales;
