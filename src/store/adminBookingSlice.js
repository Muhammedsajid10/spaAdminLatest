import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Workflow
  step: 1,
  showModal: false,
  isWalkIn: false,
  
  // Client
  client: {
    selected: null,
    searchQuery: '',
    searchResults: [],
    isAddingNew: false,
    info: { name: '', email: '', phone: '' }
  },
  
  // Selection
  selection: {
    service: null,
    professional: null,
    date: null,
    timeSlot: null
  },
  
  // Dynamic Lists
  available: {
    services: [],
    professionals: [],
    timeSlots: []
  },
  
  // Pricing & Benefits
  payment: {
    method: 'cash',
    customTotalDiscount: 0,
    membershipDiscountAmount: 0,
    editedServicePrices: {}, // { appointmentId: price }
    preview: null,
    previewLoading: false,
    previewError: null
  },
  
  benefits: {
    appliedMembership: null,
    appliedGiftCard: null,
    availableMemberships: [],
    availableGiftCards: [],
    loading: false,
    error: null
  },
  
  // Global Booking Status
  status: {
    loading: false,
    error: null,
    success: null
  },
  
  // Navigation Persistence
  navigation: {
    lastService: null,
    lastProfessional: null,
    lastAddedId: null,
    defaults: null
  }
};

const adminBookingSlice = createSlice({
  name: 'adminBooking',
  initialState,
  reducers: {
    // Basic Workflow
    setStep(state, action) { state.step = action.payload; },
    setModalOpen(state, action) { 
      state.showModal = action.payload;
      if (!action.payload) {
        // Option: reset some state when closing
      }
    },
    setIsWalkIn(state, action) { state.isWalkIn = action.payload; },
    
    // Client
    setSelectedClient(state, action) { 
      state.client.selected = action.payload;
      state.client.isAddingNew = false;
    },
    setClientSearchQuery(state, action) { state.client.searchQuery = action.payload; },
    setClientSearchResults(state, action) { state.client.searchResults = action.payload; },
    setIsAddingNewClient(state, action) { state.client.isAddingNew = action.payload; },
    setClientInfo(state, action) { state.client.info = { ...state.client.info, ...action.payload }; },
    
    // Selection
    setSelectedService(state, action) { 
      state.selection.service = action.payload;
      state.navigation.lastService = action.payload;
    },
    setSelectedProfessional(state, action) { 
      state.selection.professional = action.payload;
      state.navigation.lastProfessional = action.payload;
    },
    setSelectedDate(state, action) { state.selection.date = action.payload; },
    setSelectedTimeSlot(state, action) { state.selection.timeSlot = action.payload; },
    setBookingDefaults(state, action) { state.navigation.defaults = action.payload; },
    
    // Lists
    setAvailableServices(state, action) { state.available.services = action.payload; },
    setAvailableProfessionals(state, action) { state.available.professionals = action.payload; },
    setAvailableTimeSlots(state, action) { state.available.timeSlots = action.payload; },
    
    // Pricing & Preview
    setPaymentMethod(state, action) { state.payment.method = action.payload; },
    setCustomTotalDiscount(state, action) { state.payment.customTotalDiscount = action.payload; },
    setMembershipDiscountAmount(state, action) { state.payment.membershipDiscountAmount = action.payload; },
    setEditedServicePrice(state, action) {
      const { id, price } = action.payload;
      if (price === undefined) {
        delete state.payment.editedServicePrices[id];
      } else {
        state.payment.editedServicePrices[id] = price;
      }
    },
    setBookingPreview(state, action) { state.payment.preview = action.payload; },
    setBookingPreviewLoading(state, action) { state.payment.previewLoading = action.payload; },
    setBookingPreviewError(state, action) { state.payment.previewError = action.payload; },
    
    // Benefits
    setAppliedMembership(state, action) { state.benefits.appliedMembership = action.payload; },
    setAppliedGiftCard(state, action) { state.benefits.appliedGiftCard = action.payload; },
    setAvailableMemberships(state, action) { state.benefits.availableMemberships = action.payload; },
    setAvailableGiftCards(state, action) { state.benefits.availableGiftCards = action.payload; },
    
    // Global Status
    setBookingStatus(state, action) {
      const { loading, error, success } = action.payload;
      if (loading !== undefined) state.status.loading = loading;
      if (error !== undefined) state.status.error = error;
      if (success !== undefined) state.status.success = success;
    },
    
    // Reset
    resetBookingState(state) {
      Object.assign(state, {
        ...initialState,
        available: { ...initialState.available, services: state.available.services } // keep services cached
      });
    }
  }
});

export const {
  setStep, setModalOpen, setIsWalkIn,
  setSelectedClient, setClientSearchQuery, setClientSearchResults, setIsAddingNewClient, setClientInfo,
  setSelectedService, setSelectedProfessional, setSelectedDate, setSelectedTimeSlot, setBookingDefaults,
  setAvailableServices, setAvailableProfessionals, setAvailableTimeSlots,
  setPaymentMethod, setCustomTotalDiscount, setMembershipDiscountAmount, setEditedServicePrice,
  setBookingPreview, setBookingPreviewLoading, setBookingPreviewError,
  setAppliedMembership, setAppliedGiftCard, setAvailableMemberships, setAvailableGiftCards,
  setBookingStatus, resetBookingState
} = adminBookingSlice.actions;

export default adminBookingSlice.reducer;
