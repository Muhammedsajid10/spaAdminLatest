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
      const bookingDate = booking.appointmentDate ? new Date(booking.appointmentDate) : null;
      
      const dateStr = bookingDate 
        ? bookingDate.toLocaleString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '')
        : '';

      const monthYear = bookingDate
        ? bookingDate.toLocaleString('en-GB', { month: 'long' }) // e.g., "November"
        : 'Upcoming';

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
        date: dateStr,
        monthYear: monthYear,
        rawDate: bookingDate,
        location: 'Allora Spa and Massage Centre Dubai',
        services: services,
        totalAmount: booking.finalAmount || booking.totalAmount || 0
      };
    });
  }, [bookings, servicesMap, employeesMap]);

  const filteredAppointments = useMemo(() => {
    const target = normalize(filterStatus);

    const filtered = formattedAppointments.filter(appt => {
      if (target === 'all' || target === '') return true;
      const apptStatus = normalize(appt.status);

      // If we have a mapping for the selected filter, match against mapped values
      if (statusMap[target]) {
        return statusMap[target].some(mapped => mapped === apptStatus);
      }

      return apptStatus === target;
    });

    // Group by month
    const groups = {};
    filtered.forEach(appt => {
      if (!groups[appt.monthYear]) {
        groups[appt.monthYear] = [];
      }
      groups[appt.monthYear].push(appt);
    });

    return groups;
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
    <div className="client-appts-container">
      <div className="client-appts-header">
        <h2 className="client-appts-title">Appointments</h2>
      </div>

      {/* Filters */}
      <div className="client-appts-filters">
        {mainOptions.map(option => (
          <button
            key={option}
            className={`client-appts-filter-btn ${filterStatus === option ? 'active' : ''}`}
            onClick={() => handleFilterClick(option)}
          >
            {option}
          </button>
        ))}

        <div className="client-appts-filter-dropdown" ref={dropdownRef}>
          <button
            className={`client-appts-filter-btn client-appts-filter-trigger ${isMoreActive ? 'active' : ''}`}
            onClick={() => setIsMoreOpen(!isMoreOpen)}
          >
            More
            <ChevronDown size={14} style={{ transform: isMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isMoreOpen && (
            <div className="client-appts-dropdown-menu">
              {moreOptions.map(option => (
                <div
                  key={option}
                  className={`client-appts-dropdown-item ${filterStatus === option ? 'active' : ''}`}
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
      <div className="client-appts-list">
        {Object.keys(filteredAppointments).length > 0 ? (
          Object.entries(filteredAppointments).map(([monthYear, appts]) => (
            <div key={monthYear} className="client-appts-month-group">
              <div className="client-appts-month-divider">{monthYear}</div>
              {appts.map((appt, index) => (
                <div key={appt.id} className="client-appts-card">
                  <div className="client-appts-timeline-icon">
                    <Calendar size={16} color="#fff" />
                  </div>
                  {/* Show line if it's not the last item in the group */}
                  {index !== appts.length - 1 && <div className="client-appts-timeline-line" />}
                  
                  <div className="client-appts-content">
                    <div className="client-appts-header-row">
                      <span className="client-appts-card-title">Appointment</span>
                      <span className={`client-appts-status ${appt.status.toLowerCase()}`}>{appt.status}</span>
                    </div>
                    <div className="client-appts-meta">
                      {appt.date} • {appt.location}
                    </div>

                    <div className="client-appts-services">
                      {appt.services.map((service, idx) => (
                        <div key={service.id} className="client-appts-service-item">
                          <div className="client-appts-service-info">
                            <div className="client-appts-service-number">{idx + 1}</div>
                            <div className="client-appts-service-details">
                              <span className="client-appts-service-name">{service.name}</span>
                              <span className="client-appts-service-meta">{service.duration} • {service.staff}</span>
                            </div>
                          </div>
                          <span className="client-appts-service-price">AED {service.price}</span>
                        </div>
                      ))}
                    </div>

                   
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="client-appts-empty-state">
            <div className="client-appts-empty-icon">
              <Calendar size={32} />
            </div>
            <h3 className="client-appts-empty-title">No appointments</h3>
            <p className="client-appts-empty-desc">
              No appointments have been created for this client with selected criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAppointmentsTab;
