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
      console.log('📝 Adding appointment to Redux store:', appointment.id, appointment.service?.name);
      state.multipleAppointments.push(appointment);
    },
    removeAppointmentFromSession(state, action) {
      const idToRemove = action.payload;
      console.log('🗑️ Redux: Removing appointment with ID:', idToRemove);
      console.log('🗑️ Redux: Current appointments before removal:', state.multipleAppointments.map(a => ({ id: a.id, service: a.service?.name })));
      
      const originalLength = state.multipleAppointments.length;
      state.multipleAppointments = state.multipleAppointments.filter(a => a.id !== idToRemove);
      const newLength = state.multipleAppointments.length;
      
      console.log('🗑️ Redux: Appointments after removal:', state.multipleAppointments.map(a => ({ id: a.id, service: a.service?.name })));
      console.log('🗑️ Redux: Removed count:', originalLength - newLength);
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
