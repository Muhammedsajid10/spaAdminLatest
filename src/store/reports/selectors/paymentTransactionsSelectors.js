const selectPaymentTransactionsState = (state) =>
  state.paymentTransactions ?? {
    items: [],
    status: 'idle',
    error: null
  };

export const selectPaymentTransactions = (state) =>
  selectPaymentTransactionsState(state).items;

export const selectPaymentTransactionsStatus = (state) =>
  selectPaymentTransactionsState(state).status;

export const selectPaymentTransactionsError = (state) =>
  selectPaymentTransactionsState(state).error;