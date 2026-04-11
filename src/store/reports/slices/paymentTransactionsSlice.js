import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const normalizePaymentTransaction = (payment) => {
  const metadata = payment?.metadata ?? {};
  const booking = payment?.booking ?? {};
  const user = payment?.user ?? {};

  const toISO = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  // Helper to get client name
  const getClientName = () => {
    if (user.fullName) return user.fullName;
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return metadata.client ?? payment?.client ?? '';
  };

  return {
    id: payment?._id ?? payment?.id ?? null,
    paymentDate: toISO(payment?.processedAt ?? payment?.createdAt ?? metadata.paymentDate ?? payment?.paymentDate),
    paymentNumber: payment?.gatewayTransactionId ?? metadata.paymentNo ?? payment?.paymentNumber ?? '',
    saleDate: toISO(booking.appointmentDate ?? metadata.saleDate ?? payment?.saleDate ?? payment?.createdAt),
    saleNumber: booking.bookingNumber ?? metadata.saleNo ?? payment?.saleNumber ?? '',
    appointmentRef: booking.bookingNumber ?? metadata.apptRef ?? payment?.appointmentRef ?? '',
    client: getClientName(),
    location: booking.location?.name ?? metadata.location ?? payment?.location ?? '',
    teamMember: booking.employee?.name ?? metadata.teamMember ?? payment?.teamMember ?? '',
    transactionType: payment?.type ?? metadata.transactionType ?? payment?.transactionType ?? 'Sale',
    paymentMethod: (payment?.paymentMethod ?? metadata.paymentMethodCSV ?? '').toString(),
    paymentAmount: Number(
      payment?.amount ?? payment?.paymentAmount ?? metadata.paymentAmountCSV ?? 0
    ),
    currency: payment?.currency ?? 'AED',
    status: payment?.status ?? '',
    raw: payment
  };
};

export const buildPaymentTransactionsData = (items = [], dateRange = null) => {
  if (!dateRange?.start || !dateRange?.end) return items;
  
  return items.filter((item) => {
    const tsStr = item.paymentDate || item.saleDate;
    if (!tsStr) return false;
    const ts = new Date(tsStr);
    if (Number.isNaN(ts.getTime())) return false;
    const year = ts.getFullYear();
    const month = String(ts.getMonth() + 1).padStart(2, '0');
    const day = String(ts.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    return localDateStr >= dateRange.start && localDateStr <= dateRange.end;
  });
};

export const fetchPaymentTransactions = createAsyncThunk(
  'paymentTransactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ReportsAPI.getPaymentTransactions({
        limit: 15000
      });
      const payments = response?.data?.payments ?? [];
      if (payments.length > 0) {}
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