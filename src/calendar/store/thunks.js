import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../Service/Api';
import { Base_url } from '../../Service/Base_url';
import { setEmployees } from '../../store/employeesSlice';
import { setTimeSlots, setLoading as setCalendarLoading, setError as setCalendarError } from './calendarSlice';
import { setAppointments } from './appointmentsSlice';
import { getAppointmentColorByStatus } from '../uiUtils';
import { setServices, setServicesLoading, setServicesError } from '../../store/servicesSlice';
import { setClients, setClientsLoading, setClientsError } from '../../store/clientsSlice';
import { addAppointmentToSession } from './bookingSessionSlice';
import { formatDateLocal } from '../dateUtils';
import { 
  detectProfessionalConflict, 
  validateBookingAppointment, 
  createAppointmentForSession 
} from '../bookingLogic';

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
            // ObjectId format (API-created bookings)
            employeeId = service.employee._id;
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

          // Handle normalized client data (both string and object formats)
          let clientDisplayName = 'Client';
          if (booking.client) {
            if (typeof booking.client === 'string') {
              clientDisplayName = booking.client;
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
            } else if (service.service.name) {
              serviceName = service.service.name;
            }
          }

          // Handle normalized employee data (both string and object formats)
          let employeeName = 'Employee';
          if (service.employee) {
            if (typeof service.employee === 'string') {
              employeeName = service.employee;
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

// Business Logic Thunk: Add Appointment to Booking Session
export const addAppointmentToBookingSessionThunk = createAsyncThunk(
  'bookingSession/addAppointment',
  async ({ 
    selectedService, 
    selectedProfessional, 
    selectedTimeSlot, 
    bookingDefaults,
    selectedBookingDate,
    currentDate 
  }, { dispatch, getState, rejectWithValue }) => {
    
    try {
      const state = getState();
      const appointments = state.appointments.byEmployee;
      const multipleAppointments = state.bookingSession.multipleAppointments;

      // Validate required fields using business logic
      const validation = validateBookingAppointment(selectedService, selectedProfessional, selectedTimeSlot);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Create appointment object using business logic
      const appointment = createAppointmentForSession({
        selectedService,
        selectedProfessional,
        selectedTimeSlot,
        bookingDefaults,
        selectedBookingDate,
        currentDate
      });

      // Determine the correct booking date
      const finalBookingDate = bookingDefaults?.date || selectedBookingDate || currentDate;

      // Check for conflicts using business logic
      const professionalId = selectedProfessional._id;
      const conflictObj = detectProfessionalConflict(
        professionalId,
        finalBookingDate,
        appointment.timeSlot,
        selectedService.duration,
        appointments,
        multipleAppointments
      );

      if (conflictObj) {
        const professionalName = selectedProfessional.user?.firstName || selectedProfessional.name;
        throw new Error(`Time conflict: ${professionalName} already has a booking at this time. Please select a different slot.`);
      }

      // Final conflict check including the new appointment
      const finalConflictCheck = detectProfessionalConflict(
        selectedProfessional._id,
        finalBookingDate,
        appointment.timeSlot,
        selectedService.duration,
        appointments,
        [...multipleAppointments, appointment]
      );

      if (finalConflictCheck) {
        throw new Error('Time conflict: This professional already has a booking at this time. Please select a different slot.');
      }

      // Dispatch the appointment to Redux store
      dispatch(addAppointmentToSession(appointment));

      return {
        success: true,
        appointment,
        message: `"${selectedService.name}" added to booking session! Total services: ${multipleAppointments.length + 1}`,
        totalServices: multipleAppointments.length + 1
      };

    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add appointment to session');
    }
  }
);