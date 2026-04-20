import React, { useMemo } from 'react';
import { Info } from 'lucide-react';

const ClientOverviewTab = ({ stats, giftCards, bookings = [] }) => {
  // Calculate total gift card balance from remainingValue
  const totalGiftCardBalance = useMemo(() => {
    if (!giftCards || !Array.isArray(giftCards)) {
      return 0;
    }
    const total = giftCards.reduce((total, card) => {
      const cardValue = parseFloat(card.remainingValue) || 0;
      return total + cardValue;
    }, 0);
    return total;
  }, [giftCards]);

  // Calculate total sales from only completed bookings
  const totalCompletedSales = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return 0;
    return bookings
      .filter(booking => {
        const status = booking.status?.toLowerCase();
        return status === 'complete' || status === 'completed';
      })
      .reduce((total, booking) => {
        return total + (booking.finalAmount || booking.totalAmount || 0);
      }, 0);
  }, [bookings]);

  return (
    <div className="client-overview-tab">
      <h4 className="overview-section-title">Gift Card Balance</h4>
      
      <div className="overview-wallet-card">
        <div>
          <div className="wallet-balance-label">Balance</div>
          <div className="wallet-balance-amount">AED {totalGiftCardBalance.toLocaleString()}</div>
        </div>
        <button className="btn-view-wallet">View gift cards</button>
      </div>

      <h4 className="overview-section-title">Summary</h4>
      
      <div className="overview-summary-grid">
        {/* Total Sales */}
        <div className="summary-card full-width">
          <div className="summary-label">
            Total sales
            <Info size={16} className="info-tooltip-icon" />
          </div>
          <div className="summary-value">
            AED {totalCompletedSales.toLocaleString()}
          </div>
        </div>

        {/* Appointments */}
        <div className="summary-card">
          <div className="summary-label">
            Appointments
            <Info size={16} className="info-tooltip-icon" />
          </div>
          <div className="summary-value">{stats.appointmentsCount || 0}</div>
        </div>

        {/* Rating */}
        <div className="summary-card">
          <div className="summary-label">
            Rating
            <Info size={16} className="info-tooltip-icon" />
          </div>
          <div className="summary-value">{stats.rating || '-'}</div>
        </div>

        {/* Canceled */}
        {/* <div className="summary-card">
          <div className="summary-label">
            Canceled
            <Info size={16} className="info-tooltip-icon" />
          </div>
          <div className="summary-value">{stats.canceledCount || 0}</div>
        </div> */}

        {/* No show */}
        <div className="summary-card">
          <div className="summary-label">
            No show
            <Info size={16} className="info-tooltip-icon" />
          </div>
          <div className="summary-value">{stats.noShowCount || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default ClientOverviewTab;
