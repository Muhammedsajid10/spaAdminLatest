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
  const [allergies, setAllergies] = useState([]); // Allergies list
  const [notes, setNotes] = useState([]); // Notes list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [clientData, statsData, bookingsData, salesData, giftCardsData, reviewsData, membershipsData, servicesData, employeesData, allergiesData, notesData] = await Promise.all([
        clientService.getClientDetails(clientId),
        clientService.getClientStats(clientId),
        clientService.getAllClientBookings(clientId), // Fetch ALL bookings (includeAll=true) for Appointments tab
        clientService.getClientSales(clientId),
        clientService.getClientGiftCards(clientId),
        clientService.getClientReviews(clientId),
        clientService.getClientMemberships(clientId),
        clientService.getServices(), // Fetch all services for lookup
        clientService.getEmployees(), // Fetch all employees for lookup
        clientService.getClientAllergies(clientId), // Allergies data
        clientService.getClientNotes(clientId) // Notes data
      ]);

      setClient(clientData);

      // Process stats data from backend
      let processedStats = {
        totalSpent: 0,
        appointmentsCount: 0,
        canceledCount: 0,
        noShowCount: 0,
        rating: '-'
      };

      if (statsData) {
        processedStats = {
          totalSpent: statsData.totalStats?.totalSpent || 0,
          appointmentsCount: statsData.totalStats?.totalBookings || 0,
          canceledCount: 0,
          noShowCount: 0,
          rating: '-'
        };

        // Count canceled and no-show bookings from bookingStats
        if (statsData.bookingStats && Array.isArray(statsData.bookingStats)) {
          statsData.bookingStats.forEach(stat => {
            if (stat._id === 'canceled' || stat._id === 'cancelled') {
              processedStats.canceledCount = stat.count;
            } else if (stat._id === 'noshow' || stat._id === 'no-show') {
              processedStats.noShowCount = stat.count;
            }
          });
        }

        // Calculate average rating from recent feedback
        if (statsData.recentFeedback && Array.isArray(statsData.recentFeedback) && statsData.recentFeedback.length > 0) {
          const totalRating = statsData.recentFeedback.reduce((sum, feedback) => {
            return sum + (feedback.ratings?.overall || 0);
          }, 0);
          const avgRating = totalRating / statsData.recentFeedback.length;
          processedStats.rating = avgRating.toFixed(1);
        }

        setStats(processedStats);
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
      if (reviewsData && Array.isArray(reviewsData) && reviewsData.length > 0) {
        setReviews(reviewsData);
      } else if (statsData && Array.isArray(statsData.recentFeedback) && statsData.recentFeedback.length > 0) {
        // Some backends include recent feedback/reviews inside the stats payload (recentFeedback)
        const statsReviews = statsData.recentFeedback.map((f, idx) => ({
          _id: f._id || `stats-feedback-${idx}`,
          rating: f.ratings?.overall || f.rating || f.ratingValue || 0,
          comment: f.comment || f.text || f.review || f.feedback || '',
          createdAt: f.createdAt || f.date || null,
          service: f.service, // Keep the full service object if available
          booking: f.booking, // Keep the full booking object if available
          employee: f.employee, // Keep the full employee object if available
          // Fallbacks for flat structures
          serviceName: f.service?.name || f.serviceName || '',
          bookingId: f.booking?._id || f.bookingId || null,
          employeeName: f.employee?.user?.firstName 
            ? `${f.employee.user.firstName} ${f.employee.user.lastName}` 
            : (f.employee?.name || '')
        }));

        try {
          // eslint-disable-next-line no-console
          console.debug('Using statsData.recentFeedback as reviews fallback:', statsReviews);
        } catch (e) {}

        setReviews(statsReviews);
      } else {
        // If backend has no dedicated reviews endpoint or stats feedback, try extracting reviews from bookings
        const derivedReviews = [];
        if (Array.isArray(bookingsData)) {
          bookingsData.forEach(booking => {
            // Various places reviews/feedback might be attached
            // 1) Single rating/comment fields
            const rating1 = booking.rating || booking.ratingValue || booking.ratingScore;
            const comment1 = booking.review || booking.comment || booking.reviewText;

            // 2) Nested feedback object
            const rating2 = booking.feedback?.rating || booking.feedback?.ratings?.overall;
            const comment2 = booking.feedback?.comment || booking.feedback?.text;

            // 3) Arrays of reviews/feedbacks
            const arrayReviews = Array.isArray(booking.reviews) ? booking.reviews : (Array.isArray(booking.feedbacks) ? booking.feedbacks : []);

            // 4) Other possible shapes
            const rating3 = booking.ratings?.overall || booking.ratings?.score;
            const comment3 = booking.customerFeedback || booking.clientFeedback;

            // Collect primary rating/comment if present
            const rating = rating1 || rating2 || rating3;
            const comment = comment1 || comment2 || comment3 || '';

            if (rating || comment) {
              derivedReviews.push({
                _id: `booking-${booking._id}-review`,
                rating: rating || 0,
                comment: comment || '',
                createdAt: booking.updatedAt || booking.completedAt || booking.createdAt,
                service: booking.services?.[0]?.service?.name || '' ,
                bookingId: booking._id
              });
            }

            // If booking contains an array of review objects, map them
            if (arrayReviews && Array.isArray(arrayReviews) && arrayReviews.length > 0) {
              arrayReviews.forEach((r, idx) => {
                const rrating = r.rating || r.ratings?.overall || r.score;
                const rcomment = r.comment || r.text || r.review || r.feedback;
                if (rrating || rcomment) {
                  derivedReviews.push({
                    _id: r._id || `booking-${booking._id}-review-${idx}`,
                    rating: rrating || 0,
                    comment: rcomment || '',
                    createdAt: r.createdAt || booking.updatedAt || booking.createdAt,
                    service: r.service?.name || booking.services?.[0]?.service?.name || '',
                    bookingId: booking._id
                  });
                }
              });
            }
          });
        }

        // Debug derived reviews
        try {
          // eslint-disable-next-line no-console
          console.debug('Derived reviews from bookings:', derivedReviews);
        } catch (e) {}

        if (derivedReviews.length > 0) {
          setReviews(derivedReviews);
        } else {
          setReviews([]);
        }
      }
      if (membershipsData) {
        setMemberships(membershipsData);
      }
      if (allergiesData && Array.isArray(allergiesData)) {
        setAllergies(allergiesData);
      } else {
        setAllergies([]);
      }
      if (notesData && Array.isArray(notesData)) {
        setNotes(notesData);
      } else {
        setNotes([]);
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
    allergies, // Allergies data
    notes, // Notes data
    loading,
    error,
    refetch: fetchClientData,
    updateClient
  };
};

export default useClientDetails;
