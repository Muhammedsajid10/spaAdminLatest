import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import './ClientAppointmentsTab.css';

const ClientAppointmentsTab = ({ client, bookings = [] }) => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef(null);

  const moreOptions = ['Arrived', 'Started', 'Completed', 'Canceled', 'No-show'];
  const mainOptions = ['All', 'Booked', 'Confirmed'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  const handleFilterClick = (status) => {
    setFilterStatus(status);
    setIsMoreOpen(false);
  };

  // Format bookings into appointments structure
  const formattedAppointments = useMemo(() => {
    return bookings.map(booking => {
      const date = booking.appointmentDate 
        ? new Date(booking.appointmentDate).toLocaleString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '')
        : '';

      const services = (booking.services || []).map((svc, index) => {
        const employeeName = svc.employee?.user 
          ? `${svc.employee.user.firstName || ''} ${svc.employee.user.lastName || ''}`.trim()
          : (svc.employee?.firstName && svc.employee?.lastName 
            ? `${svc.employee.firstName} ${svc.employee.lastName}`.trim()
            : 'Staff TBD');

        return {
          id: svc._id || index,
          name: svc.service?.name || 'Service',
          duration: `${svc.duration || 60}min`,
          staff: employeeName,
          price: svc.price || 0
        };
      });

      return {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status || 'booked',
        date: date,
        location: 'Allora Spa Dubai',
        services: services,
        totalAmount: booking.finalAmount || booking.totalAmount || 0
      };
    });
  }, [bookings]);

  const filteredAppointments = useMemo(() => {
    return formattedAppointments.filter(appt => {
      if (filterStatus === 'All') return true;
      return appt.status.toLowerCase() === filterStatus.toLowerCase();
    });
  }, [formattedAppointments, filterStatus]);

  const isMoreActive = moreOptions.includes(filterStatus);

  return (
    <div className="appointments-tab-container">
      <div className="appointments-header">
        <h2 className="appointments-title">Appointments</h2>
      </div>

      {/* Filters */}
      <div className="appointments-filters">
        {mainOptions.map(option => (
          <button
            key={option}
            className={`filter-btn ${filterStatus === option ? 'active' : ''}`}
            onClick={() => handleFilterClick(option)}
          >
            {option}
          </button>
        ))}

        <div className="filter-dropdown-container" ref={dropdownRef}>
          <button
            className={`filter-btn filter-dropdown-trigger ${isMoreActive ? 'active' : ''}`}
            onClick={() => setIsMoreOpen(!isMoreOpen)}
          >
            More
            <ChevronDown size={14} style={{ transform: isMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isMoreOpen && (
            <div className="filter-dropdown-menu">
              {moreOptions.map(option => (
                <div
                  key={option}
                  className={`dropdown-item ${filterStatus === option ? 'active' : ''}`}
                  onClick={() => handleFilterClick(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="appointments-list">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appt => (
            <div key={appt.id} className="appointment-card">
              <div className="timeline-icon">
                <Calendar size={16} />
              </div>
              <div className="timeline-line" />
              
              <div className="appointment-content">
                <div className="appointment-header-row">
                  <span className="appointment-title">Appointment</span>
                  <span className={`appointment-status ${appt.status.toLowerCase()}`}>{appt.status}</span>
                </div>
                <div className="appointment-meta">
                  {appt.date} • {appt.location}
                </div>

                <div className="appointment-services">
                  {appt.services.map((service, index) => (
                    <div key={service.id} className="service-item">
                      <div className="service-info">
                        <div className="service-number">{index + 1}</div>
                        <div className="service-details">
                          <span className="service-name">{service.name}</span>
                          <span className="service-meta">{service.duration} • {service.staff}</span>
                        </div>
                      </div>
                      <span className="service-price">AED {service.price}</span>
                    </div>
                  ))}
                </div>

                <div className="appointment-actions">
                  <button className="btn-card-action" onClick={() => console.log('View sale:', appt.bookingNumber)}>View sale</button>
                  <button className="btn-card-action" onClick={() => console.log('Rebook:', appt.id)}>Rebook</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No appointments found for this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAppointmentsTab;
