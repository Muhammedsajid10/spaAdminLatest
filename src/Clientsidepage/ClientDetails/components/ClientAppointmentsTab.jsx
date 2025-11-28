import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import './ClientAppointmentsTab.css';

const MOCK_APPOINTMENTS = [
  {
    id: 1,
    status: 'Completed',
    date: 'Thu 27 Nov 17:00',
    location: 'Allora Spa and Massage Centre Dubai',
    services: [
      { id: 1, name: 'Relaxing Massage', duration: '1h', staff: 'margirita Balute', price: 200 },
      { id: 2, name: 'Relaxing Massage', duration: '1h', staff: 'sarita Lamsal', price: 200 }
    ]
  },
  {
    id: 2,
    status: 'Booked',
    date: 'Fri 28 Nov 10:00',
    location: 'Allora Spa and Massage Centre Dubai',
    services: [
      { id: 3, name: 'Deep Tissue Massage', duration: '1h', staff: 'John Doe', price: 250 }
    ]
  },
  {
    id: 3,
    status: 'Canceled',
    date: 'Wed 26 Nov 14:00',
    location: 'Allora Spa and Massage Centre Dubai',
    services: [
      { id: 4, name: 'Facial', duration: '45m', staff: 'Jane Smith', price: 150 }
    ]
  }
];

const ClientAppointmentsTab = ({ client }) => {
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

  const filteredAppointments = MOCK_APPOINTMENTS.filter(appt => {
    if (filterStatus === 'All') return true;
    return appt.status.toLowerCase() === filterStatus.toLowerCase();
  });

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

      {/* Month Divider (Mock) */}
      <div className="month-divider">November</div>

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
                  <button className="btn-card-action">View sale</button>
                  <button className="btn-card-action">Rebook</button>
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
