import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'Day', // Day | Week | Month
  currentDate: new Date().toISOString(),
  timeSlots: [],
  services: [],
  employees: [],
  appointments: {},
  loading: false,
  error: null
};

const calendarViewSlice = createSlice({
  name: 'calendarView',
  initialState,
  reducers: {
    setView(state, action) { state.currentView = action.payload; },
    setDate(state, action) { state.currentDate = action.payload; },
    setTimeSlots(state, action) { state.timeSlots = action.payload; },
    setServices(state, action) { state.services = action.payload; },
    setEmployees(state, action) { state.employees = action.payload; },
    setAppointments(state, action) { state.appointments = action.payload; },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; }
  }
});

export const { setView, setDate, setTimeSlots, setServices, setEmployees, setAppointments, setLoading, setError } = calendarViewSlice.actions;
export default calendarViewSlice.reducer;
