import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import './ClientAppointmentsTab.css';

const ClientAppointmentsTab = ({ client, bookings = [], servicesMap = {}, employeesMap = {} }) => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef(null);

  const moreOptions = ['Started', 'Completed',  'No-show'];
  const mainOptions = ['All',  'Confirmed'];

  // Normalize status strings for comparisons
  const normalize = (s) => {
    if (!s && s !== 0) return '';
    return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Mapping to handle multiple backend representations for same logical status
  const statusMap = {
    confirmed: ['confirmed', 'booked'],
    started: ['started'],
    completed: ['completed', 'complete'],
    noshow: ['noshow', 'noshows', 'no_show']
  };

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
        // Lookup service name
        let serviceName = 'Service';
        if (svc.service) {
          const serviceId = typeof svc.service === 'string' ? svc.service : svc.service._id;
          const serviceObj = servicesMap[serviceId];
          if (serviceObj) {
            serviceName = serviceObj.name;
          } else if (typeof svc.service === 'object' && svc.service.name) {
            serviceName = svc.service.name;
          }
        }
        
        // Lookup employee name
        let employeeName = 'Staff TBD';
        if (svc.employee) {
          const employeeId = typeof svc.employee === 'string' ? svc.employee : svc.employee._id;
          const employeeObj = employeesMap[employeeId];
          if (employeeObj) {
            employeeName = `${employeeObj.user?.firstName || employeeObj.firstName || ''} ${employeeObj.user?.lastName || employeeObj.lastName || ''}`.trim() || 'Staff Member';
          } else if (typeof svc.employee === 'object') {
            if (svc.employee.user) {
              employeeName = `${svc.employee.user.firstName || ''} ${svc.employee.user.lastName || ''}`.trim();
            } else if (svc.employee.firstName) {
              employeeName = `${svc.employee.firstName} ${svc.employee.lastName || ''}`.trim();
            }
          }
        }

        return {
          id: svc._id || index,
          name: serviceName,
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
  }, [bookings, servicesMap, employeesMap]);

  const filteredAppointments = useMemo(() => {
    const target = normalize(filterStatus);

    return formattedAppointments.filter(appt => {
      if (target === 'all' || target === '') return true;
      const apptStatus = normalize(appt.status);

      // If we have a mapping for the selected filter, match against mapped values
      if (statusMap[target]) {
        return statusMap[target].some(mapped => mapped === apptStatus);
      }

      return apptStatus === target;
    });
  }, [formattedAppointments, filterStatus]);

  // Debugging: print statuses so we can see what arrives from the backend
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('Appointments statuses:', formattedAppointments.map(a => ({ id: a.id, status: a.status, normalized: normalize(a.status) })));
    } catch (e) {
      // ignore
    }
  }, [formattedAppointments]);

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
            <div key={appt.id} className="appointment-card-client-side">
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
{/* 
                <div className="appointment-actions">
                  <button className="btn-card-action" onClick={() => console.log('View sale:', appt.bookingNumber)}>View sale</button>
                  <button className="btn-card-action" onClick={() => console.log('Rebook:', appt.id)}>Rebook</button>
                </div> */}
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
