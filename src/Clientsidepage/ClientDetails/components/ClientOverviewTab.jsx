import React from 'react';
import { Info } from 'lucide-react';

const ClientOverviewTab = ({ stats }) => {
  return (
    <div className="client-overview-tab">
      <h4 className="overview-section-title">Gift Card</h4>
      
      <div className="overview-wallet-card">
        <div>
          <div className="wallet-balance-label">Balance</div>
          <div className="wallet-balance-amount">AED 0</div>
        </div>
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
