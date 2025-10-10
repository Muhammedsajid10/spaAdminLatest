import { createSlice } from '@reduxjs/toolkit';

// Helper function to get default date range (current month)
const getDefaultDateRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: startOfMonth,
    end: endOfMonth,
    preset: 'current-month'
  };
};

// Helper function to get date range based on preset
const getDateRangeByPreset = (preset) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        start: today,
        end: today,
        preset: 'today'
      };
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: yesterday,
        end: yesterday,
        preset: 'yesterday'
      };
      
    case 'last-7-days':
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 6);
      return {
        start: last7Days,
        end: today,
        preset: 'last-7-days'
      };
      
    case 'last-30-days':
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 29);
      return {
        start: last30Days,
        end: today,
        preset: 'last-30-days'
      };
      
    case 'current-month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: startOfMonth,
        end: endOfMonth,
        preset: 'current-month'
      };
      
    case 'last-month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: lastMonthStart,
        end: lastMonthEnd,
        preset: 'last-month'
      };
      
    case 'current-quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      return {
        start: quarterStart,
        end: quarterEnd,
        preset: 'current-quarter'
      };
      
    case 'current-year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return {
        start: yearStart,
        end: yearEnd,
        preset: 'current-year'
      };
      
    default:
      return getDefaultDateRange();
  }
};

