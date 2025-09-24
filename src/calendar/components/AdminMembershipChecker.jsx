import React, { useState, useEffect } from 'react';
import './AdminMembershipChecker.css';
import api from '../../Service/Api';

const AdminMembershipChecker = ({ 
  selectedClient, 
  selectedServices, 
  onMembershipApplied, 
  onMembershipRemoved,
  appliedMembership 
}) => {
  const [loading, setLoading] = useState(false);
  const [clientMemberships, setClientMemberships] = useState([]);
  const [eligibleMemberships, setEligibleMemberships] = useState([]);
  const [error, setError] = useState('');

  // Fetch client memberships when client is selected
  useEffect(() => {
    if (selectedClient && selectedClient._id) {
      fetchClientMemberships();
    } else {
      setClientMemberships([]);
      setEligibleMemberships([]);
    }
  }, [selectedClient]);

  // Filter eligible memberships when services change
  useEffect(() => {
    if (clientMemberships.length > 0 && selectedServices.length > 0) {
      filterEligibleMemberships();
    }
  }, [clientMemberships, selectedServices]);

  const fetchClientMemberships = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/memberships/my-memberships/${selectedClient._id}`);
      setClientMemberships(response.data.data.memberships || []);
    } catch (err) {
      console.error('Error fetching client memberships:', err);
      setError('Failed to load client memberships');
      setClientMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEligibleMemberships = () => {
    // Find memberships that match any of the selected services
    const eligible = clientMemberships.filter(membership => {
      // Check if membership service matches any selected service
      const matchesService = selectedServices.some(service => 
        service._id === membership.service._id || service._id === membership.service
      );
      
      // Check if membership has remaining sessions
      const hasRemainingSessions = membership.remainingSessions > 0;
      
      // Check if membership is not expired
      const isNotExpired = !membership.isExpired && 
        (membership.status === 'Active' || membership.status === 'Partially Used');
      
      return matchesService && hasRemainingSessions && isNotExpired;
    });

    setEligibleMemberships(eligible);
  };

  const handleApplyMembership = (membership) => {
    console.log('🎯 Admin applying membership for client:', membership);
    
    // Find the service that matches this membership
    const matchingService = selectedServices.find(service => 
      service._id === membership.service._id || service._id === membership.service
    );

    if (matchingService) {
      onMembershipApplied(membership, matchingService);
    }
  };

  const handleRemoveMembership = () => {
    console.log('❌ Admin removing applied membership');
    onMembershipRemoved();
  };

  if (!selectedClient) {
    return (
      <div className="admin-membership-checker">
        <div className="membership-info-message">
          💡 Select a client to check for available memberships
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-membership-checker">
        <div className="membership-loading">
          <div className="loading-spinner"></div>
          <span>Checking client memberships...</span>
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

  if (clientMemberships.length === 0) {
    return (
      <div className="admin-membership-checker">
        <div className="no-memberships">
          <span className="info-icon">ℹ️</span>
          <span>This client has no active memberships</span>
        </div>
      </div>
    );
  }

  if (eligibleMemberships.length === 0) {
    return (
      <div className="admin-membership-checker">
        <div className="no-eligible-memberships">
          <div className="membership-header">
            <span className="membership-icon">🎫</span>
            <span>Client Memberships ({clientMemberships.length})</span>
          </div>
          <div className="ineligible-message">
            <span className="info-icon">ℹ️</span>
            <span>No memberships available for selected services</span>
          </div>
          <div className="memberships-list">
            {clientMemberships.map(membership => (
              <div key={membership._id} className="membership-item ineligible">
                <div className="membership-details">
                  <div className="membership-name">{membership.name}</div>
                  <div className="membership-service">{membership.serviceName}</div>
                  <div className="membership-sessions">
                    {membership.remainingSessions} sessions remaining
                  </div>
                </div>
                <div className="ineligible-reason">
                  Different service
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-membership-checker">
      <div className="membership-header">
        <span className="membership-icon">🎫</span>
        <span>Available Memberships ({eligibleMemberships.length})</span>
      </div>

      {appliedMembership ? (
        <div className="applied-membership">
          <div className="applied-header">
            <span className="success-icon">✅</span>
            <span>Membership Applied</span>
          </div>
          <div className="applied-membership-card">
            <div className="applied-details">
              <div className="applied-name">{appliedMembership.name}</div>
              <div className="applied-service">{appliedMembership.serviceName}</div>
              <div className="applied-sessions">
                Sessions: {appliedMembership.usedSessions + 1}/{appliedMembership.numberOfSessions}
                <span className="remaining">({appliedMembership.remainingSessions - 1} remaining after booking)</span>
              </div>
            </div>
            <button 
              className="remove-membership-btn"
              onClick={handleRemoveMembership}
              title="Remove membership and restore regular pricing"
            >
              Remove
            </button>
          </div>
          <div className="membership-benefit">
            💰 This service will be FREE for the client
          </div>
        </div>
      ) : (
        <div className="eligible-memberships">
          <div className="memberships-list">
            {eligibleMemberships.map(membership => (
              <div key={membership._id} className="membership-item eligible">
                <div className="membership-card">
                  <div className="membership-details">
                    <div className="membership-name">{membership.name}</div>
                    <div className="membership-service">{membership.serviceName}</div>
                    <div className="membership-sessions">
                      <span className="sessions-count">{membership.remainingSessions}</span>
                      <span className="sessions-label">sessions remaining</span>
                    </div>
                    <div className="membership-validity">
                      Valid until: {new Date(membership.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    className="apply-membership-btn"
                    onClick={() => handleApplyMembership(membership)}
                    title="Apply this membership to make the service free"
                  >
                    Apply (FREE)
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="membership-info">
            <span className="info-icon">💡</span>
            <span>Applying a membership will make the matching service free for this booking</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembershipChecker;