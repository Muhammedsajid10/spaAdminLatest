/**
 * useMemberships Hook
 * Manages membership selection and application in booking flow
 */

import { useState, useCallback, useMemo } from 'react';

export const useMemberships = () => {
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipSearchQuery, setMembershipSearchQuery] = useState('');
  const [isValidatingMembership, setIsValidatingMembership] = useState(false);
  const [membershipError, setMembershipError] = useState(null);
  const [availableMemberships, setAvailableMemberships] = useState([]);

  // Modal actions
  const openMembershipModal = useCallback(() => {
    setShowMembershipModal(true);
    setMembershipError(null);
  }, []);

  const closeMembershipModal = useCallback(() => {
    setShowMembershipModal(false);
    setMembershipSearchQuery('');
    setMembershipError(null);
  }, []);

  // Membership selection
  const selectMembership = useCallback((membership) => {
    setSelectedMembership(membership);
    setMembershipError(null);
  }, []);

  const clearMembership = useCallback(() => {
    setSelectedMembership(null);
  }, []);

  // Search
  const updateMembershipSearch = useCallback((query) => {
    setMembershipSearchQuery(query);
    setMembershipError(null);
  }, []);

  const clearMembershipSearch = useCallback(() => {
    setMembershipSearchQuery('');
  }, []);

  // Available memberships management
  const setAvailableMembershipsList = useCallback((memberships) => {
    setAvailableMemberships(memberships);
  }, []);

  const clearAvailableMemberships = useCallback(() => {
    setAvailableMemberships([]);
  }, []);

  // Validation
  const validateMembership = useCallback(async (membershipId, validationFn) => {
    if (!membershipId) {
      setMembershipError('Please select a membership');
      return null;
    }

    setIsValidatingMembership(true);
    setMembershipError(null);

    try {
      const result = await validationFn(membershipId);
      
      if (result.valid) {
        selectMembership(result.membership);
        return result.membership;
      } else {
        setMembershipError(result.error || 'Invalid membership');
        return null;
      }
    } catch (error) {
      setMembershipError('Failed to validate membership');
      return null;
    } finally {
      setIsValidatingMembership(false);
    }
  }, [selectMembership]);

  // Calculate membership discount
  const calculateMembershipDiscount = useCallback((totalPrice) => {
    if (!selectedMembership) return 0;

    const discountType = selectedMembership.discountType;
    const discountValue = parseFloat(selectedMembership.discountValue) || 0;

    if (discountType === 'percentage') {
      return (totalPrice * discountValue) / 100;
    } else if (discountType === 'fixed') {
      return Math.min(discountValue, totalPrice);
    }

    return 0;
  }, [selectedMembership]);

  // Calculate price after membership discount
  const calculatePriceAfterMembership = useCallback((totalPrice) => {
    const discount = calculateMembershipDiscount(totalPrice);
    return Math.max(0, totalPrice - discount);
  }, [calculateMembershipDiscount]);

  // Check if service is eligible for membership
  const isServiceEligible = useCallback((serviceId) => {
    if (!selectedMembership) return false;
    if (!selectedMembership.applicableServices) return true; // All services eligible
    
    return selectedMembership.applicableServices.includes(serviceId);
  }, [selectedMembership]);

  // Check if membership has remaining uses
  const hasRemainingUses = useCallback(() => {
    if (!selectedMembership) return false;
    if (selectedMembership.unlimitedUses) return true;
    
    const remaining = (selectedMembership.totalUses || 0) - (selectedMembership.usedUses || 0);
    return remaining > 0;
  }, [selectedMembership]);

  // Get remaining uses count
  const getRemainingUses = useCallback(() => {
    if (!selectedMembership) return 0;
    if (selectedMembership.unlimitedUses) return Infinity;
    
    return Math.max(0, (selectedMembership.totalUses || 0) - (selectedMembership.usedUses || 0));
  }, [selectedMembership]);

  // Check if membership is expired
  const isMembershipExpired = useCallback(() => {
    if (!selectedMembership) return false;
    if (!selectedMembership.expiryDate) return false;
    
    return new Date(selectedMembership.expiryDate) < new Date();
  }, [selectedMembership]);

  // Check if membership is active and valid
  const isMembershipValid = useCallback(() => {
    return selectedMembership && 
           !isMembershipExpired() && 
           hasRemainingUses();
  }, [selectedMembership, isMembershipExpired, hasRemainingUses]);

  // Filter memberships by search query
  const filteredMemberships = useMemo(() => {
    if (!membershipSearchQuery.trim()) return availableMemberships;
    
    const query = membershipSearchQuery.toLowerCase();
    return availableMemberships.filter(membership => {
      const name = (membership.name || '').toLowerCase();
      const description = (membership.description || '').toLowerCase();
      const type = (membership.type || '').toLowerCase();
      
      return name.includes(query) || description.includes(query) || type.includes(query);
    });
  }, [availableMemberships, membershipSearchQuery]);

  // Computed values
  const hasMembership = selectedMembership !== null;
  const isSearchingMembership = membershipSearchQuery.trim().length > 0;
  const membershipCount = availableMemberships.length;

  return {
    // State
    showMembershipModal,
    selectedMembership,
    membershipSearchQuery,
    isValidatingMembership,
    membershipError,
    availableMemberships,
    filteredMemberships,

    // Computed
    hasMembership,
    isSearchingMembership,
    membershipCount,

    // Modal actions
    openMembershipModal,
    closeMembershipModal,

    // Selection actions
    selectMembership,
    clearMembership,

    // Search actions
    updateMembershipSearch,
    clearMembershipSearch,

    // Available memberships
    setAvailableMembershipsList,
    clearAvailableMemberships,

    // Validation
    validateMembership,
    isMembershipValid,
    isMembershipExpired,
    hasRemainingUses,
    getRemainingUses,
    isServiceEligible,

    // Calculations
    calculateMembershipDiscount,
    calculatePriceAfterMembership
  };
};
