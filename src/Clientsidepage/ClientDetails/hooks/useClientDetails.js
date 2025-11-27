import { useState, useEffect, useCallback } from 'react';
import clientService from '../services/clientService';

/**
 * Custom hook to manage client details logic
 * @param {string} clientId - The ID of the client to fetch
 * @returns {Object} Client data, stats, loading state, and actions
 */
const useClientDetails = (clientId) => {
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({
    totalSpent: 0,
    appointmentsCount: 0,
    canceledCount: 0,
    noShowCount: 0,
    rating: '-'
  });
  const [sales, setSales] = useState([]); // New state for sales list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [clientData, statsData, salesData] = await Promise.all([
        clientService.getClientDetails(clientId),
        clientService.getClientStats(clientId),
        clientService.getClientSales(clientId)
      ]);

      setClient(clientData);
      if (statsData) {
        setStats({
          totalSpent: statsData.totalSpent || 0,
          appointmentsCount: statsData.appointmentsCount || 0,
          canceledCount: statsData.canceledCount || 0,
          noShowCount: statsData.noShowCount || 0,
          rating: statsData.rating || '-'
        });
      }
      if (salesData) {
        setSales(salesData);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch client details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const updateClient = async (data) => {
    try {
      const updatedClient = await clientService.updateClient(clientId, data);
      setClient(updatedClient);
      return updatedClient;
    } catch (err) {
      throw err;
    }
  };

  return {
    client,
    stats,
    sales, // Return sales data
    loading,
    error,
    refetch: fetchClientData,
    updateClient
  };
};

export default useClientDetails;
