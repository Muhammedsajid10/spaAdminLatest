import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Step management
  bookingStep: 1,
  showAddBookingModal: false,
  
  // Selection states
  selectedService: null,
  selectedProfessional: null,
  selectedTimeSlot: null,
  availableProfessionals: [],
  availableTimeSlots: [],
  
  // Date selection
  selectedBookingDate: null,
  showBookingDatePicker: false,
  
  // Client information
  selectedExistingClient: null,
  isAddingNewClient: false,
  clientInfo: { name: '', email: '', phone: '' },
  clientSearchQuery: '',
  clientSearchResults: [],
  showClientSearch: false,
  
  // Payment information
  paymentMethod: 'cash',
  giftCardCode: '',
  cardDetails: { number: '', name: '', expiry: '', cvv: '' },
  upiId: '',
  
  // Membership & Gift Cards
  appliedMembership: null,
  membershipDiscountAmount: 0,
  selectedGiftCard: null,
  selectedMembership: null,
  redeemGiftCardAmount: 0,
  availableGiftCards: [],
  availableMemberships: [],
  
  // Form state
  bookingForm: { notes: '' },
  bookingDefaults: null,
  
  // UI states
  bookingLoading: false,
  bookingError: null,
  bookingSuccess: null,
  giftCardError: '',
  giftCardLoading: false,
  benefitsLoading: false,
  benefitsError: null,
  
  // Popups and modals
  showUnavailablePopup: false,
  unavailableMessage: '',
  showAppointmentSummary: false,
  
  // Additional states
  isNewAppointment: false,
  membershipRefreshSignal: 0
};

const bookingFormSlice = createSlice({
  name: 'bookingForm',
  initialState,
  reducers: {
    // Step management
    setBookingStep(state, action) {
      state.bookingStep = action.payload;
    },
    setShowAddBookingModal(state, action) {
      state.showAddBookingModal = action.payload;
    },
    
    // Selection actions
    setSelectedService(state, action) {
      state.selectedService = action.payload;
    },
    setSelectedProfessional(state, action) {
      state.selectedProfessional = action.payload;
    },
    setSelectedTimeSlot(state, action) {
      state.selectedTimeSlot = action.payload;
    },
    setAvailableProfessionals(state, action) {
      state.availableProfessionals = action.payload;
    },
    setAvailableTimeSlots(state, action) {
      state.availableTimeSlots = action.payload;
    },
    
    // Client management
    setSelectedExistingClient(state, action) {
      state.selectedExistingClient = action.payload;
    },
    setIsAddingNewClient(state, action) {
      state.isAddingNewClient = action.payload;
    },
    setClientInfo(state, action) {
      state.clientInfo = { ...state.clientInfo, ...action.payload };
    },
    setClientSearchQuery(state, action) {
      state.clientSearchQuery = action.payload;
    },
    setClientSearchResults(state, action) {
      state.clientSearchResults = action.payload;
    },
    setShowClientSearch(state, action) {
      state.showClientSearch = action.payload;
    },
    clearClientSelection(state) {
      state.selectedExistingClient = null;
      state.isAddingNewClient = false;
      state.clientInfo = { name: '', email: '', phone: '' };
      state.clientSearchQuery = '';
      state.clientSearchResults = [];
      state.showClientSearch = false;
    },
    
    // Payment management
    setPaymentMethod(state, action) {
      state.paymentMethod = action.payload;
    },
    setGiftCardCode(state, action) {
      state.giftCardCode = action.payload;
    },
    setBookingForm(state, action) {
      state.bookingForm = { ...state.bookingForm, ...action.payload };
    },
    
    // Error and success management
    setBookingError(state, action) {
      state.bookingError = action.payload;
    },
    setBookingSuccess(state, action) {
      state.bookingSuccess = action.payload;
    },
    setBookingLoading(state, action) {
      state.bookingLoading = action.payload;
    },
    
    // Clear all selections (after successful booking or cancel)
    clearBookingSelections(state) {
      state.selectedService = null;
      state.selectedProfessional = null;
      state.selectedTimeSlot = null;
      state.availableProfessionals = [];
      state.availableTimeSlots = [];
      state.bookingError = null;
      state.bookingSuccess = null;
    },
    
    // Reset entire form
    resetBookingForm(state) {
      return {
        ...initialState,
        showAddBookingModal: state.showAddBookingModal // Preserve modal state if needed
      };
    },
    
    // Date management
    setSelectedBookingDate(state, action) {
      state.selectedBookingDate = action.payload;
    },
    setShowBookingDatePicker(state, action) {
      state.showBookingDatePicker = action.payload;
    },
    
    // Booking defaults (for pre-filled appointments)
    setBookingDefaults(state, action) {
      state.bookingDefaults = action.payload;
    }
  }
});

export const {
  // Step management
  setBookingStep,
  setShowAddBookingModal,
  
  // Selection actions
  setSelectedService,
  setSelectedProfessional,
  setSelectedTimeSlot,
  setAvailableProfessionals,
  setAvailableTimeSlots,
  
  // Client management
  setSelectedExistingClient,
  setIsAddingNewClient,
  setClientInfo,
  setClientSearchQuery,
  setClientSearchResults,
  setShowClientSearch,
  clearClientSelection,
  
  // Payment management
  setPaymentMethod,
  setGiftCardCode,
  setBookingForm,
  
  // Error and success management
  setBookingError,
  setBookingSuccess,
  setBookingLoading,
  
  // Form management
  clearBookingSelections,
  resetBookingForm,
  
  // Date management
  setSelectedBookingDate,
  setShowBookingDatePicker,
  
  // Booking defaults
  setBookingDefaults
} = bookingFormSlice.actions;

export default bookingFormSlice.reducer;