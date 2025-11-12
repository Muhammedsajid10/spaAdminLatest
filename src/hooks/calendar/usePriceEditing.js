/**
 * usePriceEditing Hook
 * Manages custom price editing for booking sessions
 */

import { useState, useCallback } from 'react';

export const usePriceEditing = () => {
  const [editingTotalPrice, setEditingTotalPrice] = useState(false);
  const [tempTotalPrice, setTempTotalPrice] = useState('');
  const [customTotalDiscount, setCustomTotalDiscount] = useState(0);

  const calculateOriginalTotal = useCallback((appointments) => {
    return appointments.reduce((sum, apt) => {
      const price = (apt && (apt.price ?? apt.service?.price ?? 0)) || 0;
      return sum + Number(price || 0);
    }, 0);
  }, []);

  const calculateFinalTotal = useCallback((appointments) => {
    const original = calculateOriginalTotal(appointments);
    return Math.max(0, original - customTotalDiscount);
  }, [calculateOriginalTotal, customTotalDiscount]);

  const startEditingTotalPrice = useCallback((currentTotal) => {
    setTempTotalPrice(currentTotal.toString());
    setEditingTotalPrice(true);
  }, []);

  const cancelEditingTotalPrice = useCallback(() => {
    setEditingTotalPrice(false);
    setTempTotalPrice('');
  }, []);

  const saveEditedTotalPrice = useCallback((originalTotal) => {
    const newTotal = parseFloat(tempTotalPrice);
    if (!isNaN(newTotal) && newTotal >= 0) {
      const discount = originalTotal - newTotal;
      setCustomTotalDiscount(discount);
      setEditingTotalPrice(false);
      setTempTotalPrice('');
    }
  }, [tempTotalPrice]);

  const clearCustomDiscount = useCallback(() => {
    setCustomTotalDiscount(0);
  }, []);

  const updateTempPrice = useCallback((value) => {
    setTempTotalPrice(value);
  }, []);

  const hasDiscount = customTotalDiscount > 0;

  return {
    // State
    editingTotalPrice,
    tempTotalPrice,
    customTotalDiscount,
    hasDiscount,

    // Actions
    startEditingTotalPrice,
    cancelEditingTotalPrice,
    saveEditedTotalPrice,
    clearCustomDiscount,
    updateTempPrice,
    calculateOriginalTotal,
    calculateFinalTotal
  };
};
