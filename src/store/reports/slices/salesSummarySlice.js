import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

// Simple function to extract sales data from bookings
export const normalizeSalesData = (bookings) => {
  console.log('📊 Simple Sales Summary from Bookings');
  
  // Get bookings array
  const bookingsArray = bookings?.data?.bookings || bookings?.bookings || [];
  console.log(`📋 Found ${bookingsArray.length} bookings`);
  
  // Log first booking to see structure
  if (bookingsArray.length > 0) {
    console.log('📝 First booking:', bookingsArray[0]);
    console.log('📝 First booking service:', bookingsArray[0]?.service);
    console.log('📝 First booking client:', bookingsArray[0]?.client);
    console.log('📝 First booking employee:', bookingsArray[0]?.employee);
  }

  // Simple tracking objects
  const serviceData = {};
  const clientData = {};
  const teamMemberData = {};

  bookingsArray.forEach((booking, index) => {
    // Skip non-completed bookings
    if (booking.status && !['completed', 'confirmed'].includes(booking.status.toLowerCase())) {
      return;
    }

    // Get service info from booking
    const service = booking.service || (booking.services && booking.services[0]?.service) || {};
    const serviceName = service.name || 'Unknown Service';
    
    // Get client info from booking
    const client = booking.client || {};
    const clientName = client.fullName || client.name || 'Unknown Client';
    
    // Get team member info from booking or service
    const teamMember = booking.employee || booking.assignedEmployee || 
                      (booking.services && booking.services[0]?.employee) || {};
    const teamMemberName = teamMember.name || teamMember.fullName || 'Unassigned';
    
    // Get price from booking or service
    const price = Number(booking.totalAmount || booking.finalAmount || booking.amount || service.price || 0);
    
    console.log(`Booking ${index + 1}: ${serviceName} for ${clientName} by ${teamMemberName} - $${price}`);
    
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

  const services = Object.values(serviceData);
  const clients = Object.values(clientData);
  const teamMembers = Object.values(teamMemberData);

  console.log(`✅ Summary: ${services.length} services, ${clients.length} clients, ${teamMembers.length} team members`);
  console.log('🔍 Sample service data:', services[0]);
  console.log('🔍 Sample client data:', clients[0]);
  console.log('🔍 Sample team member data:', teamMembers[0]);

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
  async ({ dateRange = null, filterBy = 'service' } = {}) => {
    console.log('🚀 Fetching Sales Summary data...');
    
    try {
      // Fetch all bookings directly
      const response = await ReportsAPI.getAllBookings({ page: 1, limit: 10000 });
      console.log('📡 Bookings fetched:', response?.data?.bookings?.length || 0);

      // Simple processing of bookings
      const normalizedData = normalizeSalesData(response);      console.log('✅ Sales Summary data processed successfully');
      
      return {
        ...normalizedData,
        filterBy,
        dateRange,
        rawData: response
      };
    } catch (error) {
      console.error('❌ Error fetching sales summary:', error);
      throw error;
    }
  }
);

const initialState = {
  data: [],
  byService: [],
  byClient: [],
  byTeamMember: [],
  services: [],
  clients: [],
  teamMembers: [],
  loading: false,
  error: null,
  lastFetched: null,
  filterBy: 'service', // 'service', 'client', or 'team-member'
  dateRange: null
};

const salesSummarySlice = createSlice({
  name: 'salesSummary',
  initialState,
  reducers: {
    setFilterBy: (state, action) => {
      console.log('🔥 Redux setFilterBy called with:', action.payload);
      console.log('🔥 Current state before update:', {
        currentFilterBy: state.filterBy,
        dataLength: state.data?.length,
        byServiceLength: state.byService?.length,
        byClientLength: state.byClient?.length,
        byTeamMemberLength: state.byTeamMember?.length
      });
      
      state.filterBy = action.payload;
      // Update main data array based on filter
      switch (action.payload) {
        case 'client':
          state.data = state.byClient;
          console.log('🔥 Switched to client data, length:', state.byClient?.length);
          break;
        case 'team-member':
          state.data = state.byTeamMember;
          console.log('🔥 Switched to team member data, length:', state.byTeamMember?.length);
          break;
        case 'service':
        default:
          state.data = state.byService;
          console.log('🔥 Switched to service data, length:', state.byService?.length);
          break;
      }
      
      console.log('🔥 State after update:', {
        newFilterBy: state.filterBy,
        newDataLength: state.data?.length
      });
    },
    clearSalesSummary: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.byService = action.payload.byService;
        state.byClient = action.payload.byClient;
        state.byTeamMember = action.payload.byTeamMember;
        state.services = action.payload.services;
        state.clients = action.payload.clients;
        state.teamMembers = action.payload.teamMembers;
        state.filterBy = action.payload.filterBy;
        state.dateRange = action.payload.dateRange;
        state.lastFetched = new Date().toISOString();
        
        // Set main data array based on current filter
        switch (action.payload.filterBy) {
          case 'client':
            state.data = state.byClient;
            break;
          case 'team-member':
            state.data = state.byTeamMember;
            break;
          case 'service':
          default:
            state.data = state.byService;
            break;
        }
      })
      .addCase(fetchSalesSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales summary';
      });
  }
});

export const { setFilterBy, clearSalesSummary } = salesSummarySlice.actions;

// Selectors
export const selectSalesSummaryData = (state) => state.salesSummary.data;
export const selectSalesSummaryByService = (state) => state.salesSummary.byService;
export const selectSalesSummaryByClient = (state) => state.salesSummary.byClient;
export const selectSalesSummaryByTeamMember = (state) => state.salesSummary.byTeamMember;
export const selectSalesSummaryServices = (state) => state.salesSummary.services;
export const selectSalesSummaryClients = (state) => state.salesSummary.clients;
export const selectSalesSummaryTeamMembers = (state) => state.salesSummary.teamMembers;
export const selectSalesSummaryLoading = (state) => state.salesSummary.loading;
export const selectSalesSummaryError = (state) => state.salesSummary.error;
export const selectSalesSummaryFilterBy = (state) => state.salesSummary.filterBy;
export const selectSalesSummaryLastFetched = (state) => state.salesSummary.lastFetched;

export default salesSummarySlice.reducer;