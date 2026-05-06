import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  fetchSearchAppointments,
  fetchSearchClients,
  setSearchTerm,
  selectSearchTerm,
  selectFilteredAppointments,
  selectFilteredClients,
  selectSearchLoading,
  selectSearchError
} from './searchSlice';
import Loading from "../../states/Loading";
import Error500Page from "../../states/ErrorPage";
import './search.css';

const SearchBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  const searchTerm = useSelector(selectSearchTerm);
  const filteredAppointments = useSelector(selectFilteredAppointments);
  const filteredClients = useSelector(selectFilteredClients);
  const loading = useSelector(selectSearchLoading);
  const error = useSelector(selectSearchError);

  // Effect to fetch initial data
  useEffect(() => { 
    const fetchData = async () => {
      await Promise.all([
        dispatch(fetchSearchAppointments()),
        dispatch(fetchSearchClients())
      ]);
    };
    fetchData();
  }, [dispatch]);

  // Handle search input change
  const handleSearchChange = (event) => {
    dispatch(setSearchTerm(event.target.value));
  };

  if (error) {
    return <Error500Page />;
  }

  return (
    <div className="search-page" data-loaded={!loading}>
      <div className="search-header">
        <div className="search-header-top">
          <h1>What are you looking for?</h1>
          <button className="search-close-btn" onClick={handleClose} title="Close search">
            <X size={24} />
          </button>
        </div>
        <div className="search-field-wrapper">
          <input
            className="search-bar"
            type="text"
            placeholder="Search by client name, mobile, email, service, booking reference or appointment details"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
      </div>

      <div className="content">
        <div className="appointments">
          <h2>{searchTerm ? "Matching Appointments" : "Upcoming Appointments"}</h2>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => (
              <div className="appointment-card" key={appt.id}>
                <div className="date">{appt.date}</div>
                <div className="info">
                  <div className="time-status-wrapper">
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
                : "No upcoming appointments."}
            </p>
          )}
        </div>

        <div className="clients">
          <h2>{searchTerm ? "Matching Clients" : "Clients (Recently Added)"}</h2>
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div className="client-card" key={client.id}>
                <div
                  className="client-avatar"
                  style={{ backgroundColor: client.color }}
                >
                  {client.initial}
                </div>
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-phone">{client.phone}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results-message">
              {searchTerm
                ? "No clients match your search."
                : "No clients found."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;