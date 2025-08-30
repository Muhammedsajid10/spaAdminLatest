import React from 'react';
import { hasShiftOnDate, getDayName, formatDateLocal } from '..';

// Extracted Booking Modal component to reduce size of SelectCalendar
export const BookingModal = ({
  bookingStep,
  setBookingStep,
  bookingError,
  bookingLoading,
  bookingSuccess,
  isAddingAdditionalService,
  availableServices,
  currentAppointmentIndex,
  bookingDefaults,
  multipleAppointments,
  addMinutesToTime,
  removeAppointmentFromSession,
  setShowServiceCatalog,
  showServiceCatalog,
  selectedService,
  handleServiceSelect,
  currentDate,
  getTotalSessionPrice,
  closeBookingModal,
  availableProfessionals,
  selectedProfessional,
  setSelectedProfessional,
  getValidTimeSlotsForProfessional,
  appointments,
  setAvailableTimeSlots,
  selectedTimeSlot,
  handleAddToBookingSession,
  startAdditionalService,
  selectedExistingClient,
  isAddingNewClient,
  clientSearchQuery,
  handleClientSearchChange,
  setShowClientSearch,
  searchClients,
  showClientSearch,
  clientSearchResults,
  selectExistingClient,
  addNewClient,
  clearClientSelection,
  clientInfo,
  setClientInfo,
  setIsAddingNewClient,
  paymentMethod,
  setPaymentMethod,
  giftCardCode,
  setGiftCardCode,
  bookingForm,
  setBookingForm,
  handleCreateBooking,
}) => {
  return (
    <div className="modern-booking-modal">
      <div className="booking-modal-overlay booking-modal-fade-in" onClick={closeBookingModal}>
        <div className={`booking-modal booking-modal-animate-in ${bookingStep === 6 ? 'final-step' : ''}`} onClick={e => e.stopPropagation()}>
          <button className="booking-modal-close" onClick={closeBookingModal}>×</button>
          <h2>New Appointment</h2>

          <div className="step-indicator">
            <div className={`step-dot ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 1 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 4 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 5 ? 'active' : ''} ${bookingStep > 5 ? 'completed' : ''}`}></div>
            <div className={`step-connector ${bookingStep > 5 ? 'active' : ''}`}></div>
            <div className={`step-dot ${bookingStep >= 6 ? 'active' : ''}`}></div>
          </div>

          {bookingError && <div className="booking-modal-error">{bookingError}</div>}
          {bookingLoading && <div className="booking-modal-loading">Creating your perfect appointment...</div>}
          {bookingSuccess && <div className="booking-modal-success">{bookingSuccess}</div>}

          {/* Step 1: Service Selection */}
          {bookingStep === 1 && (
            <>
              <h3 className="services-section-title">Services</h3>
              {(bookingDefaults?.professional || multipleAppointments.length > 0) && (
                <div className="service-cards-stack">
                  {multipleAppointments.map((apt) => {
                    const start = apt.timeSlot;
                    const end = addMinutesToTime(apt.timeSlot, apt.duration);
                    return (
                      <div key={apt.id} className="service-card-mini">
                        <div className="service-card-left-bar" />
                        <div className="service-card-body">
                          <div className="service-card-row1">
                            <span className="svc-name">{apt.service.name}</span>
                            <span className="svc-price">AED {apt.price}</span>
                          </div>
                          <div className="service-card-row2">
                            <span className="svc-time">{start} - {end}</span>
                            <span className="svc-dot">•</span>
                            <span className="svc-duration">{Math.round(apt.duration/60) || 1}h{apt.duration % 60 ? ` ${apt.duration%60}m` : ''}</span>
                            <span className="svc-dot">•</span>
                            <span className="svc-prof">{apt.professional.user?.firstName || apt.professional.name}</span>
                          </div>
                        </div>
                        <div className="service-card-actions">
                          <button className="svc-edit-btn" title="Edit" onClick={() => {}}>
                            ✏️
                          </button>
                          <button className="svc-delete-btn" title="Remove" onClick={() => removeAppointmentFromSession(apt.id)}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {multipleAppointments.length === 0 && bookingDefaults?.time && (
                    <div className="service-card-placeholder">Select a service below to add it at {bookingDefaults.time}</div>
                  )}
                  <button
                    type="button"
                    className="add-service-inline-btn"
                    onClick={() => { setShowServiceCatalog(true); setTimeout(()=>document.querySelector('.service-catalog-grid')?.scrollIntoView({behavior:'smooth'}),50); }}
                    title="Add another service"
                  >
                    ➕ Add service
                  </button>
                </div>
              )}

              {showServiceCatalog && (
                <div className="service-catalog-grid pro-theme">
                  {availableServices.map(service => {
                    const isSelected = selectedService && selectedService._id === service._id;
                    return (
                      <button
                        key={service._id}
                        className={`service-catalog-item pro-theme ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleServiceSelect(service)}
                        type="button"
                      >
                        <span className="catalog-name">{service.name}</span>
                        <span className="catalog-meta">{service.duration}m • AED {service.price}</span>
                        <div className="badge-row">
                          <span className="badge">⏱ {service.duration}m</span>
                          <span className="badge">💰 AED {service.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {bookingDefaults?.professional && (
                <div className="services-footer-summary">
                  <div className="footer-left">
                    <div className="footer-date-line">
                      {currentDate.toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'short' })}
                    </div>
                    <div className="footer-total-line">
                      <span className="footer-total-label">Total</span>
                      <span className="footer-total-value">AED {getTotalSessionPrice()}</span>
                    </div>
                  </div>
                  <div className="footer-actions">
                    <button type="button" className="footer-btn secondary" onClick={closeBookingModal}>Cancel</button>
                    <button type="button" className="footer-btn" disabled={multipleAppointments.length===0} onClick={()=> setBookingStep(5)}>Checkout</button>
                    <button type="button" className="footer-btn primary" disabled={multipleAppointments.length===0} onClick={()=> setBookingStep(5)}>Save</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Professional Selection */}
          {bookingStep === 2 && (
            <>
              <h3>👨‍⚕️ Choose Your Professional</h3>
              {availableProfessionals.length === 0 ? (
                <div className="booking-modal-empty-state">
                  <p>No professionals are available for this service on {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
                  <p>Please select a different date or service.</p>
                </div>
              ) : (
                <div className="booking-modal-list">
                  {availableProfessionals.map(prof => {
                    const employeeForShiftCheck = { workSchedule: prof.workSchedule || {} };
                    const hasShift = hasShiftOnDate(employeeForShiftCheck, currentDate); // eslint-disable-line
                    const dayName = getDayName(currentDate);
                    const todaySchedule = prof.workSchedule?.[dayName];
                    const sessionConflicts = multipleAppointments.filter(apt =>
                      apt.professional._id === prof._id &&
                      formatDateLocal(new Date(apt.date)) === formatDateLocal(currentDate)
                    );
                    let shiftInfo = 'Available';
                    if (todaySchedule) {
                      if (todaySchedule.shifts && typeof todaySchedule.shifts === 'string') {
                        shiftInfo = todaySchedule.shifts;
                      } else if (todaySchedule.startTime && todaySchedule.endTime) {
                        shiftInfo = `${todaySchedule.startTime} - ${todaySchedule.endTime}`;
                      } else if (Array.isArray(todaySchedule.shiftsData) && todaySchedule.shiftsData.length > 0) {
                        const firstShift = todaySchedule.shiftsData[0];
                        shiftInfo = `${firstShift.startTime} - ${firstShift.endTime}`;
                        if (todaySchedule.shiftsData.length > 1) shiftInfo += ' +more';
                      }
                    }
                    return (
                      <button
                        key={prof._id}
                        className={`booking-modal-list-item${selectedProfessional && selectedProfessional._id === prof._id ? ' selected' : ''}${sessionConflicts.length > 0 ? ' has-conflicts' : ''}`}
                        onClick={() => {
                          setSelectedProfessional(prof);
                          setBookingStep(3);
                          const service = selectedService;
                          const slots = getValidTimeSlotsForProfessional(prof, currentDate, service.duration, appointments);
                          setAvailableTimeSlots(slots);
                        }}
                      >
                        <div className="booking-modal-item-name">
                          {prof.name}
                          {sessionConflicts.length > 0 ? (
                            <span className="professional-conflict-indicator">⚠️ {sessionConflicts.length} booking(s) in session</span>
                          ) : (
                            <span className="professional-shift-indicator">✓ Available</span>
                          )}
                        </div>
                        <div className="booking-modal-list-desc">
                          {prof.position} • Shift: {shiftInfo}
                          {sessionConflicts.length > 0 && (
                            <div className="conflict-details">
                              Current bookings: {sessionConflicts.map(apt => `${apt.service.name} at ${apt.timeSlot}`).join(', ')}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(1)}>← Back</button>
              </div>
            </>
          )}

          {/* Step 3: Time Selection */}
          {bookingStep === 3 && (
            <>
              <h3>🕐 Pick Your Perfect Time</h3>
              <div className="booking-modal-list">
                {availableTimeSlots.filter(slot => slot.available).map(slot => (
                  <button key={slot.startTime} className={`booking-modal-list-item${selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime ? ' selected' : ''}`} onClick={() => { 
                    setSelectedTimeSlot(slot);
                    handleAddToBookingSession(slot);
                    setBookingStep(4);
                  }}>
                    <div className="booking-modal-item-name">
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="booking-modal-list-desc">
                      {selectedService?.duration} minutes with {selectedProfessional?.name}
                    </div>
                  </button>
                ))}
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(2)}>← Back</button>
              </div>
            </>
          )}

          {/* Step 4: Multi Services */}
          {bookingStep === 4 && (
            <>
              <h3>📋 Service Selection Summary</h3>
              {(!selectedService || !selectedProfessional || !selectedTimeSlot) && multipleAppointments.length === 0 && (
                <div className="empty-service-selection">
                  <div className="empty-service-message">
                    <div className="empty-icon">➕</div>
                    <h4>No services added yet</h4>
                    <p>Select a service to begin. When you pick a time it will be added automatically.</p>
                  </div>
                </div>
              )}
              {multipleAppointments.length > 0 && (
                <div className="services-session-summary">
                  <h4>✨ Services in Your Booking Session ({multipleAppointments.length})</h4>
                  <div className="services-list">
                    {multipleAppointments.map((apt, index) => (
                      <div key={apt.id} className="service-session-item">
                        <div className="service-number">#{index + 1}</div>
                        <div className="service-session-details">
                          <div className="service-session-name">{apt.service.name}</div>
                          <div className="service-session-meta">
                            👨‍⚕️ {apt.professional.user?.firstName || apt.professional.name} • 
                            🕐 {apt.timeSlot} • ⏱️ {apt.service.duration}min • 💰 AED {apt.service.price}
                          </div>
                        </div>
                        <button 
                          className="remove-service-btn"
                          onClick={() => removeAppointmentFromSession(apt.id)}
                          title="Remove this service"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="session-summary-totals">
                    <div className="summary-total-row">
                      <span>Total Services:</span>
                      <span className="total-count">{multipleAppointments.length}</span>
                    </div>
                    <div className="summary-total-row">
                      <span>Total Duration:</span>
                      <span className="total-duration">{multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0)} minutes</span>
                    </div>
                    <div className="summary-total-row total-price-row">
                      <span>Total Amount:</span>
                      <span className="total-amount">AED {getTotalSessionPrice()}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="multi-service-actions">
                <button 
                  className="add-another-service-btn"
                  onClick={startAdditionalService}
                  disabled={bookingLoading}
                >
                  ➕ Add Another Service
                </button>
                {multipleAppointments.length > 0 && (
                  <button 
                    className="proceed-to-client-btn"
                    onClick={() => setBookingStep(5)}
                    disabled={bookingLoading}
                  >
                    👤 Proceed to Client Information →
                  </button>
                )}
                {multipleAppointments.length === 0 && (
                  <div className="no-services-message">
                    <p>ℹ️ Please add at least one service to proceed to client information.</p>
                  </div>
                )}
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-back" onClick={() => setBookingStep(3)}>← Back to Time</button>
              </div>
            </>
          )}

          {/* Step 5: Client Info */}
          {bookingStep === 5 && (
            <>
              <h3>👤 Client Information</h3>
              <div className="client-step-services-summary">
                <h4>📋 Selected Services ({multipleAppointments.length})</h4>
                <div className="mini-services-list">
                  {multipleAppointments.map((apt) => (
                    <div key={apt.id} className="mini-service-item">
                      <span className="mini-service-name">{apt.service.name}</span>
                      <span className="mini-service-price">AED {apt.service.price}</span>
                    </div>
                  ))}
                </div>
                <div className="mini-total">
                  <strong>Total: AED {getTotalSessionPrice()}</strong>
                </div>
              </div>
              <div className="client-search-section">
                <div className="client-search-header">
                  <h4>Search Existing Client</h4>
                  {selectedExistingClient && (
                    <button className="clear-client-btn" onClick={clearClientSelection}>Clear Selection</button>
                  )}
                </div>
                {!selectedExistingClient && !isAddingNewClient && (
                  <div className="client-search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={clientSearchQuery}
                      onChange={handleClientSearchChange}
                      onFocus={() => { setShowClientSearch(true); searchClients(clientSearchQuery); }}
                      onBlur={() => { setTimeout(() => setShowClientSearch(false), 200); }}
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
                              <div className="client-result-name">{client.firstName} {client.lastName}</div>
                              <div className="client-result-contact">{client.email} • {client.phone}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showClientSearch && clientSearchQuery && clientSearchResults.length === 0 && (
                      <div className="client-search-no-results">
                        <p>No clients found for "{clientSearchQuery}"</p>
                        <button className="add-new-client-btn" onClick={addNewClient}>Add New Client</button>
                      </div>
                    )}
                    {!showClientSearch && !isAddingNewClient && (
                      <button className="add-new-client-btn" onClick={addNewClient}>+ Add New Client</button>
                    )}
                  </div>
                )}
                {selectedExistingClient && (
                  <div className="selected-client-display">
                    <div className="selected-client-avatar">
                      {(selectedExistingClient.firstName?.[0] || '') + (selectedExistingClient.lastName?.[0] || '')}
                    </div>
                    <div className="selected-client-info">
                      <div className="selected-client-name">{selectedExistingClient.firstName} {selectedExistingClient.lastName}</div>
                      <div className="selected-client-contact">{selectedExistingClient.email} • {selectedExistingClient.phone}</div>
                    </div>
                    <div className="selected-client-badge">Existing Client</div>
                  </div>
                )}
                {isAddingNewClient && (
                  <div className="new-client-form">
                    <div className="new-client-header">
                      <h4>Add New Client</h4>
                      <button className="back-to-search-btn" onClick={() => { setIsAddingNewClient(false); setShowClientSearch(true); setClientInfo({ name: '', email: '', phone: '' }); }}>← Back to Search</button>
                    </div>
                    <div className="booking-modal-form">
                      <div className="form-group">
                        <label htmlFor="clientName">Client Name *</label>
                        <input id="clientName" type="text" placeholder="Enter client's full name" value={clientInfo.name} onChange={e => setClientInfo(f => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="clientEmail">Email Address *</label>
                        <input id="clientEmail" type="email" placeholder="Enter client's email address" value={clientInfo.email} onChange={e => setClientInfo(f => ({ ...f, email: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="clientPhone">Phone Number *</label>
                        <input id="clientPhone" type="tel" placeholder="Enter client's phone number" value={clientInfo.phone} onChange={e => setClientInfo(f => ({ ...f, phone: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="booking-modal-actions">
                <button
                  className="booking-modal-next"
                  onClick={() => setBookingStep(6)}
                  disabled={!selectedExistingClient && (!clientInfo.name.trim() || !clientInfo.email.trim() || !clientInfo.phone.trim())}
                >
                  Continue to Payment →
                </button>
                <button className="booking-modal-back" onClick={() => setBookingStep(4)}>← Back to Services</button>
              </div>
            </>
          )}

          {/* Step 6: Payment */}
          {bookingStep === 6 && (
            <>
              <h3>💳 Payment & Final Confirmation</h3>
              <div className="multiple-appointments-summary">
                <h4>📋 Appointment Session Summary</h4>
                <div className="appointments-list">
                  {multipleAppointments.map((apt, index) => (
                    <div key={apt.id} className="appointment-summary-item">
                      <div className="appointment-number">#{index + 1}</div>
                      <div className="appointment-details">
                        <div className="service-name">{apt.service.name}</div>
                        <div className="appointment-meta">
                          {apt.professional.user?.firstName || apt.professional.name} • 
                          {apt.timeSlot} • {apt.service.duration}min • AED {apt.service.price}
                        </div>
                      </div>
                      <button className="remove-appointment-btn" onClick={() => removeAppointmentFromSession(apt.id)} title="Remove this appointment">×</button>
                    </div>
                  ))}
                </div>
                <div className="session-totals">
                  <div className="total-item"><span>Total Services:</span><span>{multipleAppointments.length}</span></div>
                  <div className="total-item"><span>Total Duration:</span><span>{multipleAppointments.reduce((sum, apt) => sum + apt.service.duration, 0)} minutes</span></div>
                  <div className="total-item total-price"><span>Total Amount:</span><span>AED {getTotalSessionPrice()}</span></div>
                </div>
              </div>
              <div className="client-summary">
                <h4>  Client Information</h4>
                <div className="summary-item">
                  <span>Client:</span>
                  <span>
                    {selectedExistingClient ? `${selectedExistingClient.firstName} ${selectedExistingClient.lastName}` : clientInfo.name}
                    {selectedExistingClient && (<span className="existing-client-indicator">✨ VIP Member</span>)}
                  </span>
                </div>
                <div className="summary-item">
                  <span>📧 Email:</span>
                  <span>{selectedExistingClient ? selectedExistingClient.email : clientInfo.email}</span>
                </div>
                <div className="summary-item">
                  <span>📱 Phone:</span>
                  <span>{selectedExistingClient ? selectedExistingClient.phone : clientInfo.phone}</span>
                </div>
              </div>
              <div className="booking-modal-form">
                <div className="form-group">
                  <label>💳 Select Payment Method:</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>🎁 Gift Card Code (Optional):</label>
                  <input type="text" placeholder="Enter gift card code" value={giftCardCode} onChange={e => setGiftCardCode(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>📝 Notes (Optional):</label>
                  <textarea placeholder="Any special requests or notes..." value={bookingForm.notes} onChange={e => setBookingForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
                </div>
              </div>
              <div className="booking-modal-actions">
                <button className="booking-modal-confirm" onClick={handleCreateBooking} disabled={bookingLoading || multipleAppointments.length === 0}>
                  {bookingLoading ? '✨ Creating Your Luxury Experience...' : `🎉 Confirm ${multipleAppointments.length} Service${multipleAppointments.length > 1 ? 's' : ''} - AED ${getTotalSessionPrice()}`}
                </button>
                <button className="booking-modal-back" onClick={() => setBookingStep(5)}>← Back</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
