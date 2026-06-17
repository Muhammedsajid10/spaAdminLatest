import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '../../../Service/api/reportsApi';

const toISO = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const normalizeBooking = (booking) => {
  let servicesList = booking?.services ?? [];
  
  // If no services array, but there is a root service object, create a synthetic service entry
  if (servicesList.length === 0 && booking?.service) {
      servicesList = [{
          service: booking.service,
          employee: booking.employee || booking.assignedEmployee,
          price: booking.totalAmount || booking.amount,
          duration: booking.duration
      }];
  }

  // Fallback employee from booking level
  const bookingEmployee = booking?.employee || booking?.assignedEmployee;
  const bookingEmployeeName = bookingEmployee?.name ?? bookingEmployee?.fullName ?? 
                              (bookingEmployee?.firstName ? `${bookingEmployee.firstName} ${bookingEmployee.lastName || ''}`.trim() : null);

  const services = servicesList.map(s => {
    const emp = s?.employee;
    let empName = emp?.name ?? emp?.fullName ?? emp?.user?.fullName ?? emp?.user?.name ?? 
                  (emp?.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : null);
    
    // Fallback to booking level employee if not found on service
    if (!empName && bookingEmployeeName) {
        empName = bookingEmployeeName;
    }

    return {
      name: s?.service?.name ?? 'Unknown Service',
      employeeName: empName ?? 'Unassigned',
      employeeId: emp?._id ?? emp?.id ?? bookingEmployee?._id ?? bookingEmployee?.id ?? null,
      price: Number(s?.price ?? 0),
      duration: Number(s?.duration ?? 0)
    };
  });

  return {
    id: booking?._id ?? booking?.id ?? null,
    appointmentDate: toISO(booking?.appointmentDate ?? booking?.createdAt),
    client: {
      id: booking?.client?._id ?? null,
      fullName: booking?.client?.fullName ?? booking?.client?.name ?? 'Unknown Client'
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
  if (Number.isNaN(apptDate.getTime())) return false;
  const year = apptDate.getFullYear();
  const month = String(apptDate.getMonth() + 1).padStart(2, '0');
  const day = String(apptDate.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;
  
  return localDateStr >= dateRange.start && localDateStr <= dateRange.end;
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
  // Filter by date range
  const filteredBookings = rawBookings.filter(b => isInDateRange(b.appointmentDate, dateRange));

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

  // Calculate metrics per group
  const summaryRows = Array.from(groups.entries())
    .map(([label, bookings]) => {
    const metrics = calculateMetrics(bookings, filteredBookings);
    return {
      label,
      type: groupBy,
      ...metrics
    };
  })
    .sort((a, b) => b.appointments - a.appointments);

  const result = [totalRow, ...summaryRows];

  return result;
};

export const fetchAppointmentSummary = createAsyncThunk(
  'appointmentSummary/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ReportsAPI.getAllBookings();
      const bookings = response?.data?.bookings ?? response?.bookings ?? [];
      if (bookings.length > 0) {
        if (bookings[0].services && bookings[0].services.length > 0) {}
      }
      const normalized = bookings.map(normalizeBooking);
      if (normalized.length > 0) {}
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