const initialState = {
  // Date Range Filter
  dateRange: getDefaultDateRange(),
  
  // Location Filter
  selectedLocation: 'all',
  availableLocations: [
    { value: 'all', label: 'All Locations' },
    { value: 'allora-spa-dubai', label: 'Allora Spa and Massage Centre Dubai' },
    { value: 'allora-spa-abudhabi', label: 'Allora Spa and Massage Centre Abu Dhabi' },
  ],
  
  // Team Member Filter
  selectedTeamMember: 'all',
  availableTeamMembers: [
    { value: 'all', label: 'All Team Members' },
  ],
  
  // Service Filter
  selectedService: 'all',
  availableServices: [
    { value: 'all', label: 'All Services' },
    { value: 'massage', label: 'Massage Therapy' },
    { value: 'facial', label: 'Facial Treatment' },
    { value: 'body-treatment', label: 'Body Treatment' },
    { value: 'spa-package', label: 'Spa Package' },
  ],
  
  // Status Filter
  selectedStatus: 'all',
  availableStatuses: [
    { value: 'all', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'no-show', label: 'No Show' },
  ],
  
  // Channel Filter (for bookings)
  selectedChannel: 'all',
  availableChannels: [
    { value: 'all', label: 'All Channels' },
    { value: 'online', label: 'Online Booking' },
    { value: 'phone', label: 'Phone Booking' },
    { value: 'walk-in', label: 'Walk-in' },
    { value: 'app', label: 'Mobile App' },
  ],
  
  // Payment Method Filter
  selectedPaymentMethod: 'all',
  availablePaymentMethods: [
    { value: 'all', label: 'All Payment Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank-transfer', label: 'Bank Transfer' },
    { value: 'digital-wallet', label: 'Digital Wallet' },
  ],
  
  // Group By Filter
  groupBy: 'location',
  availableGroupByOptions: [
    { value: 'location', label: 'Location' },
    { value: 'team-member', label: 'Team Member' },
    { value: 'service', label: 'Service' },
    { value: 'channel', label: 'Channel' },
    { value: 'status', label: 'Status' },
    { value: 'payment-method', label: 'Payment Method' },
    { value: 'date', label: 'Date' },
  ],
  
  // Custom Filters (for extensibility)
  customFilters: {},
  
  // Filter State
  isFilterPanelOpen: false,
  hasActiveFilters: false,
  
  // Search
  searchQuery: '',
  
  // Sorting
  sortBy: 'date',
  sortOrder: 'desc', // 'asc' or 'desc'
  availableSortOptions: [
    { value: 'date', label: 'Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'customer', label: 'Customer Name' },
    { value: 'service', label: 'Service' },
    { value: 'status', label: 'Status' },
  ],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Date Range Actions
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
      state.hasActiveFilters = true;
    },
    
    setDateRangeByPreset: (state, action) => {
      state.dateRange = getDateRangeByPreset(action.payload);
      state.hasActiveFilters = true;
    },
    
    // Location Actions
    setSelectedLocation: (state, action) => {
      state.selectedLocation = action.payload;
      state.hasActiveFilters = action.payload !== 'all';
    },
    
    setAvailableLocations: (state, action) => {
      state.availableLocations = [
        { value: 'all', label: 'All Locations' },
        ...action.payload
      ];
    },
    
    // Team Member Actions
    setSelectedTeamMember: (state, action) => {
      state.selectedTeamMember = action.payload;
      state.hasActiveFilters = action.payload !== 'all';
    },
    
    setAvailableTeamMembers: (state, action) => {
      state.availableTeamMembers = [
        { value: 'all', label: 'All Team Members' },
        ...action.payload
      ];
    },
    
    // Service Actions
    setSelectedService: (state, action) => {
      state.selectedService = action.payload;
      state.hasActiveFilters = action.payload !== 'all';
    },
    
    setAvailableServices: (state, action) => {
      state.availableServices = [
        { value: 'all', label: 'All Services' },
        ...action.payload
      ];
    },
    
    // Status Actions
    setSelectedStatus: (state, action) => {
      state.selectedStatus = action.payload;
      state.hasActiveFilters = action.payload !== 'all';
    },
    
    // Channel Actions
    setSelectedChannel: (state, action) => {
      state.selectedChannel = action.payload;
      state.hasActiveFilters = action.payload !== 'all';
    },
    
    // Payment Method Actions
    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
      state.hasActiveFilters = action.payload !== 'all';
    },
    
    // Group By Actions
    setGroupBy: (state, action) => {
      state.groupBy = action.payload;
    },
    
    // Custom Filter Actions
    setCustomFilter: (state, action) => {
      const { key, value } = action.payload;
      state.customFilters[key] = value;
      state.hasActiveFilters = true;
    },
    
    removeCustomFilter: (state, action) => {
      delete state.customFilters[action.payload];
      // Check if we still have active filters
      state.hasActiveFilters = Object.keys(state.customFilters).length > 0 ||
        state.selectedLocation !== 'all' ||
        state.selectedTeamMember !== 'all' ||
        state.selectedService !== 'all' ||
        state.selectedStatus !== 'all' ||
        state.selectedChannel !== 'all' ||
        state.selectedPaymentMethod !== 'all' ||
        state.searchQuery !== '';
    },
    
    // Search Actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.hasActiveFilters = action.payload !== '';
    },
    
    // Sorting Actions
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    
    // Panel Actions
    toggleFilterPanel: (state) => {
      state.isFilterPanelOpen = !state.isFilterPanelOpen;
    },
    
    openFilterPanel: (state) => {
      state.isFilterPanelOpen = true;
    },
    
    closeFilterPanel: (state) => {
      state.isFilterPanelOpen = false;
    },
    
    // Reset Actions
    resetFilters: (state) => {
      state.selectedLocation = 'all';
      state.selectedTeamMember = 'all';
      state.selectedService = 'all';
      state.selectedStatus = 'all';
      state.selectedChannel = 'all';
      state.selectedPaymentMethod = 'all';
      state.customFilters = {};
      state.searchQuery = '';
      state.hasActiveFilters = false;
      // Keep date range and groupBy as they are more like preferences
    },
    
    resetAllFilters: (state) => {
      Object.assign(state, {
        ...initialState,
        availableLocations: state.availableLocations,
        availableTeamMembers: state.availableTeamMembers,
        availableServices: state.availableServices,
      });
    },
    
    // Bulk Actions
    setMultipleFilters: (state, action) => {
      const filters = action.payload;
      Object.keys(filters).forEach(key => {
        if (state.hasOwnProperty(key)) {
          state[key] = filters[key];
        }
      });
      
      // Update active filters flag
      state.hasActiveFilters = 
        state.selectedLocation !== 'all' ||
        state.selectedTeamMember !== 'all' ||
        state.selectedService !== 'all' ||
        state.selectedStatus !== 'all' ||
        state.selectedChannel !== 'all' ||
        state.selectedPaymentMethod !== 'all' ||
        Object.keys(state.customFilters).length > 0 ||
        state.searchQuery !== '';
    },
  },
});

