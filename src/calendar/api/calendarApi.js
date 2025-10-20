import api from '../../Service/Api';
import { Base_url } from '../../Service/Base_url';

// Beginner-friendly API wrappers. They return data or throw an error so callers can handle it.
export const fetchServices = async () => {
  const res = await api.get(`${Base_url}/bookings/services`);
  if (!res || !res.data) throw new Error('Failed to fetch services');
  return res.data.data?.services || [];
};

export const fetchEmployees = async () => {
  const res = await api.get(`${Base_url}/employees`);
  return res.data?.data?.employees || [];
};

export const fetchAppointmentsForDate = async (dateIso) => {
  // Example endpoint - adjust to real API
  const res = await api.get(`${Base_url}/bookings?date=${dateIso}`);
  return res.data?.data || {};
};

export const fetchTimeSlots = async (employeeId, serviceId, dateIso) => {
  const res = await api.get(`${Base_url}/employees/${employeeId}/timeslots?serviceId=${serviceId}&date=${dateIso}`);
  return res.data?.data?.timeSlots || [];
};
