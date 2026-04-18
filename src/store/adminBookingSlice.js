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
    previewError: null,
    editingTotalPrice: false,
    tempTotalPrice: ''
  },
  
  benefits: {
    appliedMembership: null,
    appliedGiftCard: null,
    availableMemberships: [],
    availableGiftCards: [],
    loading: false,
    error: null,
    redeemGiftCardAmount: 0,
    giftCardCode: '',
    giftCardError: '',
    giftCardLoading: false
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
  },

  // Management of existing bookings
  management: {
    showStatusModal: false,
    selectedBooking: null,
    loading: false,
    error: null
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
    setBenefitsStatus(state, action) {
      const { loading, error } = action.payload;
      if (loading !== undefined) state.benefits.loading = loading;
      if (error !== undefined) state.benefits.error = error;
    },
    setAppliedGiftCardAmount(state, action) {
      if (state.benefits.appliedGiftCard) {
        state.benefits.appliedGiftCard.appliedAmount = action.payload;
      }
    },
    setRedeemGiftCardAmount(state, action) { state.benefits.redeemGiftCardAmount = action.payload; },
    setGiftCardCode(state, action) { state.benefits.giftCardCode = action.payload; },
    setGiftCardError(state, action) { state.benefits.giftCardError = action.payload; },
    setGiftCardLoading(state, action) { state.benefits.giftCardLoading = action.payload; },
    setEditingTotalPrice(state, action) { state.payment.editingTotalPrice = action.payload; },
    setTempTotalPrice(state, action) { state.payment.tempTotalPrice = action.payload; },
    
    // Global Status
    setBookingStatus(state, action) {
      const { loading, error, success } = action.payload;
      if (loading !== undefined) state.status.loading = loading;
      if (error !== undefined) state.status.error = error;
      if (success !== undefined) state.status.success = success;
    },
    
    // Management
    setManagementStatusModal(state, action) { state.management.showStatusModal = action.payload; },
    setSelectedManagementBooking(state, action) { state.management.selectedBooking = action.payload; },
    setManagementStatus(state, action) {
      const { loading, error } = action.payload;
      if (loading !== undefined) state.management.loading = loading;
      if (error !== undefined) state.management.error = error;
    },
    
    // Reset
    resetBookingState(state) {
      Object.assign(state, {
        ...initialState,
        available: { ...initialState.available, services: state.available.services } // keep services cached
      });
    }
  },
  extraReducers: (builder) => {
    // Management Fetch Details
    builder.addCase('adminBooking/fetchManagementDetails/fulfilled', (state, action) => {
      const booking = action.payload;
      if (state.management.selectedBooking) {
        // Enrich existing selection with full record
        state.management.selectedBooking = {
          ...state.management.selectedBooking,
          ...booking,
          // Explicitly map nested data if needed
          services: booking.services || [],
          client: booking.client,
          totalAmount: booking.totalAmount || booking.finalAmount || 0
        };
      }
    });
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
  setBookingStatus, resetBookingState,
  setManagementStatusModal, setSelectedManagementBooking, setManagementStatus
} = adminBookingSlice.actions;

export const adminBookingActions = adminBookingSlice.actions;
export default adminBookingSlice.reducer;
