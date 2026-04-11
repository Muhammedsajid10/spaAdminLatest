import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const toISO = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizeFinanceData = (item) => {
  return {
    id: item?._id ?? item?.id ?? null,
    date: toISO(item?.date),
    // Sales section
    grossSales: Number(item?.grossSales ?? 0),
    discounts: Number(item?.discounts ?? 0),
    refundsReturns: Number(item?.refundsReturns ?? 0),
    netSales: Number(item?.netSales ?? 0),
    taxes: Number(item?.taxes ?? 0),
    totalSales: Number(item?.totalSales ?? 0),
    giftCardSales: Number(item?.giftCardSales ?? 0),
    serviceCharges: Number(item?.serviceCharges ?? 0),
    tips: Number(item?.tips ?? 0),
    netOtherSales: Number(item?.netOtherSales ?? 0),
    taxOnOtherSales: Number(item?.taxOnOtherSales ?? 0),
    totalOtherSales: Number(item?.totalOtherSales ?? 0),
    totalSalesOtherSales: Number(item?.totalSalesOtherSales ?? 0),
    salesPaidInPeriod: Number(item?.salesPaidInPeriod ?? 0),
    unpaidSalesInPeriod: Number(item?.unpaidSalesInPeriod ?? 0),
    // Payments section
    card: Number(item?.card ?? 0),
    cash: Number(item?.cash ?? 0),
    paymentLink: Number(item?.paymentLink ?? 0),
    freshaOnline: Number(item?.freshaOnline ?? 0),
    totalPayments: Number(item?.totalPayments ?? 0),
    paymentsForSalesInPeriod: Number(item?.paymentsForSalesInPeriod ?? 0),
    paymentsForSalesInPreviousPeriods: Number(item?.paymentsForSalesInPreviousPeriods ?? 0),
    upfrontPayments: Number(item?.upfrontPayments ?? 0),
    // Redemptions section
    upfrontPaymentRedemption: Number(item?.upfrontPaymentRedemption ?? 0),
    giftCardRedemption: Number(item?.giftCardRedemption ?? 0),
    totalRedemptions: Number(item?.totalRedemptions ?? 0),
    redemptionsForSalesInPeriod: Number(item?.redemptionsForSalesInPeriod ?? 0),
    redemptionsForSalesInPreviousPeriods: Number(item?.redemptionsForSalesInPreviousPeriods ?? 0),
    createdAt: toISO(item?.createdAt),
    updatedAt: toISO(item?.updatedAt)
  };
};

export const buildFinanceSummary = (rows = [], dateRange = null) => {
  // Filter by date range if provided
  let filteredRows = rows;
  if (dateRange?.start && dateRange?.end) {
    filteredRows = rows.filter((item) => {
      if (!item?.date) return false;
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      return localDateStr >= dateRange.start && localDateStr <= dateRange.end;
    });
  }

  // Group by date and remove duplicates (keep latest by updatedAt)
  const dateMap = new Map();
  
  filteredRows.forEach((item) => {
    if (!item?.date) return;
    
    const dateKey = new Date(item.date).toISOString().split('T')[0];
    const existing = dateMap.get(dateKey);
    
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      dateMap.set(dateKey, item);
    }
  });

  // Convert to array and sort by date (newest first)
  return Array.from(dateMap.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const fetchFinanceSummary = createAsyncThunk(
  'financeSummary/fetch',
  async ({ startDate = null, endDate = null } = {}, { rejectWithValue }) => {
    try {
      const response = await ReportsAPI.getFinanceSummary({ startDate, endDate });
      
      const data = response?.data ?? [];
      
      // Normalize all finance data returned by the backend (already date-filtered)
      const normalized = data.map(normalizeFinanceData);
      return normalized;
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Failed to load finance summary';
      return rejectWithValue(message);
    }
  }
);

const financeSummarySlice = createSlice({
  name: 'financeSummary',
  initialState: {
    rawItems: [], // Store normalized raw data
    status: 'idle',
    error: null,
    fetchedAt: null
  },
  reducers: {
    clearFinanceSummary: (state) => {
      state.rawItems = [];
      state.status = 'idle';
      state.error = null;
      state.fetchedAt = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinanceSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFinanceSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rawItems = action.payload ?? [];
        state.fetchedAt = Date.now();
      })
      .addCase(fetchFinanceSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load finance summary';
        state.rawItems = [];
      });
  }
});

export const { clearFinanceSummary } = financeSummarySlice.actions;
export default financeSummarySlice.reducer;