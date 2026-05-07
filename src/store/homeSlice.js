import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../Service/Api';

const formatDateLabel = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

const buildLast7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - i);
    days.push(dt);
  }
  return days;
};

const formatDashboardAppointment = (booking) => {
  const dt = new Date(booking.appointmentDate);
  return {
    originalDate: dt,
    date: dt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
    month: dt.toLocaleDateString('en-GB', { month: 'short' }),
    time: dt.toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: booking.status,
    title: booking.services?.map((s) => s?.service?.name).join(', '),
    type: booking.services?.map((s) => s?.type).join(', '),
    payment: booking.paymentMethod || '',
    price: booking.finalAmount ? `AED ${booking.finalAmount}` : '',
    location: booking.location || '',
    appointmentDateTime: dt,
  };
};

const isSameDay = (dateA, dateB) =>
  dateA.getDate() === dateB.getDate() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getFullYear() === dateB.getFullYear();

const calculateTeamMemberRevenue = (bookings, empId, rangeStart, rangeEnd) =>
  bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.appointmentDate);
      return (
        bookingDate >= rangeStart &&
        bookingDate <= rangeEnd &&
        booking.status === 'completed' &&
        booking.services?.some((service) => {
          if (!service.employee) return false;
          if (typeof service.employee === 'string') return service.employee === empId;
          if (service.employee._id) return service.employee._id.toString() === empId;
          return false;
        })
      );
    })
    .reduce((sum, booking) => {
      const employeeServices = booking.services.filter((service) => {
        if (!service.employee) return false;
        if (typeof service.employee === 'string') return service.employee === empId;
        return service.employee._id?.toString() === empId;
      });

      if (!employeeServices.length) return sum;

      if (booking.finalAmount !== undefined && booking.finalAmount !== null) {
        const totalServices = booking.services.length || 1;
        const employeeServiceCount = employeeServices.length;
        return sum + (booking.finalAmount / totalServices) * employeeServiceCount;
      }

      return (
        sum +
        employeeServices.reduce((serviceSum, service) => serviceSum + (service.price || 0), 0)
      );
    }, 0);

export const fetchHomeOverview = createAsyncThunk(
  'home/fetchHomeOverview',
  async (_, { rejectWithValue }) => {
    try {
      const [dashboardRes, analyticsRes, revenueRes, bookingsRes, employeesRes] =
        await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics/bookings'),
          api.get('/admin/analytics/revenue?period=daily'),
          api.get('/bookings/admin/all?limit=10000'),
          api.get('/employees?limit=10000'),
        ]);

      const bookings = bookingsRes.data?.data?.bookings || [];
      const analytics = analyticsRes.data?.data || {};
      const revenueData = revenueRes.data?.data?.revenueData || [];
      const employees = employeesRes.data?.data?.employees || [];
      const popularServices = analytics.popularServices || [];

      const last7Days = buildLast7Days();
      const salesGraph = last7Days.map((day) => {
        const raw = revenueData.find((item) => {
          if (!item._id) return false;
          const itemDate = new Date(item._id.year, item._id.month - 1, item._id.day);
          return itemDate.toDateString() === day.toDateString();
        });

        return {
          name: formatDateLabel(day),
          appointments: raw?.bookings || 0,
          value: raw?.revenue || 0,
        };
      });

      const totalRevenue = salesGraph.reduce((sum, item) => sum + (item.value || 0), 0);
      const totalBookings = salesGraph.reduce((sum, item) => sum + (item.appointments || 0), 0);

      const formattedBookings = bookings.map(formatDashboardAppointment).sort(
        (a, b) => b.appointmentDateTime - a.appointmentDateTime,
      );

      const today = new Date();
      const todaysAppointments = formattedBookings.filter((appt) =>
        isSameDay(appt.originalDate, today),
      );

      const upcomingAppointments = formattedBookings.filter((appt) => {
        const apptDate = appt.originalDate;
        const startDay = new Date(today);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(startDay);
        endDay.setDate(endDay.getDate() + 7);
        endDay.setHours(23, 59, 59, 999);
        return apptDate >= startDay && apptDate <= endDay;
      });

      const topServices = popularServices.map((service) => ({
        service: service.serviceName,
        thisMonth: service.bookings,
        lastMonth: service.revenue,
      }));

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const thisMonthStart = new Date(currentYear, currentMonth, 1);
      const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

      const topTeamMembers = employees
        .map((emp) => {
          const empId = emp._id?.toString();
          if (!empId) return null;

          return {
            name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || 'Unknown',
            thisMonth: calculateTeamMemberRevenue(bookings, empId, thisMonthStart, thisMonthEnd),
            lastMonth: calculateTeamMemberRevenue(bookings, empId, lastMonthStart, lastMonthEnd),
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.thisMonth - a.thisMonth)
        .map((member) => ({
          name: member.name,
          thisMonth: `AED ${member.thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          lastMonth: `AED ${member.lastMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        }));

      return {
        salesSummary: {
          totalRevenue,
          totalBookings,
          graphData: salesGraph,
        },
        upcomingAppointments,
        activityAppointments: formattedBookings,
        todaysAppointments,
        topServices,
        topTeamMembers,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to load home overview',
      );
    }
  },
);

const homeSlice = createSlice({
  name: 'home',
  initialState: {
    loading: false,
    error: null,
    salesSummary: {
      totalRevenue: 0,
      totalBookings: 0,
      graphData: [],
    },
    upcomingAppointments: [],
    activityAppointments: [],
    todaysAppointments: [],
    topServices: [],
    topTeamMembers: [],
  },
  reducers: {
    clearHomeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.salesSummary = action.payload.salesSummary;
        state.upcomingAppointments = action.payload.upcomingAppointments;
        state.activityAppointments = action.payload.activityAppointments;
        state.todaysAppointments = action.payload.todaysAppointments;
        state.topServices = action.payload.topServices;
        state.topTeamMembers = action.payload.topTeamMembers;
      })
      .addCase(fetchHomeOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load home overview';
      });
  },
});

export const { clearHomeError } = homeSlice.actions;

export const selectHomeLoading = (state) => state.home.loading;
export const selectHomeError = (state) => state.home.error;
export const selectHomeSalesSummary = (state) => state.home.salesSummary;
export const selectHomeUpcomingAppointments = (state) => state.home.upcomingAppointments;
export const selectHomeActivityAppointments = (state) => state.home.activityAppointments;
export const selectHomeTodaysAppointments = (state) => state.home.todaysAppointments;
export const selectHomeTopServices = (state) => state.home.topServices;
export const selectHomeTopTeamMembers = (state) => state.home.topTeamMembers;

export default homeSlice.reducer;
