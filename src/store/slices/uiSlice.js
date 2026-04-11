import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Table/DataGrid State
  sortConfig: {
    key: null,
    direction: 'asc' // 'asc' | 'desc'
  },
  currentPage: 1,
  itemsPerPage: 25,
  selectedRows: [],
  tableLoading: false,
  tableError: null,
  
  // Modal State
  modals: {
    // Dynamic modal management
    // Example: { modalId: { isOpen: boolean, data: any, props: object } }
  },
  
  // Notification/Toast State
  notifications: [],
  
  // Loading States (global and specific)
  loading: {
    global: false,
    export: false,
    save: false,
    delete: false,
    // Add more specific loading states as needed
  },
  
  // Error States
  errors: {
    global: null,
    form: {},
    api: null,
  },
  
  // Form State
  forms: {
    // Dynamic form state management
    // Example: { formId: { values: {}, errors: {}, touched: {}, isValid: boolean } }
  },
  
  // UI Preferences
  preferences: {
    theme: 'light', // 'light' | 'dark' | 'system'
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
  },
  
  // Search State
  search: {
    query: '',
    filters: {},
    suggestions: [],
    recentSearches: [],
  },
  
  // Panel/Drawer State
  panels: {
    sidebar: { isOpen: true, width: 280 },
    filterPanel: { isOpen: false },
    detailPanel: { isOpen: false, data: null },
  },
  
  // Confirmation Dialogs
  confirmations: {
    // Example: { confirmId: { isOpen: boolean, message: string, onConfirm: function, onCancel: function } }
  },
  
  // Breadcrumb State
  breadcrumbs: [],
  
  // Active/Focus State
  activeElements: {
    activeTab: null,
    focusedRow: null,
    selectedItem: null,
  },
  
  // View State
  viewMode: 'table', // 'table' | 'grid' | 'list' | 'kanban'
  
  // Bulk Operations
  bulkOperations: {
    isActive: false,
    selectedItems: [],
    availableActions: [],
  },
  
  // Performance/Optimization
  virtualization: {
    enabled: false,
    itemHeight: 50,
    overscan: 5,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // ===== TABLE/DATAGRID ACTIONS =====
    setSortConfig: (state, action) => {
      state.sortConfig = action.payload;
    },
    
    toggleSort: (state, action) => {
      const { key } = action.payload;
      if (state.sortConfig.key === key) {
        state.sortConfig.direction = state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortConfig = { key, direction: 'asc' };
      }
    },
    
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    setItemsPerPage: (state, action) => {
      state.itemsPerPage = action.payload;
      state.currentPage = 1; // Reset to first page
    },
    
    selectRow: (state, action) => {
      const { id } = action.payload;
      if (!state.selectedRows.includes(id)) {
        state.selectedRows.push(id);
      }
    },
    
    deselectRow: (state, action) => {
      const { id } = action.payload;
      state.selectedRows = state.selectedRows.filter(rowId => rowId !== id);
    },
    
    selectAllRows: (state, action) => {
      state.selectedRows = action.payload;
    },
    
    clearSelectedRows: (state) => {
      state.selectedRows = [];
    },
    
    toggleRowSelection: (state, action) => {
      const { id } = action.payload;
      if (state.selectedRows.includes(id)) {
        state.selectedRows = state.selectedRows.filter(rowId => rowId !== id);
      } else {
        state.selectedRows.push(id);
      }
    },
    
    setTableLoading: (state, action) => {
      state.tableLoading = action.payload;
    },
    
    setTableError: (state, action) => {
      state.tableError = action.payload;
    },
    
    // ===== MODAL ACTIONS =====
    openModal: (state, action) => {
      const { modalId, data = null, props = {} } = action.payload;
      state.modals[modalId] = {
        isOpen: true,
        data,
        props,
      };
    },
    
    closeModal: (state, action) => {
      const { modalId } = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = false;
      }
    },
    
    updateModalData: (state, action) => {
      const { modalId, data } = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].data = data;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalId => {
        state.modals[modalId].isOpen = false;
      });
    },
    
    // ===== NOTIFICATION ACTIONS =====
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        autoHide: true,
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      const { id } = action.payload;
      state.notifications = state.notifications.filter(notification => notification.id !== id);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    updateNotification: (state, action) => {
      const { id, updates } = action.payload;
      const notification = state.notifications.find(n => n.id === id);
      if (notification) {
        Object.assign(notification, updates);
      }
    },
    
    // ===== LOADING ACTIONS =====
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    setSpecificLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    
    setMultipleLoading: (state, action) => {
      Object.assign(state.loading, action.payload);
    },
    
    clearAllLoading: (state) => {
      Object.keys(state.loading).forEach(key => {
        state.loading[key] = false;
      });
    },
    
    // ===== ERROR ACTIONS =====
    setGlobalError: (state, action) => {
      state.errors.global = action.payload;
    },
    
    setFormError: (state, action) => {
      const { formId, field, error } = action.payload;
      if (!state.errors.form[formId]) {
        state.errors.form[formId] = {};
      }
      state.errors.form[formId][field] = error;
    },
    
    clearFormErrors: (state, action) => {
      const { formId } = action.payload;
      if (formId) {
        delete state.errors.form[formId];
      } else {
        state.errors.form = {};
      }
    },
    
    setApiError: (state, action) => {
      state.errors.api = action.payload;
    },
    
    clearAllErrors: (state) => {
      state.errors = {
        global: null,
        form: {},
        api: null,
      };
    },
    
    // ===== FORM ACTIONS =====
    initializeForm: (state, action) => {
      const { formId, initialValues = {}, schema = null } = action.payload;
      state.forms[formId] = {
        values: initialValues,
        errors: {},
        touched: {},
        isValid: true,
        isDirty: false,
        schema,
      };
    },
    
    updateFormField: (state, action) => {
      const { formId, field, value } = action.payload;
      if (state.forms[formId]) {
        state.forms[formId].values[field] = value;
        state.forms[formId].touched[field] = true;
        state.forms[formId].isDirty = true;
      }
    },
    
    setFormValues: (state, action) => {
      const { formId, values } = action.payload;
      if (state.forms[formId]) {
        state.forms[formId].values = { ...state.forms[formId].values, ...values };
        state.forms[formId].isDirty = true;
      }
    },
    
    resetForm: (state, action) => {
      const { formId } = action.payload;
      if (state.forms[formId]) {
        const initialValues = state.forms[formId].schema?.initialValues || {};
        state.forms[formId] = {
          ...state.forms[formId],
          values: initialValues,
          errors: {},
          touched: {},
          isDirty: false,
        };
      }
    },
    
    removeForm: (state, action) => {
      const { formId } = action.payload;
      delete state.forms[formId];
    },
    
    // ===== PREFERENCES ACTIONS =====
    setTheme: (state, action) => {
      state.preferences.theme = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.preferences.sidebarCollapsed = !state.preferences.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action) => {
      state.preferences.sidebarCollapsed = action.payload;
    },
    
    setCompactMode: (state, action) => {
      state.preferences.compactMode = action.payload;
    },
    
    setAnimations: (state, action) => {
      state.preferences.animations = action.payload;
    },
    
    updatePreferences: (state, action) => {
      Object.assign(state.preferences, action.payload);
    },
    
    // ===== SEARCH ACTIONS =====
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    
    setSearchFilters: (state, action) => {
      state.search.filters = action.payload;
    },
    
    addSearchSuggestion: (state, action) => {
      const suggestion = action.payload;
      if (!state.search.suggestions.includes(suggestion)) {
        state.search.suggestions.unshift(suggestion);
        // Keep only last 10 suggestions
        state.search.suggestions = state.search.suggestions.slice(0, 10);
      }
    },
    
    addRecentSearch: (state, action) => {
      const query = action.payload;
      if (query && query.trim()) {
        state.search.recentSearches = [
          query,
          ...state.search.recentSearches.filter(q => q !== query)
        ].slice(0, 5);
      }
    },
    
    clearSearchHistory: (state) => {
      state.search.recentSearches = [];
      state.search.suggestions = [];
    },
    
    // ===== PANEL ACTIONS =====
    togglePanel: (state, action) => {
      const { panelId } = action.payload;
      if (state.panels[panelId]) {
        state.panels[panelId].isOpen = !state.panels[panelId].isOpen;
      }
    },
    
    openPanel: (state, action) => {
      const { panelId, data = null } = action.payload;
      if (state.panels[panelId]) {
        state.panels[panelId].isOpen = true;
        if (data !== null) {
          state.panels[panelId].data = data;
        }
      }
    },
    
    closePanel: (state, action) => {
      const { panelId } = action.payload;
      if (state.panels[panelId]) {
        state.panels[panelId].isOpen = false;
      }
    },
    
    setPanelWidth: (state, action) => {
      const { panelId, width } = action.payload;
      if (state.panels[panelId]) {
        state.panels[panelId].width = width;
      }
    },
    
    // ===== CONFIRMATION ACTIONS =====
    showConfirmation: (state, action) => {
      const { confirmId, message, onConfirm, onCancel, ...props } = action.payload;
      state.confirmations[confirmId] = {
        isOpen: true,
        message,
        onConfirm,
        onCancel,
        ...props,
      };
    },
    
    hideConfirmation: (state, action) => {
      const { confirmId } = action.payload;
      if (state.confirmations[confirmId]) {
        state.confirmations[confirmId].isOpen = false;
      }
    },
    
    // ===== BREADCRUMB ACTIONS =====
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action) => {
      state.breadcrumbs.push(action.payload);
    },
    
    removeBreadcrumb: (state, action) => {
      const index = action.payload;
      state.breadcrumbs.splice(index, 1);
    },
    
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },
    
    // ===== ACTIVE ELEMENT ACTIONS =====
    setActiveTab: (state, action) => {
      state.activeElements.activeTab = action.payload;
    },
    
    setFocusedRow: (state, action) => {
      state.activeElements.focusedRow = action.payload;
    },
    
    setSelectedItem: (state, action) => {
      state.activeElements.selectedItem = action.payload;
    },
    
    // ===== VIEW MODE ACTIONS =====
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // ===== BULK OPERATIONS ACTIONS =====
    startBulkOperation: (state, action) => {
      const { selectedItems = [], availableActions = [] } = action.payload;
      state.bulkOperations = {
        isActive: true,
        selectedItems,
        availableActions,
      };
    },
    
    endBulkOperation: (state) => {
      state.bulkOperations = {
        isActive: false,
        selectedItems: [],
        availableActions: [],
      };
    },
    
    updateBulkSelection: (state, action) => {
      state.bulkOperations.selectedItems = action.payload;
    },
    
    // ===== RESET ACTIONS =====
    resetTableState: (state) => {
      state.sortConfig = { key: null, direction: 'asc' };
      state.currentPage = 1;
      state.selectedRows = [];
      state.tableLoading = false;
      state.tableError = null;
    },
    
    resetUIState: (state) => {
      return {
        ...initialState,
        preferences: state.preferences, // Keep user preferences
      };
    },
  },
});

