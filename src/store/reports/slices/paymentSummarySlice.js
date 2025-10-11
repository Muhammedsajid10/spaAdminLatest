import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const toISO = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizePaymentForSummary = (payment) => {
  const metadata = payment?.metadata ?? {};
  
  // Priority: metadata.paymentDate -> createdAt
  const paymentDate = metadata.paymentDate ?? payment?.createdAt ?? null;

  return {
    id: payment?._id ?? payment?.id ?? null,
    paymentMethod: (metadata.paymentMethodCSV ?? payment?.paymentMethod ?? 'Unknown')
      .toString()
      .toLowerCase(),
    paymentDate: toISO(paymentDate),
    paymentAmount: Number(metadata.paymentAmountCSV ?? payment?.amount ?? 0),
    refundAmount: Number(payment?.refundAmount ?? 0)
  };
};

export const buildPaymentSummary = (rows = [], dateRange = null) => {
  const map = new Map();

  // Filter by date range first if provided
  let filteredRows = rows;
  if (dateRange?.start && dateRange?.end) {
    const start = new Date(dateRange.start);
    const end = new Date(`${dateRange.end}T23:59:59`);
    
    filteredRows = rows.filter((item) => {
      if (!item?.paymentDate) return false;
      const ts = new Date(item.paymentDate);
      return !Number.isNaN(ts.getTime()) && ts >= start && ts <= end;
    });
  }

  // Build summary from filtered rows
  filteredRows.forEach((item) => {
    if (!item) return;

    const key = item.paymentMethod || 'unknown';
    
    if (!map.has(key)) {
      map.set(key, {
        paymentMethod: key.charAt(0).toUpperCase() + key.slice(1),
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
      const response = await ReportsAPI.getPaymentSummary();
      const payments = response?.data?.payments ?? response?.payments ?? [];
      
      // Normalize all payments and store in state
      const normalized = payments.map(normalizePaymentForSummary);
      return normalized;
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
    rawItems: [], // Store normalized raw data
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
        state.rawItems = action.payload ?? [];
        state.fetchedAt = Date.now();
      })
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load payment summary';
        state.rawItems = [];
      });
  }
});

export default paymentSummarySlice.reducer;