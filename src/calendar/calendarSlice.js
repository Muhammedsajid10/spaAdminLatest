import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  existingClients: [],
  clientSearchQuery: '',
  clientSearchResults: [],
  selectedExistingClient: null,
  clientInfo: { name: '', email: '', phone: '' },
  showClientSearch: false,
  isAddingNewClient: false,
};

const calendarSlice = createSlice({
  name: 'calendarUI',
  initialState,
  reducers: {
    setExistingClients(state, action) {
      state.existingClients = action.payload || [];
      // Reset search results when full list set
      state.clientSearchResults = state.existingClients.slice(0, 10);
    },
    setClientSearchQuery(state, action) {
      state.clientSearchQuery = action.payload || '';
    },
    setClientSearchResults(state, action) {
      state.clientSearchResults = action.payload || [];
    },
    setSelectedExistingClient(state, action) {
      state.selectedExistingClient = action.payload || null;
    },
    setClientInfo(state, action) {
      state.clientInfo = action.payload || { name: '', email: '', phone: '' };
    },
    setShowClientSearch(state, action) {
      state.showClientSearch = !!action.payload;
    },
    setIsAddingNewClient(state, action) {
      state.isAddingNewClient = !!action.payload;
    },
    clearClientSelection(state) {
      state.selectedExistingClient = null;
      state.clientInfo = { name: '', email: '', phone: '' };
      state.clientSearchQuery = '';
      state.clientSearchResults = [];
      state.showClientSearch = true;
      state.isAddingNewClient = false;
    },
    addNewClientLocal(state) {
      state.isAddingNewClient = true;
      state.selectedExistingClient = null;
      state.clientInfo = { name: state.clientSearchQuery, email: '', phone: '' };
      state.clientSearchQuery = '';
      state.clientSearchResults = [];
      state.showClientSearch = false;
    }
  }
});

export const {
  setExistingClients,
  setClientSearchQuery,
  setClientSearchResults,
  setSelectedExistingClient,
  setClientInfo,
  setShowClientSearch,
  setIsAddingNewClient,
  clearClientSelection,
  addNewClientLocal
} = calendarSlice.actions;

export default calendarSlice.reducer;
