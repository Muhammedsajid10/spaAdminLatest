/**
 * useDateNavigation Hook
 * Manages current date state and navigation
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook for date navigation in calendar
 * @returns {Object} Date state and navigation functions
 */
export const useDateNavigation = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const viewMode = useSelector(state => state.calendar?.viewMode || 'week');

  /**
   * Navigate to next period based on view mode
   */
  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      switch (viewMode) {
        case 'day':
          next.setDate(next.getDate() + 1);
          break;
        case 'week':
          next.setDate(next.getDate() + 7);
          break;
        case 'month':
          next.setMonth(next.getMonth() + 1);
          break;
        default:
          next.setDate(next.getDate() + 7);
      }
      return next;
    });
  }, [viewMode]);

  /**
   * Navigate to previous period based on view mode
   */
  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      const previous = new Date(prev);
      switch (viewMode) {
        case 'day':
          previous.setDate(previous.getDate() - 1);
          break;
        case 'week':
          previous.setDate(previous.getDate() - 7);
          break;
        case 'month':
          previous.setMonth(previous.getMonth() - 1);
          break;
        default:
          previous.setDate(previous.getDate() - 7);
      }
      return previous;
    });
  }, [viewMode]);

  /**
   * Navigate to today
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /**
   * Set specific date
   */
  const setDate = useCallback((date) => {
    setCurrentDate(new Date(date));
  }, []);

  /**
   * Get date range for current view
   */
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        // Same day
        break;
      case 'week':
        // Start of week (Monday)
        const dayOfWeek = start.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start.setDate(start.getDate() + diff);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        // Start and end of month
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      default:
        // Default to week
        const day = start.getDay();
        const weekDiff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + weekDiff);
        end.setDate(start.getDate() + 6);
    }

    return { start, end };
  }, [currentDate, viewMode]);

  /**
   * Check if current date is today
   */
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  return {
    currentDate,
    dateRange,
    isToday,
    goToNext,
    goToPrevious,
    goToToday,
    setDate,
  };
};
