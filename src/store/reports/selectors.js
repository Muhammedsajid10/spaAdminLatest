const selectReportsState = (state) => state?.reports ?? {
  dateRange: null,
  clients: [],
  clientsStatus: 'idle',
  clientsError: null
};

export const selectReportDateRange = (state) => selectReportsState(state).dateRange;
export const selectReportClients = (state) => selectReportsState(state).clients;
export const selectReportClientsStatus = (state) => selectReportsState(state).clientsStatus;
export const selectReportClientsError = (state) => selectReportsState(state).clientsError;