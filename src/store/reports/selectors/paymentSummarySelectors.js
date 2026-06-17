const selectPaymentSummaryState = (state) =>
  state.paymentSummary ?? {
    rawItems: [],
    status: 'idle',
    error: null,
    fetchedAt: null
  };

export const selectPaymentSummaryRawItems = (state) =>
  selectPaymentSummaryState(state).rawItems;

export const selectPaymentSummaryStatus = (state) =>
  selectPaymentSummaryState(state).status;

export const selectPaymentSummaryError = (state) =>
  selectPaymentSummaryState(state).error;

export const selectPaymentSummaryFetchedAt = (state) =>
  selectPaymentSummaryState(state).fetchedAt;