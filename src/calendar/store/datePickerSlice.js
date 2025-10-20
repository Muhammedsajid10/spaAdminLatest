import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

// Helper functions for date picker calculations
const getDatePickerCalendarDays = (month) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // First day of the month
  const firstDay = new Date(year, monthIndex, 1);
  // Last day of the month
  const lastDay = new Date(year, monthIndex + 1, 0);

  // Calculate padding days needed at the start (Monday = 1, Sunday = 0)
  const startPadding = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0

  // Calculate padding days needed at the end
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((totalDays + startPadding) / 7) * 7;
  const endPadding = totalCells - (totalDays + startPadding);

  const days = [];
  const today = new Date();

  // Add padding days from previous month
  for (let i = startPadding; i > 0; i--) {
    const date = new Date(year, monthIndex, 1 - i);
    days.push({
      date: date.toISOString(), // Store as ISO string for serialization
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: date.toDateString() === today.toDateString()
    });
  }

  // Add current month days
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, monthIndex, day);
    days.push({
      date: date.toISOString(), // Store as ISO string for serialization
      day: day,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString()
    });
  }

  // Add padding days from next month
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, monthIndex + 1, i);
    days.push({
      date: date.toISOString(), // Store as ISO string for serialization
      date: date.toISOString(), // Store as ISO string for serialization
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: date.toDateString() === today.toDateString()
    });
  }

  return days;
};

// Helper function to get weeks for a given month (for week picker)
const getWeeksInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  const weeks = [];
  let currentWeekStart = new Date(firstDay);

  // Adjust to start of the week (Monday)
  const dayOfWeek = (firstDay.getDay() + 6) % 7;
  currentWeekStart.setDate(firstDay.getDate() - dayOfWeek);

  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    weeks.push({
      startDate: currentWeekStart.toISOString(), // Store as ISO string
      endDate: weekEnd.toISOString(), // Store as ISO string
      weekNumber: weeks.length + 1,
      isCurrentWeek: (() => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return todayStart >= currentWeekStart && todayStart <= weekEnd;
      })()
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

// Helper function to get months for a given year (for month picker)
const getMonthsInYear = (year) => {
  const months = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(year, i, 1);
    months.push({
      month: i,
      year: year,
      name: monthDate.toLocaleDateString('en-US', { month: 'long' }),
      shortName: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      isCurrentMonth: year === currentYear && i === currentMonth
    });
  }

  return months;
};

const initialState = {
  // Store dates as ISO strings for Redux serialization
  currentDate: new Date().toISOString(),
  currentView: 'Day', // 'Day', 'Week', 'Month'
  datePickerView: 'date',
  showDatePicker: false,
  datePickerCurrentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
  datePickerSelectedDate: new Date().toISOString(),
  weekRanges: [],
  selectedWeekRange: null,
  calendarDays: getDatePickerCalendarDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  weeksInMonth: getWeeksInMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  monthsInYear: getMonthsInYear(new Date().getFullYear())
};

