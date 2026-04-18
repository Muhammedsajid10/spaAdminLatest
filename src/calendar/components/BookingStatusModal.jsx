import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  User, Calendar, Clock, Timer, Hash, Banknote 
} from 'lucide-react';
import { MdDelete } from 'react-icons/md';
import Loading from '../../Service/Loading';
import { 
  setManagementStatusModal, 
  setManagementStatus 
} from '../../../store/adminBookingSlice';
import { 
  updateBookingStatusThunk, 
  deleteBookingThunk 
} from '../../../store/adminBookingThunks';
import { fetchCalendarThunk } from '../../../store/thunks';

const BookingStatusModal = () => {
  const dispatch = useDispatch();
  const { management } = useSelector(state => state.adminBooking);
  const { currentDate, currentView } = useSelector(state => state.calendar);

  const { showStatusModal, selectedBooking, loading, error } = management;

  if (!showStatusModal || !selectedBooking) return null;

  const closeBookingStatusModal = () => {
    dispatch(setManagementStatusModal(false));
  };

  const handleBookingStatusUpdate = async (newStatus) => {
    dispatch(setManagementStatus({ loading: true, error: null }));
    try {
      await dispatch(updateBookingStatusThunk({
        bookingId: selectedBooking.bookingId,
        serviceEntryId: selectedBooking.serviceEntryId,
        newStatus
      })).unwrap();
      
      // Refresh calendar
      dispatch(fetchCalendarThunk({ currentDate, currentView }));
      closeBookingStatusModal();
    } catch (err) {
      dispatch(setManagementStatus({ loading: false, error: err.message }));
    }
  };

  const handleDeleteBooking = async () => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    dispatch(setManagementStatus({ loading: true, error: null }));
    try {
      await dispatch(deleteBookingThunk(selectedBooking.bookingId)).unwrap();
      
      // Refresh calendar
      dispatch(fetchCalendarThunk({ currentDate, currentView }));
      closeBookingStatusModal();
    } catch (err) {
      dispatch(setManagementStatus({ loading: false, error: err.message }));
    }
  };

  return (
    <div className="modern-booking-modal">
      <div className="booking-modal-overlay booking-modal-fade-in">
        <div className="booking-modal booking-modal-animate-in pro-theme">
          <button className="booking-modal-close" onClick={closeBookingStatusModal}>×</button>
          <h2>Booking Management</h2>

          {error && (
            <div className="booking-modal-error">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="booking-modal-loading" style={{ justifyContent: 'center' }}>
              <Loading text="Updating status" />
            </div>
          )}

          <div className="booking-status-details">
            <div className="booking-status-header">
              <div className="booking-status-info">
                <h3>
                  {typeof selectedBooking.client === 'string'
                    ? selectedBooking.client
                    : selectedBooking.client?.fullName ||
                    `${selectedBooking.client?.firstName || ''} ${selectedBooking.client?.lastName || ''}`.trim() ||
                    'Client'}
                </h3>
                <p>
                  {typeof selectedBooking.service === 'string'
                    ? selectedBooking.service
                    : selectedBooking.service?.name || 'Service'}
                </p>
              </div>
              <div className={`booking-status-badge status-${selectedBooking.status?.toLowerCase() || 'booked'}`}>
                {(selectedBooking.status || 'Booked').charAt(0).toUpperCase() + (selectedBooking.status || 'Booked').slice(1)}
              </div>
            </div>

            <div className="booking-status-grid">
              <div className="status-detail">
                <div className="detail-icon"><User size={20} /></div>
                <div className="detail-content">
                  <span className="detail-label">Professional</span>
                  <span className="detail-value">
                    {typeof selectedBooking.employeeName === 'string'
                      ? selectedBooking.employeeName
                      : selectedBooking.employeeName?.user?.firstName ||
                      selectedBooking.employeeName?.fullName ||
                      'Employee'}
                  </span>
                </div>
              </div>
              <div className="status-detail">
                <div className="detail-icon"><Calendar size={20} /></div>
                <div className="detail-content">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {new Date(selectedBooking.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="status-detail">
                <div className="detail-icon"><Clock size={20} /></div>
                <div className="detail-content">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{selectedBooking.slotTime}</span>
                </div>
              </div>
              <div className="status-detail">
                <div className="detail-icon"><Timer size={20} /></div>
                <div className="detail-content">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{selectedBooking.duration} minutes</span>
                </div>
              </div>
              <div className="status-detail">
                <div className="detail-icon"><Hash size={20} /></div>
                <div className="detail-content">
                  <span className="detail-label">Booking ID</span>
                  <span className="detail-value">{selectedBooking.bookingId || 'N/A'}</span>
                </div>
              </div>
              <div className="status-detail full-width-breakdown">
                <div className="detail-icon"><Banknote size={20} /></div>
                <div className="detail-content pricing-breakdown-content">
                  <span className="detail-label">Payment Details</span>
                  <div className="booking-breakdown-list">
                    {(() => {
                      const allServices = selectedBooking.services || [];
                      let currentSvc = null;

                      if (selectedBooking.serviceEntryId && allServices.length > 0) {
                        currentSvc = allServices.find(s => String(s._id) === String(selectedBooking.serviceEntryId));
                      }

                      if (!currentSvc) {
                        currentSvc = {
                          serviceName: selectedBooking.service,
                          price: Number(selectedBooking.price || 0),
                          originalPrice: Number(selectedBooking.originalPrice || selectedBooking.price || 0)
                        };
                      }

                      const svcPrice = Number(currentSvc.price ?? currentSvc.servicePrice ?? currentSvc.finalPrice ?? currentSvc.customPrice ?? currentSvc.originalPrice ?? 0);
                      const svcOrigPrice = Number(currentSvc.originalPrice ?? currentSvc.price ?? svcPrice);
                      const svcDiscount = svcOrigPrice - svcPrice;

                      const bookingTotalOrigValue = allServices.length > 0
                        ? allServices.reduce((sum, s) => sum + Number(s.originalPrice || s.price || 0), 0)
                        : Number(selectedBooking.originalPrice || selectedBooking.price || 0);

                      const bookingFinalTotal = Number(selectedBooking.totalAmount || selectedBooking.finalAmount || 0);
                      const totalSavings = bookingTotalOrigValue - bookingFinalTotal;

                      const globalDiscount = Number(selectedBooking.customDiscount || selectedBooking.customTotalDiscount || 0);

                      return (
                        <>
                          <div className="breakdown-service-item">
                            <div className="svc-info">
                              <span className="svc-name-small">{currentSvc.serviceName || currentSvc.service?.name || selectedBooking.service}</span>
                              <div className="svc-pricing-line">
                                {svcDiscount > 0 ? (
                                  <>
                                    <span className="orig-price-strike">AED {svcOrigPrice.toFixed(2)}</span>
                                    <span className="final-price-bold">AED {svcPrice.toFixed(2)}</span>
                                    <span className="disc-tag-small">(-AED {svcDiscount.toFixed(2)})</span>
                                  </>
                                ) : (
                                  <span className="final-price-normal">AED {svcPrice.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="breakdown-total-separator"></div>
                          {globalDiscount > 0 && (
                            <div className="breakdown-row discount-global">
                              <span className="final-label-small">Extra Booking Discount</span>
                              <span className="final-value-disc">-AED {globalDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          {totalSavings > globalDiscount && (
                            <div className="breakdown-row discount-info-row">
                              <span className="final-label-small">Applied Service Discounts</span>
                              <span className="final-value-disc">-AED {(totalSavings - globalDiscount).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="breakdown-final-row">
                            <div className="final-label-group">
                              <span className="final-label">Total Amount</span>
                              {totalSavings > 0 && (
                                <span className="total-savings-badge">AED {totalSavings.toFixed(2)} SAVED</span>
                              )}
                            </div>
                            <div className="final-value-stack">
                              {totalSavings > 0 && (
                                <span className="final-orig-strike-total">AED {bookingTotalOrigValue.toFixed(2)}</span>
                              )}
                              <span className="final-value-large">AED {bookingFinalTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-status-actions">
              <div className="status-actions-header">
                <div className="status-options" role="radiogroup" aria-label="Update status">
                  {['confirmed', 'started', 'completed', 'no-show'].map(st => {
                    const current = (selectedBooking.status || 'confirmed').toLowerCase();
                    let isActive = current === st;

                    if ((current === 'in-progress' || current === 'started') && st === 'started') isActive = true;
                    if ((current === 'scheduled' || current === 'booked') && st === 'confirmed') isActive = true;

                    const label = st === 'no-show' ? 'No-Show' : st.charAt(0).toUpperCase() + st.slice(1);

                    return (
                      <button
                        key={st}
                        type="button"
                        className={`status-option ${isActive ? 'active' : ''}`}
                        onClick={() => handleBookingStatusUpdate(st)}
                        disabled={loading}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="booking-danger-zone">
                <button
                  className="delete-booking-btn"
                  onClick={handleDeleteBooking}
                  disabled={loading}
                >
                  <span className="btn-icon"><MdDelete /></span>
                  <span className="btn-label">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusModal;