// Action creators
export const {
  setDateRange,
  setDateRangeByPreset,
  setSelectedLocation,
  setAvailableLocations,
  setSelectedTeamMember,
  setAvailableTeamMembers,
  setSelectedService,
  setAvailableServices,
  setSelectedStatus,
  setSelectedChannel,
  setSelectedPaymentMethod,
  setGroupBy,
  setCustomFilter,
  removeCustomFilter,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  toggleFilterPanel,
  openFilterPanel,
  closeFilterPanel,
  resetFilters,
  resetAllFilters,
  setMultipleFilters,
} = filtersSlice.actions;

// Selectors
export const selectFilters = (state) => state.filters;
export const selectDateRange = (state) => state.filters.dateRange;
export const selectSelectedLocation = (state) => state.filters.selectedLocation;
export const selectSelectedTeamMember = (state) => state.filters.selectedTeamMember;
export const selectSelectedService = (state) => state.filters.selectedService;
export const selectSelectedStatus = (state) => state.filters.selectedStatus;
export const selectSelectedChannel = (state) => state.filters.selectedChannel;
export const selectSelectedPaymentMethod = (state) => state.filters.selectedPaymentMethod;
export const selectGroupBy = (state) => state.filters.groupBy;
export const selectSearchQuery = (state) => state.filters.searchQuery;
export const selectSorting = (state) => ({ 
  sortBy: state.filters.sortBy, 
  sortOrder: state.filters.sortOrder 
});
export const selectHasActiveFilters = (state) => state.filters.hasActiveFilters;
export const selectIsFilterPanelOpen = (state) => state.filters.isFilterPanelOpen;

// Complex selectors
export const selectActiveFiltersCount = (state) => {
  let count = 0;
  const filters = state.filters;
  
  if (filters.selectedLocation !== 'all') count++;
  if (filters.selectedTeamMember !== 'all') count++;
  if (filters.selectedService !== 'all') count++;
  if (filters.selectedStatus !== 'all') count++;
  if (filters.selectedChannel !== 'all') count++;
  if (filters.selectedPaymentMethod !== 'all') count++;
  if (filters.searchQuery !== '') count++;
  
  count += Object.keys(filters.customFilters).length;
  
  return count;
};

export const selectFilterSummary = (state) => {
  const filters = state.filters;
  const summary = [];
  
  if (filters.selectedLocation !== 'all') {
    const location = filters.availableLocations.find(l => l.value === filters.selectedLocation);
    summary.push({ type: 'location', label: location?.label || filters.selectedLocation });
  }
  
  if (filters.selectedTeamMember !== 'all') {
    const member = filters.availableTeamMembers.find(m => m.value === filters.selectedTeamMember);
    summary.push({ type: 'team-member', label: member?.label || filters.selectedTeamMember });
  }
  
  if (filters.selectedService !== 'all') {
    const service = filters.availableServices.find(s => s.value === filters.selectedService);
    summary.push({ type: 'service', label: service?.label || filters.selectedService });
  }
  
  if (filters.selectedStatus !== 'all') {
    const status = filters.availableStatuses.find(s => s.value === filters.selectedStatus);
    summary.push({ type: 'status', label: status?.label || filters.selectedStatus });
  }
  
  if (filters.searchQuery !== '') {
    summary.push({ type: 'search', label: `Search: ${filters.searchQuery}` });
  }
  
  return summary;
};

export default filtersSlice.reducer;