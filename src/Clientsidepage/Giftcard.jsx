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
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const fetchGiftCards = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with actual gift cards API endpoint
        const res = await api.get("/gift-cards/admin/all");
        console.log("Gift Cards API result:", res.data);
        
        const giftCardsData = res.data?.data?.giftCards || [];
        const mapped = giftCardsData.map((card) => ({
          id: card._id,
          code: card.code || card.giftCardNumber || "-",
          status: card.status || "-",
          sale: card.saleNumber || card.orderNumber || "-",
          purchaser: card.purchaser ? 
            `${card.purchaser.firstName || ''} ${card.purchaser.lastName || ''}`.trim() : 
            "-",
          owner: card.owner ? 
            `${card.owner.firstName || ''} ${card.owner.lastName || ''}`.trim() : 
            card.purchaser ? 
            `${card.purchaser.firstName || ''} ${card.purchaser.lastName || ''}`.trim() : 
            "-",
          total: (card.amount || card.totalValue || 0) / 100, // Convert from cents
          redeemed: (card.redeemedAmount || card.usedAmount || 0) / 100, // Convert from cents
          createdAt: card.createdAt,
          expiryDate: card.expiryDate,
        }));
        
        setGiftCards(mapped);
      } catch (err) {
        console.error("Failed to fetch gift cards:", err);
        setError(err.response?.data?.message || err.message || "Failed to load gift cards");
      } finally {
        setLoading(false);
      }
    };
    
    fetchGiftCards();
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
    card.code.toLowerCase().includes(search.toLowerCase()) ||
    card.purchaser.toLowerCase().includes(search.toLowerCase()) ||
    card.owner.toLowerCase().includes(search.toLowerCase())
  );

  const calculateRemaining = (total, redeemed) => {
    return (total - redeemed).toFixed(2);
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
          <button className="options-btn" disabled>
            Export
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="desc">
          View, filter and export gift cards purchased by your clients.
        </p>
        <Loading />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="gift-container">
        <div className="header-section">
          <h1>Gift cards sold</h1>
          <button className="options-btn" disabled>
            Export
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="desc">
          View, filter and export gift cards purchased by your clients. 
        </p>
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
          <button className="options-btn" disabled>
            Export
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="desc">
          View, filter and export gift cards purchased by your clients.
        </p>
        <NoDataState
          message="No gift cards found"
          description="There are no gift cards sold yet. When clients purchase gift cards, they will appear here."
          icon="🎁"
        />
      </div>
    );
  }

  return (
    <div className="gift-container">
      <div className="header-section">
        <h1>Gift cards sold</h1>
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
                <th>Gift card</th>
                <th>Status</th>
                <th>Sale #</th>
                <th>Purchaser</th>
                <th>Owner</th>
                <th>Total</th>
                <th>Redeemed</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card, index) => (
                <tr key={card.id || index}>
                  <td>
                    <span className="link">{card.code}</span>
                  </td>
                  <td>
                    <span className={card.status.toLowerCase()}>
                      {card.status}
                    </span>
                  </td>
                  <td>
                    <span className="link">{card.sale}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Giftcards;





