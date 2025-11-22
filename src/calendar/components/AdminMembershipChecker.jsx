import React, { useState, useEffect } from 'react';
import './AdminMembershipChecker.css';
import api from '../../Service/Api';
import Loading from '../../states/Loading';

const AdminMembershipChecker = ({ 
  selectedClient, 
  selectedServices, 
  onMembershipApplied, 
  onMembershipRemoved,
  appliedMembership 
  , refreshSignal
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
  }, [selectedClient, refreshSignal]);

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
      // Primary attempt
      const primaryUrl = `/memberships/my-memberships/${selectedClient._id}`;
      let response;
      // collectedMemberships will hold memberships extracted from fallbacks where we don't populate `response`
      let collectedMemberships = null;
      try {
        response = await api.get(primaryUrl);
      } catch (err) {
        // If 404, don't immediately treat as no memberships — some servers use a different path.
        const status = err?.response?.status;
        if (status === 404) {
          console.warn(`Memberships endpoint not found (404): ${primaryUrl}. Will try fallback endpoints.`);
        } else {
          console.warn(`Primary memberships endpoint error (${status}):`, err?.response?.data || err.message);
        }

        // Try plausible fallbacks before giving up
        const fallbackUrls = [
          `/memberships/client/${selectedClient._id}`,
          `/memberships?clientId=${selectedClient._id}`
        ];
        let fallbackOk = false;
        for (const u of fallbackUrls) {
          try {
            response = await api.get(u);
            fallbackOk = true;
            console.info(`Fetched memberships via fallback URL: ${u}`);
            break;
          } catch (e2) {
            if (e2?.response?.status === 404) {
              console.info(`Fallback ${u} returned 404`);
              continue; // try next
            }
            // non-404 fallback error -> bubble up
            throw e2;
          }
        }

        if (!fallbackOk) {
          // No client-specific fallback succeeded (all 404) -> try broader endpoints and filter locally
          console.warn('No client-specific memberships endpoints found; trying broader memberships endpoints as fallback.');
          try {
            // Try purchased memberships list and filter by client
            const purchasedRes = await api.get('/memberships/purchased');
            const allPurchased = purchasedRes.data.data?.memberships || purchasedRes.data?.memberships || [];
            const clientMatches = allPurchased.filter(m => {
              const id = m.client && (typeof m.client === 'string' ? m.client : m.client._id);
              return id === selectedClient._id;
            });
            if (clientMatches.length) {
              collectedMemberships = clientMatches;
              console.info(`Found ${clientMatches.length} membership(s) via /memberships/purchased fallback`);
              // fall through to normal processing
            } else {
              // Try general memberships listing
              try {
                const listRes = await api.get('/memberships');
                const all = listRes.data.data?.memberships || listRes.data?.memberships || [];
                const matches = all.filter(m => {
                  const id = m.client && (typeof m.client === 'string' ? m.client : m.client._id);
                  return id === selectedClient._id;
                });
                if (matches.length) {
                  collectedMemberships = matches;
                  console.info(`Found ${matches.length} membership(s) via /memberships fallback`);
                } else {
                  console.warn('No memberships found for client after checking /memberships/purchased and /memberships');
                  collectedMemberships = [];
                  setEligibleMemberships([]);
                  return;
                }
              } catch (eList) {
                console.info('/memberships listing not available or failed:', eList?.response?.status || eList.message);
                setClientMemberships([]);
                setEligibleMemberships([]);
                return;
              }
            }
          } catch (ePurchased) {
            console.info('/memberships/purchased not available or failed:', ePurchased?.response?.status || ePurchased.message);
            setClientMemberships([]);
            setEligibleMemberships([]);
            return;
          }
        }
      }

      // Finalize memberships list: prefer collectedMemberships (from fallbacks), else response if present
      const finalList = collectedMemberships !== null
        ? collectedMemberships
        : (response ? (response.data?.data?.memberships || response.data?.memberships || []) : []);

      setClientMemberships(finalList);
    } catch (err) {
      console.error('Error fetching client memberships:', err);
      // If server returned 404 already handled above; here show message for other errors
      setError('Failed to load client memberships');
      setClientMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEligibleMemberships = () => {
    console.log('🔍 Filtering eligible memberships:', {
      totalMemberships: clientMemberships.length,
      selectedServices: selectedServices.map(s => ({ id: s?._id, name: s?.name }))
    });

    // Find memberships that match any of the selected services
    const eligible = clientMemberships.filter(membership => {
      // Support multiple services per membership
      let membershipServiceIds = [];
      let membershipServiceNames = [];

      // If membership has a services array, collect all _id and name
      if (Array.isArray(membership.services)) {
        membershipServiceIds = membership.services.map(s => typeof s === 'string' ? s : s._id).filter(Boolean);
        membershipServiceNames = membership.services.map(s => s.name).filter(Boolean);
      }
      // If membership has serviceNames array, collect all names
      if (Array.isArray(membership.serviceNames)) {
        membershipServiceNames = membershipServiceNames.concat(membership.serviceNames);
      }
      // If membership has a single service/serviceId
      if (membership.service) {
        membershipServiceIds.push(typeof membership.service === 'string' ? membership.service : membership.service._id);
        if (membership.service.name) membershipServiceNames.push(membership.service.name);
      }
      if (membership.serviceId) {
        membershipServiceIds.push(membership.serviceId);
      }

      // Check if any selected service matches by _id or name
      const matchesService = selectedServices.some(service => {
        if (!service) return false;
        const idMatch = membershipServiceIds.includes(service._id);
        const nameMatch = membershipServiceNames.includes(service.name);
        return idMatch || nameMatch;
      });

      // Compute remaining sessions defensively
      const remainingSessions = membership?.remainingSessions ?? (
        (typeof membership?.numberOfSessions === 'number' && typeof membership?.usedSessions === 'number')
          ? (membership.numberOfSessions - membership.usedSessions)
          : null
      );
      const hasRemainingSessions = remainingSessions === null ? true : (remainingSessions > 0);

      // Determine expiry/status
      const status = (membership?.status || '').toString();
      const isNotExpired = !(membership?.isExpired) && (['Active','active','Partially Used','partially used'].includes(status));

      console.log(`   Membership "${membership.name}":`, {
        membershipServiceIds,
        membershipServiceNames,
        matchesService,
        hasRemainingSessions,
        remainingSessions,
        isNotExpired,
        status,
        isEligible: matchesService && hasRemainingSessions && isNotExpired
      });

      return matchesService && hasRemainingSessions && isNotExpired;
    });

    console.log('✅ Eligible memberships filtered:', eligible.length, 'out of', clientMemberships.length);
    setEligibleMemberships(eligible);
  };

  const handleApplyMembership = (membership) => {
    console.log('🎯 Admin applying membership for client:', membership);

    // Gather all possible service IDs and names from the membership
    let membershipServiceIds = [];
    let membershipServiceNames = [];
    if (Array.isArray(membership.services)) {
      membershipServiceIds = membership.services.map(s => typeof s === 'string' ? s : s._id).filter(Boolean);
      membershipServiceNames = membership.services.map(s => s.name).filter(Boolean);
    }
    if (Array.isArray(membership.serviceNames)) {
      membershipServiceNames = membershipServiceNames.concat(membership.serviceNames);
    }
    if (membership.service) {
      membershipServiceIds.push(typeof membership.service === 'string' ? membership.service : membership.service._id);
      if (membership.service.name) membershipServiceNames.push(membership.service.name);
    }
    if (membership.serviceId) {
      membershipServiceIds.push(membership.serviceId);
    }

    // Find the selected service that matches any of the membership's services
    const matchingService = selectedServices.find(service => {
      if (!service) return false;
      return membershipServiceIds.includes(service._id) || membershipServiceNames.includes(service.name);
    });

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
          <Loading/>
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
          <span className="info-icon"></span>
          <span>This client has no active memberships</span>
        </div>
      </div>
    );
  }

  if (eligibleMemberships.length === 0) {
    return (
      <div className="admin-membership-checker">
        <div className="no-eligible-memberships">
          <div className="ineligible-message">
            <span className="info-icon"></span>
            <span>No memberships available for the selected service</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-membership-checker">
      <div className="membership-header">
        <span className="membership-icon"></span>
        <span>Available Memberships ({eligibleMemberships.length})</span>
      </div>

      {appliedMembership ? (
        <div className="applied-membership">
          <div className="applied-header">
            <span className="success-icon"></span>
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
             This service will be FREE for the client
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
            <span className="info-icon"></span>
            <span>Applying a membership will make the matching service free for this booking</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembershipChecker;