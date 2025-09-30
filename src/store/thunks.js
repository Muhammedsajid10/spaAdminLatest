import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';
import { setEmployees } from './employeesSlice';
import { setTimeSlots, setLoading as setCalendarLoading, setError as setCalendarError } from './calendarSlice';
import { setAppointments } from './appointmentsSlice';
import { getAppointmentColorByStatus } from '../calendar/uiUtils';
import { setServices, setServicesLoading, setServicesError } from './servicesSlice';
import { setClients, setClientsLoading, setClientsError } from './clientsSlice';
import { addAppointmentToSession } from './bookingSessionSlice';

const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  let currentHour = parseInt(startTime.split(':')[0]);
  let currentMinute = parseInt(startTime.split(':')[1]);
  const endHour = parseInt(endTime.split(':')[0]);
  const endMinute = parseInt(endTime.split(':')[1]);

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const hourFormatted = String(currentHour).padStart(2, '0');
    const minuteFormatted = String(currentMinute).padStart(2, '0');
    slots.push(`${hourFormatted}:${minuteFormatted}`);

    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }
  }
  return slots;
};

const formatDateForAPI = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const fetchCalendarThunk = createAsyncThunk('calendar/fetchCalendar', async ({ currentDate, currentView }, { dispatch, rejectWithValue }) => {
  dispatch(setCalendarLoading(true));
  dispatch(setCalendarError(null));
  try {
    // compute date range
    let startDate, endDate;
    if (currentView === 'Day') {
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (currentView === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      startDate = startOfWeek;
      endDate = new Date(startOfWeek);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    const startDateParam = formatDateForAPI(startDate);
    const endDateParam = formatDateForAPI(endDate);

    const [employeesResponse, bookingsResponse, servicesResponse] = await Promise.all([
      api.get(`${Base_url}/employees?weekStartDate=${startDateParam}`),
      api.get(`${Base_url}/bookings/admin/all?startDate=${startDateParam}&endDate=${endDateParam}`),
      api.get(`${Base_url}/services`)
    ]);

    if (bookingsResponse.data.success && employeesResponse.data.success) {
      const allBookings = bookingsResponse.data.data.bookings || [];
      const employees = employeesResponse.data.data.employees || [];

      if (servicesResponse.data && servicesResponse.data.success) {
        // services are not currently stored in Redux in this minimal refactor
      }

      const activeEmployees = employees.filter(emp => emp.isActive !== false);
      const transformedEmployees = activeEmployees.map(emp => ({
        id: emp._id,
        name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim(),
        position: emp.position || emp.department || 'Staff',
        avatar: emp.user?.avatar || emp.avatar,
        avatarColor: '#ccc',
        unavailablePeriods: emp.unavailablePeriods || [],
        isActive: emp.isActive !== false,
        workSchedule: emp.workSchedule || {}
      }));

      const transformedAppointments = {};
      allBookings.forEach(booking => {
        booking.services?.forEach(service => {
          const employeeId = service.employee?._id || service.employee;
          if (!employeeId) return;
          if (!transformedAppointments[employeeId]) transformedAppointments[employeeId] = {};

          const startISO = service.startTime ? String(service.startTime) : (booking.appointmentDate ? String(booking.appointmentDate) : null);
          let endISO = null;
          if (service.endTime) {
            endISO = String(service.endTime);
          } else if (startISO && service.duration) {
            const sDt = new Date(startISO);
            endISO = new Date(sDt.getTime() + (service.duration * 60000)).toISOString();
          }

          const startDateTime = startISO ? new Date(startISO) : new Date();
          const localYear = startDateTime.getUTCFullYear();
          const localMonth = String(startDateTime.getUTCMonth() + 1).padStart(2, '0');
          const localDay = String(startDateTime.getUTCDate()).padStart(2, '0');
          const appointmentLocalDate = `${localYear}-${localMonth}-${localDay}`;

          const timeSlot = startISO ? (() => {
            const dt = new Date(startISO);
            const hours = String(dt.getUTCHours()).padStart(2, '0');
            const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          })() : (service.startTime || '');

          const endTimeLabel = endISO ? (() => {
            const dt = new Date(endISO);
            const hours = String(dt.getUTCHours()).padStart(2, '0');
            const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          })() : null;

          const slotKey = `${appointmentLocalDate}_${timeSlot}`;

          transformedAppointments[employeeId][slotKey] = {
            client: `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''}`.trim(),
            service: service.service?.name || service.name || 'Service',
            duration: service.duration || 30,
            color: getAppointmentColorByStatus(service.status || booking.status || 'booked'),
            date: appointmentLocalDate,
            bookingId: booking._id,
            status: service.status || booking.status || 'confirmed',
            serviceEntryId: service._id,
            isMainSlot: true,
            startISO,
            endISO,
            startTime: timeSlot,
            endTime: endTimeLabel,
            displayStartTime: timeSlot,
            displayEndTime: endTimeLabel,
            time: timeSlot,
            timeSlot: timeSlot
          };
        });
      });

      dispatch(setEmployees(transformedEmployees));
      dispatch(setTimeSlots(generateTimeSlots('00:00', '23:30', 30)));
      dispatch(setAppointments(transformedAppointments));
      return { success: true };
    }

    throw new Error('Failed to fetch calendar data');
  } catch (err) {
    dispatch(setCalendarError(err.message || String(err)));
    return rejectWithValue(err.message || String(err));
  } finally {
    dispatch(setCalendarLoading(false));
  }
});

export default fetchCalendarThunk;

export const fetchServicesThunk = createAsyncThunk('services/fetch', async (_, { dispatch, rejectWithValue }) => {
  dispatch(setServicesLoading(true));
  try {
    const res = await api.get(`${Base_url}/services`);
    if (res.data && res.data.success) {
      dispatch(setServices(res.data.data.services || []));
      return res.data.data.services || [];
    }
    throw new Error('Failed to fetch services');
  } catch (err) {
    dispatch(setServicesError(err.message || String(err)));
    return rejectWithValue(err.message || String(err));
  } finally {
    dispatch(setServicesLoading(false));
  }
});

export const fetchClientsThunk = createAsyncThunk('clients/fetch', async (_, { dispatch, rejectWithValue }) => {
  dispatch(setClientsLoading(true));
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token');
    const res = await api.get(`${Base_url}/admin/clients`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data && res.data.success) {
      dispatch(setClients(res.data.data.clients || []));
      return res.data.data.clients || [];
    }
    throw new Error('Failed to fetch clients');
  } catch (err) {
    dispatch(setClientsError(err.message || String(err)));
    return rejectWithValue(err.message || String(err));
  } finally {
    dispatch(setClientsLoading(false));
  }
});

export const fetchProfessionalsThunk = createAsyncThunk('professionals/fetch', async ({ date }, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.get(`${Base_url}/employees`);
    if (res.data && res.data.success) {
      return res.data.data.employees || [];
    }
    throw new Error('Failed to fetch professionals');
  } catch (err) {
    return rejectWithValue(err.message || String(err));
  }
});

export const fetchBookingTimeSlotsThunk = createAsyncThunk('timeslots/fetch', async ({ employeeId, serviceId, date }, { dispatch, rejectWithValue }) => {
  try {
    // For this minimal migration, call the existing SelectCalendar handlers was previously used to compute shift-based slots.
    // We'll rely on a simple API route if available, fallback to an empty list.
    const res = await api.get(`${Base_url}/employees/${employeeId}/timeslots?serviceId=${serviceId}&date=${date.toISOString().slice(0,10)}`);
    if (res.data && res.data.success) return res.data.data.timeSlots || [];
    return [];
  } catch (err) {
    return rejectWithValue(err.message || String(err));
  }
});
