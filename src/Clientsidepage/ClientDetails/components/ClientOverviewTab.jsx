import React, { useMemo } from 'react';
import { Info } from 'lucide-react';

const ClientOverviewTab = ({ stats, giftCards }) => {
  // Calculate total gift card balance
  const totalGiftCardBalance = useMemo(() => {
    if (!giftCards || !Array.isArray(giftCards)) return 0;
    return giftCards.reduce((total, card) => {
      // Only count active gift cards
      if (card.status === 'active' || card.status === 'Active') {
        return total + (parseFloat(card.balance) || 0);
      }
      return total;
    }, 0);
  }, [giftCards]);

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
            AED {stats.totalSpent?.toLocaleString() || '0'}
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
        <div className="summary-card">
          <div className="summary-label">
            Canceled
            <Info size={16} className="info-tooltip-icon" />
          </div>
          <div className="summary-value">{stats.canceledCount || 0}</div>
        </div>

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
