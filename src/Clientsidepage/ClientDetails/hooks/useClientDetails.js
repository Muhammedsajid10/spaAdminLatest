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
  const [allBookings, setAllBookings] = useState([]); // All appointments (all statuses)
  const [bookings, setBookings] = useState([]); // Filtered bookings for Items tab
  const [memberships, setMemberships] = useState([]); // Memberships list
  const [sales, setSales] = useState([]); // Sales/payments list
  const [giftCards, setGiftCards] = useState([]); // Gift cards list
  const [reviews, setReviews] = useState([]); // Reviews list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [clientData, statsData, bookingsData, allAppointmentsData, salesData, giftCardsData, reviewsData, membershipsData] = await Promise.all([
        clientService.getClientDetails(clientId),
        clientService.getClientStats(clientId),
        clientService.getClientBookings(clientId), // Filtered bookings for Items tab
        clientService.getAllClientBookings(clientId), // All bookings for Appointments tab
        clientService.getClientSales(clientId),
        clientService.getClientGiftCards(clientId),
        clientService.getClientReviews(clientId),
        clientService.getClientMemberships(clientId)
      ]);

      console.log('📦 Hook received data:', {
        clientData,
        statsData,
        bookingsData,
        allAppointmentsData,
        salesData,
        giftCardsData,
        reviewsData,
        membershipsData
      });

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
      if (bookingsData && Array.isArray(bookingsData)) {
        // Backend already filters for: confirmed, noshow, complete, started
        setBookings(bookingsData);
      } else {
        setBookings([]);
      }
      if (allAppointmentsData && Array.isArray(allAppointmentsData)) {
        setAllBookings(allAppointmentsData);
      } else {
        setAllBookings([]);
      }
      if (salesData && Array.isArray(salesData)) {
        setSales(salesData);
      } else {
        setSales([]);
      }
      if (giftCardsData && Array.isArray(giftCardsData)) {
        setGiftCards(giftCardsData);
      } else {
        setGiftCards([]);
      }
      if (reviewsData && Array.isArray(reviewsData)) {
        setReviews(reviewsData);
      } else {
        setReviews([]);
      }
      if (membershipsData) {
        setMemberships(membershipsData);
      }
      
      console.log('✅ Hook state updated:', {
        client: clientData,
        allBookings: allAppointmentsData?.length,
        bookings: bookingsData?.length,
        sales: salesData?.length,
        giftCards: giftCardsData?.length,
        reviews: reviewsData?.length,
        memberships: membershipsData?.length
      });
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
    allBookings, // All appointments for Appointments tab
    bookings, // Filtered bookings for Items tab
    sales, // Sales/payments data
    giftCards, // Gift cards data
    reviews, // Reviews data
    memberships, // Memberships data
    loading,
    error,
    refetch: fetchClientData,
    updateClient
  };
};

export default useClientDetails;
