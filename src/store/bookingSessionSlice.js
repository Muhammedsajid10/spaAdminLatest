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
      const appointment = action.payload;
      // Ensure appointment has an ID
      if (!appointment.id) {
        appointment.id = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      state.multipleAppointments.push(appointment);
    },
    removeAppointmentFromSession(state, action) {
      const idToRemove = action.payload;

      const originalLength = state.multipleAppointments.length;
      state.multipleAppointments = state.multipleAppointments.filter(a => a.id !== idToRemove);
      const newLength = state.multipleAppointments.length;
    },
    clearSession(state) {
      state.multipleAppointments = [];
    },
    updateAppointmentPrice(state, action) {
      const { appointmentId, customPrice } = action.payload;
      const appointment = state.multipleAppointments.find(a => a.id === appointmentId);
      if (appointment) {
        appointment.customPrice = customPrice;
      }
    },
    updateAppointment(state, action) {
      const { id, ...updates } = action.payload;
      const appointment = state.multipleAppointments.find(a => a.id === id);
      if (appointment) {
        Object.assign(appointment, updates);
      }
    },
    setShowServiceCatalog(state, action) {
      state.showServiceCatalog = action.payload;
    },
    setCurrentAppointmentIndex(state, action) {
      state.currentAppointmentIndex = action.payload;
    },
    setIsAddingAdditionalService(state, action) {
      state.isAddingAdditionalService = action.payload;
    }
  }
});

export const { setMultipleAppointments, addAppointmentToSession, removeAppointmentFromSession, clearSession, updateAppointmentPrice, updateAppointment, setShowServiceCatalog } = bookingSessionSlice.actions;
export const bookingSessionActions = bookingSessionSlice.actions;
export default bookingSessionSlice.reducer;
