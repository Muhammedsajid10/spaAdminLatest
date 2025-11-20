/**
 * useMembershipIntegration Hook
 * Handles membership validation, application, and discount calculation
 */

import { useState, useCallback } from 'react';

export const useMembershipIntegration = () => {
  const [appliedMembership, setAppliedMembership] = useState(null);
  const [membershipDiscountAmount, setMembershipDiscountAmount] = useState(0);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [availableMemberships, setAvailableMemberships] = useState([]);
  const [membershipRefreshSignal, setMembershipRefreshSignal] = useState(0);

  /**
   * Handle membership application
   * Makes the service FREE for the client
   */
  const handleMembershipApplied = useCallback((membership, matchingService) => {
    console.log('🎯 Admin applying membership:', membership, 'for service:', matchingService);

    setAppliedMembership(membership);
    setMembershipDiscountAmount(matchingService.price || 0);

    // Show success feedback
    alert(`✅ Membership "${membership.name}" applied! The service "${matchingService.name}" will be FREE for this client.`);
  }, []);

  /**
   * Handle membership removal
   * Restores regular pricing
   */
  const handleMembershipRemoved = useCallback(() => {
    console.log('❌ Admin removing applied membership');

    setAppliedMembership(null);
    setMembershipDiscountAmount(0);

    // Show feedback
    alert('Membership removed. Regular pricing restored.');
  }, []);

  /**
   * Select a membership from available list
   */
  const selectMembership = useCallback((membership) => {
    setSelectedMembership(membership);
  }, []);

  /**
   * Clear membership selection
   */
  const clearMembership = useCallback(() => {
    setSelectedMembership(null);
    setAppliedMembership(null);
    setMembershipDiscountAmount(0);
  }, []);

  /**
   * Set available memberships for client
   */
  const setMemberships = useCallback((memberships) => {
    setAvailableMemberships(memberships);
  }, []);

  /**
   * Trigger membership refresh
   */
  const refreshMemberships = useCallback(() => {
    setMembershipRefreshSignal(prev => prev + 1);
  }, []);

  /**
   * Calculate total discount from membership
   */
  const getMembershipDiscount = useCallback(() => {
    return membershipDiscountAmount;
  }, [membershipDiscountAmount]);

  /**
   * Check if membership is applied
   */
  const hasMembershipApplied = useCallback(() => {
    return !!appliedMembership;
  }, [appliedMembership]);

  return {
    // State
    appliedMembership,
    membershipDiscountAmount,
    selectedMembership,
    availableMemberships,
    membershipRefreshSignal,
    
    // Actions
    handleMembershipApplied,
    handleMembershipRemoved,
    selectMembership,
    clearMembership,
    setMemberships,
    refreshMemberships,
    
    // Computed
    getMembershipDiscount,
    hasMembershipApplied
  };
};
