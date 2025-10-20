/**
 * Team Popup Redux Slice
 * 
 * This slice manages the state for the team popup functionality.
 * It handles showing/hiding the team popup and managing team-related UI state.
 * 
 * Business Logic:
 * - Show/hide team popup
 * - Manage team filter state (all/scheduled)
 * - Handle team search functionality
 * - Manage team view mode (list/grid)
 * - Track selected employees for filtering
 */

import { createSlice } from '@reduxjs/toolkit';

// Initial state for team popup
const initialState = {
  // UI state for team popup visibility
  showTeamPopup: false,
  
  // Team filtering options
  teamFilter: 'all', // 'all' or 'scheduled'
  
  // Search functionality for team members
  teamSearchQuery: '',
  
  // View mode for displaying team members
  teamViewMode: 'list', // 'list' or 'grid'
  
  // Array of selected employee IDs for filtering (using array instead of Set for Redux serialization)
  selectedEmployees: [],
  
  // Calendar popup related state (moved from main component)
  showCalendarPopup: false,
  calendarPopupTab: 'confirmed', // 'confirmed', 'pending', etc.
};

/**
 * Team Popup Slice
 * Contains all actions and reducers for team popup state management
 */
const teamPopupSlice = createSlice({
  name: 'teamPopup',
  initialState,
  reducers: {
    /**
     * Show the team popup
     * Used when user clicks the team icon in header
     */
    showTeamPopup: (state) => {
      state.showTeamPopup = true;
    },

    /**
     * Hide the team popup
     * Used when user clicks outside popup or closes it
     */
    hideTeamPopup: (state) => {
      state.showTeamPopup = false;
    },

    /**
     * Toggle team popup visibility
     * Convenience action for show/hide toggle
     */
    toggleTeamPopup: (state) => {
      state.showTeamPopup = !state.showTeamPopup;
    },

    /**
     * Set team filter (all employees vs only scheduled employees)
     * @param {string} payload - 'all' or 'scheduled'
     */
    setTeamFilter: (state, action) => {
      state.teamFilter = action.payload;
      
      // Auto-update selected employees based on filter
      if (action.payload === 'all') {
        // Keep current selection when switching to 'all'
        // User can see all employees but keep their selection
      } else if (action.payload === 'scheduled') {
        // When switching to 'scheduled', we might want to clear selection
        // or filter it to only include scheduled employees
        // For now, keep the selection as is
      }
    },

    /**
     * Update team search query
     * @param {string} payload - Search query string
     */
    setTeamSearchQuery: (state, action) => {
      state.teamSearchQuery = action.payload;
    },

    /**
     * Set team view mode (list or grid display)
     * @param {string} payload - 'list' or 'grid'
     */
    setTeamViewMode: (state, action) => {
      state.teamViewMode = action.payload;
    },

    /**
     * Toggle employee selection for filtering
     * @param {string} payload - Employee ID to toggle
     */
    toggleEmployeeSelection: (state, action) => {
      const employeeId = action.payload;
      const currentIndex = state.selectedEmployees.indexOf(employeeId);
      
      if (currentIndex >= 0) {
        // Remove employee from selection
        state.selectedEmployees.splice(currentIndex, 1);
      } else {
        // Add employee to selection
        state.selectedEmployees.push(employeeId);
      }
    },

    /**
     * Add employee to selection
     * @param {string} payload - Employee ID to add
     */
    addEmployeeToSelection: (state, action) => {
      const employeeId = action.payload;
      if (!state.selectedEmployees.includes(employeeId)) {
        state.selectedEmployees.push(employeeId);
      }
    },

    /**
     * Remove employee from selection
     * @param {string} payload - Employee ID to remove
     */
    removeEmployeeFromSelection: (state, action) => {
      const employeeId = action.payload;
      const index = state.selectedEmployees.indexOf(employeeId);
      if (index >= 0) {
        state.selectedEmployees.splice(index, 1);
      }
    },

    /**
     * Clear all employee selections
     * Useful for "Select All" / "Clear All" functionality
     */
    clearEmployeeSelection: (state) => {
      state.selectedEmployees = [];
    },

    /**
     * Select all employees
     * @param {string[]} payload - Array of all employee IDs
     */
    selectAllEmployees: (state, action) => {
      state.selectedEmployees = [...action.payload];
    },

    /**
     * Show calendar popup
     */
    showCalendarPopup: (state) => {
      state.showCalendarPopup = true;
    },

    /**
     * Hide calendar popup
     */
    hideCalendarPopup: (state) => {
      state.showCalendarPopup = false;
    },

    /**
     * Set calendar popup tab
     * @param {string} payload - Tab name ('confirmed', 'pending', etc.)
     */
    setCalendarPopupTab: (state, action) => {
      state.calendarPopupTab = action.payload;
    },

    /**
     * Reset team popup state to initial values
     * Useful when logging out or switching contexts
     */
    resetTeamPopupState: (state) => {
      return { ...initialState };
    }
  }
});

// Export actions for use in components
export const {
  showTeamPopup,
  hideTeamPopup,
  toggleTeamPopup,
  setTeamFilter,
  setTeamSearchQuery,
  setTeamViewMode,
  toggleEmployeeSelection,
  addEmployeeToSelection,
  removeEmployeeFromSelection,
  clearEmployeeSelection,
  selectAllEmployees,
  showCalendarPopup,
  hideCalendarPopup,
  setCalendarPopupTab,
  resetTeamPopupState
} = teamPopupSlice.actions;

// Selectors for easy state access in components
export const selectTeamPopupState = (state) => state.teamPopup;
export const selectShowTeamPopup = (state) => state.teamPopup.showTeamPopup;
export const selectTeamFilter = (state) => state.teamPopup.teamFilter;
export const selectTeamSearchQuery = (state) => state.teamPopup.teamSearchQuery;
export const selectTeamViewMode = (state) => state.teamPopup.teamViewMode;

// Employee selection selectors
export const selectSelectedEmployees = (state) => state.teamPopup.selectedEmployees; // Returns array
export const selectSelectedEmployeesSet = (state) => new Set(state.teamPopup.selectedEmployees); // Returns Set for easy lookup

// Calendar popup selectors
export const selectShowCalendarPopup = (state) => state.teamPopup.showCalendarPopup;
export const selectCalendarPopupTab = (state) => state.teamPopup.calendarPopupTab;

// Export reducer for store configuration
export default teamPopupSlice.reducer;