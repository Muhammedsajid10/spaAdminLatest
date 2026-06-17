const selectAppointmentSummaryState = (state) =>
  state.appointmentSummary ?? {
    rawBookings: [],
    status: 'idle',
    error: null
  };

export const selectAppointmentSummaryRawBookings = (state) =>
  selectAppointmentSummaryState(state).rawBookings;

export const selectAppointmentSummaryStatus = (state) =>
  selectAppointmentSummaryState(state).status;

export const selectAppointmentSummaryError = (state) =>
  selectAppointmentSummaryState(state).error;