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
      return response.data.data;
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
      return response.data.data;
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
  }
};

export default clientService;
