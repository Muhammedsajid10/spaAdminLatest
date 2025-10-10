import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const toISO = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizePaymentForSummary = (payment) => {
  const metadata = payment?.metadata ?? {};
  const paymentDate =
    metadata.paymentDate ?? payment?.paymentDate ?? payment?.createdAt ?? null;

  return {
    id: payment?._id ?? payment?.id ?? null,
    paymentMethod: (metadata.paymentMethodCSV ?? payment?.paymentMethod ?? 'Unknown').toString(),
    paymentDate: toISO(paymentDate),
    paymentAmount: Number(metadata.paymentAmountCSV ?? payment?.amount ?? 0),
    refundAmount: Number(payment?.refundAmount ?? metadata.refundAmountCSV ?? 0)
  };
};

export const buildPaymentSummary = (rows = [], dateRange) => {
  const start = dateRange?.start ? new Date(dateRange.start) : null;
  const end = dateRange?.end ? new Date(`${dateRange.end}T23:59:59`) : null;

  const map = new Map();

  rows.forEach((item) => {
    if (!item) return;

    if (start && end && item.paymentDate) {
      const ts = new Date(item.paymentDate);
      if (Number.isNaN(ts.getTime()) || ts < start || ts > end) {
        return;
      }
    }

    const key = item.paymentMethod || 'Unknown';
    if (!map.has(key)) {
      map.set(key, {
        paymentMethod: key,
        numberOfPayments: 0,
        paymentAmount: 0,
        numberOfRefunds: 0,
        refundAmount: 0,
        netPayments: 0
      });
    }

    const bucket = map.get(key);
    bucket.numberOfPayments += 1;
    bucket.paymentAmount += item.paymentAmount;

    if (item.refundAmount > 0) {
      bucket.numberOfRefunds += 1;
      bucket.refundAmount += item.refundAmount;
    }

    bucket.netPayments = bucket.paymentAmount - bucket.refundAmount;
  });

  return Array.from(map.values()).map((entry) => ({
    paymentMethod: entry.paymentMethod,
    numberOfPayments: entry.numberOfPayments,
    paymentAmount: Number(entry.paymentAmount.toFixed(2)),
    numberOfRefunds: entry.numberOfRefunds,
    refundAmount: Number(entry.refundAmount.toFixed(2)),
    netPayments: Number(entry.netPayments.toFixed(2))
  }));
};

export const fetchPaymentSummary = createAsyncThunk(
  'paymentSummary/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const payload = await ReportsAPI.getPaymentSummary();
      const payments = payload?.data?.payments ?? payload?.payments ?? [];
      return payments.map(normalizePaymentForSummary);
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Failed to load payment summary';
      return rejectWithValue(message);
    }
  }
);

const paymentSummarySlice = createSlice({
  name: 'paymentSummary',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    fetchedAt: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload ?? [];
        state.fetchedAt = Date.now();
      })
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load payment summary';
        state.items = [];
      });
  }
});

export default paymentSummarySlice.reducer;