import { useState, useCallback } from 'react';
import { minutesToLabel } from './timeUtils';

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

  return {
    // state
    currentDate, datePickerView, showDatePicker, datePickerCurrentMonth, datePickerSelectedDate,
    weekRanges, selectedWeekRange,
    // setters
    setCurrentDate, setDatePickerView, setShowDatePicker, setDatePickerCurrentMonth,
    setDatePickerSelectedDate, setWeekRanges, setSelectedWeekRange,
    // actions
    goToDatePickerPreviousMonth, goToDatePickerNextMonth, goToDatePickerToday, handleDatePickerDateSelect
  };
};
