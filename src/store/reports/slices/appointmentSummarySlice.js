import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const toISO = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizeBooking = (booking) => {
  const services = (booking?.services ?? []).map(s => ({
    name: s?.service?.name ?? 'Unknown Service',
    employeeName: s?.employee?.user?.fullName ?? 'Unassigned',
    employeeId: s?.employee?._id ?? s?.employee?.id ?? null,
    price: Number(s?.price ?? 0),
    duration: Number(s?.duration ?? 0)
  }));

  return {
    id: booking?._id ?? booking?.id ?? null,
    appointmentDate: toISO(booking?.appointmentDate ?? booking?.createdAt),
    client: {
      id: booking?.client?._id ?? null,
      fullName: booking?.client?.fullName ?? 'Unknown Client'
    },
    services,
    totalAmount: Number(booking?.finalAmount ?? booking?.totalAmount ?? 0),
    status: (booking?.status ?? 'confirmed').toLowerCase(),
    bookingSource: (booking?.bookingSource ?? 'website').toLowerCase(),
    bookingNumber: booking?.bookingNumber ?? '',
    createdAt: toISO(booking?.createdAt)
  };
};

const isInDateRange = (appointmentDate, dateRange) => {
  if (!dateRange?.start || !dateRange?.end) return true;
  if (!appointmentDate) return false;
  
  const apptDate = new Date(appointmentDate);
  const start = new Date(dateRange.start);
  const end = new Date(`${dateRange.end}T23:59:59`);
  
  return !Number.isNaN(apptDate.getTime()) && apptDate >= start && apptDate <= end;
};

const calculateMetrics = (bookings, allBookingsInRange) => {
  const totalBookings = bookings.length;
  if (totalBookings === 0) {
    return {
      appointments: 0,
      services: 0,
      percentRequested: 0,
      totalApptValue: 0,
      averageApptValue: 0,
      percentOnline: 0,
      percentCancelled: 0,
      percentNoShow: 0,
      totalClients: 0,
      newClients: 0,
      percentNewClients: 0,
      percentReturningClients: 0
    };
  }

  const serviceCount = bookings.reduce((sum, b) => sum + b.services.length, 0);
  const totalValue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const onlineCount = bookings.filter(b => b.bookingSource === 'fresha').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
  const noShowCount = bookings.filter(b => b.status === 'no-show' || b.status === 'no show').length;

  // Unique clients in this group
  const clientIds = new Set();
  bookings.forEach(b => {
    if (b.client.id) clientIds.add(b.client.id);
  });
  const uniqueClients = clientIds.size;

  // New clients: clients whose first booking (globally in date range) is in this group
  const allClientFirstBookings = new Map();
  const sortedAllBookings = [...allBookingsInRange].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  
  sortedAllBookings.forEach(b => {
    if (b.client.id && !allClientFirstBookings.has(b.client.id)) {
      allClientFirstBookings.set(b.client.id, b.id);
    }
  });

  // Count how many of this group's bookings are first bookings
  let newClientsCount = 0;
  const groupClientFirstBooking = new Map();
  const sortedGroupBookings = [...bookings].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  
  sortedGroupBookings.forEach(b => {
    if (b.client.id && !groupClientFirstBooking.has(b.client.id)) {
      groupClientFirstBooking.set(b.client.id, b.id);
      // Check if this is their first booking globally in the date range
      if (allClientFirstBookings.get(b.client.id) === b.id) {
        newClientsCount++;
      }
    }
  });

  // % requested relative to total bookings in range
  const totalInRange = allBookingsInRange.length;
  const percentRequested = totalInRange > 0 ? Number(((totalBookings / totalInRange) * 100).toFixed(1)) : 0;

  return {
    appointments: totalBookings,
    services: serviceCount,
    percentRequested,
    totalApptValue: Number(totalValue.toFixed(2)),
    averageApptValue: Number((totalValue / totalBookings).toFixed(2)),
    percentOnline: Number(((onlineCount / totalBookings) * 100).toFixed(1)),
    percentCancelled: Number(((cancelledCount / totalBookings) * 100).toFixed(1)),
    percentNoShow: Number(((noShowCount / totalBookings) * 100).toFixed(1)),
    totalClients: uniqueClients,
    newClients: newClientsCount,
    percentNewClients: uniqueClients > 0 ? Number(((newClientsCount / uniqueClients) * 100).toFixed(1)) : 0,
    percentReturningClients: uniqueClients > 0 ? Number((((uniqueClients - newClientsCount) / uniqueClients) * 100).toFixed(1)) : 0
  };
};

