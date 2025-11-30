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
  const [bookings, setBookings] = useState([]); // Bookings for both Appointments and Items tabs
  const [memberships, setMemberships] = useState([]); // Memberships list
  const [sales, setSales] = useState([]); // Sales/payments list
  const [giftCards, setGiftCards] = useState([]); // Gift cards list
  const [reviews, setReviews] = useState([]); // Reviews list
  const [servicesMap, setServicesMap] = useState({}); // Services lookup map
  const [employeesMap, setEmployeesMap] = useState({}); // Employees lookup map
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [clientData, statsData, bookingsData, salesData, giftCardsData, reviewsData, membershipsData, servicesData, employeesData] = await Promise.all([
        clientService.getClientDetails(clientId),
        clientService.getClientStats(clientId),
        clientService.getClientBookings(clientId), // Bookings for both Appointments and Items tabs
        clientService.getClientSales(clientId),
        clientService.getClientGiftCards(clientId),
        clientService.getClientReviews(clientId),
        clientService.getClientMemberships(clientId),
        clientService.getServices(), // Fetch all services for lookup
        clientService.getEmployees() // Fetch all employees for lookup
      ]);

      console.log('📦 Hook received data:', {
        clientData,
        statsData,
        bookingsData,
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
        setBookings(bookingsData);
      } else {
        setBookings([]);
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
      
      // Create lookup maps for services and employees
      const svcMap = {};
      if (Array.isArray(servicesData)) {
        servicesData.forEach(svc => {
          if (svc._id) svcMap[svc._id] = svc;
        });
      }
      
      const empMap = {};
      if (Array.isArray(employeesData)) {
        employeesData.forEach(emp => {
          if (emp._id) empMap[emp._id] = emp;
        });
      }
      
      setServicesMap(svcMap);
      setEmployeesMap(empMap);
      
      console.log('✅ Hook state updated:', {
        client: clientData,
        bookings: bookingsData?.length,
        sales: salesData?.length,
        giftCards: giftCardsData?.length,
        reviews: reviewsData?.length,
        memberships: membershipsData?.length,
        servicesMapSize: Object.keys(svcMap).length,
        employeesMapSize: Object.keys(empMap).length
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
    allBookings: bookings, // Alias for compatibility
    bookings, // Bookings for both tabs
    sales, // Sales/payments data
    giftCards, // Gift cards data
    reviews, // Reviews data
    memberships, // Memberships data
    servicesMap, // Services lookup map
    employeesMap, // Employees lookup map
    loading,
    error,
    refetch: fetchClientData,
    updateClient
  };
};

export default useClientDetails;
