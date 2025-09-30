import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  multipleAppointments: [],
  currentAppointmentIndex: 0,
  showServiceCatalog: false,
  isAddingAdditionalService: false
};

const bookingSessionSlice = createSlice({
  name: 'bookingSession',
  initialState,
  reducers: {
    setMultipleAppointments(state, action) {
      state.multipleAppointments = action.payload;
    },
    addAppointmentToSession(state, action) {
      state.multipleAppointments.push(action.payload);
    },
    removeAppointmentFromSession(state, action) {
      state.multipleAppointments = state.multipleAppointments.filter(a => a.id !== action.payload);
    },
    clearSession(state) {
      state.multipleAppointments = [];
    },
    setShowServiceCatalog(state, action) {
      state.showServiceCatalog = action.payload;
    }
  }
});

export const { setMultipleAppointments, addAppointmentToSession, removeAppointmentFromSession, clearSession, setShowServiceCatalog } = bookingSessionSlice.actions;
export default bookingSessionSlice.reducer;
