const selectPaymentSummaryState = (state) =>
  state.paymentSummary ?? {
    rawItems: [],
    status: 'idle',
    error: null
  };

export const selectPaymentSummaryRawItems = (state) =>
  selectPaymentSummaryState(state).rawItems;

export const selectPaymentSummaryStatus = (state) =>
  selectPaymentSummaryState(state).status;

export const selectPaymentSummaryError = (state) =>
  selectPaymentSummaryState(state).error;