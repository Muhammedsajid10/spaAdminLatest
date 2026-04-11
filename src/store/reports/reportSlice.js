import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../Service/api/reportsApi';

const getLocalDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialDateRange = {
  start: getLocalDateString(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: getLocalDateString(Date.now())
};

export const fetchReportClients = createAsyncThunk(
  'reports/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ReportsAPI.getClients();
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load clients');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    dateRange: initialDateRange,
    clients: [],
    clientsStatus: 'idle',
    clientsError: null
  },
  reducers: {
    setReportDateRange: (state, action) => {
      state.dateRange = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportClients.pending, (state) => {
        state.clientsStatus = 'loading';
        state.clientsError = null;
      })
      .addCase(fetchReportClients.fulfilled, (state, action) => {
        state.clientsStatus = 'succeeded';
        state.clients = action.payload || [];
      })
      .addCase(fetchReportClients.rejected, (state, action) => {
        state.clientsStatus = 'failed';
        state.clientsError = action.payload;
      });
  }
});

export const { setReportDateRange } = reportSlice.actions;
export default reportSlice.reducer;