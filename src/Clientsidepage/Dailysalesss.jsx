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
import Swal from "sweetalert2";
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



  // Fetch both cash movement summary and payments data
  useEffect(() => {
    const fetchDailySalesData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatApiDate(currentDate);

        let cashMovementRes, transactionRes;

        try {
          // Fetch cash movement data
          cashMovementRes = await api.get(`/admin/cash-movement-summary?date=${dateStr}`);
        } catch (cashErr) {
          console.warn('Cash movement API failed:', cashErr);
          cashMovementRes = { data: { data: {} } };
        }

        try {
          // Fetch daily transaction summary
          transactionRes = await api.get(`/admin/daily-transaction-summary?date=${dateStr}`);
        } catch (transactionErr) {
          console.warn('Transaction summary API failed:', transactionErr);
          transactionRes = { data: { data: {} } };
        }

        // Process cash movement summary
        const cashMovementData = cashMovementRes.data?.data || {};

        const paymentTypes = ['card', 'cash', 'digital_wallet', 'giftcard', 'membership'];
        const paymentTypeLabels = {
          'card': 'Card',
          'cash': 'Cash',
          'digital_wallet': 'Bank Transfer',
          'giftcard': 'Gift Card Redeemed',
          'membership': 'Membership Redeemed'
        };

        const processedCashMovement = paymentTypes.map(type => {
          const typeData = cashMovementData[type] || {};
          const paymentsCollected = typeData.paymentsCollected || 0;
          const refundsPaid = typeData.refundsPaid || 0;
          const paymentsCount = typeData.paymentsCount || 0;
          const refundsCount = typeData.refundsCount || 0;
          
          return {
            paymentType: paymentTypeLabels[type],
            transactionCount: paymentsCount,
            paymentsCollected: paymentsCollected > 0 
              ? `AED ${(paymentsCollected).toFixed(2)}` 
              : "AED 0.00",
            refundsPaid: refundsPaid > 0 
              ? `AED ${(refundsPaid).toFixed(2)}` 
              : "AED 0.00"
          };
        });

        // Process transaction summary
        const transactionSummaryData = transactionRes.data?.data || {};

        const processedTransactions = [
          {
            itemType: 'Services',
            salesQty: transactionSummaryData.Services?.salesQty || 0,
            refundQty: transactionSummaryData.Services?.refundQty || 0,
            grossTotal: transactionSummaryData.Services?.grossTotal 
              ? `AED ${(transactionSummaryData.Services.grossTotal).toFixed(2)}`
              : "AED 0.00"
          },
          {
            itemType: 'Membership card',
            salesQty: transactionSummaryData['Membership card']?.salesQty || 0,
            refundQty: transactionSummaryData['Membership card']?.refundQty || 0,
            grossTotal: transactionSummaryData['Membership card']?.grossTotal
              ? `AED ${(transactionSummaryData['Membership card'].grossTotal).toFixed(2)}`
              : "AED 0.00"
          },
          {
            itemType: 'Gift cards',
            salesQty: transactionSummaryData['Gift cards']?.salesQty || 0,
            refundQty: transactionSummaryData['Gift cards']?.refundQty || 0,
            grossTotal: transactionSummaryData['Gift cards']?.grossTotal
              ? `AED ${(transactionSummaryData['Gift cards'].grossTotal).toFixed(2)}`
              : "AED 0.00"
          }
        ];

        setTransactionSummary(processedTransactions);
        setCashMovementSummary(processedCashMovement);
      } catch (err) {
        console.error('Failed to fetch daily sales data:', err);
        setError(err.response?.data?.message || err.message || "Failed to load daily sales data");
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
    (item) => item.paymentsCollected !== "AED 0.00" || item.refundsPaid !== "AED 0.00" || item.transactionCount > 0
  );

  // Debug logs for data state (only log once when data changes)
  useEffect(() => {}, [transactionSummary, cashMovementSummary, hasTransactionData, hasCashMovementData]);

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
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No data available to export',
        confirmButtonColor: '#1f2937'
      });
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
        head: [["Payment type", "Transaction count", "Payments collected", "Refunds paid"]],
        body: cashMovementSummary.map((item) => [item.paymentType, item.transactionCount, item.paymentsCollected, item.refundsPaid]),
      });
    }

    doc.save(`DailySales_${formatApiDate(currentDate)}.pdf`);
  };

  const handleExportCSV = () => {
    if (!hasTransactionData && !hasCashMovementData) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No data available to export',
        confirmButtonColor: '#1f2937'
      });
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
        ["Payment type", "Transaction count", "Payments collected", "Refunds paid"],
        ...cashMovementSummary.map((item) => [item.paymentType, item.transactionCount, item.paymentsCollected, item.refundsPaid])
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
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No data available to export',
        confirmButtonColor: '#1f2937'
      });
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
        ["Payment type", "Transaction count", "Payments collected", "Refunds paid"],
        ...cashMovementSummary.map((item) => [item.paymentType, item.transactionCount, item.paymentsCollected, item.refundsPaid]),
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
          </div>
        </div>

        <div className="ds-table-card">
          <h2 className="ds-table-title">Cash movement summary</h2>
          <div className="ds-table-wrapper">
           
              <table>
                <thead>
                  <tr>
                    <th>Payment type</th>
                    <th>Transaction count</th>
                    <th>Payments collected</th>
                    <th>Refunds paid</th>
                  </tr>
                </thead>
                <tbody>
                  {cashMovementSummary.map((item, index) => (
                    <tr key={index}>
                      <td>{item.paymentType}</td>
                      <td>{item.transactionCount}</td>
                      <td>{item.paymentsCollected}</td>
                      <td>{item.refundsPaid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySales;
