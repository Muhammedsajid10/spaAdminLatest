import api from "../../../Service/Api";

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
      // Backend returns data: [...] (direct array)
      return response.data.data || [];
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
      return response.data.data || [];
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
      const bookings = response.data.data || [];
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
      // Backend returns data: { giftcards: [...] } or data: [...]
      return response.data.data?.giftcards || response.data.data || [];
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
      // Backend doesn't have a client-specific feedback endpoint
      // Return empty for now - can be implemented later if needed
      return [];
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
  }
};

export default clientService;
