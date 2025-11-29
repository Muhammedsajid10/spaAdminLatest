import { useState, useCallback } from 'react';
import { useDatePickerState, formatDateLocal, getDayName } from '../../../calendar';

export const useCalendarView = (initialDate = new Date()) => {
  const [currentView, setCurrentView] = useState('Day');
  
  // Date Picker State Hook (reusing existing hook)
  const {
    currentDate, datePickerView, showDatePicker, datePickerCurrentMonth, datePickerSelectedDate,
    setCurrentDate, setDatePickerView, setShowDatePicker, setDatePickerCurrentMonth,
    setDatePickerSelectedDate,
    goToDatePickerPreviousMonth,
    goToDatePickerNextMonth,
    goToDatePickerToday,
    handleDatePickerDateSelect,
    getDatePickerCalendarDays,
    getWeeksInMonth,
    getMonthsInYear
  } = useDatePickerState(initialDate);

  // Navigation Handlers
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, [setCurrentDate]);

  const goToPrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() - 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() - 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  }, [currentDate, currentView, setCurrentDate]);

  const goToNext = useCallback(() => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() + 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() + 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  }, [currentDate, currentView, setCurrentDate]);

  // Date Picker Navigation Handlers
  const goToDatePickerPreviousWeek = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setDate(newDate.getDate() - 7);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const goToDatePickerNextWeek = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setDate(newDate.getDate() + 7);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const goToDatePickerPreviousYear = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const goToDatePickerNextYear = useCallback(() => {
    const newDate = new Date(datePickerCurrentMonth);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setDatePickerCurrentMonth(newDate);
  }, [datePickerCurrentMonth, setDatePickerCurrentMonth]);

  const handleWeekSelect = useCallback((weekStartDate) => {
    setCurrentDate(weekStartDate);
    setDatePickerSelectedDate(weekStartDate);
    setShowDatePicker(false);
  }, [setCurrentDate, setDatePickerSelectedDate, setShowDatePicker]);

  const handleMonthSelect = useCallback((month, year) => {
    const selectedDate = new Date(year, month, 1);
    setCurrentDate(selectedDate);
    setDatePickerSelectedDate(selectedDate);
    setShowDatePicker(false);
  }, [setCurrentDate, setDatePickerSelectedDate, setShowDatePicker]);

  // Helper: Get Calendar Days for View
  const getCalendarDays = useCallback(() => {
    if (currentView === 'Day') {
      return [currentDate];
    } else if (currentView === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
      });
    } else if (currentView === 'Month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const numDays = endOfMonth.getDate();
      return Array.from({ length: numDays }, (_, i) => {
        const day = new Date(startOfMonth);
        day.setDate(startOfMonth.getDate() + i);
        return day;
      });
    }
    return [currentDate];
  }, [currentDate, currentView]);

  return {
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,
    calendarDays: getCalendarDays(),
    
    // Navigation
    goToToday,
    goToPrevious,
    goToNext,
    
    // Date Picker State & Handlers
    datePickerView,
    setDatePickerView,
    showDatePicker,
    setShowDatePicker,
    datePickerCurrentMonth,
    setDatePickerCurrentMonth,
    datePickerSelectedDate,
    setDatePickerSelectedDate,
    goToDatePickerPreviousMonth,
    goToDatePickerNextMonth,
    goToDatePickerPreviousYear,
    goToDatePickerNextYear,
    goToDatePickerToday,
    handleDatePickerDateSelect,
    handleWeekSelect,
    handleMonthSelect,
    getDatePickerCalendarDays,
    getWeeksInMonth,
    getMonthsInYear
  };
};
