import React from 'react';
import './AdminMembershipChecker.css';
import { Check } from 'lucide-react';
import Loading from '../../states/Loading';

/**
 * AdminMembershipChecker - Now a simplified component that uses backend-resolved benefits
 */
const AdminMembershipChecker = ({ 
  eligibleMemberships = [], 
  appliedMembership,
  onMembershipApplied, 
  onMembershipRemoved,
  loading = false,
  error = ''
}) => {
  
  const handleApplyMembership = (membership) => {
    // In our new flow, we just tell the parent which membership was picked
    // The parent will re-trigger the preview with this membershipId
    onMembershipApplied(membership);
  };

  if (loading) {
    return (
      <div className="admin-membership-checker">
        <div className="membership-loading">
          <Loading />
          <span>Verifying memberships...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-membership-checker">
        <div className="membership-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (appliedMembership) {
    return (
      <div className="admin-membership-checker">
        <div className="applied-membership">
          <div className="applied-header">
            <div className="applied-info">
              <div className="applied-name">{appliedMembership.membershipName}</div>
              <div className="applied-service">{appliedMembership.matchedServiceName}</div>
              <div className="membership-sessions-indicator">
                <div className="session-progress-bar">
                  <div 
                    className="session-progress-fill" 
                    style={{ width: '100%' }} // Simplified for applied state
                  ></div>
                </div>
                <span className="sessions-text">applied to this booking</span>
              </div>
            </div>
            <button 
              className="remove-membership-btn"
              onClick={onMembershipRemoved}
              title="Remove membership"
            >
              Remove
            </button>
          </div>
          <div className="membership-benefit">
             <Check size={12} /> Membership applied successfully
          </div>
        </div>
      </div>
    );
  }

  if (eligibleMemberships.length === 0) {
    return (
      <div className="admin-membership-checker">
        <div className="no-eligible-memberships">
          <div className="ineligible-message">
            <span>No active/eligible memberships found for this client and selection.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-membership-checker">
      <div className="eligible-memberships">
        <div className="memberships-list">
          {eligibleMemberships.map(membership => (
            <div key={membership.membershipId} className="membership-item eligible">
              <div className="membership-card">
                <div className="membership-details">
                  <div className="membership-name">{membership.name}</div>
                  <div className="membership-sessions-indicator">
                    <div className="session-progress-bar">
                      <div 
                        className="session-progress-fill" 
                        style={{ width: `${(membership.usedSessions / membership.totalSessions) * 100}%` }}
                      ></div>
                    </div>
                    <span className="sessions-text">{membership.remainingSessions} sessions left</span>
                  </div>
                </div>
                <button 
                  className="apply-membership-btn"
                  onClick={() => handleApplyMembership(membership)}
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMembershipChecker;
