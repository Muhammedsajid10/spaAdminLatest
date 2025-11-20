import { createSlice } from '@reduxjs/toolkit';
import { getAllSessionConflicts } from '../utils/calendar/conflictDetection';

const initialState = {
  appointments: [], // Renamed from multipleAppointments for clarity
  currentAppointmentIndex: 0,
  showServiceCatalog: false,
  isAddingAdditionalService: false,
  sessionId: null, // Session identifier
  conflicts: [], // Track detected conflicts
  clientInfo: null // Store client information for the session
};

const bookingSessionSlice = createSlice({
  name: 'bookingSession',
  initialState,
  reducers: {
    // Initialize a new booking session
    initializeSession(state, action) {
      state.sessionId = action.payload?.sessionId || `session_${Date.now()}`;
      state.appointments = [];
      state.conflicts = [];
      state.clientInfo = action.payload?.clientInfo || null;
      state.currentAppointmentIndex = 0;
      state.isAddingAdditionalService = false;
      console.log('🎬 Initialized new booking session:', state.sessionId);
    },

    // Set client information for the session
    setClientInfo(state, action) {
      state.clientInfo = action.payload;
      console.log('👤 Set client info:', action.payload);
    },

    // Replace all appointments (legacy compatibility)
    setMultipleAppointments(state, action) {
      state.appointments = action.payload;
      console.log('📋 Set appointments:', action.payload.length);
    },

    // Add a single appointment to the session
    addAppointmentToSession(state, action) {
      const appointment = action.payload;
      
      console.log('📝 addAppointmentToSession called');
      console.log('📊 Current appointments count BEFORE:', state.appointments.length);
      console.log('📊 Current appointments:', state.appointments.map(a => ({
        id: a.id,
        service: a.serviceName || a.service?.name
      })));
      
      // Ensure appointment has an ID
      if (!appointment.id) {
        appointment.id = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Add timestamp
      appointment.addedAt = new Date().toISOString();
      
      console.log('📝 Adding appointment to session:', {
        id: appointment.id,
        service: appointment.serviceName || appointment.service?.name,
        professional: appointment.professionalName || appointment.professional?.name,
        date: appointment.date,
        time: appointment.time
      });

      state.appointments.push(appointment);
      state.isAddingAdditionalService = false;
      
      console.log('✅ Appointments count AFTER:', state.appointments.length);
      console.log('✅ All appointments now:', state.appointments.map(a => ({
        id: a.id,
        service: a.serviceName || a.service?.name
      })));
    },

    // Remove an appointment from the session
    removeAppointmentFromSession(state, action) {
      const idToRemove = action.payload;
      console.log('🗑️ Removing appointment:', idToRemove);
      
      const originalLength = state.appointments.length;
      state.appointments = state.appointments.filter(a => a.id !== idToRemove);
      
      console.log('✅ Removed:', originalLength - state.appointments.length, 'appointments');
    },

    // Update appointment details
    updateAppointment(state, action) {
      const { appointmentId, updates } = action.payload;
      const appointment = state.appointments.find(a => a.id === appointmentId);
      
      if (appointment) {
        Object.assign(appointment, updates);
        appointment.updatedAt = new Date().toISOString();
        console.log('✏️ Updated appointment:', appointmentId, updates);
      }
    },

    // Update appointment price (legacy compatibility + new features)
    updateAppointmentPrice(state, action) {
      const { appointmentId, customPrice, discount, giftCardValue } = action.payload;
      const appointment = state.appointments.find(a => a.id === appointmentId);
      
      if (appointment) {
        if (customPrice !== undefined) appointment.customPrice = customPrice;
        if (discount !== undefined) appointment.discount = discount;
        if (giftCardValue !== undefined) appointment.giftCardValue = giftCardValue;
        appointment.updatedAt = new Date().toISOString();
        
        console.log('💰 Updated pricing for:', appointmentId, {
          customPrice,
          discount,
          giftCardValue
        });
      }
    },

    // Set conflicts detected during validation
    setConflicts(state, action) {
      state.conflicts = action.payload;
      console.log('⚠️ Conflicts detected:', action.payload.length);
    },

    // Clear all conflicts
    clearConflicts(state) {
      state.conflicts = [];
    },

    // Toggle service catalog modal
    setShowServiceCatalog(state, action) {
      state.showServiceCatalog = action.payload;
    },

    // Set flag when adding additional service
    setAddingAdditionalService(state, action) {
      state.isAddingAdditionalService = action.payload;
    },

    // Clear entire session
    clearSession(state) {
      console.log('🧹 clearSession called - clearing', state.appointments.length, 'appointments');
      console.log('🧹 Stack trace:', new Error().stack);
      state.appointments = [];
      state.conflicts = [];
      state.currentAppointmentIndex = 0;
      state.isAddingAdditionalService = false;
      state.sessionId = null;
      state.clientInfo = null;
      console.log('🧹 Cleared booking session');
    }
  }
});

// Selectors
export const selectSessionAppointments = (state) => state.bookingSession.appointments;
export const selectSessionConflicts = (state) => state.bookingSession.conflicts;
export const selectSessionId = (state) => state.bookingSession.sessionId;
export const selectClientInfo = (state) => state.bookingSession.clientInfo;
export const selectIsAddingService = (state) => state.bookingSession.isAddingAdditionalService;
export const selectShowServiceCatalog = (state) => state.bookingSession.showServiceCatalog;

// Computed selectors
export const selectSessionTotal = (state) => {
  return state.bookingSession.appointments.reduce((total, apt) => {
    const price = apt.customPrice || apt.price || apt.service?.price || 0;
    const discount = apt.discount || 0;
    const giftCardValue = apt.giftCardValue || 0;
    return total + price - discount - giftCardValue;
  }, 0);
};

export const selectAppointmentCount = (state) => state.bookingSession.appointments.length;

export const selectHasConflicts = (state) => state.bookingSession.conflicts.length > 0;

export const {
  initializeSession,
  setClientInfo,
  setMultipleAppointments,
  addAppointmentToSession,
  removeAppointmentFromSession,
  updateAppointment,
  updateAppointmentPrice,
  setConflicts,
  clearConflicts,
  setShowServiceCatalog,
  setAddingAdditionalService,
  clearSession
} = bookingSessionSlice.actions;

export default bookingSessionSlice.reducer;
