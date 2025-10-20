import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  timeSlots: [],
  currentDateISO: null,
  loading: false,
  error: null,
  selectedStaff: 'All'
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
    }
  }
});

export const { setTimeSlots, setCurrentDateISO, setLoading, setError, setSelectedStaff } = calendarSlice.actions;
export default calendarSlice.reducer;