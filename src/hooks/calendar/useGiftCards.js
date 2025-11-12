/**
 * useGiftCards Hook
 * Manages gift card selection and redemption in booking flow
 */

import { useState, useCallback, useMemo } from 'react';

export const useGiftCards = () => {
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [selectedGiftCards, setSelectedGiftCards] = useState([]);
  const [giftCardSearchQuery, setGiftCardSearchQuery] = useState('');
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState(null);

  // Modal actions
  const openGiftCardModal = useCallback(() => {
    setShowGiftCardModal(true);
    setGiftCardError(null);
  }, []);

  const closeGiftCardModal = useCallback(() => {
    setShowGiftCardModal(false);
    setGiftCardSearchQuery('');
    setGiftCardError(null);
  }, []);

  // Gift card selection
  const addGiftCard = useCallback((giftCard) => {
    setSelectedGiftCards(prev => {
      // Prevent duplicates
      if (prev.some(gc => gc.id === giftCard.id || gc.code === giftCard.code)) {
        return prev;
      }
      return [...prev, giftCard];
    });
    setGiftCardError(null);
  }, []);

  const removeGiftCard = useCallback((giftCardId) => {
    setSelectedGiftCards(prev => prev.filter(gc => gc.id !== giftCardId));
  }, []);

  const clearGiftCards = useCallback(() => {
    setSelectedGiftCards([]);
  }, []);

  // Search
  const updateGiftCardSearch = useCallback((query) => {
    setGiftCardSearchQuery(query);
    setGiftCardError(null);
  }, []);

  const clearGiftCardSearch = useCallback(() => {
    setGiftCardSearchQuery('');
  }, []);

  // Validation
  const validateGiftCard = useCallback(async (giftCardCode, validationFn) => {
    if (!giftCardCode.trim()) {
      setGiftCardError('Please enter a gift card code');
      return null;
    }

    setIsValidatingGiftCard(true);
    setGiftCardError(null);

    try {
      const result = await validationFn(giftCardCode);
      
      if (result.valid) {
        addGiftCard(result.giftCard);
        setGiftCardSearchQuery('');
        return result.giftCard;
      } else {
        setGiftCardError(result.error || 'Invalid gift card');
        return null;
      }
    } catch (error) {
      setGiftCardError('Failed to validate gift card');
      return null;
    } finally {
      setIsValidatingGiftCard(false);
    }
  }, [addGiftCard]);

  // Calculate total gift card value
  const totalGiftCardValue = useMemo(() => {
    return selectedGiftCards.reduce((sum, gc) => {
      return sum + (parseFloat(gc.balance) || parseFloat(gc.value) || 0);
    }, 0);
  }, [selectedGiftCards]);

  // Calculate applied gift card amount (up to total price)
  const calculateAppliedGiftCardAmount = useCallback((totalPrice) => {
    return Math.min(totalGiftCardValue, totalPrice);
  }, [totalGiftCardValue]);

  // Calculate remaining balance after applying to price
  const calculateRemainingBalance = useCallback((totalPrice) => {
    const applied = calculateAppliedGiftCardAmount(totalPrice);
    return Math.max(0, totalPrice - applied);
  }, [calculateAppliedGiftCardAmount]);

  // Check if gift card is selected
  const isGiftCardSelected = useCallback((giftCardId) => {
    return selectedGiftCards.some(gc => gc.id === giftCardId);
  }, [selectedGiftCards]);

  // Computed values
  const hasGiftCards = selectedGiftCards.length > 0;
  const giftCardCount = selectedGiftCards.length;
  const isSearchingGiftCard = giftCardSearchQuery.trim().length > 0;

  return {
    // State
    showGiftCardModal,
    selectedGiftCards,
    giftCardSearchQuery,
    isValidatingGiftCard,
    giftCardError,
    totalGiftCardValue,

    // Computed
    hasGiftCards,
    giftCardCount,
    isSearchingGiftCard,

    // Modal actions
    openGiftCardModal,
    closeGiftCardModal,

    // Selection actions
    addGiftCard,
    removeGiftCard,
    clearGiftCards,
    isGiftCardSelected,

    // Search actions
    updateGiftCardSearch,
    clearGiftCardSearch,

    // Validation
    validateGiftCard,

    // Calculations
    calculateAppliedGiftCardAmount,
    calculateRemainingBalance
  };
};
