import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Plus,
  Calendar,
} from "lucide-react";
import './Selectcalander.css';
import { Base_url } from '../Service/Base_url';

// --- Helper Functions ---
const generateAvatar = (fName, lName) => (fName?.[0] || "") + (lName?.[0] || "");
const staffColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const timeSlots = Array.from({ length: 96 }, (_, i) => ({
  time: `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`,
  isHourStart: (i % 4) === 0,
}));
const paymentMethods = [{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }];

// --- CustomCalendar Component ---
const CustomCalendar = ({ isVisible, onClose, onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const navigateMonth = (direction) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));

  const handleDateClick = (day, monthOffset = 0) => {
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    onDateSelect(selectedDateObj);
    onClose();
  };

  const renderMonth = (monthOffset = 0) => {
    const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const daysInMonth = getDaysInMonth(displayDate);
    const firstDay = getFirstDayOfMonth(displayDate);
    const today = new Date();
    const isCurrentMonth = displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
    let days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === displayDate.getMonth() && selectedDate.getFullYear() === displayDate.getFullYear();
      days.push(
        <div key={day} className={`calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`} onClick={() => handleDateClick(day, monthOffset)}>
          {day}
        </div>
      );
    }
    return (
      <div className="calendar-month">
        <div className="calendar-month-header"><h3>{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</h3></div>
        <div className="calendar-weekdays">{dayNames.map((d) => <div key={d} className="calendar-weekday">{d}</div>)}</div>
        <div className="calendar-days">{days}</div>
      </div>
    );
  };

  if (!isVisible) return null;
  return (
    <div className="calendar-overlay">
      <div className="custom-calendar" ref={calendarRef}>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}><ChevronLeft size={20} /></button>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}><ChevronRight size={20} /></button>
        </div>
        <div className="calendar-months">{renderMonth(0)}{renderMonth(1)}</div>
      </div>
    </div>
  );
};

