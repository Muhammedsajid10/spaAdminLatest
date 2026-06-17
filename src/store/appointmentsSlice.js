import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  byEmployee: {},
  loading: false,
  error: null
};

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointments(state, action) {
      state.byEmployee = action.payload;
    },
    setAppointmentsLoading(state, action) {
      state.loading = action.payload;
    },
    setAppointmentsError(state, action) {
      state.error = action.payload;
    },
    upsertAppointment(state, action) {
      const { employeeId, slotKey, appointment } = action.payload;
      if (!state.byEmployee[employeeId]) state.byEmployee[employeeId] = {};
      state.byEmployee[employeeId][slotKey] = appointment;
    },
    removeAppointment(state, action) {
      const { employeeId, slotKey } = action.payload;
      if (state.byEmployee[employeeId]) {
        delete state.byEmployee[employeeId][slotKey];
      }
    }
  }
});

export const { setAppointments, setAppointmentsLoading, setAppointmentsError, upsertAppointment, removeAppointment } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
