/**
 * MembershipSection Component
 * Displays and manages membership application during booking
 */

import React from 'react';
import AdminMembershipChecker from '../../../calendar/components/AdminMembershipChecker.jsx';
import './MembershipSection.css';

const MembershipSection = ({
  selectedClient,
  sessionAppointments,
  appliedMembership,
  membershipDiscountAmount,
  membershipRefreshSignal,
  onMembershipApplied,
  onMembershipRemoved
}) => {
  if (!selectedClient) {
    return (
      <div className="membership-section-empty">
        <p className="empty-message">Select a client to check for available memberships</p>
      </div>
    );
  }

  return (
    <div className="membership-section">
      <h4 className="membership-section-title">
        <span className="icon">🎫</span>
        Membership Benefits
      </h4>

      {appliedMembership && (
        <div className="applied-membership-banner">
          <div className="banner-icon">✅</div>
          <div className="banner-content">
            <div className="banner-title">Membership Applied!</div>
            <div className="banner-text">
              <strong>{appliedMembership.name}</strong> - Discount: AED {membershipDiscountAmount.toFixed(2)}
            </div>
          </div>
          <button 
            className="banner-remove-btn"
            onClick={onMembershipRemoved}
            title="Remove membership"
          >
            ×
          </button>
        </div>
      )}

      <div className="membership-checker-wrapper">
        <AdminMembershipChecker
          selectedClient={selectedClient}
          multipleAppointments={sessionAppointments}
          onMembershipApplied={onMembershipApplied}
          onMembershipRemoved={onMembershipRemoved}
          refreshSignal={membershipRefreshSignal}
        />
      </div>

      {!appliedMembership && (
        <p className="membership-hint">
          💡 If this client has an active membership, you can apply it here to get discounts on eligible services.
        </p>
      )}
    </div>
  );
};

export default MembershipSection;
