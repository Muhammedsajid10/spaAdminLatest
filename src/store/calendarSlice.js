import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  timeSlots: [],
  currentDateISO: null,
  currentView: 'Day',
  datePicker: {
    show: false,
    view: 'date',
    currentMonthISO: null,
    selectedDateISO: null
  },
  loading: false,
  error: null,
  selectedStaff: 'All',
  filters: {
    selectedEmployeeIds: [],
    teamFilter: 'scheduled',
    showTeamPopup: false,
    showCalendarPopup: false,
    calendarPopupTab: 'confirmed'
  }
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setTimeSlots(state, action) {
      state.timeSlots = action.payload;
    },
    setCurrentDateISO(state, action) {
      state.currentDateISO = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setSelectedStaff(state, action) {
      state.selectedStaff = action.payload;
    },
    setCurrentView(state, action) {
      state.currentView = action.payload;
    },
    setDatePickerShow(state, action) { state.datePicker.show = action.payload; },
    setDatePickerView(state, action) { state.datePicker.view = action.payload; },
    setDatePickerMonth(state, action) { state.datePicker.currentMonthISO = action.payload; },
    setDatePickerSelected(state, action) { state.datePicker.selectedDateISO = action.payload; },
    
    // Filters & Popups
    toggleEmployeeSelection(state, action) {
      const id = action.payload;
      const index = state.filters.selectedEmployeeIds.indexOf(id);
      if (index === -1) {
        state.filters.selectedEmployeeIds.push(id);
      } else {
        state.filters.selectedEmployeeIds.splice(index, 1);
      }
    },
    setEmployeeSelection(state, action) { state.filters.selectedEmployeeIds = action.payload; },
    setTeamFilter(state, action) { state.filters.teamFilter = action.payload; },
    setShowTeamPopup(state, action) { state.filters.showTeamPopup = action.payload; },
    setShowCalendarPopup(state, action) { state.filters.showCalendarPopup = action.payload; },
    setCalendarPopupTab(state, action) { state.filters.calendarPopupTab = action.payload; }
  },
  extraReducers: (builder) => {
    builder
      .addCase('calendar/fetchData/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('calendar/fetchData/fulfilled', (state, action) => {
        state.loading = false;
        // The actual data might be shared with other slices (employees, appointments)
        // This slice just tracks the global status of the calendar load
      })
      .addCase('calendar/fetchData/rejected', (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setTimeSlots, setCurrentDateISO, setLoading, setError, setSelectedStaff, setCurrentView,
  setDatePickerShow, setDatePickerView, setDatePickerMonth, setDatePickerSelected,
  toggleEmployeeSelection, setEmployeeSelection, setTeamFilter, setShowTeamPopup, setShowCalendarPopup, setCalendarPopupTab
} = calendarSlice.actions;
export const calendarActions = calendarSlice.actions;
export default calendarSlice.reducer;
