import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './TopNavBar.css'; // Your CSS file
import { FiSearch } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";
import { MoreVertical, CheckCircle, Users } from 'lucide-react';
import spa from '../Images/WhatsApp Image 2025-07-21 at 13.52.40_0846e8b9.jpg'; // Assuming this path is correct
import { useNavigate } from 'react-router-dom';
import api from '../Service/Api'; // Assuming your API instance
import { CircularProgress } from '@mui/material'; // For loading indicator

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [appointments, setAppointments] = useState([]); // State for API fetched appointments
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);

  const navigate = useNavigate();

  // Helper for avatar colors (consistent with previous implementations)
  const getRandomColor = useCallback(() => {
    const colors = [
      '#6a0dad', '#8b5cf6', '#a16207', '#16a34a', '#0ea5e9', '#ef4444', '#7c3aed', '#db2777'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    setAppointmentsError(null);
    try {
      // Fetch only upcoming or recent bookings relevant for a notification dropdown
      // Example: fetch last 10 bookings, or only unread ones, etc.
      // For simplicity, fetching all, then filtering. Adjust API endpoint as needed.
      const res = await api.get("/bookings/admin/all"); 
      const bookings = res.data.data.bookings || [];

      // Process bookings to fit the existing appointment item structure
      const processedAppointments = bookings
        .filter(booking => new Date(booking.appointmentDate) >= new Date()) // Only show current/future appointments
        .sort((a,b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)) // Sort by date ascending
        .slice(0, 10) // Limit to top 10 upcoming appointments for notification list
        .map(booking => {
        const clientName = booking.client && booking.client.firstName 
                           ? `${booking.client.firstName} ${booking.client.lastName}` 
                           : 'Unknown Client';
        const serviceName = booking.services?.[0]?.service?.name || 'Unknown Service';
        const appointmentTime = booking.appointmentDate 
                                ? new Date(booking.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : 'N/A';
        const appointmentDate = booking.appointmentDate
                                ? new Date(booking.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', weekday: 'short' })
                                : 'N/A';
        const avatarInitial = clientName.charAt(0).toUpperCase();

        return {
          id: booking._id,
          name: clientName,
          service: serviceName,
          amount: `AED ${booking.finalAmount ? booking.finalAmount.toFixed(2) : '0.00'}`,
          date: `${appointmentTime} ${appointmentDate.replace(',', '')}`, // e.g., "17:45 Tue 10"
          status: "read", // Assuming all shown are "read" or default, adjust if API provides
          avatar: avatarInitial,
          avatarColor: getRandomColor() // Assign a random color
        };
      });
      setAppointments(processedAppointments);

    } catch (err) {
      console.error("Failed to fetch appointments for notification:", err);
      setAppointmentsError(err.message || "Failed to load appointments.");
    } finally {
      setLoadingAppointments(false);
    }
  }, [getRandomColor]);

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Control body overflow when dropdowns are open
  useEffect(() => {
    if (showSearch || showNotifications) {
      document.body.classList.add('dropdown-open');
    } else {
      document.body.classList.remove('dropdown-open');
    }
    return () => {
      document.body.classList.remove('dropdown-open');
    };
  }, [showSearch, showNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside any part of the navbar, including its dropdowns
      const navbarElement = document.querySelector('.navbar-container');
      if (navbarElement && !navbarElement.contains(event.target)) {
        setShowSearch(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle Search dropdown / Navigate to Search page
  const toggleSearch = () => {
    // As per your previous instruction, navigate to search-bar page
    navigate('search-bar'); 
    // If you want to show an *inline search dropdown*, uncomment below and remove navigate
    // setShowSearch(prev => !prev);
    // setShowNotifications(false);
  };

  // Toggle Notification dropdown and fetch data if opening
  const toggleNotification = () => {
    setShowNotifications(prev => {
      if (!prev) { // If it's about to open, fetch data
        fetchAppointments();
      }
      return !prev;
    });
    setShowSearch(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Memoize the rendered appointments list for performance
  const renderedAppointments = useMemo(() => {
    if (loadingAppointments) {
      return (
        <div className="notification-status">
          <CircularProgress size={20} color="primary" />
          <p>Loading appointments...</p>
        </div>
      );
    }
    if (appointmentsError) {
      return (
        <div className="notification-status notification-status--error">
          <p>Error: {appointmentsError}</p>
          <button onClick={fetchAppointments} className="notification-status__retry-btn">Retry</button>
        </div>
      );
    }
    if (appointments.length === 0) {
      return (
        <div className="notification-status">
          <p>No upcoming appointments.</p>
        </div>
      );
    }

    return (
      <div className="appointments-section">
        <div className="section-header">
          <span className="section-title">Upcoming</span> {/* Changed from "Read" to "Upcoming" */}
        </div>
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-item">
              <div className="appointment-avatar-container">
                <div className="appointment-avatar" style={{backgroundColor: appointment.avatarColor}}>
                  {appointment.avatar}
                </div>
                <div className="status-indicators">
                  {/* Assuming CheckCircle implies confirmed, Users implies multiple attendees or team */}
                  <CheckCircle size={16} className="check-icon" /> 
                  <Users size={14} className="users-icon" />
                </div>
              </div>

              <div className="appointment-content">
                <div className="appointment-main">
                  <span className="customer-name">{appointment.name}</span>
                  <span className="booking-text">booked online</span>
                  <span className="amount">{appointment.amount}</span>
                </div>
                <div className="appointment-details">
                  <span className="date-time">{appointment.date}</span>
                  <span className="service-name">{appointment.service}</span>
                  <span className="booking-info">booked with you</span> {/* Simplified info */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [appointments, loadingAppointments, appointmentsError, fetchAppointments]);


  return (
    <nav className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-left-content">
        <img src={spa} alt="Logo" className='spa-image' />
      </div>

      <div className="navbar-right-content">
        <div className="navbar-icons">
          <div className="search-wrapper">
            <button className='icon' onClick={toggleSearch} aria-label="Search">
              <FiSearch />
            </button>
            {/* Conditional inline search dropdown - currently navigates to search-bar page */}
            {/* {showSearch && (
              <div className="search-dropdown">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )} */}
          </div>

          <div className="notification-wrapper">
            <button className='icon' onClick={toggleNotification} aria-label="Notifications">
              <IoNotificationsOutline />
            </button>
            {showNotifications && (
              <div className="notification-dropdown custom-popup">
                <div className="appointments-container">
                  <div className="appointments-header">
                    <h1 className="appointments-title">Appointments</h1>
                    <button className="more-button" aria-label="More options">
                      <MoreVertical size={20} className="more-icon" />
                    </button>
                  </div>
                  {renderedAppointments} {/* Render memoized appointments */}
                </div>
              </div>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;