import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../Service/api/reportsApi';

// Async thunk for fetching reports data
export const fetchReportsData = createAsyncThunk(
  'reports/fetchData',
  async ({ reportType, filters }, { rejectWithValue }) => {
    try {
      const data = await ReportsAPI.getReportData(reportType, filters);
      return { reportType, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for exporting data
export const exportReportData = createAsyncThunk(
  'reports/exportData',
  async ({ reportType, format, filters }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const data = state.reports.data[reportType];
      const blob = await ReportsAPI.exportData(data, format);
      return { blob, filename: `${reportType}-${Date.now()}.${format}` };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Data for different report types
  data: {
    salesSummary: [],
    paymentSummary: [],
    paymentTransactions: [],
    appointmentSummary: [],
    financeSummary: {},
    workingHours: [],
    clientsList: [],
  },
  
  // Loading states for each report type
  loading: {
    salesSummary: false,
    paymentSummary: false,
    paymentTransactions: false,
    appointmentSummary: false,
    financeSummary: false,
    workingHours: false,
    clientsList: false,
  },
  
  // Error states
  errors: {},
  
  // Last updated timestamps
  lastUpdated: {},
  
  // Export status
  exportLoading: false,
  exportError: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state, action) => {
      const { reportType } = action.payload;
      delete state.errors[reportType];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reports data
      .addCase(fetchReportsData.pending, (state, action) => {
        const { reportType } = action.meta.arg;
        state.loading[reportType] = true;
        delete state.errors[reportType];
      })
      .addCase(fetchReportsData.fulfilled, (state, action) => {
        const { reportType, data } = action.payload;
        state.loading[reportType] = false;
        state.data[reportType] = data;
        state.lastUpdated[reportType] = new Date().toISOString();
      })
      .addCase(fetchReportsData.rejected, (state, action) => {
        const { reportType } = action.meta.arg;
        state.loading[reportType] = false;
        state.errors[reportType] = action.payload;
      })
      
      // Export data
      .addCase(exportReportData.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportReportData.fulfilled, (state, action) => {
        state.exportLoading = false;
        // Trigger download in component
      })
      .addCase(exportReportData.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload;
      });
  },
});

export const { clearError, clearAllErrors } = reportsSlice.actions;
export default reportsSlice.reducer;