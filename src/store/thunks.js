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

// Generate unique avatar color for each staff member
const getAvatarColor = (employeeId) => {
  const colors = [
    '#818cf8', // Indigo
    '#f472b6', // Pink
    '#a78bfa', // Purple
    '#fb923c', // Orange
    '#34d399', // Emerald
    '#60a5fa', // Blue
    '#fbbf24', // Amber
    '#f87171', // Red
    '#2dd4bf', // Teal
    '#c084fc', // Purple light
    '#fb7185', // Rose
    '#4ade80', // Green
  ];
  if (!employeeId) return colors[0];
  const hash = Array.from(employeeId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

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

    const [employeesResponse, calendarViewResponse, servicesResponse] = await Promise.all([
      api.get(`${Base_url}/employees?weekStartDate=${startDateParam}`),
      api.get(`${Base_url}/bookings/calendar/view?startDate=${startDateParam}&endDate=${endDateParam}`),
      api.get(`${Base_url}/services`)
    ]);

    if (calendarViewResponse.data.success && employeesResponse.data.success) {
      const transformedAppointments = calendarViewResponse.data.data || {};
      const employees = employeesResponse.data.data.employees || [];

      const activeEmployees = employees.filter(emp => emp.isActive !== false);
      const transformedEmployees = activeEmployees.map(emp => ({
        id: emp._id,
        name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim(),
        position: emp.position || emp.department || 'Staff',
        avatar: emp.user?.avatar || emp.avatar,
        avatarColor: getAvatarColor(emp._id),
        unavailablePeriods: emp.unavailablePeriods || [],
        isActive: emp.isActive !== false,
        workSchedule: emp.workSchedule || {}
      }));

      // Add status specific colors to appointments
      Object.keys(transformedAppointments).forEach(empId => {
        Object.keys(transformedAppointments[empId]).forEach(slotKey => {
          const appt = transformedAppointments[empId][slotKey];
          appt.color = getAppointmentColorByStatus(appt.status || 'booked');
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
    const res = await api.get(`${Base_url}/employees/${employeeId}/timeslots?serviceId=${serviceId}&date=${date.toISOString().slice(0, 10)}`);
    if (res.data && res.data.success) return res.data.data.timeSlots || [];
    return [];
  } catch (err) {
    return rejectWithValue(err.message || String(err));
  }
});
export const fetchBookingPreviewThunk = createAsyncThunk('adminBooking/fetchPreview', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required.');

    const res = await api.post(`${Base_url}/bookings/admin/preview`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error(res.data.message || 'Preview failed');
  } catch (err) {
    return rejectWithValue(err.message || String(err));
  }
});

export const createBookingThunk = createAsyncThunk('adminBooking/create', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required.');

    const res = await api.post(`${Base_url}/bookings`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error(res.data.message || 'Booking creation failed');
  } catch (err) {
    return rejectWithValue(err.message || String(err));
  }
});