const datePickerSlice = createSlice({
  name: 'datePicker',
  initialState,
  reducers: {
    setCurrentDate(state, action) {
      // Ensure we store as ISO string
      state.currentDate = action.payload instanceof Date ? action.payload.toISOString() : action.payload;
    },
    setDatePickerView(state, action) {
      state.datePickerView = action.payload;
    },
    setShowDatePicker(state, action) {
      state.showDatePicker = action.payload;
    },
    setDatePickerCurrentMonth(state, action) {
      const monthDate = action.payload instanceof Date ? action.payload : new Date(action.payload);
      state.datePickerCurrentMonth = monthDate.toISOString();
      // Recalculate derived data when month changes
      state.calendarDays = getDatePickerCalendarDays(monthDate);
      state.weeksInMonth = getWeeksInMonth(monthDate);
      state.monthsInYear = getMonthsInYear(monthDate.getFullYear());
    },
    setDatePickerSelectedDate(state, action) {
      // Ensure we store as ISO string
      state.datePickerSelectedDate = action.payload instanceof Date ? action.payload.toISOString() : action.payload;
    },
    setWeekRanges(state, action) {
      state.weekRanges = action.payload;
    },
    setCurrentView(state, action) {
      state.currentView = action.payload;
    },
    goToDatePickerPreviousMonth(state) {
      const currentMonth = new Date(state.datePickerCurrentMonth);
      const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      state.datePickerCurrentMonth = newMonth.toISOString();
      state.calendarDays = getDatePickerCalendarDays(newMonth);
      state.weeksInMonth = getWeeksInMonth(newMonth);
      state.monthsInYear = getMonthsInYear(newMonth.getFullYear());
    },
    goToDatePickerNextMonth(state) {
      const currentMonth = new Date(state.datePickerCurrentMonth);
      const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      state.datePickerCurrentMonth = newMonth.toISOString();
      state.calendarDays = getDatePickerCalendarDays(newMonth);
      state.weeksInMonth = getWeeksInMonth(newMonth);
      state.monthsInYear = getMonthsInYear(newMonth.getFullYear());
    },
    goToDatePickerToday(state) {
      const today = new Date();
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      state.datePickerCurrentMonth = todayMonth.toISOString();
      state.datePickerSelectedDate = today.toISOString();
      state.currentDate = today.toISOString();
      state.showDatePicker = false;
      state.calendarDays = getDatePickerCalendarDays(todayMonth);
      state.weeksInMonth = getWeeksInMonth(todayMonth);
      state.monthsInYear = getMonthsInYear(today.getFullYear());
    },
    handleDatePickerDateSelect(state, action) {
      const selectedDate = action.payload instanceof Date ? action.payload.toISOString() : action.payload;
      state.currentDate = selectedDate;
      state.datePickerSelectedDate = selectedDate;
      state.showDatePicker = false;
    },
    handleWeekSelect(state, action) {
      const weekStartDate = action.payload instanceof Date ? action.payload.toISOString() : action.payload;
      state.currentDate = weekStartDate;
      state.datePickerSelectedDate = weekStartDate;
      state.showDatePicker = false;
    },
    handleMonthSelect(state, action) {
      const { month, year } = action.payload;
      const selectedDate = new Date(year, month, 1);
      state.currentDate = selectedDate.toISOString();
      state.datePickerSelectedDate = selectedDate.toISOString();
      state.showDatePicker = false;
    },
    goToPrevious(state) {
      const currentDate = new Date(state.currentDate);
      if (state.currentView === 'Day') {
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (state.currentView === 'Week') {
        currentDate.setDate(currentDate.getDate() - 7);
      } else if (state.currentView === 'Month') {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }
      state.currentDate = currentDate.toISOString();
    },
    goToNext(state) {
      const currentDate = new Date(state.currentDate);
      if (state.currentView === 'Day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (state.currentView === 'Week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (state.currentView === 'Month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      state.currentDate = currentDate.toISOString();
    },
    goToToday(state) {
      const today = new Date();
      state.currentDate = today.toISOString();
    },
    initializeDatePicker(state) {
      // Initialize the date picker with current date and calculate derived data
      const today = new Date();
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      state.datePickerCurrentMonth = todayMonth.toISOString();
      state.datePickerSelectedDate = today.toISOString();
      state.calendarDays = getDatePickerCalendarDays(todayMonth);
      state.weeksInMonth = getWeeksInMonth(todayMonth);
      state.monthsInYear = getMonthsInYear(today.getFullYear());
    },
  }
});

export const {
  setCurrentDate,
  setCurrentView,
  setDatePickerView,
  setShowDatePicker,
  setDatePickerCurrentMonth,
  setDatePickerSelectedDate,
  setWeekRanges,
  setSelectedWeekRange,
  goToDatePickerPreviousMonth,
  goToDatePickerNextMonth,
  goToDatePickerToday,
  handleDatePickerDateSelect,
  handleWeekSelect,
  handleMonthSelect,
  goToPrevious,
  goToNext,
  goToToday,
  initializeDatePicker
} = datePickerSlice.actions;

// Selectors - Convert ISO strings back to Date objects for components
export const selectDatePickerState = (state) => state.datePicker;

// Memoized selector that converts calendar days with ISO strings back to Date objects
export const selectCalendarDays = createSelector(
  [(state) => state.datePicker.calendarDays],
  (calendarDays) => calendarDays.map(dayObj => ({
    ...dayObj,
    date: new Date(dayObj.date)
  }))
);

// Memoized selector that converts weeks with ISO strings back to Date objects
export const selectWeeksInMonth = createSelector(
  [(state) => state.datePicker.weeksInMonth],
  (weeksInMonth) => weeksInMonth.map(weekObj => ({
    ...weekObj,
    startDate: new Date(weekObj.startDate),
    endDate: new Date(weekObj.endDate)
  }))
);

export const selectMonthsInYear = (state) => state.datePicker.monthsInYear;

// Date selectors that return Date objects - memoized to prevent unnecessary re-renders
export const selectCurrentDate = createSelector(
  [(state) => state.datePicker.currentDate],
  (currentDate) => new Date(currentDate)
);
export const selectCurrentView = (state) => state.datePicker.currentView;
export const selectShowDatePicker = (state) => state.datePicker.showDatePicker;
export const selectDatePickerCurrentMonth = createSelector(
  [(state) => state.datePicker.datePickerCurrentMonth],
  (datePickerCurrentMonth) => new Date(datePickerCurrentMonth)
);
export const selectDatePickerSelectedDate = createSelector(
  [(state) => state.datePicker.datePickerSelectedDate],
  (datePickerSelectedDate) => new Date(datePickerSelectedDate)
);
export const selectDatePickerView = (state) => state.datePicker.datePickerView;

export default datePickerSlice.reducer;