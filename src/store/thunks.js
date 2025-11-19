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
      // ✅ FIX: Use high limit for calendar to get all appointments in date range
      api.get(`${Base_url}/bookings/admin/all?startDate=${startDateParam}&endDate=${endDateParam}&limit=10000`),
      api.get(`${Base_url}/services`)
    ]);

    if (bookingsResponse.data.success && employeesResponse.data.success) {
      const allBookings = bookingsResponse.data.data.bookings || [];
      const employees = employeesResponse.data.data.employees || [];

      console.log('📊 CALENDAR DATA RECEIVED:', {
        totalBookings: allBookings.length,
        totalEmployees: employees.length,
        dateRange: `${startDateParam} to ${endDateParam}`,
        sampleBooking: allBookings[0] ? {
          id: allBookings[0]._id,
          date: allBookings[0].appointmentDate,
          client: allBookings[0].client,
          services: allBookings[0].services?.length
        } : 'No bookings'
      });

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
      
      // Create a helper function to find employee ID by name for Python-created bookings
      const findEmployeeIdByName = (employeeName) => {
        if (!employeeName || typeof employeeName !== 'string') return null;
        
        const matchingEmployee = activeEmployees.find(emp => {
          const empFullName = `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim();
          return empFullName.toLowerCase() === employeeName.toLowerCase() ||
                 emp.user?.firstName?.toLowerCase() === employeeName.toLowerCase() ||
                 empFullName.toLowerCase().includes(employeeName.toLowerCase()) ||
                 employeeName.toLowerCase().includes(empFullName.toLowerCase());
        });
        return matchingEmployee?._id || null;
      };
      
      allBookings.forEach(booking => {
        booking.services?.forEach(service => {
          let employeeId = null;
          
          // Handle different employee data formats
          if (service.employee?._id) {
            // Check if it's a placeholder ObjectId for legacy data
            if (service.employee._id === '000000000000000000000000') {
              // Legacy data with placeholder - try to match by fullName
              employeeId = findEmployeeIdByName(service.employee.fullName || service.employee.user?.firstName);
            } else {
              // Real ObjectId format (API-created bookings) - employee is an object
              employeeId = service.employee._id;
            }
          } else if (typeof service.employee === 'string' && /^[0-9a-fA-F]{24}$/.test(service.employee)) {
            // Check if it's a placeholder ObjectId string
            if (service.employee === '000000000000000000000000') {
              // Placeholder - cannot match, skip this service
              console.warn('⚠️ Placeholder employee ID without name data for booking:', booking._id);
              return;
            }
            // ✅ FIX: Direct ObjectId string format (from createBooking API)
            employeeId = service.employee;
          } else if (typeof service.employee === 'string') {
            // String format (Python-created bookings) - try to match by name
            employeeId = findEmployeeIdByName(service.employee);
          } else if (service.employee?.fullName) {
            // Normalized object format - try to match by fullName
            employeeId = findEmployeeIdByName(service.employee.fullName);
          }
          
          if (!employeeId) {
            console.warn('❌ Could not find employee ID for booking:', booking._id, 'Employee data:', service.employee);
            console.log('Available employees:', activeEmployees.map(emp => ({
              id: emp._id,
              name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim()
            })));
            return;
          }
          
          console.log('✅ Matched employee:', employeeId, 'for booking:', booking._id);
          
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
          // ✅ FIX: Use UTC date extraction to match UTC time
          const localYear = startDateTime.getUTCFullYear();
          const localMonth = String(startDateTime.getUTCMonth() + 1).padStart(2, '0');
          const localDay = String(startDateTime.getUTCDate()).padStart(2, '0');
          const appointmentLocalDate = `${localYear}-${localMonth}-${localDay}`;

          const timeSlot = startISO ? (() => {
            const dt = new Date(startISO);
            // ✅ FIX: Use UTC hours/minutes since backend stores in UTC
            const hours = String(dt.getUTCHours()).padStart(2, '0');
            const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          })() : (service.startTime || '');

          const endTimeLabel = endISO ? (() => {
            const dt = new Date(endISO);
            // ✅ FIX: Use UTC hours/minutes since backend stores in UTC
            const hours = String(dt.getUTCHours()).padStart(2, '0');
            const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          })() : null;

          const slotKey = `${appointmentLocalDate}_${timeSlot}`;

          // Handle normalized client data (both string and object formats)
          let clientDisplayName = 'Client';
          if (booking.client) {
            if (typeof booking.client === 'string') {
              clientDisplayName = booking.client;
            } else if (booking.client._id === '000000000000000000000000') {
              // Legacy data with placeholder - use the preserved name from firstName
              clientDisplayName = booking.client.firstName || booking.client.fullName || 'Unknown Client';
            } else if (booking.client.fullName) {
              clientDisplayName = booking.client.fullName;
            } else if (booking.client.firstName || booking.client.lastName) {
              clientDisplayName = `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim();
            }
          }

          // Handle normalized service data (both string and object formats)
          let serviceName = 'Service';
          if (service.service) {
            if (typeof service.service === 'string') {
              serviceName = service.service;
            } else if (service.service._id === '000000000000000000000000') {
              // Legacy data with placeholder - use the preserved name
              serviceName = service.service.name || 'Unknown Service';
            } else if (service.service.name) {
              serviceName = service.service.name;
            }
          }

          // Handle normalized employee data (both string and object formats)
          let employeeName = 'Employee';
          if (service.employee) {
            if (typeof service.employee === 'string') {
              employeeName = service.employee;
            } else if (service.employee._id === '000000000000000000000000') {
              // Legacy data with placeholder - use the preserved name from fullName
              employeeName = service.employee.fullName || service.employee.user?.firstName || 'Unknown Employee';
            } else if (service.employee.fullName && !/^[0-9a-fA-F]{24}$/.test(service.employee.fullName)) {
              employeeName = service.employee.fullName;
            } else if (service.employee.user) {
              employeeName = `${service.employee.user.firstName || ''} ${service.employee.user.lastName || ''}`.trim();
            } else if (service.employee._id) {
              // If we have an ObjectId, try to find the actual employee name
              const emp = activeEmployees.find(e => e._id === service.employee._id);
              if (emp) {
                employeeName = `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim();
              }
            }
          }

          transformedAppointments[employeeId][slotKey] = {
            client: clientDisplayName,
            service: serviceName,
            employee: employeeName,
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

      console.log('✅ TRANSFORMED APPOINTMENTS:', {
        totalEmployeesWithAppointments: Object.keys(transformedAppointments).length,
        appointmentsByEmployee: Object.entries(transformedAppointments).map(([empId, slots]) => ({
          employeeId: empId,
          appointmentCount: Object.keys(slots).length,
          sampleSlot: Object.keys(slots)[0],
          sampleAppointment: slots[Object.keys(slots)[0]]
        })),
        fullData: transformedAppointments
      });

      console.log('📦 Dispatching to Redux:', {
        employees: transformedEmployees.length,
        appointments: Object.keys(transformedAppointments).length
      });

      dispatch(setEmployees(transformedEmployees));
      dispatch(setTimeSlots(generateTimeSlots('00:00', '23:30', 30)));
      dispatch(setAppointments(transformedAppointments));
      
      console.log('✅ Redux dispatch complete');
      
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