// Add this enhanced logging to buildAppointmentSummary in appointmentSummarySlice.js

export const buildAppointmentSummary = (rawBookings = [], dateRange = null, groupBy = 'team-member') => {
  console.log('Building summary:', { 
    totalBookings: rawBookings.length, 
    dateRange, 
    groupBy 
  });
  
  // Filter by date range
  const filteredBookings = rawBookings.filter(b => isInDateRange(b.appointmentDate, dateRange));

  console.log('Filtered bookings:', filteredBookings.length);

  if (filteredBookings.length === 0) {
    console.warn('No bookings found in date range');
    return [];
  }

  // Calculate total row
  const totalMetrics = calculateMetrics(filteredBookings, filteredBookings);
  const totalRow = {
    label: 'Total',
    type: 'total',
    ...totalMetrics
  };

  // Group bookings based on groupBy type
  const groups = new Map();

  filteredBookings.forEach(booking => {
    switch (groupBy) {
      case 'team-member':
        // Each service in a booking can have a different team member
        booking.services.forEach(service => {
          const key = service.employeeName || 'Unassigned';
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key).push({
            ...booking,
            services: [service],
            totalAmount: service.price
          });
        });
        break;

      case 'service':
        booking.services.forEach(service => {
          const key = service.name || 'Unknown Service';
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key).push({
            ...booking,
            services: [service],
            totalAmount: service.price
          });
        });
        break;

      case 'channel':
        const channelKey = booking.bookingSource 
          ? (booking.bookingSource.charAt(0).toUpperCase() + booking.bookingSource.slice(1))
          : 'Unknown';
        if (!groups.has(channelKey)) {
          groups.set(channelKey, []);
        }
        groups.get(channelKey).push(booking);
        break;

      case 'status':
        const statusKey = booking.status 
          ? (booking.status.charAt(0).toUpperCase() + booking.status.slice(1))
          : 'Unknown';
        if (!groups.has(statusKey)) {
          groups.set(statusKey, []);
        }
        groups.get(statusKey).push(booking);
        break;

      default:
        console.warn('Unknown groupBy type:', groupBy);
        const defaultKey = 'Unknown';
        if (!groups.has(defaultKey)) {
          groups.set(defaultKey, []);
        }
        groups.get(defaultKey).push(booking);
    }
  });

  console.log('Groups created:', {
    groupBy,
    groupNames: Array.from(groups.keys()),
    groupCount: groups.size
  });

  // Calculate metrics per group
  const summaryRows = Array.from(groups.entries())
    .map(([label, bookings]) => {
      const metrics = calculateMetrics(bookings, filteredBookings);
      console.log(`Group "${label}":`, metrics);
      return {
        label,
        type: groupBy,
        ...metrics
      };
    })
    .sort((a, b) => b.appointments - a.appointments);

  const result = [totalRow, ...summaryRows];
  console.log('Final summary:', {
    totalRows: result.length,
    firstRow: result[0], 
    sampleDataRow: result[1]
  });
  
  return result;
};

export const fetchAppointmentSummary = createAsyncThunk(
  'appointmentSummary/fetch',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching appointment summary...');
      const response = await ReportsAPI.getAllBookings();
      const bookings = response?.data?.bookings ?? response?.bookings ?? [];
      console.log('Fetched bookings:', bookings.length);
      const normalized = bookings.map(normalizeBooking);
      console.log('Normalized bookings:', normalized.length);
      return normalized;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Failed to load appointment summary';
      return rejectWithValue(message);
    }
  }
);

const appointmentSummarySlice = createSlice({
  name: 'appointmentSummary',
  initialState: {
    rawBookings: [],
    status: 'idle',
    error: null,
    fetchedAt: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointmentSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAppointmentSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rawBookings = action.payload ?? [];
        state.fetchedAt = Date.now();
      })
      .addCase(fetchAppointmentSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load appointment summary';
        state.rawBookings = [];
      });
  }
});

export default appointmentSummarySlice.reducer;