// Action creators
export const {
  // Table actions
  setSortConfig,
  toggleSort,
  setCurrentPage,
  setItemsPerPage,
  selectRow,
  deselectRow,
  selectAllRows,
  clearSelectedRows,
  toggleRowSelection,
  setTableLoading,
  setTableError,
  
  // Modal actions
  openModal,
  closeModal,
  updateModalData,
  closeAllModals,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearAllNotifications,
  updateNotification,
  
  // Loading actions
  setGlobalLoading,
  setSpecificLoading,
  setMultipleLoading,
  clearAllLoading,
  
  // Error actions
  setGlobalError,
  setFormError,
  clearFormErrors,
  setApiError,
  clearAllErrors,
  
  // Form actions
  initializeForm,
  updateFormField,
  setFormValues,
  resetForm,
  removeForm,
  
  // Preferences actions
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setCompactMode,
  setAnimations,
  updatePreferences,
  
  // Search actions
  setSearchQuery,
  setSearchFilters,
  addSearchSuggestion,
  addRecentSearch,
  clearSearchHistory,
  
  // Panel actions
  togglePanel,
  openPanel,
  closePanel,
  setPanelWidth,
  
  // Confirmation actions
  showConfirmation,
  hideConfirmation,
  
  // Breadcrumb actions
  setBreadcrumbs,
  addBreadcrumb,
  removeBreadcrumb,
  clearBreadcrumbs,
  
  // Active element actions
  setActiveTab,
  setFocusedRow,
  setSelectedItem,
  
  // View mode actions
  setViewMode,
  
  // Bulk operations actions
  startBulkOperation,
  endBulkOperation,
  updateBulkSelection,
  
  // Reset actions
  resetTableState,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectUI = (state) => state.ui;
export const selectSortConfig = (state) => state.ui.sortConfig;
export const selectCurrentPage = (state) => state.ui.currentPage;
export const selectItemsPerPage = (state) => state.ui.itemsPerPage;
export const selectSelectedRows = (state) => state.ui.selectedRows;
export const selectTableLoading = (state) => state.ui.tableLoading;
export const selectTableError = (state) => state.ui.tableError;

export const selectModal = (modalId) => (state) => state.ui.modals[modalId];
export const selectNotifications = (state) => state.ui.notifications;
export const selectLoading = (state) => state.ui.loading;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectSpecificLoading = (key) => (state) => state.ui.loading[key];

export const selectErrors = (state) => state.ui.errors;
export const selectGlobalError = (state) => state.ui.errors.global;

export const selectForm = (formId) => (state) => state.ui.forms[formId];
export const selectFormValues = (formId) => (state) => state.ui.forms[formId]?.values;
export const selectFormErrors = (formId) => (state) => state.ui.forms[formId]?.errors;

export const selectPreferences = (state) => state.ui.preferences;
export const selectTheme = (state) => state.ui.preferences.theme;
export const selectSidebarCollapsed = (state) => state.ui.preferences.sidebarCollapsed;

export const selectSearch = (state) => state.ui.search;
export const selectSearchQuery = (state) => state.ui.search.query;
export const selectRecentSearches = (state) => state.ui.search.recentSearches;

export const selectPanels = (state) => state.ui.panels;
export const selectPanel = (panelId) => (state) => state.ui.panels[panelId];

export const selectConfirmations = (state) => state.ui.confirmations;
export const selectConfirmation = (confirmId) => (state) => state.ui.confirmations[confirmId];

export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;
export const selectActiveElements = (state) => state.ui.activeElements;
export const selectViewMode = (state) => state.ui.viewMode;
export const selectBulkOperations = (state) => state.ui.bulkOperations;

// Complex selectors
export const selectSelectedRowsCount = (state) => state.ui.selectedRows.length;
export const selectHasSelectedRows = (state) => state.ui.selectedRows.length > 0;
export const selectIsAllRowsSelected = (totalRows) => (state) => 
  state.ui.selectedRows.length === totalRows && totalRows > 0;

export const selectActiveNotificationsCount = (state) => 
  state.ui.notifications.filter(n => !n.dismissed).length;

export const selectHasActiveModals = (state) => 
  Object.values(state.ui.modals).some(modal => modal.isOpen);

export const selectFormIsDirty = (formId) => (state) => 
  state.ui.forms[formId]?.isDirty || false;

export const selectFormIsValid = (formId) => (state) => 
  state.ui.forms[formId]?.isValid || false;

export default uiSlice.reducer;