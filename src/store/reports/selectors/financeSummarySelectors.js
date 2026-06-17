const selectFinanceSummaryState = (state) =>
  state.financeSummary ?? {
    rawItems: [],
    status: 'idle',
    error: null
  };

export const selectFinanceSummaryRawItems = (state) =>
  selectFinanceSummaryState(state).rawItems;

export const selectFinanceSummaryStatus = (state) =>
  selectFinanceSummaryState(state).status;

export const selectFinanceSummaryError = (state) =>
  selectFinanceSummaryState(state).error;