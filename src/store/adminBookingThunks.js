import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setAppliedMembership, setMembershipDiscountAmount, setBookingStatus,
  setSelectedService, setSelectedProfessional, setSelectedTimeSlot, 
  setAvailableServices, setAvailableProfessionals, setAvailableTimeSlots,
  setSelectedClient, setIsAddingNewClient, setClientSearchResults, setClientSearchQuery, setClientInfo,
  setSelectedDate, setStep as setBookingStep,
  setAvailableMemberships, setAvailableGiftCards, setBenefitsStatus
} from './adminBookingSlice';
import { addAppointmentToSession } from './bookingSessionSlice';
import { 
  getAvailableProfessionalsWithAccumulatedBookings,
  getAvailableTimeSlotsWithAccumulatedBookings,
  detectProfessionalConflict,
  formatDateLocal
} from '../Clientsidepage/helpers/selectCalendarHelpers';
import { hasShiftOnDate } from '../calendar';
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
  async (query, { dispatch, getState }) => {
    if (!query || query.length < 2) {
      const state = getState();
      dispatch(setClientSearchResults(state.adminBooking.client.existingList || []));
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
    
    dispatch(setBenefitsStatus({ loading: true, error: null }));
    try {
      const token = localStorage.getItem('token');
      
      // 1. Fetch Client Memberships (from current benefits endpoint)
      const res = await api.get(`${Base_url}/admin/clients/${clientId}/benefits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.success) {
        dispatch(setAvailableMemberships(res.data.data?.memberships || []));
      }

      // 2. Fetch Available Gift Cards (This was previously done in SelectCalendar local state)
      const gcRes = await api.get(`${Base_url}/giftcards/purchased`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (gcRes.data && gcRes.data.success) {
        const giftCards = gcRes.data.data?.giftCards || [];
        // Optional: Perform specific filtering here or in component
        // Current SelectCalendar logic filters by clientId or recipient name match
        dispatch(setAvailableGiftCards(giftCards));
      }

    } catch (err) {
      console.error('Load benefits error:', err);
      dispatch(setBenefitsStatus({ error: err.message }));
    } finally {
      dispatch(setBenefitsStatus({ loading: false }));
    }
  }
);

/**
 * Handle adding the current selection to the booking session
 */
export const handleAddToBookingSessionThunk = createAsyncThunk(
  'adminBooking/addToSession',
  async (overrideSlot = null, { dispatch, getState }) => {
    const state = getState();
    const { selection, navigation, status: bookingStatus } = state.adminBooking;
    const { multipleAppointments } = state.bookingSession;
    const { byEmployee: appointments } = state.appointments;
    const { currentDate } = state.calendar;

    const { service: selectedService, professional: selectedProfessional, timeSlot: selectedTimeSlot, date: selectedBookingDate } = selection;
    const slotToUse = overrideSlot || selectedTimeSlot;

    // Validate
    if (!selectedService || !selectedProfessional || !slotToUse) {
      dispatch(setBookingStatus({ error: 'Please complete all booking steps: Service, Professional, and Time selection.' }));
      return false;
    }

    const timeSlotStr = (() => {
      if (slotToUse?.label) return slotToUse.label;
      if (slotToUse?.startTime) {
        const dt = new Date(slotToUse.startTime);
        return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }
      return slotToUse.time || slotToUse;
    })();

    const bookingDate = navigation.defaults?.date || selectedBookingDate || currentDate;

    // Conflict detection
    const conflictObj = detectProfessionalConflict(
      selectedProfessional._id,
      bookingDate,
      timeSlotStr,
      selectedService.duration,
      appointments,
      multipleAppointments
    );

    if (conflictObj) {
      const professionalName = selectedProfessional.user?.firstName || selectedProfessional.name;
      dispatch(setBookingStatus({ error: `Time conflict: ${professionalName} already has a booking at this time.` }));
      return false;
    }

    const appointmentDateStr = bookingDate instanceof Date ? formatDateLocal(bookingDate) : bookingDate;

    // Build appointment object
    const appointment = {
      id: `${selectedProfessional._id}_${appointmentDateStr}_${timeSlotStr}_${Date.now()}`,
      service: selectedService,
      professional: selectedProfessional,
      timeSlot: timeSlotStr,
      date: appointmentDateStr,
      duration: selectedService.duration,
      price: selectedService.price,
      originalPrice: selectedService.price
    };

    // Add to session
    dispatch(addAppointmentToSession(appointment));

    // Clear current selections
    dispatch(setSelectedService(null));
    dispatch(setSelectedProfessional(null));
    dispatch(setSelectedTimeSlot(null));
    dispatch(setAvailableProfessionals([]));
    dispatch(setAvailableTimeSlots([]));
    dispatch(setBookingStatus({ error: null, success: `"${selectedService.name}" added to session!` }));

    // Auto-clear success message
    setTimeout(() => dispatch(setBookingStatus({ success: null })), 4000);

    return true;
  }
);

/**
 * Build the booking payload for API calls
 * This logic was extracted from Selectcalander.jsx and unified here
 */
const buildBookingPayload = (state, { usePreviewValues = false } = {}) => {
  const { selection, client: clientState, isWalkIn, navigation, payment, benefits } = state.adminBooking;
  const { multipleAppointments } = state.bookingSession;
  
  if (multipleAppointments.length === 0) {
    throw new Error('No appointments in session. Please add at least one service.');
  }

  let clientData;
  if (clientState.selected) {
    clientData = {
      firstName: clientState.selected.firstName,
      lastName: clientState.selected.lastName,
      email: clientState.selected.email,
      phone: clientState.selected.phone
    };
  } else {
    const nameString = clientState.info.name ? clientState.info.name.trim() : '';
    if (!isWalkIn && !nameString) {
      throw new Error('Client name is required.');
    }

    const [firstName, ...rest] = nameString.split(' ');
    clientData = {
      firstName: firstName || 'Walk-in',
      lastName: rest.join(' ') || 'Customer',
      email: clientState.info.email ? clientState.info.email.trim() : '',
      phone: clientState.info.phone ? clientState.info.phone.trim() : ''
    };
  }

  const services = multipleAppointments.map(apt => {
    let appointmentDate = apt.date instanceof Date || typeof apt.date === 'string' ? new Date(apt.date) : new Date();
    if (isNaN(appointmentDate.getTime())) appointmentDate = new Date();

    const dateStr = typeof apt.date === 'string' && apt.date.match(/^\d{4}-\d{2}-\d{2}$/)
      ? apt.date
      : `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;
    
    const [hours, minutes] = apt.timeSlot.split(':').map(Number);
    const appointmentDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`);
    const endTime = new Date(appointmentDateTime);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + apt.service.duration);

    const editedPrice = payment.editedServicePrices[apt.id];
    const finalPrice = editedPrice !== undefined ? editedPrice : apt.service.price;
    
    const serviceData = {
      service: apt.service._id,
      employee: apt.professional._id || apt.professional.id,
      duration: apt.service.duration,
      price: finalPrice,
      originalPrice: apt.service.price,
      startTime: appointmentDateTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    if (editedPrice !== undefined) {
      serviceData.customPrice = editedPrice;
      serviceData.priceDiscount = apt.service.price - editedPrice;
    }

    return serviceData;
  });

  const paymentDetails = { clientId: clientState.selected?._id };
  if (benefits.appliedMembership) {
    paymentDetails.adminMembership = {
      membershipId: benefits.appliedMembership._id,
      membershipName: benefits.appliedMembership.name,
      sessionDeduction: true,
      remainingSessionsBefore: benefits.appliedMembership.remainingSessions
    };
  }

  if (benefits.appliedGiftCard) {
    paymentDetails.giftCard = {
      giftCardId: benefits.appliedGiftCard._id || benefits.appliedGiftCard.id,
      code: benefits.appliedGiftCard.code || benefits.appliedGiftCard.giftCardCode || benefits.appliedGiftCard.cardNumber
    };
  }

  const paymentMethodMapping = { upi: 'online' };
  const authoritativePaymentDetails = (usePreviewValues && payment.preview?.normalizedPaymentDetails)
    ? payment.preview.normalizedPaymentDetails
    : paymentDetails;

  const authoritativeFinalAmount = (usePreviewValues && payment.preview?.pricing)
    ? Number(payment.preview.pricing.finalAmount || 0)
    : (multipleAppointments.reduce((sum, a) => sum + Number(a.price || 0), 0) - (payment.customTotalDiscount || 0));

  return {
    services,
    appointmentDate: services[0].startTime,
    totalDuration: multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0),
    totalAmount: multipleAppointments.reduce((sum, a) => sum + Number(a.price || 0), 0),
    finalAmount: Math.max(0, authoritativeFinalAmount),
    paymentMethod: authoritativeFinalAmount === 0 && authoritativePaymentDetails?.giftCard
      ? 'giftcard'
      : (paymentMethodMapping[payment.method] || payment.method || 'cash'),
    paymentDetails: authoritativePaymentDetails,
    client: clientData,
    notes: clientState.info.notes || '', // Updated to match likely state location or adjust as needed
    bookingSource: 'admin',
    customDiscount: payment.customTotalDiscount > 0 ? payment.customTotalDiscount : undefined
  };
};

/**
 * Fetch booking preview from backend
 */
export const fetchBookingPreviewThunk = createAsyncThunk(
  'adminBooking/fetchPreview',
  async (_, { dispatch, getState }) => {
    try {
      dispatch(setBookingPreviewLoading(true));
      dispatch(setBookingPreviewError(null));

      const state = getState();
      const payload = buildBookingPayload(state);
      
      const res = await api.post(`${Base_url}/bookings/admin/preview`, payload);
      
      if (res.data && res.data.success) {
        dispatch(setBookingPreview(res.data.data));
        dispatch(setMembershipDiscountAmount(Number(res.data.data?.pricing?.membershipDiscount || 0)));
        // Could also update gift card amount here
      } else {
        throw new Error(res.data?.message || 'Preview failed');
      }
    } catch (err) {
      console.error('Preview error:', err);
      dispatch(setBookingPreviewError(err.message));
      dispatch(setBookingPreview(null));
    } finally {
      dispatch(setBookingPreviewLoading(false));
    }
  }
);

/**
 * Handle final booking creation
 */
export const createBookingThunk = createAsyncThunk(
  'adminBooking/createBooking',
  async (_, { dispatch, getState }) => {
    try {
      dispatch(setBookingStatus({ loading: true, error: null, success: null }));

      const state = getState();
      const payload = buildBookingPayload(state, { usePreviewValues: true });
      
      const res = await api.post(`${Base_url}/bookings`, payload);
      
      if (res.data && res.data.success) {
        dispatch(setBookingStatus({ 
          success: `Booking created successfully! ID: ${res.data.data?.booking?.bookingNumber || 'N/A'}`,
          loading: false 
        }));
        
        // Return result so component can perform cleanup (close modal, etc.)
        return res.data.data;
      } else {
        throw new Error(res.data?.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Create booking error:', err);
      dispatch(setBookingStatus({ 
        error: `Failed to create booking: ${err.message}`, 
        loading: false 
      }));
    }
  }
);
/**
 * Update the status of a specific booking or service entry
 */
export const updateBookingStatusThunk = createAsyncThunk(
  'adminBooking/updateStatus',
  async ({ bookingId, serviceEntryId, newStatus }, { dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = serviceEntryId
        ? `${Base_url}/bookings/admin/${bookingId}/service/${serviceEntryId}/status`
        : `${Base_url}/bookings/admin/${bookingId}`;

      const res = await api.patch(endpoint, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        return res.data;
      } else {
        throw new Error(res.data?.message || 'Status update failed');
      }
    } catch (err) {
       console.error('Update status error:', err);
       throw err;
    }
  }
);

/**
 * Delete a booking
 */
export const deleteBookingThunk = createAsyncThunk(
  'adminBooking/deleteBooking',
  async (bookingId, { dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`${Base_url}/bookings/admin/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        return res.data;
      } else {
        throw new Error(res.data?.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete booking error:', err);
      throw err;
    }
  }
);

/**
 * Fetch full booking details for management modal
 */
export const fetchManagementBookingDetailsThunk = createAsyncThunk(
  'adminBooking/fetchManagementDetails',
  async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`${Base_url}/bookings/admin/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        return res.data.data.booking || res.data.data;
      }
      throw new Error('Failed to fetch booking details');
    } catch (err) {
      console.error('Fetch management details error:', err);
      throw err;
    }
  }
);

/**
 * Fetch initial list of services
 */
export const fetchBookingServicesThunk = createAsyncThunk(
  'adminBooking/fetchServices',
  async (_, { dispatch }) => {
    dispatch(setBookingStatus({ loading: true, error: null }));
    try {
      const res = await api.get(`${Base_url}/bookings/services`);
      if (res.data && res.data.success) {
        dispatch(setAvailableServices(res.data.data?.services || []));
      } else {
        throw new Error(res.data?.message || 'Failed to fetch services');
      }
    } catch (err) {
      dispatch(setBookingStatus({ error: err.message }));
      throw err;
    } finally {
      dispatch(setBookingStatus({ loading: false }));
    }
  }
);

/**
 * Fetch available professionals
 */
export const fetchBookingProfessionalsThunk = createAsyncThunk(
  'adminBooking/fetchProfessionals',
  async ({ serviceId, date }, { dispatch, getState }) => {
    dispatch(setBookingStatus({ loading: true, error: null }));
    try {
      const res = await api.get(`${Base_url}/employees`);
      if (res.data && res.data.success) {
        const allProfessionals = res.data.data?.employees || [];
        
        // Filter logic moved from component
        const state = getState();
        const selectedService = state.adminBooking.selection.service;
        const appointments = state.appointments.byEmployee;
        const multipleAppointments = state.bookingSession.multipleAppointments;

        const professionalsWithShifts = allProfessionals.filter(prof => {
          const isActive = prof.isActive !== false;
          const employeeForShiftCheck = {
            name: `${prof.user?.firstName} ${prof.user?.lastName}`,
            workSchedule: prof.workSchedule || {}
          };

          const hasShift = hasShiftOnDate(employeeForShiftCheck, date);

          if (isActive && hasShift && selectedService) {
            const availableSlots = getAvailableTimeSlotsWithAccumulatedBookings(
              { _id: prof._id, ...employeeForShiftCheck },
              date,
              selectedService.duration,
              appointments,
              multipleAppointments
            );
            return availableSlots.length > 0;
          }
          return isActive && hasShift;
        });

        dispatch(setAvailableProfessionals(professionalsWithShifts));
        return professionalsWithShifts;
      } else {
        throw new Error(res.data?.message || 'Failed to fetch professionals');
      }
    } catch (err) {
      dispatch(setBookingStatus({ error: err.message }));
      throw err;
    } finally {
      dispatch(setBookingStatus({ loading: false }));
    }
  }
);

/**
 * Fetch existing clients (initial load)
 */
export const fetchExistingClientsThunk = createAsyncThunk(
  'adminBooking/fetchClients',
  async (_, { dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`${Base_url}/admin/clients?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        const clients = res.data.data.clients || [];
        dispatch(setExistingClients(clients));
        dispatch(setClientSearchResults(clients));
      }
    } catch (err) {
      console.error('Fetch clients error:', err);
    }
  }
);

/**
 * Confirm/Create new booking
 */
export const confirmBookingThunk = createAsyncThunk(
  'adminBooking/confirmBooking',
  async (bookingData, { dispatch }) => {
    dispatch(setBookingStatus({ loading: true, error: null }));
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`${Base_url}/bookings`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.success) {
        dispatch(setBookingStatus({ success: true }));
        return res.data;
      } else {
        throw new Error(res.data?.message || 'Booking confirmation failed');
      }
    } catch (err) {
      dispatch(setBookingStatus({ error: err.message }));
      throw err;
    } finally {
      dispatch(setBookingStatus({ loading: false }));
    }
  }
);


