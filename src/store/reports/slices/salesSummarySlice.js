import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '@api/reportsApi';

// Simple function to extract sales data from bookings
export const buildSalesSummary = (bookingsData, dateRange = null) => {
  // Get bookings array
  let bookingsArray = Array.isArray(bookingsData) 
    ? bookingsData 
    : (bookingsData?.data?.bookings || bookingsData?.bookings || []);

  // Log first booking to see structure
  if (bookingsArray.length > 0) {}

  // Filter by date range
  console.log('📅 Date Range Picked for Sales Summary:', dateRange);
  let filteredBookings = bookingsArray;
  if (dateRange?.start && dateRange?.end) {
    filteredBookings = bookingsArray.filter((booking) => {
      const dateStr = booking.appointmentDate || booking.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      return localDateStr >= dateRange.start && localDateStr <= dateRange.end;
    });
  }
  console.log('📈 Current Range Based Data (Filtered Bookings):', filteredBookings);

  // Simple tracking objects
  const serviceData = {};
  const clientData = {};
  const teamMemberData = {};

  filteredBookings.forEach((booking, index) => {
    // Skip non-completed bookings
    if (booking.status && booking.status.toLowerCase() !== 'completed') {
      return;
    }

    // Get client info from booking
    const client = booking.client || {};
    const clientName = client.fullName || client.name || 'Unknown Client';

    // Parse out all sub-services for this booking
    let bookingServices = [];
    if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
      bookingServices = booking.services;
    } else if (booking.service) { // Fallback for single-service payload
      bookingServices = [{
        service: booking.service,
        serviceName: booking.service.name || 'Unknown Service',
        employee: booking.employee || booking.assignedEmployee,
        price: Number(booking.totalAmount || booking.finalAmount || booking.amount || booking.service.price || 0)
      }];
    } else {
      return; // Skip if no service structure
    }

    bookingServices.forEach(subItem => {
      const service = subItem.service || {};
      const serviceName = subItem.serviceName || service.name || 'Unknown Service';

      const teamMember = subItem.employee || booking.employee || booking.assignedEmployee || {};
      const teamMemberName = teamMember.name || teamMember.fullName || 'Unassigned';

      // Prefer sub-item price to accurately split total booking cost, fallback to service price or 0
      const price = Number(subItem.price !== undefined ? subItem.price : (service.price || 0));

      // Track by service
      if (!serviceData[serviceName]) {
        serviceData[serviceName] = {
          name: serviceName,
          service: serviceName,
          salesQty: 0,
          itemsSold: 0,
          grossSales: 0,
          totalDiscounts: 0,
          refunds: 0,
          netSales: 0,
          taxes: 0,
          totalSales: 0
        };
      }
      serviceData[serviceName].salesQty += 1;
      serviceData[serviceName].itemsSold += 1;
      serviceData[serviceName].grossSales += price;
      serviceData[serviceName].netSales += price;
      serviceData[serviceName].totalSales += price;

      // Track by client
      if (!clientData[clientName]) {
        clientData[clientName] = {
          name: clientName,
          client: clientName,
          salesQty: 0,
          itemsSold: 0,
          grossSales: 0,
          totalDiscounts: 0,
          refunds: 0,
          netSales: 0,
          taxes: 0,
          totalSales: 0
        };
      }
      clientData[clientName].salesQty += 1;
      clientData[clientName].itemsSold += 1;
      clientData[clientName].grossSales += price;
      clientData[clientName].netSales += price;
      clientData[clientName].totalSales += price;

      // Track by team member
      if (!teamMemberData[teamMemberName]) {
        teamMemberData[teamMemberName] = {
          name: teamMemberName,
          teamMember: teamMemberName,
          salesQty: 0,
          itemsSold: 0,
          grossSales: 0,
          totalDiscounts: 0,
          refunds: 0,
          netSales: 0,
          taxes: 0,
          totalSales: 0
        };
      }
      teamMemberData[teamMemberName].salesQty += 1;
      teamMemberData[teamMemberName].itemsSold += 1;
      teamMemberData[teamMemberName].grossSales += price;
      teamMemberData[teamMemberName].netSales += price;
      teamMemberData[teamMemberName].totalSales += price;
    });
  });

  const services = Object.values(serviceData);
  const clients = Object.values(clientData);
  const teamMembers = Object.values(teamMemberData);

  return {
    byService: services,
    byClient: clients,
    byTeamMember: teamMembers,
    services: services.map(s => ({ name: s.service })),
    clients: clients.map(c => ({ name: c.client })),
    teamMembers: teamMembers.map(t => ({ name: t.teamMember }))
  };
};

// Async thunk for fetching sales summary data
export const fetchSalesSummary = createAsyncThunk(
  'salesSummary/fetchSalesSummary',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch all bookings directly
      const response = await ReportsAPI.getAllBookings({ page: 1, limit: 15000 });
      const bookingsArray = response?.data?.bookings || response?.bookings || [];
      console.log('📊 Incoming Sales Summary API Booking Data:', bookingsArray);
      return bookingsArray;
    } catch (error) {
      console.error('❌ Error fetching sales summary:', error);
      return rejectWithValue(error?.message || 'Failed to fetch sales summary');
    }
  }
);

const initialState = {
  rawBookings: [],
  status: 'idle',
  loading: false,
  error: null,
  lastFetched: null,
  filterBy: 'service'
};

const salesSummarySlice = createSlice({
  name: 'salesSummary',
  initialState,
  reducers: {
    setFilterBy: (state, action) => {
      state.filterBy = action.payload;
    },
    clearSalesSummary: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesSummary.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        state.error = null;
        state.rawBookings = action.payload ?? [];
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchSalesSummary.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Failed to fetch sales summary';
      });
  }
});

export const { setFilterBy, clearSalesSummary } = salesSummarySlice.actions;

// Selectors
export const selectSalesSummaryRawBookings = (state) => state.salesSummary.rawBookings;
export const selectSalesSummaryLoading = (state) => state.salesSummary.loading;
export const selectSalesSummaryStatus = (state) => state.salesSummary.status;
export const selectSalesSummaryError = (state) => state.salesSummary.error;
export const selectSalesSummaryFilterBy = (state) => state.salesSummary.filterBy;
export const selectSalesSummaryLastFetched = (state) => state.salesSummary.lastFetched;

export default salesSummarySlice.reducer;