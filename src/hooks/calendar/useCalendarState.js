/**
 * useCalendarState Hook
 * Manages calendar view state (date, view type, navigation)
 */

import { useState, useCallback, useMemo } from 'react';
import { formatDateLocal } from '../../utils/calendar';

export const useCalendarState = (initialDate) => {
  const [currentDate, setCurrentDate] = useState(() => initialDate || new Date());
  const [currentView, setCurrentView] = useState('Week');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState(null);
  const [teamFilter, setTeamFilter] = useState([]);

  // Date navigation
  const goToPreviousWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  const goToPreviousDay = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToSpecificDate = useCallback((date) => {
    setCurrentDate(new Date(date));
  }, []);

  // View switching
  const switchToWeekView = useCallback(() => {
    setCurrentView('Week');
  }, []);

  const switchToDayView = useCallback(() => {
    setCurrentView('Day');
  }, []);

  const switchToMonthView = useCallback(() => {
    setCurrentView('Month');
  }, []);

  // Staff filtering
  const toggleStaffFilter = useCallback((staffId) => {
    setSelectedStaffFilter(prev => prev === staffId ? null : staffId);
  }, []);

  const clearStaffFilter = useCallback(() => {
    setSelectedStaffFilter(null);
  }, []);

  const setMultipleStaffFilter = useCallback((staffIds) => {
    setTeamFilter(staffIds);
  }, []);

  const toggleTeamMemberFilter = useCallback((staffId) => {
    setTeamFilter(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      }
      return [...prev, staffId];
    });
  }, []);

  const clearTeamFilter = useCallback(() => {
    setTeamFilter([]);
  }, []);

  // Utility computed values
  const currentDateKey = useMemo(() => {
    return currentDate ? formatDateLocal(currentDate) : formatDateLocal(new Date());
  }, [currentDate]);
  
  const isToday = useMemo(() => {
    if (!currentDate) return false;
    return formatDateLocal(currentDate) === formatDateLocal(new Date());
  }, [currentDate]);

  return {
    // State
    currentDate,
    currentView,
    selectedStaffFilter,
    teamFilter,
    currentDateKey,
    isToday,

    // Date navigation
    setCurrentDate,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToSpecificDate,

    // View switching
    setCurrentView,
    switchToWeekView,
    switchToDayView,
    switchToMonthView,

    // Staff filtering
    toggleStaffFilter,
    clearStaffFilter,
    setMultipleStaffFilter,
    toggleTeamMemberFilter,
    clearTeamFilter
  };
};