// --- TeamSelection Component ---
const TeamSelection = ({ isVisible, onClose, staffList, selectedStaff, onStaffToggle }) => {
  const teamRef = useRef();
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teamRef.current && !teamRef.current.contains(e.target)) onClose();
    };
    if (isVisible) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible) return null;
  return (
    <div className="team-selection-overlay">
      <div className="team-selection-panel" ref={teamRef}>
        <div className="team-members-header"><h3>Team Members</h3></div>
        <div className="team-members-list">
          {staffList.map((staff, index) => (
            <div key={staff.id} className="team-member-item" onClick={() => onStaffToggle(index)}>
              <div className="team-member-info">
                <div className="team-member-avatar" style={{ backgroundColor: staff.color }}>
                  {staff.profileImage ? (<img src={staff.profileImage} alt={staff.name} className="avatar-image"/>) : (<span className="avatar-text">{staff.avatar}</span>)}
                </div>
                <div className="team-member-details">
                  <span className="team-member-name">{staff.name}</span>
                  <span className="team-member-position">{staff.position}</span>
                </div>
              </div>
              <div className="team-member-checkbox">
                <input type="checkbox" id={`staff-${index}`} checked={selectedStaff.includes(index)} readOnly />
                <label htmlFor={`staff-${index}`} className="checkbox-label"><div className="checkbox-custom"></div></label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Service Selection Popup Component ---
const ServiceSelectionPopup = ({ 
  isVisible, 
  onClose, 
  selectedDate, 
  selectedStaff,
  selectedTime,
  onServiceSelect,
  position = { x: 0, y: 0 }
}) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const popupRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      fetchServices();
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/services`);
      const data = await res.json();
      if (res.ok) {
        setServices(data.data?.services || []);
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      setError('Failed to fetch services: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleServiceClick = (service) => {
    onServiceSelect(service);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="service-selection-overlay">
      <div 
        className="service-selection-popup" 
        ref={popupRef}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -10px)'
        }}
      >
        <div className="service-popup-header">
          <h3>Select Service</h3>
          <p>Time: {selectedTime} | Professional: {selectedStaff?.name}</p>
        </div>
        
        {loading && <div className="service-popup-loading">Loading services...</div>}
        {error && <div className="service-popup-error">{error}</div>}
        
        <div className="service-list">
          {services.map(service => (
            <button 
              key={service._id} 
              className="service-item"
              onClick={() => handleServiceClick(service)}
            >
              <div className="service-name">{service.name}</div>
              <div className="service-details">
                {service.duration} minutes • AED {service.price}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Enhanced BookingModal Component ---
const BookingModal = ({ 
  isVisible, 
  onClose, 
  selectedDate, 
  bookingDefaults,
  setBookingDefaults,
  fetchBookings,
  fetchWaitlistBookings,
  isNewAppointment = false // New prop to distinguish between Add button and time slot click
}) => {
  // Booking Modal State
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingServices, setBookingServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingProfessionals, setBookingProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [bookingTimeSlots, setBookingTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingLoading, setBookingModalLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Client Search State
  const [existingClients, setExistingClients] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [selectedExistingClient, setSelectedExistingClient] = useState(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      // For new appointments (Add button), start from service selection
      // For time slot clicks, start from client information (service and professional are pre-selected)
      if (isNewAppointment) {
        setBookingStep(1); // Start with service selection
      } else {
        setBookingStep(4); // Skip to client information
      }
      
      setSelectedService(bookingDefaults?.service || null);
      setSelectedProfessional(bookingDefaults?.professional || null);
      setSelectedTimeSlot(bookingDefaults?.timeSlot || null);
      setClientInfo({ name: '', email: '', phone: '' });
      setPaymentMethod('cash');
      setBookingSuccess(null);
      setBookingError(null);
      setBookingServices([]);
      setBookingProfessionals([]);
      setBookingTimeSlots([]);
      setSelectedExistingClient(null);
      setClientSearchQuery('');
      setClientSearchResults([]);
      setShowClientSearch(false);
      setIsAddingNewClient(false);
      
      if (isNewAppointment) {
        fetchBookingServices();
      }
      fetchExistingClients();
    }
  }, [isVisible, isNewAppointment, bookingDefaults]);

  // Auto-selection effects for booking modal (only for new appointments)
  useEffect(() => {
    if (isNewAppointment && bookingStep === 2 && bookingDefaults?.staffId && bookingProfessionals.length > 0) {
      const defaultProf = bookingProfessionals.find(p => p._id === bookingDefaults.staffId);
      if (defaultProf) {
        setSelectedProfessional(defaultProf);
        setBookingStep(3);
        fetchBookingTimeSlots(defaultProf._id, selectedService._id, selectedDate);
      }
    }
  }, [isNewAppointment, bookingStep, bookingDefaults, bookingProfessionals, selectedService, selectedDate]);
  
  useEffect(() => {
    if (isNewAppointment && bookingStep === 3 && bookingDefaults?.time && bookingTimeSlots.length > 0) {
      const [hour, minute] = bookingDefaults.time.split(':').map(Number);
      const defaultSlot = bookingTimeSlots.find(slot => {
        const d = new Date(slot.startTime);
        return slot.available && d.getHours() === hour && d.getMinutes() === minute;
      });
      if (defaultSlot) {
        setSelectedTimeSlot(defaultSlot);
        setBookingStep(4);
        setBookingDefaults(null); // Clear defaults after use
      }
    }
  }, [isNewAppointment, bookingStep, bookingDefaults, bookingTimeSlots, setBookingDefaults]);

  const fetchBookingServices = useCallback(async () => {
    setBookingModalLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/services`);
      const data = await res.json();
      if (res.ok) {
        setBookingServices(data.data?.services || []);
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      setBookingError('Failed to fetch services: ' + err.message);
    } finally {
      setBookingModalLoading(false);
    }
  }, []);

  const fetchBookingProfessionals = useCallback(async (serviceId, date) => {
    setBookingModalLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/professionals?service=${serviceId}&date=${date.toISOString().slice(0,10)}`);
      const data = await res.json();
      if (res.ok) {
        setBookingProfessionals(data.data?.professionals || []);
      } else {
        throw new Error(data.message || 'Failed to fetch professionals');
      }
    } catch (err) {
      setBookingError('Failed to fetch professionals: ' + err.message);
    } finally {
      setBookingModalLoading(false);
    }
  }, []);

  const fetchBookingTimeSlots = useCallback(async (employeeId, serviceId, date) => {
    setBookingModalLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`${Base_url}/bookings/time-slots?employeeId=${employeeId}&serviceId=${serviceId}&date=${date.toISOString().slice(0,10)}`);
      const data = await res.json();
      if (res.ok) {
        setBookingTimeSlots(data.data?.timeSlots || []);
      } else {
        throw new Error(data.message || 'Failed to fetch time slots');
      }
    } catch (err) {
      setBookingError('Failed to fetch time slots: ' + err.message);
    } finally {
      setBookingModalLoading(false);
    }
  }, []);

  const handleCreateBooking = async () => {
    setBookingModalLoading(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      const token = localStorage.getItem('token');
      
      let clientData;
      
      if (selectedExistingClient) {
        clientData = {
          firstName: selectedExistingClient.firstName,
          lastName: selectedExistingClient.lastName,
          email: selectedExistingClient.email,
          phone: selectedExistingClient.phone
        };
      } else {
        const nameString = clientInfo.name ? clientInfo.name.trim() : '';
        if (!nameString) {
          setBookingError('Client name is required.');
          setBookingModalLoading(false);
          return;
        }
        const [firstName, ...rest] = nameString.split(' ');
        const lastName = rest.join(' ') || '';
        clientData = {
          firstName,
          lastName,
          email: clientInfo.email.trim(),
          phone: clientInfo.phone.trim()
        };
      }

      const bookingPayload = {
        services: [
          {
            service: selectedService._id,
            employee: selectedProfessional._id,
            duration: selectedService.duration,
            price: selectedService.price,
            startTime: selectedTimeSlot.startTime,
            endTime: selectedTimeSlot.endTime,
          },
        ],
        appointmentDate: selectedTimeSlot.startTime,
        finalAmount: selectedService.price,
        totalDuration: selectedService.duration,
        notes: '',
        paymentMethod,
        client: clientData,
      };

      console.log('Booking payload:', bookingPayload);
      
      const res = await fetch(`${Base_url}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();

      console.log('Booking creation response:', data);

      if (!res.ok) throw new Error(data.message || 'Booking failed');
      
      const clientName = selectedExistingClient 
        ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
        : clientData.firstName;
      
      setBookingSuccess(`Booking created successfully for ${clientName}!`);
      
      setTimeout(() => {
        onClose(); // Close the modal
        fetchBookings(selectedDate); // Refresh the calendar
        fetchWaitlistBookings(); // Refresh the waitlist
      }, 2000);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingModalLoading(false);
    }
  };

  const fetchExistingClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setExistingClients(data.data?.clients || []);
      } else {
        console.error('Failed to fetch clients:', data.message);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  const searchClients = useCallback((query) => {
    if (!query.trim()) {
      setClientSearchResults(existingClients.slice(0, 10));
      return;
    }
    
    const filtered = existingClients.filter(client => {
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      const searchTerm = query.toLowerCase();
      
      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             phone.includes(searchTerm);
    });
    setClientSearchResults(filtered);
  }, [existingClients]);

  const handleClientSearchChange = (e) => {
    const query = e.target.value;
    setClientSearchQuery(query);
    searchClients(query);
  };

  const selectExistingClient = (client) => {
    setSelectedExistingClient(client);
    setClientSearchQuery(`${client.firstName} ${client.lastName}`);
    setClientInfo({ name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone });
    setShowClientSearch(false);
    setIsAddingNewClient(false);
  };

  const clearClientSelection = () => {
    setSelectedExistingClient(null);
    setClientInfo({ name: '', email: '', phone: '' });
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(true);
  };

  const addNewClient = () => {
    setIsAddingNewClient(true);
    setSelectedExistingClient(null);
    setClientInfo({ name: clientSearchQuery, email: '', phone: '' });
    setClientSearchQuery('');
    setClientSearchResults([]);
    setShowClientSearch(false);
  };

  if (!isVisible) return null;

  return (
    <div className="modern-booking-modal">
      <div className="booking-modal-overlay booking-modal-fade-in">
        <div className="booking-modal booking-modal-animate-in">
          <button className="booking-modal-close" onClick={onClose}>×</button>
          <h2>✨ {isNewAppointment ? 'New Appointment' : 'Quick Booking'} ✨</h2>
          
          {/* Step Indicator - Only show for new appointments */}
          {isNewAppointment && (
            <div className="step-indicator">
              <div className={`step-dot ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}></div>
              <div className={`step-connector ${bookingStep > 1 ? 'active' : ''}`}></div>
              <div className={`step-dot ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}></div>
              <div className={`step-connector ${bookingStep > 2 ? 'active' : ''}`}></div>
              <div className={`step-dot ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}></div>
              <div className={`step-connector ${bookingStep > 3 ? 'active' : ''}`}></div>
              <div className={`step-dot ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'completed' : ''}`}></div>
              <div className={`step-connector ${bookingStep > 4 ? 'active' : ''}`}></div>
              <div className={`step-dot ${bookingStep >= 5 ? 'active' : ''}`}></div>
            </div>
          )}

          {bookingError && <div className="booking-modal-error">{bookingError}</div>}
          {bookingLoading && <div className="booking-modal-loading">Creating your perfect appointment...</div>}
          {bookingSuccess && <div className="booking-modal-success">{bookingSuccess}</div>}

          {/* Service Selection Step - Only for new appointments */}
          {isNewAppointment && bookingStep === 1 && (
            <>
              <h3>💆‍♀ Select Your Service</h3>
              <div className="booking-modal-list">
                {bookingServices.map(service => (
                  <button key={service._id} className={`booking-modal-list-item${selectedService && selectedService._id === service._id ? ' selected' : ''}`} onClick={() => { setSelectedService(service); setBookingStep(2); fetchBookingProfessionals(service._id, selectedDate); }}>
                    <div className="booking-modal-item-name">{service.name}</div>
                    <div className="booking-modal-list-desc">{service.duration} minutes • AED {service.price}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Professional Selection Step - Only for new appointments */}
          {isNewAppointment && bookingStep === 2 && (
            <>
              <h3>👨‍⚕ Choose Your Professional</h3>
              <div className="booking-modal-list">
                {bookingProfessionals.map(prof => (
                  <button key={prof._id} className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}`} onClick={() => { setSelectedProfessional(prof); setBookingStep(3); fetchBookingTimeSlots(prof._id, selectedService._id, selectedDate); }}>
                    <div className="booking-modal-item-name">{prof.user.firstName} {prof.user.lastName}</div>
                    <div className="booking-modal-list-desc">{prof.position} • Expert in {selectedService?.name}</div>
                  </button>
                ))}
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(1)}>← Back</button>
              </div>
            </>
          )}

          {/* Time Selection Step - Only for new appointments */}
          {isNewAppointment && bookingStep === 3 && (
            <>
              <h3>🕐 Pick Your Perfect Time</h3>
              <div className="booking-modal-list">
                {bookingTimeSlots.filter(slot => slot.available).map(slot => (
                  <button key={slot.startTime} className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} onClick={() => { setSelectedTimeSlot(slot); setBookingStep(4); }}>
                    <div className="booking-modal-item-name">
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="booking-modal-list-desc">
                      {selectedService?.duration} minutes with {selectedProfessional?.user?.firstName}
                    </div>
                  </button>
                ))}
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(2)}>← Back</button>
              </div>
            </>
          )}

          {/* Client Information Step */}
          {bookingStep === 4 && (
            <>
              <h3>👤 Client Information</h3>
              
              {/* Show booking summary for time slot clicks */}
              {!isNewAppointment && (
                <div className="booking-summary-quick">
                  <div className="summary-item">
                    <span>💆‍♀ Service:</span>
                    <span>{selectedService?.name}</span>
                  </div>
                  <div className="summary-item">
                    <span>👨‍⚕ Professional:</span>
                    <span>{selectedProfessional?.user?.firstName} {selectedProfessional?.user?.lastName}</span>
                  </div>
                  <div className="summary-item">
                    <span>🕐 Time:</span>
                    <span>
                      {selectedTimeSlot ? new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      {selectedTimeSlot ? ' - ' + new Date(selectedTimeSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Client Search Section */}
              <div className="client-search-section">
                <div className="client-search-header">
                  <h4>Search Existing Client</h4>
                  {selectedExistingClient && (
                    <button 
                      className="clear-client-btn" 
                      onClick={clearClientSelection}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                
                {!selectedExistingClient && !isAddingNewClient && (
                  <div className="client-search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={clientSearchQuery}
                      onChange={handleClientSearchChange}
                      onFocus={() => {
                        setShowClientSearch(true);
                        searchClients(clientSearchQuery);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowClientSearch(false), 200);
                      }}
                    />
                    {showClientSearch && clientSearchResults.length > 0 && (
                      <div className="client-search-results">
                        {clientSearchResults.map(client => (
                          <div 
                            key={client._id} 
                            className="client-search-result"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectExistingClient(client)}
                          >
                            <div className="client-result-avatar">
                              {(client.firstName?.[0] || '') + (client.lastName?.[0] || '')}
                            </div>
                            <div className="client-result-info">
                              <div className="client-result-name">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="client-result-contact">
                                {client.email} • {client.phone}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showClientSearch && clientSearchQuery && clientSearchResults.length === 0 && (
                      <div className="client-search-no-results">
                        <p>No clients found for "{clientSearchQuery}"</p>
                        <button 
                          className="add-new-client-btn"
                          onClick={addNewClient}
                        >
                          Add New Client
                        </button>
                      </div>
                    )}
                    
                    {!showClientSearch && !isAddingNewClient && (
                      <button 
                        className="add-new-client-btn"
                        onClick={addNewClient}
                      >
                        + Add New Client
                      </button>
                    )}
                  </div>
                )}
                
                {/* Selected Client Display */}
                {selectedExistingClient && (
                  <div className="selected-client-display">
                    <div className="selected-client-avatar">
                      {(selectedExistingClient.firstName?.[0] || '') + (selectedExistingClient.lastName?.[0] || '')}
                    </div>
                    <div className="selected-client-info">
                      <div className="selected-client-name">
                        {selectedExistingClient.firstName} {selectedExistingClient.lastName}
                      </div>
                      <div className="selected-client-contact">
                        {selectedExistingClient.email} • {selectedExistingClient.phone}
                      </div>
                    </div>
                    <div className="selected-client-badge">
                      Existing Client
                    </div>
                  </div>
                )}
                
                {/* New Client Form */}
                {isAddingNewClient && (
                  <div className="new-client-form">
                    <div className="new-client-header">
                      <h4>Add New Client</h4>
                      <button 
                        className="back-to-search-btn"
                        onClick={() => {
                          setIsAddingNewClient(false);
                          setShowClientSearch(true);
                          setClientInfo({ name: '', email: '', phone: '' });
                        }}
                      >
                        ← Back to Search
                      </button>
                    </div>
                    <div className="booking-modal-form">
                      <div className="form-group">
                        <label htmlFor="clientName">Client Name *</label>
                        <input 
                          id="clientName"
                          type="text" 
                          placeholder="Enter client's full name" 
                          value={clientInfo.name} 
                          onChange={e => setClientInfo(f => ({ ...f, name: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="clientEmail">Email Address *</label>
                        <input 
                          id="clientEmail"
                          type="email" 
                          placeholder="Enter client's email address" 
                          value={clientInfo.email} 
                          onChange={e => setClientInfo(f => ({ ...f, email: e.target.value }))} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="clientPhone">Phone Number *</label>
                        <input 
                          id="clientPhone"
                          type="tel" 
                          placeholder="Enter client's phone number" 
                          value={clientInfo.phone} 
                          onChange={e => setClientInfo(f => ({ ...f, phone: e.target.value }))} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="booking-modal-actions">
                <button 
                  className="booking-modal-next" 
                  onClick={() => setBookingStep(5)}
                  disabled={
                    !selectedExistingClient && 
                    (!clientInfo.name.trim() || !clientInfo.email.trim() || !clientInfo.phone.trim())
                  }
                >
                  Continue to Payment →
                </button>
                {isNewAppointment && (
                  <button className="booking-modal-back" onClick={() => setBookingStep(3)}>← Back</button>
                )}
              </div>
            </>
          )}

          {/* Payment & Confirmation Step */}
          {bookingStep === 5 && (
            <>
              <h3>💳 Payment & Final Confirmation</h3>
              <div className="booking-summary">
                <div className="summary-item">
                  <span>Client:</span>
                  <span>
                    {selectedExistingClient 
                      ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}`
                      : clientInfo.name
                    }
                    {selectedExistingClient && (
                      <span className="existing-client-indicator">✨ VIP Member</span>
                    )}
                  </span>
                </div>
                <div className="summary-item">
                  <span>📧 Email:</span>
                  <span>
                    {selectedExistingClient 
                      ? selectedExistingClient.email
                      : clientInfo.email
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span>📱 Phone:</span>
                  <span>
                    {selectedExistingClient 
                      ? selectedExistingClient.phone
                      : clientInfo.phone
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span>💆‍♀ Service:</span>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="summary-item">
                  <span>👨‍⚕ Professional:</span>
                  <span>{selectedProfessional?.user?.firstName} {selectedProfessional?.user?.lastName}</span>
                </div>
                <div className="summary-item">
                  <span>📅 Date & Time:</span>
                  <span>
                    {selectedDate?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {' '}
                    {selectedTimeSlot ? new Date(selectedTimeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="summary-item">
                  <span>⏱ Duration:</span>
                  <span>{selectedService?.duration} minutes of luxury</span>
                </div>
                <div className="summary-item">
                  <span>💰 Investment:</span>
                  <span>AED {selectedService?.price}</span>
                </div>
              </div>
              <div className="booking-modal-form">
                <div className="form-group">
                  <label>💳 Select Payment Method:</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {paymentMethods.map(pm => (
                      <option key={pm.value} value={pm.value}>{pm.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="booking-modal-actions">
                <button 
                  className="booking-modal-confirm" 
                  onClick={handleCreateBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? '✨ Creating Your Luxury Experience...' : '🌟 Confirm Booking 🌟'}
                </button>
                <button className="booking-modal-back" onClick={() => setBookingStep(4)}>← Back</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Scheduler Component ---
const Scheduler = () => {
  // Core State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [appointments, setAppointments] = useState({});
  
  // Responsive State
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [activeMobileStaffIndex, setActiveMobileStaffIndex] = useState(0);

  // UI Visibility & Loading State
  const [staffLoading, setStaffLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [teamSelectionVisible, setTeamSelectionVisible] = useState(false);
  const [waitlistVisible, setWaitlistVisible] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [servicePopupVisible, setServicePopupVisible] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  // Data State for Popups & Modals
  const [servicePopupData, setServicePopupData] = useState({ x: 0, y: 0, time: "", staffIndex: null, staff: null });
  const [bookingDefaults, setBookingDefaults] = useState(null);
  const [isNewAppointment, setIsNewAppointment] = useState(false);
  const [waitlistBookings, setWaitlistBookings] = useState({ upcoming: [], completed: [], booked: [] });
  const [activeWaitlistTab, setActiveWaitlistTab] = useState("upcoming");
  
  // --- REFS ---
  const tooltipRef = useRef();
  const waitlistRef = useRef();

  // --- API FETCHING ---
  const fetchStaffList = useCallback(async () => {
    setStaffLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        const formattedStaff = data.data.employees.map((employee, index) => ({
          id: employee._id,
          name: `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim(),
          avatar: generateAvatar(employee.user?.firstName, employee.user?.lastName),
          color: staffColors[index % staffColors.length],
          profileImage: employee.user?.profileImage || null,
          position: employee.position || 'Staff',
          employeeId: employee.employeeId,
          user: employee.user,
          isActive: employee.isActive,
        }));
        setStaffList(formattedStaff);
        setSelectedStaff(formattedStaff.map((_, index) => index)); // Select all by default
      } else {
        console.error('Failed to fetch staff:', data.message);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const fetchWaitlistBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${Base_url}/bookings/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        const allBookings = data.data.bookings;
        const now = new Date();
        
        const categorizedBookings = {
          upcoming: allBookings.filter(booking => {
            const bookingDate = new Date(booking.appointmentDate);
            return bookingDate >= now && ['pending', 'confirmed'].includes(booking.status);
          }),
          completed: allBookings.filter(booking => {
            const bookingDate = new Date(booking.appointmentDate);
            return bookingDate < now || booking.status === 'completed';
          }),
          booked: allBookings.filter(booking => 
            ['confirmed', 'pending', 'booked'].includes(booking.status)
          )
        };
        
        setWaitlistBookings(categorizedBookings);
      }
    } catch (error) {
      console.error('Error fetching waitlist bookings:', error);
    }
  }, []);

  const processBookingsForCalendar = useCallback((bookingsToProcess) => {
    const newAppointments = {};
    bookingsToProcess.forEach(booking => {
      booking.services.forEach(service => {
        const startTime = new Date(service.startTime);
        const timeSlotIndex = startTime.getHours() * 4 + Math.floor(startTime.getMinutes() / 15);
        const staffIndex = staffList.findIndex(staff => staff.id === service.employee?._id);

        if (staffIndex !== -1) {
          const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim() || 'Guest';
          const key = `${timeSlotIndex}-${staffIndex}`;
          newAppointments[key] = {
            clientName,
            serviceName: service.service?.name || 'Service',
            startTime: service.startTime,
            endTime: service.endTime,
            status: booking.status,
            bookingId: booking._id,
            serviceId: service._id,
          };
        }
      });
    });
    setAppointments(newAppointments);
  }, [staffList]);

  const fetchBookings = useCallback(async (date) => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dateStr = date.toISOString().slice(0, 10);
      const res = await fetch(`${Base_url}/bookings/admin/date/${dateStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        processBookingsForCalendar(data.data.bookings);
      } else {
        console.error('Failed to fetch bookings:', data.message);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  }, [processBookingsForCalendar]);

  // --- EVENT HANDLERS ---
  const handleStaffToggle = (index) => {
    setSelectedStaff(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchBookings(date);
  };

  // Handle time slot click - show service selection popup
  const handleTimeSlotClick = (timeSlotIndex, staffIndex, event) => {
    const staff = staffList[staffIndex];
    const timeSlot = timeSlots[timeSlotIndex];
    const rect = event.target.getBoundingClientRect();
    
    setServicePopupData({
      x: rect.left + rect.width / 2,
      y: rect.top,
      time: timeSlot.time,
      staffIndex,
      staff
    });
    setServicePopupVisible(true);
  };

  // Handle service selection from popup
  const handleServiceSelect = (service) => {
    const { staff, time } = servicePopupData;
    
    // Create time slot object for the selected time
    const [hour, minute] = time.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hour, minute, 0, 0);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);
    
    const timeSlot = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      available: true
    };

    // Set booking defaults for quick booking
    setBookingDefaults({
      service,
      professional: { _id: staff.id, user: staff.user || { firstName: staff.name.split(' ')[0], lastName: staff.name.split(' ')[1] || '' } },
      timeSlot,
      staffId: staff.id,
      time
    });
    
    setIsNewAppointment(false); // This is a time slot click, not new appointment
    setBookingModalOpen(true);
    setServicePopupVisible(false);
  };

  // Handle Add button click - start new appointment flow
  const handleAddAppointment = () => {
    setBookingDefaults(null);
    setIsNewAppointment(true); // This is a new appointment
    setBookingModalOpen(true);
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchStaffList();
    fetchWaitlistBookings();
  }, [fetchStaffList, fetchWaitlistBookings]);

  useEffect(() => {
    if (staffList.length > 0) {
      fetchBookings(selectedDate);
    }
  }, [staffList, selectedDate, fetchBookings]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- RENDER HELPERS ---
  const renderTimeSlot = (timeSlotIndex, staffIndex) => {
    const key = `${timeSlotIndex}-${staffIndex}`;
    const appointment = appointments[key];
    const timeSlot = timeSlots[timeSlotIndex];
    
    if (appointment) {
      return (
        <div 
          className="time-slot appointment" 
          style={{ backgroundColor: staffList[staffIndex]?.color }}
          onMouseEnter={(e) => {
            const rect = e.target.getBoundingClientRect();
            setHoverTooltip({
              visible: true,
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              content: {
                clientName: appointment.clientName,
                serviceName: appointment.serviceName,
                time: `${new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              }
            });
          }}
          onMouseLeave={() => setHoverTooltip({ visible: false, x: 0, y: 0, content: null })}
        >
          <div className="appointment-text">
            {appointment.clientName}
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className="time-slot empty" 
        onClick={(e) => handleTimeSlotClick(timeSlotIndex, staffIndex, e)}
      >
        {timeSlot.isHourStart && <span className="hour-marker">{timeSlot.time}</span>}
      </div>
    );
  };

  const renderStaffColumn = (staffIndex) => {
    const staff = staffList[staffIndex];
    if (!staff) return null;

    return (
      <div key={staff.id} className="staff-column">
        <div className="staff-header">
          <div className="staff-avatar" style={{ backgroundColor: staff.color }}>
            {staff.profileImage ? (
              <img src={staff.profileImage} alt={staff.name} className="avatar-image"/>
            ) : (
              <span className="avatar-text">{staff.avatar}</span>
            )}
          </div>
          <div className="staff-info">
            <div className="staff-name">{staff.name}</div>
            <div className="staff-position">{staff.position}</div>
          </div>
        </div>
        <div className="time-slots-column">
          {timeSlots.map((_, timeSlotIndex) => (
            <div key={timeSlotIndex} className="time-slot-wrapper">
              {renderTimeSlot(timeSlotIndex, staffIndex)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="scheduler-root">
      {/* Header */}
      <div className="scheduler-header">
        <div className="header-left">
          <h1>Appointment Scheduler</h1>
          <div className="current-time">
            {currentTime.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={handleAddAppointment}
          >
            <Plus size={20} />
            Add Appointment
          </button>
          <button 
            className="action-btn"
            onClick={() => setCalendarVisible(true)}
          >
            <Calendar size={20} />
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </button>
          <button 
            className="action-btn"
            onClick={() => setTeamSelectionVisible(true)}
          >
            <Users size={20} />
            Team ({selectedStaff.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="scheduler-content">
        {/* Time Column */}
        <div className="time-column">
          <div className="time-header">Time</div>
          <div className="time-slots">
            {timeSlots.map((slot, index) => (
              <div key={index} className={`time-slot-label ${slot.isHourStart ? 'hour-start' : ''}`}>
                {slot.isHourStart && <span>{slot.time}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Staff Columns */}
        <div className="staff-grid">
          {selectedStaff.map(staffIndex => renderStaffColumn(staffIndex))}
        </div>
      </div>

      {/* Modals and Popups */}
      <CustomCalendar 
        isVisible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />

      <TeamSelection 
        isVisible={teamSelectionVisible}
        onClose={() => setTeamSelectionVisible(false)}
        staffList={staffList}
        selectedStaff={selectedStaff}
        onStaffToggle={handleStaffToggle}
      />

      <ServiceSelectionPopup
        isVisible={servicePopupVisible}
        onClose={() => setServicePopupVisible(false)}
        selectedDate={selectedDate}
        selectedStaff={servicePopupData.staff}
        selectedTime={servicePopupData.time}
        onServiceSelect={handleServiceSelect}
        position={{ x: servicePopupData.x, y: servicePopupData.y }}
      />

      <BookingModal 
        isVisible={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedDate={selectedDate}
        bookingDefaults={bookingDefaults}
        setBookingDefaults={setBookingDefaults}
        fetchBookings={fetchBookings}
        fetchWaitlistBookings={fetchWaitlistBookings}
        isNewAppointment={isNewAppointment}
      />

      {/* Hover Tooltip */}
      {hoverTooltip.visible && hoverTooltip.content && (
        <div 
          className="hover-tooltip"
          style={{
            position: 'fixed',
            left: hoverTooltip.x + 'px',
            top: hoverTooltip.y + 'px',
            transform: 'translate(-50%, -100%)',
            zIndex: 1000
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-client">{hoverTooltip.content.clientName}</div>
            <div className="tooltip-service">{hoverTooltip.content.serviceName}</div>
            <div className="tooltip-time">{hoverTooltip.content.time}</div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(staffLoading || bookingsLoading) && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;
