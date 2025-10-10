import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const normalizePaymentTransaction = (payment) => {
  const metadata = payment?.metadata ?? {};
  const toISO = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  return {
    id: payment?._id ?? payment?.id ?? null,
    paymentDate: toISO(metadata.paymentDate ?? payment?.paymentDate),
    paymentNumber: metadata.paymentNo ?? payment?.paymentNumber ?? '',
    saleDate: toISO(metadata.saleDate ?? payment?.saleDate),
    saleNumber: metadata.saleNo ?? payment?.saleNumber ?? '',
    appointmentRef: metadata.apptRef ?? payment?.appointmentRef ?? '',
    client: metadata.client ?? payment?.client ?? '',
    location: metadata.location ?? payment?.location ?? '',
    teamMember: metadata.teamMember ?? payment?.teamMember ?? '',
    transactionType:
      metadata.transactionType ?? payment?.transactionType ?? '',
    paymentMethod:
      (metadata.paymentMethodCSV ?? payment?.paymentMethod ?? '').toString(),
    paymentAmount: Number(
      metadata.paymentAmountCSV ?? payment?.paymentAmount ?? payment?.amount ?? 0
    ),
    currency: payment?.currency ?? 'AED',
    status: payment?.status ?? '',
    raw: payment
  };
};

export const fetchPaymentTransactions = createAsyncThunk(
  'paymentTransactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ReportsAPI.getPaymentTransactions({
        limit: 15000
      });
      const payments = response?.data?.payments ?? [];
      return payments.map(normalizePaymentTransaction);
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Failed to load payment transactions';
      return rejectWithValue(message);
    }
  }
);

const paymentTransactionsSlice = createSlice({
  name: 'paymentTransactions',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    lastFetched: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentTransactions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPaymentTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload ?? [];
        state.lastFetched = Date.now();
      })
      .addCase(fetchPaymentTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load payment transactions';
        state.items = [];
      });
  }
});

export default paymentTransactionsSlice.reducer;