import React, { useState, useEffect, useCallback } from "react";
import "./SearchBar.css";
import api from "../Service/Api"; // Corrected path as per your code

// Helper function to generate a random background color for avatars
const getRandomColor = () => {
  const colors = [
    "#FFDDC1", // Light Orange
    "#D1E7DD", // Light Green
    "#CCE5FF", // Light Blue
    "#F0FFF0", // Honeydew
    "#F8F8FF", // Ghost White
    "#F0F8FF", // Alice Blue
    "#FFF0F5", // Lavender Blush
    "#E0FFFF", // Light Cyan
    "#F5DEB3", // Wheat
    "#DDA0DD", // Plum
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Searchbar = () => {
  const [allAppointments, setAllAppointments] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Removed: appointmentSortOrder, clientSortOrder states

  // Helper function to format appointment details
  const formatAppointmentDetails = (booking) => {
    const teamMembers = booking.services
      .map((s) =>
        s.employee && s.employee.user
          ? `${s.employee.user.firstName} ${s.employee.user.lastName}`
          : ""
      )
      .filter(Boolean)
      .join(", ");

    const clientName =
      booking.client && booking.client.firstName
        ? `${booking.client.firstName} ${booking.client.lastName}`
        : "N/A";

    const serviceNames = booking.services
      .map((s) => s.service?.name)
      .filter(Boolean)
      .join(", ");

    const formattedDuration = booking.totalDuration
      ? `${Math.round(booking.totalDuration / 60)}h`
      : "";

    return {
      id: booking._id,
      date: booking.appointmentDate
        ? new Date(booking.appointmentDate).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
          })
        : "-",
      time: booking.appointmentDate
        ? new Date(booking.appointmentDate).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "-",
      status: booking.status || "Unknown",
      service: serviceNames || "No Service",
      details: `${clientName}, ${formattedDuration} with ${teamMembers}`,
      price: booking.finalAmount
        ? `AED ${booking.finalAmount.toFixed(2)}`
        : "AED 0.00",
      rawClientName: clientName,
      rawClientPhone: booking.client?.phone || "",
      rawClientEmail: booking.client?.email || "",
      rawBookingRef: booking.bookingNumber || booking._id,
      // Store the raw date object for sorting
      appointmentDateTime: booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(0),
    };
  };

  // Fetch appointments from backend
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get("/bookings/admin/all");
      const bookings = res.data.data.bookings || [];

      const now = new Date();
      const mappedAppointments = bookings
        .map(formatAppointmentDetails)
        .filter((appt) => appt.appointmentDateTime >= now); // Filter for upcoming

      setAllAppointments(mappedAppointments);
      // Fixed sort for initial display: Most recent upcoming first
      setFilteredAppointments(
        [...mappedAppointments].sort((a, b) => b.appointmentDateTime - a.appointmentDateTime).slice(0, 5)
      );
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load appointments"
      );
    }
  }, []); // Removed appointmentSortOrder from dependencies

  // Fetch clients from backend
  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get("/admin/clients");
      const clientsData = res.data.data.clients || [];

      const transformedClients = clientsData.map((client) => ({
        id: client._id,
        name: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
        phone: client.phone || "-",
        email: client.email || "-",
        initial: (client.firstName ? client.firstName[0] : (client.lastName ? client.lastName[0] : '?')).toUpperCase(),
        color: getRandomColor(),
        createdAt: client.createdAt ? new Date(client.createdAt) : new Date(0), // Store raw date for sorting
      }));
      setAllClients(transformedClients);
      // Fixed sort for initial display: Most recent added clients first
      setFilteredClients(
        [...transformedClients].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
      );
    } catch (err) {
      console.error("Failed to load clients:", err);
      setError(err.response?.data?.message || err.message || "Failed to load clients");
    }
  }, []); // Removed clientSortOrder from dependencies

  // Effect to fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchAppointments(), fetchClients()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchAppointments, fetchClients]);

  // Effect to handle search filtering and fixed sorting
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    // Filter and Sort Appointments (current to old)
    const appointments = allAppointments
      .filter((appt) => {
        return (
          appt.rawClientName.toLowerCase().includes(lowercasedSearchTerm) ||
          appt.rawClientPhone.toLowerCase().includes(lowercasedSearchTerm) ||
          appt.rawClientEmail.toLowerCase().includes(lowercasedSearchTerm) ||
          appt.rawBookingRef.toLowerCase().includes(lowercasedSearchTerm) ||
          appt.service.toLowerCase().includes(lowercasedSearchTerm) ||
          appt.details.toLowerCase().includes(lowercasedSearchTerm)
        );
      })
      .sort((a, b) => b.appointmentDateTime - a.appointmentDateTime); // Fixed: Current to old

    setFilteredAppointments(searchTerm ? appointments : appointments.slice(0, 5)); // Apply slice only if no search term

    // Filter and Sort Clients (recent to old)
    const clients = allClients
      .filter((client) => {
        return (
          client.name.toLowerCase().includes(lowercasedSearchTerm) ||
          client.phone.toLowerCase().includes(lowercasedSearchTerm) ||
          client.email.toLowerCase().includes(lowercasedSearchTerm)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Fixed: Recent to old

    setFilteredClients(searchTerm ? clients : clients.slice(0, 5)); // Apply slice only if no search term
  }, [searchTerm, allAppointments, allClients]); // Removed sort orders from dependencies

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Removed: toggleAppointmentSort, toggleClientSort functions

  if (loading) {
    return (
      <div className="search-page loading-state">
        <div className="loading-spinner"></div>
        <p className="search-subtext">Fetching the latest data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-page error-state">
        <h2 className="error-title">Oops! Something went wrong.</h2>
        <p className="error-message">Error: {error}</p>
        <p className="error-tip">Please check your internet connection or try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="search-page">
      <input
        className="search-bar"
        type="text"
        placeholder="What are you looking for?"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <p className="search-subtext">
        Search by client name, mobile, email, service, booking reference or appointment details
      </p>

      <div className="content">
        <div className="appointments">
          <h2>
            {searchTerm ? "Matching Appointments" : "Upcoming Appointments"}
            {/* Removed: Sort button */}
          </h2>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => (
              <div className="appointment-card" key={appt.id}>
                <div className="date">{appt.date}</div>
                <div className="info">
                  <div className="time-status-wrapper"> {/* HTML change for time-status-wrapper */}
                    <span className="time">{appt.time}</span>
                    <span className="status">{appt.status}</span>
                  </div>
                  <h3>{appt.service}</h3>
                  <p>{appt.details}</p>
                </div>
                <div className="price">{appt.price}</div>
              </div>
            ))
          ) : (
            <p className="no-results-message">
              {searchTerm
                ? "No appointments match your search."
                : "No upcoming appointments found."}
            </p>
          )}
        </div>

        <div className="clients">
          <h2>
            {searchTerm ? "Matching Clients" : "Clients (Recently Added)"}
            {/* Removed: Sort button */}
          </h2>
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div className="client-card" key={client.id}>
                <div className="client-avatar" style={{ backgroundColor: client.color }}>
                  {client.initial}
                </div>
                <div>
                  <div className="client-name">{client.name}</div>
                  <div className="client-phone">{client.phone}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results-message">
              {searchTerm
                ? "No clients match your search."
                : "No recent clients found."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Searchbar;