import api from '@api';

/**
 * Service to handle all client-related API calls for the details view
 */
const clientService = {
  /**
   * Fetch full client details by ID
   * @param {string} clientId 
   * @returns {Promise<Object>} Client data
   */
  getClientDetails: async (clientId) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}`);
      // Backend returns { data: { client: {...} } }, so we need response.data.data.client
      return response.data.data.client || response.data.data;
    } catch (error) {
      console.error("Error fetching client details:", error);
      throw error;
    }
  },

  /**
   * Fetch client statistics (sales, appointments, etc.)
   * @param {string} clientId 
   * @returns {Promise<Object>} Client statistics
   */
  getClientStats: async (clientId) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}/stats`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching client stats:", error);
      throw error;
    }
  },

  /**
   * Update client information
   * @param {string} clientId 
   * @param {Object} updateData 
   * @returns {Promise<Object>} Updated client data
   */
  updateClient: async (clientId, updateData) => {
    try {
      
      const response = await api.patch(`/admin/clients/${clientId}`, updateData);
      // Backend returns { data: { client: {...} } } or just { data: {...} }
      // Check for nested client object first
      return response.data.data.client || response.data.data;
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  },

  /**
   * Fetch client sales history
   * @param {string} clientId 
   * @returns {Promise<Array>} List of sales records
   */
  getClientSales: async (clientId) => {
    try {
      // Assuming endpoint, can be adjusted if needed
      const response = await api.get(`/admin/clients/${clientId}/sales`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching client sales:", error);
      // Return empty array on error to prevent UI crash, or throw if strict
      return []; 
    }
  },

  /**
   * Fetch client bookings/services (filtered: confirmed, noshow, complete, started)
   * @param {string} clientId 
   * @returns {Promise<Array>} List of client bookings
   */
  getClientBookings: async (clientId) => {
    try {
      const response = await api.get(`/admin/clients/${clientId}/bookings`);
      let bookings = response.data.data;
      if (!Array.isArray(bookings)) {
        bookings = bookings?.bookings || [];
      }
      return Array.isArray(bookings) ? bookings : [];
    } catch (error) {
      console.error("Error fetching client bookings:", error);
      return [];
    }
  },

  /**
   * Fetch ALL client bookings/appointments (all statuses)
   * @param {string} clientId 
   * @returns {Promise<Array>} List of all client bookings
   */
  getAllClientBookings: async (clientId) => {
    try {
      // Use same endpoint with includeAll=true to get all bookings
      const response = await api.get(`/admin/clients/${clientId}/bookings?includeAll=true`);
      let bookings = response.data.data;
      if (!Array.isArray(bookings)) {
        bookings = bookings?.bookings || [];
      }
      return Array.isArray(bookings) ? bookings : [];
    } catch (error) {
      console.error("Error fetching all client bookings:", error);
      return [];
    }
  },

  /**
   * Fetch client sales/payments
   * @param {string} clientId 
   * @returns {Promise<Array>} List of client payments
   */
  getClientSales: async (clientId) => {
    try {
      // Get bookings and convert to sales format
      const response = await api.get(`/admin/clients/${clientId}/bookings`);
      let bookings = response.data.data;
      
      // Handle potential response structures
      if (!Array.isArray(bookings)) {
        bookings = bookings?.bookings || [];
      }
      
      if (!Array.isArray(bookings)) {
        console.warn("getClientSales: Expected array but got:", bookings);
        return [];
      }
      // Convert bookings to sales/payment format
      return bookings.map(booking => ({
        _id: booking._id,
        createdAt: booking.createdAt,
        paymentStatus: booking.paymentStatus || 'pending',
        paymentMethod: booking.paymentMethod || 'cash',
        finalAmount: booking.finalAmount || booking.totalAmount || 0,
        amount: booking.totalAmount || 0,
        booking: booking
      }));
    } catch (error) {
      console.error("Error fetching client sales:", error);
      return [];
    }
  },

  /**
   * Fetch client gift cards
   * @param {string} clientId 
   * @returns {Promise<Array>} List of client gift cards
   */
  getClientGiftCards: async (clientId) => {
    try {
      const response = await api.get(`/giftcards/purchased?clientId=${clientId}`);
      // Backend returns data: { giftCards: [...] } (note: capital C)
      return response.data.data?.giftCards || response.data.data || [];
    } catch (error) {
      console.error("Error fetching client gift cards:", error);
      return [];
    }
  },

  /**
   * Fetch client reviews/feedback
   * @param {string} clientId 
   * @returns {Promise<Array>} List of client reviews
   */
  getClientReviews: async (clientId) => {
    try {
      // Try common review endpoints. Some backends expose client reviews at
      // /admin/clients/:id/reviews or at /reviews?clientId=:id
      try {
        const res = await api.get(`/admin/clients/${clientId}/reviews`);
        return res.data.data || [];
      } catch (err) {
        // fallback to query param style
        try {
          const res2 = await api.get(`/reviews?clientId=${clientId}`);
          return res2.data.data || [];
        } catch (err2) {
          console.warn('getClientReviews: no reviews endpoint found, returning empty array');
          return [];
        }
      }
    } catch (error) {
      console.error("Error fetching client reviews:", error);
      return [];
    }
  },

  /**
   * Fetch client memberships
   * @param {string} clientId 
   * @returns {Promise<Array>} List of client memberships
   */
  getClientMemberships: async (clientId) => {
    try {
      const response = await api.get(`/memberships/my-memberships/${clientId}`);
      // Backend returns data: { memberships: [...] }
      return response.data.data?.memberships || [];
    } catch (error) {
      console.error("Error fetching client memberships:", error);
      return [];
    }
  },

  /**
   * Fetch all services for lookup
   * @returns {Promise<Array>} List of all services
   */
  getServices: async () => {
    try {
      const response = await api.get('/services');
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  },

  /**
   * Fetch all employees for lookup
   * @returns {Promise<Array>} List of all employees
   */
  getEmployees: async () => {
    try {
      const response = await api.get('/employees');
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },

  /**
   * Fetch allergy configuration (reactions, severity levels, etc.)
   * @returns {Promise<Object>} Configuration data
   */
  getAllergyConfig: async () => {
    try {
      const response = await api.get('/admin/allergies/config');
      return response.data.data;
    } catch (error) {
      console.error("Error fetching allergy config:", error);
      throw error;
    }
  },

  /**
   * Fetch client allergies
   * @param {string} clientId 
   * @param {boolean} includeAll - Include all statuses (active, resolved, archived)
   * @returns {Promise<Array>} List of client allergies
   */
  getClientAllergies: async (clientId, includeAll = false) => {
    try {
      const url = includeAll 
        ? `/admin/clients/${clientId}/allergies?includeAll=true`
        : `/admin/clients/${clientId}/allergies`;
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching client allergies:", error);
      return [];
    }
  },

  /**
   * Create a new allergy for a client
   * @param {string} clientId 
   * @param {Object} allergyData - { type, name, reaction, severity, note }
   * @returns {Promise<Object>} Created allergy
   */
  createAllergy: async (clientId, allergyData) => {
    try {
      const response = await api.post(`/admin/clients/${clientId}/allergies`, allergyData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating allergy:", error);
      throw error;
    }
  },

  /**
   * Update an existing allergy
   * @param {string} allergyId 
   * @param {Object} allergyData - { name, reaction, severity, note, status }
   * @returns {Promise<Object>} Updated allergy
   */
  updateAllergy: async (allergyId, allergyData) => {
    try {
      const response = await api.patch(`/admin/allergies/${allergyId}`, allergyData);
      return response.data.data;
    } catch (error) {
      console.error("Error updating allergy:", error);
      throw error;
    }
  },

  /**
   * Delete (archive) an allergy
   * @param {string} allergyId 
   * @returns {Promise<Object>} Response
   */
  deleteAllergy: async (allergyId) => {
    try {
      const response = await api.delete(`/admin/allergies/${allergyId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting allergy:", error);
      throw error;
    }
  },

  /**
   * Fetch client notes
   * @param {string} clientId 
   * @param {string} type - Optional filter: 'client' or 'appointment'
   * @returns {Promise<Array>} List of client notes
   */
  getClientNotes: async (clientId, type = null) => {
    try {
      const url = type 
        ? `/admin/clients/${clientId}/notes?type=${type}`
        : `/admin/clients/${clientId}/notes`;
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching client notes:", error);
      return [];
    }
  },

  /**
   * Create a new note for a client
   * @param {string} clientId 
   * @param {Object} noteData - { content, type, bookingId, isPinned, isPrivate }
   * @returns {Promise<Object>} Created note
   */
  createNote: async (clientId, noteData) => {
    try {
      const response = await api.post(`/admin/clients/${clientId}/notes`, noteData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  },

  /**
   * Update an existing note
   * @param {string} noteId 
   * @param {Object} noteData - { content, isPinned, isPrivate }
   * @returns {Promise<Object>} Updated note
   */
  updateNote: async (noteId, noteData) => {
    try {
      const response = await api.patch(`/admin/notes/${noteId}`, noteData);
      return response.data.data;
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  },

  /**
   * Delete a note
   * @param {string} noteId 
   * @returns {Promise<Object>} Response
   */
  deleteNote: async (noteId) => {
    try {
      const response = await api.delete(`/admin/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  },

  /**
   * Toggle pin status of a note
   * @param {string} noteId 
   * @returns {Promise<Object>} Updated note
   */
  togglePinNote: async (noteId) => {
    try {
      const response = await api.patch(`/admin/notes/${noteId}/toggle-pin`);
      return response.data.data;
    } catch (error) {
      console.error("Error toggling pin note:", error);
      throw error;
    }
  }
};

export default clientService;
