import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setSelectedService, setBookingStep, setAvailableProfessionals, setSelectedProfessional, setAvailableTimeSlots,
  setClientInfo, setSelectedClient, setIsAddingNewClient, setClientSearchResults, setClientSearchQuery,
  setAppliedMembership, setMembershipDiscountAmount
} from './adminBookingSlice';
import { 
  getValidTimeSlotsForProfessional, 
  getAvailableProfessionalsWithAccumulatedBookings 
} from '../Clientsidepage/helpers/selectCalendarHelpers';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';

/**
 * Handle service selection logic
 */
export const selectServiceThunk = createAsyncThunk(
  'adminBooking/handleServiceSelect',
  async (service, { dispatch, getState }) => {
    const state = getState();
    const { selection, navigation } = state.adminBooking;
    const { bookingDefaults } = navigation;
    const { currentDate } = state.calendar; // Assuming we add currentDate to calendarSlice or similar
    const selectedBookingDate = selection.date || new Date(); 
    const { employees } = state.employees;
    const { byEmployee: appointments } = state.appointments;
    const { multipleAppointments } = state.bookingSession;

    dispatch(setSelectedService(service));
    dispatch(setAvailableProfessionals([]));
    dispatch(setAvailableTimeSlots([]));

    const bookingDate = selectedBookingDate;

    if (navigation.defaults?.isDirectEmployeeSelection) {
      dispatch(setBookingStep(3));
      dispatch(setAvailableProfessionals([navigation.defaults.professional]));
      dispatch(setSelectedProfessional(navigation.defaults.professional));

      const slots = getValidTimeSlotsForProfessional(
        navigation.defaults.professional, 
        bookingDate, 
        service.duration, 
        appointments
      );
      dispatch(setAvailableTimeSlots(slots));
    } else {
      dispatch(setBookingStep(2));
      const professionals = getAvailableProfessionalsWithAccumulatedBookings(
        service, 
        bookingDate, 
        employees, 
        appointments, 
        multipleAppointments
      );
      dispatch(setAvailableProfessionals(professionals));
    }
  }
);

/**
 * Handle professional selection logic
 */
export const selectProfessionalThunk = createAsyncThunk(
  'adminBooking/handleProfessionalSelect',
  async (prof, { dispatch, getState }) => {
    const state = getState();
    const { selection } = state.adminBooking;
    const selectedService = selection.service;
    const selectedBookingDate = selection.date || new Date();
    const { byEmployee: appointments } = state.appointments;

    dispatch(setSelectedProfessional(prof));
    dispatch(setBookingStep(3));

    const slots = getValidTimeSlotsForProfessional(
      prof, 
      selectedBookingDate, 
      selectedService.duration, 
      appointments
    );
    dispatch(setAvailableTimeSlots(slots));
  }
);

/**
 * Search clients thunk
 */
export const searchClientsThunk = createAsyncThunk(
  'adminBooking/searchClients',
  async (query, { dispatch }) => {
    if (!query || query.length < 2) {
      dispatch(setClientSearchResults([]));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`${Base_url}/admin/clients?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        dispatch(setClientSearchResults(res.data.data.clients || []));
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }
);
export const handleBookingDateSelectThunk = createAsyncThunk(
  'adminBooking/handleDateSelect',
  async (day, { dispatch }) => {
    dispatch(setSelectedDate(day.date));
    // Clear selections when date changes to force fresh availability
    dispatch(setSelectedProfessional(null));
    dispatch(setSelectedTimeSlot(null));
    dispatch(setAvailableProfessionals([]));
    dispatch(setAvailableTimeSlots([]));
    // Close the sub-date picker
    // This typically needs a local UI state but we can trigger it via a status or if it's in Redux
  }
);

export const clearClientSelectionThunk = createAsyncThunk(
  'adminBooking/clearClientSelection',
  async (_, { dispatch }) => {
    dispatch(setSelectedClient(null));
    dispatch(setClientInfo({ name: '', email: '', phone: '' }));
    dispatch(setIsAddingNewClient(false));
  }
);

export const startAddNewClientThunk = createAsyncThunk(
  'adminBooking/startAddNewClient',
  async (_, { dispatch }) => {
    dispatch(setIsAddingNewClient(true));
    dispatch(setSelectedClient(null));
    dispatch(setClientInfo({ name: '', email: '', phone: '' }));
  }
);

/**
 * Load client benefits (Memberships/Giftcards)
 */
export const loadClientBenefitsThunk = createAsyncThunk(
  'adminBooking/loadBenefits',
  async (clientId, { dispatch }) => {
    if (!clientId) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`${Base_url}/admin/clients/${clientId}/benefits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.success) {
        // Handle benefit loading here if needed or return to component
        return res.data.data;
      }
    } catch (err) {
      console.error('Load benefits error:', err);
    }
  }
);
