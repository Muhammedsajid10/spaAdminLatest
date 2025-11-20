/**
 * useGiftCardIntegration Hook
 * Handles gift card validation, selection, and payment calculation
 */

import { useState, useCallback } from 'react';

const Base_url = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

export const useGiftCardIntegration = () => {
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [redeemGiftCardAmount, setRedeemGiftCardAmount] = useState(0);
  const [giftCardAppliedAmount, setGiftCardAppliedAmount] = useState(0);
  const [availableGiftCards, setAvailableGiftCards] = useState([]);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  /**
   * Fetch gift cards for a specific client
   */
  const fetchGiftCardsForClient = useCallback(async (clientId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${Base_url}/giftcards/purchased`, { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift cards');
    }

    return data;
  }, []);

  /**
   * Get gift card details by code
   */
  const getGiftCardDetails = useCallback(async (giftCardCode) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${Base_url}/giftcards/validate/${giftCardCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid gift card code');
    }

    return data;
  }, []);

  /**
   * Calculate remaining value of gift card
   */
  const calculateGiftCardValue = useCallback((giftCard) => {
    // Handle different possible response structures from API
    if (giftCard?.remainingValue !== undefined) {
      return giftCard.remainingValue;
    }
    if (giftCard?.value && giftCard?.usedAmount !== undefined) {
      return Math.max(0, giftCard.value - giftCard.usedAmount);
    }
    if (giftCard?.amount) {
      return giftCard.amount;
    }
    if (giftCard?.balance) {
      return giftCard.balance;
    }
    return 0;
  }, []);

  /**
   * Calculate total with gift card discount
   */
  const calculateTotalWithGiftCard = useCallback((totalAmount, membershipDiscount = 0) => {
    let giftCardDiscount = 0;
    
    if (selectedGiftCard) {
      const availableValue = calculateGiftCardValue(selectedGiftCard);
      giftCardDiscount = Math.min(totalAmount - membershipDiscount, availableValue);
      
      console.log('💰 calculateTotalWithGiftCard:', {
        totalAmount,
        membershipDiscount,
        availableValue,
        giftCardDiscount,
        currentAppliedAmount: giftCardAppliedAmount
      });

      // Update the applied amount for display if it changed
      if (giftCardAppliedAmount !== giftCardDiscount) {
        console.log('🔄 Updating giftCardAppliedAmount from', giftCardAppliedAmount, 'to', giftCardDiscount);
        setGiftCardAppliedAmount(giftCardDiscount);
      }
    }

    return {
      subtotal: totalAmount,
      membershipDiscount: membershipDiscount,
      giftCardDiscount: giftCardDiscount,
      remainingAmount: Math.max(0, totalAmount - membershipDiscount - giftCardDiscount)
    };
  }, [selectedGiftCard, giftCardAppliedAmount, calculateGiftCardValue]);

  /**
   * Handle gift card selection
   */
  const handleGiftCardSelect = useCallback((giftCard, totalAmount) => {
    console.log('🎁 Selected gift card:', giftCard);
    setSelectedGiftCard(giftCard);

    // Auto-calculate the maximum redeemable amount
    const availableValue = calculateGiftCardValue(giftCard);
    const maxRedeemable = Math.min(availableValue, totalAmount);

    setRedeemGiftCardAmount(maxRedeemable);
    setGiftCardAppliedAmount(maxRedeemable);

    console.log('Auto-applied gift card amount:', maxRedeemable);
  }, [calculateGiftCardValue]);

  /**
   * Handle gift card removal
   */
  const handleGiftCardRemove = useCallback(() => {
    console.log('❌ Removing applied gift card');
    setSelectedGiftCard(null);
    setRedeemGiftCardAmount(0);
    setGiftCardAppliedAmount(0);
    setGiftCardError('');
  }, []);

  /**
   * Remove applied gift card (alias)
   */
  const removeAppliedGiftCard = useCallback(() => {
    handleGiftCardRemove();
  }, [handleGiftCardRemove]);

  /**
   * Validate gift card code
   */
  const validateGiftCardCode = useCallback(async (code) => {
    if (!code || !code.trim()) {
      throw new Error('Gift card code is required');
    }

    try {
      setGiftCardLoading(true);
      setGiftCardError('');

      const giftCardData = await getGiftCardDetails(code);
      
      // Check if gift card is valid and has balance
      const availableValue = calculateGiftCardValue(giftCardData);
      if (availableValue <= 0) {
        throw new Error('This gift card has no remaining balance');
      }

      setGiftCardLoading(false);
      return giftCardData;
    } catch (error) {
      setGiftCardLoading(false);
      setGiftCardError(error.message);
      throw error;
    }
  }, [getGiftCardDetails, calculateGiftCardValue]);

  /**
   * Set available gift cards
   */
  const setGiftCards = useCallback((giftCards) => {
    setAvailableGiftCards(giftCards);
  }, []);

  /**
   * Clear all gift card state
   */
  const clearGiftCard = useCallback(() => {
    setSelectedGiftCard(null);
    setRedeemGiftCardAmount(0);
    setGiftCardAppliedAmount(0);
    setGiftCardCode('');
    setGiftCardError('');
  }, []);

  /**
   * Get gift card discount amount
   */
  const getGiftCardDiscount = useCallback(() => {
    return giftCardAppliedAmount;
  }, [giftCardAppliedAmount]);

  /**
   * Check if gift card is applied
   */
  const hasGiftCardApplied = useCallback(() => {
    return !!selectedGiftCard;
  }, [selectedGiftCard]);

  return {
    // State
    selectedGiftCard,
    redeemGiftCardAmount,
    giftCardAppliedAmount,
    availableGiftCards,
    giftCardCode,
    giftCardError,
    giftCardLoading,
    
    // Actions
    handleGiftCardSelect,
    handleGiftCardRemove,
    removeAppliedGiftCard,
    validateGiftCardCode,
    fetchGiftCardsForClient,
    getGiftCardDetails,
    setGiftCards,
    clearGiftCard,
    setGiftCardCode,
    
    // Helpers
    calculateGiftCardValue,
    calculateTotalWithGiftCard,
    getGiftCardDiscount,
    hasGiftCardApplied
  };
};
