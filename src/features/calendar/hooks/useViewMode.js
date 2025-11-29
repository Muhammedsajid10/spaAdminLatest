/**
 * useViewMode Hook
 * Manages calendar view mode (day/week/month)
 */

import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

/**
 * Custom hook for managing calendar view mode
 * @returns {Object} View mode state and setter
 */
export const useViewMode = () => {
  const dispatch = useDispatch();
  const viewMode = useSelector(state => state.calendar?.viewMode || 'week');

  /**
   * Set view mode
   * @param {string} mode - 'day' | 'week' | 'month'
   */
  const setViewMode = useCallback((mode) => {
    if (['day', 'week', 'month'].includes(mode)) {
      dispatch({ type: 'calendar/setViewMode', payload: mode });
    }
  }, [dispatch]);

  /**
   * Toggle between week and month views
   */
  const toggleView = useCallback(() => {
    const nextMode = viewMode === 'week' ? 'month' : 'week';
    setViewMode(nextMode);
  }, [viewMode, setViewMode]);

  return {
    viewMode,
    setViewMode,
    toggleView,
    isWeekView: viewMode === 'week',
    isMonthView: viewMode === 'month',
    isDayView: viewMode === 'day',
  };
};
