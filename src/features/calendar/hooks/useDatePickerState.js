import { useState, useCallback } from 'react';

export const useDatePickerState = (initialDate = new Date()) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [datePickerView, setDatePickerView] = useState('date');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerCurrentMonth, setDatePickerCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [datePickerSelectedDate, setDatePickerSelectedDate] = useState(initialDate);
  const [weekRanges, setWeekRanges] = useState([]);
  const [selectedWeekRange, setSelectedWeekRange] = useState(null);

  const goToDatePickerPreviousMonth = useCallback(()=>{
    setDatePickerCurrentMonth(prev=> new Date(prev.getFullYear(), prev.getMonth()-1,1));
  },[]);

  const goToDatePickerNextMonth = useCallback(()=>{
    setDatePickerCurrentMonth(prev=> new Date(prev.getFullYear(), prev.getMonth()+1,1));
  },[]);

  const goToDatePickerToday = useCallback(()=>{
    const today=new Date();
    setDatePickerCurrentMonth(today);
    setDatePickerSelectedDate(today);
    setCurrentDate(today);
    setShowDatePicker(false);
  },[]);

  const handleDatePickerDateSelect = useCallback((date)=>{
    setCurrentDate(date);
    setDatePickerSelectedDate(date);
    setShowDatePicker(false);
  },[]);

  // Helpers for date picker
  const getDatePickerCalendarDays = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Sunday before the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on the Saturday after the last day of the month
    const endDate = new Date(lastDay);
    if (lastDay.getDay() !== 6) {
      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    }
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString()
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getWeeksInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks = [];
    const current = new Date(firstDay);
    // Adjust to start of week (Monday)
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);

    while (current <= lastDay || (current.getMonth() === month)) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Get week number
      const d = new Date(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);

      weeks.push({
        startDate: weekStart,
        endDate: weekEnd,
        weekNumber: weekNo,
        isCurrentWeek: new Date() >= weekStart && new Date() <= weekEnd
      });
      
      current.setDate(current.getDate() + 7);
      if (current.getFullYear() > year || (current.getFullYear() === year && current.getMonth() > month)) break;
    }
    return weeks;
  };

  const getMonthsInYear = (year) => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      months.push({
        month: i + 1,
        year: year,
        label: d.toLocaleDateString('en-US', { month: 'long' }),
        current: new Date().getMonth() === i && new Date().getFullYear() === year
      });
    }
    return months;
  };

  return {
    // state
    currentDate, datePickerView, showDatePicker, datePickerCurrentMonth, datePickerSelectedDate,
    weekRanges, selectedWeekRange,
    // setters
    setCurrentDate, setDatePickerView, setShowDatePicker, setDatePickerCurrentMonth,
    setDatePickerSelectedDate, setWeekRanges, setSelectedWeekRange,
    // actions
    goToDatePickerPreviousMonth, goToDatePickerNextMonth, goToDatePickerToday, handleDatePickerDateSelect,
    // helpers
    getDatePickerCalendarDays, getWeeksInMonth, getMonthsInYear
  };
};
