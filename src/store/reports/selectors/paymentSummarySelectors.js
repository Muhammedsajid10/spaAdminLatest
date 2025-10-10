const selectPaymentSummaryState = (state) =>
  state.paymentSummary ?? {
    items: [],
    status: 'idle',
    error: null
  };

export const selectPaymentSummaryItems = (state) =>
  selectPaymentSummaryState(state).items;

export const selectPaymentSummaryStatus = (state) =>
  selectPaymentSummaryState(state).status;

export const selectPaymentSummaryError = (state) =>
  selectPaymentSummaryState(state).error;