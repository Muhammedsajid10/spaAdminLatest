import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Base_url } from '../Service/Base_url';
import './Selectcalander.css';
import './BookingModals.css';

// Components
import CalendarHeader from '../features/calendar/components/CalendarHeader/CalendarHeader';
import CalendarGrid from '../features/calendar/components/CalendarGrid/CalendarGrid';
import BookingModal from '../features/calendar/components/BookingFlow/BookingModal';
import Loading from '../states/Loading.jsx';
import Error500Page from '../states/ErrorPage';

// Hooks
import { useCalendarLogic } from '../features/calendar/hooks/useCalendarLogic';
import { useCalendarView } from '../features/calendar/hooks/useCalendarView';
import { useCalendarModals } from '../features/calendar/hooks/useCalendarModals';

// Utils
import { BookingTooltip } from '../features/calendar/components/shared/BookingTooltip';
import { TimeHoverTooltip } from '../features/calendar/components/shared/TimeHoverTooltip';
import { MoreAppointmentsDropdown } from '../features/calendar/components/shared/MoreAppointmentsDropdown';
import { clearSession as clearSessionAction, setShowServiceCatalog as setShowServiceCatalogAction } from '../store/bookingSessionSlice';

const SelectCalendar = () => {
  const dispatch = useDispatch();
  const schedulerContentRef = useRef(null);

  // --- HOOKS ---
  const {
    currentView, setCurrentView, currentDate, setCurrentDate, calendarDays,
    goToToday, goToPrevious, goToNext,
    datePickerView, setDatePickerView, showDatePicker, setShowDatePicker,
    datePickerCurrentMonth, setDatePickerCurrentMonth, datePickerSelectedDate, setDatePickerSelectedDate,
    goToDatePickerPreviousMonth, goToDatePickerNextMonth, goToDatePickerPreviousYear, goToDatePickerNextYear,
    goToDatePickerToday, handleDatePickerDateSelect, handleWeekSelect, handleMonthSelect,
    getDatePickerCalendarDays, getWeeksInMonth, getMonthsInYear
  } = useCalendarView();

  const {
    employees, employeesLoading, employeesError, timeSlots, loading, error, appointments, mergedAppointments, displayEmployees,
    teamFilter, teamSearchQuery, selectedEmployees, bookingStatusLoading, bookingStatusError,
    setTeamSearchQuery, fetchCalendarData, handleBookingStatusUpdate, handleDeleteBooking,
    handleTeamFilterChange, handleEmployeeToggle, handleClearSelection, isTimeSlotUnavailable, getFilteredAndSearchedEmployees
  } = useCalendarLogic(currentDate, currentView);

  const {
    showAddBookingModal, setShowAddBookingModal, bookingDefaults, setBookingDefaults,
    selectedBookingDate, setSelectedBookingDate, showBookingDatePicker, setShowBookingDatePicker,
    isNewAppointment, setIsNewAppointment, showUnavailablePopup, setShowUnavailablePopup,
    unavailableMessage, setUnavailableMessage, showBookingStatusModal, setShowBookingStatusModal,
    selectedBookingForStatus, setSelectedBookingForStatus, showTeamPopup, setShowTeamPopup,
    showCalendarPopup, setShowCalendarPopup, calendarPopupTab, setCalendarPopupTab,
    showMoreAppointments, setShowMoreAppointments, selectedDayAppointments, setSelectedDayAppointments,
    selectedDayDate, setSelectedDayDate, dropdownPosition, setDropdownPosition,
    dropdownPositionedAbove, setDropdownPositionedAbove, showBookingTooltip, setShowBookingTooltip,
    tooltipData, setTooltipData, tooltipPosition, setTooltipPosition, showTimeHover, setShowTimeHover,
    hoverTimeData, setHoverTimeData, hoverTimePosition, setHoverTimePosition,
    closeBookingModal, closeBookingStatusModal, handleShowMoreAppointments, closeMoreAppointmentsDropdown,
    showBookingTooltipHandler, hideBookingTooltip, showTimeHoverHandler, hideTimeHover
  } = useCalendarModals();

  // --- HANDLERS ---

  const handleTimeSlotClick = (employeeId, slotTime, day) => {
    const dayKey = day ? day.toISOString().split('T')[0] : currentDate.toISOString().split('T')[0];
    const slotKey = `${dayKey}_${slotTime}`;
    const existingAppointment = appointments[employeeId]?.[slotKey];

    // Cutoff check
    const [hours] = slotTime.split(':').map(Number);
    if (hours >= 23) {
      setUnavailableMessage('Bookings cannot start at or after 23:00.');
      setShowUnavailablePopup(true);
      return;
    }

    if (existingAppointment) {
      const employee = employees.find(emp => emp.id === employeeId);
      setSelectedBookingForStatus({
        ...existingAppointment,
        employeeId,
        employeeName: employee?.name,
        slotTime,
        date: dayKey,
        slotKey
      });
      setShowBookingStatusModal(true);
      return;
    }

    const unavailableReason = isTimeSlotUnavailable(employeeId, slotTime);
    if (unavailableReason) {
      setUnavailableMessage(unavailableReason === "No shift scheduled" 
        ? `${employees.find(e => e.id === employeeId)?.name} has no shift scheduled on this day`
        : `This time slot is unavailable: ${unavailableReason}`);
      setShowUnavailablePopup(true);
      return;
    }

    const staff = employees.find(emp => emp.id === employeeId);
    setBookingDefaults({
      professional: {
        _id: staff._id || staff.id,
        id: staff.id,
        user: { firstName: staff.name.split(' ')[0], lastName: staff.name.split(' ')[1] || '' },
        name: staff.name,
        position: staff.position,
        ...staff
      },
      time: slotTime,
      date: day || currentDate,
      isDirectTimeSlotSelection: true
    });
    setSelectedBookingDate(day || currentDate);
    setShowAddBookingModal(true);
  };

  const handleAddNewAppointment = () => {
    setBookingDefaults(null);
    if (currentView === 'Week' || currentView === 'Month') {
      setSelectedBookingDate(null);
      setShowBookingDatePicker(true);
    } else {
      setSelectedBookingDate(currentDate);
      setShowAddBookingModal(true);
    }
  };

  const handleMonthDayClick = (selectedDay) => {
    setSelectedBookingDate(selectedDay);
    setBookingDefaults(null);
    setShowAddBookingModal(true);
  };

  const handleRefreshToNow = () => {
    setCurrentDate(new Date());
    fetchCalendarData();
  };

  // Helper for Calendar Popup
  const getAppointmentsForDateRange = () => {
    // Simplified logic for demo - in real app, use date range from view
    const appointmentsList = [];
    Object.entries(appointments).forEach(([employeeId, empAppointments]) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;
      Object.entries(empAppointments).forEach(([slotKey, appointment]) => {
        appointmentsList.push({
          ...appointment,
          employeeName: employee.name,
          timeSlot: slotKey.split('_')[1]
        });
      });
    });
    
    return appointmentsList.filter(app => {
      const status = (app.status || 'confirmed').toLowerCase();
      if (calendarPopupTab === 'confirmed') return ['confirmed', 'booked', 'scheduled'].includes(status) || !app.status;
      if (calendarPopupTab === 'started') return ['started', 'in-progress', 'arrived'].includes(status);
      if (calendarPopupTab === 'completed') return status === 'completed';
      return true;
    });
  };

  // Current Time Line
  const [currentTimeLineTop, setCurrentTimeLineTop] = useState(-100);
  const [currentTimeText, setCurrentTimeText] = useState('');

  useEffect(() => {
    const updateTimeLine = () => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString() || currentView !== 'Day') {
        setCurrentTimeLineTop(-100);
        return;
      }
      const timeSlotHeightPx = 80; // Fixed height
      const firstSlotTime = timeSlots[0] || '00:00';
      const [startH, startM] = firstSlotTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const minutesIntoSchedule = currentMinutes - startMinutes;

      if (minutesIntoSchedule < 0) {
        setCurrentTimeLineTop(-100);
        return;
      }
      const top = ((minutesIntoSchedule / 30) * timeSlotHeightPx) + 86; // 86px header offset
      setCurrentTimeLineTop(top);
      setCurrentTimeText(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };

    updateTimeLine();
    const interval = setInterval(updateTimeLine, 60000);
    return () => clearInterval(interval);
  }, [currentDate, currentView, timeSlots]);

  if (loading && !employees.length) return <Loading />;
  if (error && !employees.length) return <Error500Page error={error} />;

  return (
    <div className="scheduler-root">
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        calendarDays={calendarDays}
        goToToday={goToToday}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        datePickerView={datePickerView}
        setDatePickerView={setDatePickerView}
        datePickerCurrentMonth={datePickerCurrentMonth}
        setDatePickerCurrentMonth={setDatePickerCurrentMonth}
        datePickerSelectedDate={datePickerSelectedDate}
        setDatePickerSelectedDate={setDatePickerSelectedDate}
        goToDatePickerPreviousMonth={goToDatePickerPreviousMonth}
        goToDatePickerNextMonth={goToDatePickerNextMonth}
        goToDatePickerPreviousYear={goToDatePickerPreviousYear}
        goToDatePickerNextYear={goToDatePickerNextYear}
        goToDatePickerToday={goToDatePickerToday}
        handleDatePickerDateSelect={handleDatePickerDateSelect}
        handleWeekSelect={handleWeekSelect}
        handleMonthSelect={handleMonthSelect}
        getDatePickerCalendarDays={getDatePickerCalendarDays}
        getWeeksInMonth={getWeeksInMonth}
        getMonthsInYear={getMonthsInYear}
        showTeamPopup={showTeamPopup}
        setShowTeamPopup={setShowTeamPopup}
        teamFilter={teamFilter}
        handleTeamFilterChange={handleTeamFilterChange}
        handleClearSelection={handleClearSelection}
        getFilteredAndSearchedEmployees={getFilteredAndSearchedEmployees}
        selectedEmployees={selectedEmployees}
        handleEmployeeToggle={handleEmployeeToggle}
        showCalendarPopup={showCalendarPopup}
        setShowCalendarPopup={setShowCalendarPopup}
        calendarPopupTab={calendarPopupTab}
        setCalendarPopupTab={setCalendarPopupTab}
        getAppointmentsForDateRange={getAppointmentsForDateRange}
        handleRefreshToNow={handleRefreshToNow}
        handleViewChange={setCurrentView}
        handleAddNewAppointment={handleAddNewAppointment}
      />

      <div className="scheduler-content" ref={schedulerContentRef}>
        <CalendarGrid
          loading={loading}
          error={error}
          employees={employees}
          appointments={appointments}
          currentView={currentView}
          currentDate={currentDate}
          timeSlots={timeSlots}
          displayEmployees={displayEmployees}
          calendarDays={calendarDays}
          mergedAppointments={mergedAppointments}
          isTimeSlotUnavailable={isTimeSlotUnavailable}
          handleTimeSlotClick={handleTimeSlotClick}
          showBookingTooltipHandler={showBookingTooltipHandler}
          hideBookingTooltip={hideBookingTooltip}
          showTimeHoverHandler={(e, time) => showTimeHoverHandler(e, time, currentDate)}
          hideTimeHover={hideTimeHover}
          setSelectedBookingForStatus={setSelectedBookingForStatus}
          setShowBookingStatusModal={setShowBookingStatusModal}
          setBookingDefaults={setBookingDefaults}
          setSelectedBookingDate={setSelectedBookingDate}
          setIsNewAppointment={setIsNewAppointment}
          setShowAddBookingModal={setShowAddBookingModal}
          setShowServiceCatalog={(val) => dispatch(setShowServiceCatalogAction(val))}
          handleMonthDayClick={handleMonthDayClick}
          handleShowMoreAppointments={handleShowMoreAppointments}
        />
        
        {currentView === 'Day' && currentTimeLineTop > 0 && (
          <div className="current-time-line" style={{ top: `${currentTimeLineTop}px` }}>
            <span className="current-time-marker">{currentTimeText}</span>
          </div>
        )}
      </div>

      {/* Modals & Popups */}
      <BookingModal
        isOpen={showAddBookingModal}
        onClose={closeBookingModal}
        initialData={{
          service: null,
          professional: bookingDefaults?.professional,
          timeSlot: bookingDefaults?.time,
          date: bookingDefaults?.date || selectedBookingDate || currentDate
        }}
      />

      {showBookingTooltip && tooltipData && (
        <BookingTooltip
          data={tooltipData}
          position={tooltipPosition}
          onClose={hideBookingTooltip}
        />
      )}

      {showTimeHover && hoverTimeData && (
        <TimeHoverTooltip
          data={hoverTimeData}
          position={hoverTimePosition}
        />
      )}

      {showMoreAppointments && (
        <MoreAppointmentsDropdown
          appointments={selectedDayAppointments}
          date={selectedDayDate}
          position={dropdownPosition}
          positionedAbove={dropdownPositionedAbove}
          onClose={closeMoreAppointmentsDropdown}
        />
      )}

      {/* Unavailable Popup */}
      {showUnavailablePopup && (
        <div className="service-selection-overlay" onClick={() => setShowUnavailablePopup(false)}>
          <div className="service-selection-popup" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Unavailable</h3>
              <button className="close-btn" onClick={() => setShowUnavailablePopup(false)}>×</button>
            </div>
            <div className="popup-content">
              <p>{unavailableMessage}</p>
            </div>
            <div className="popup-footer">
              <button className="confirm-btn" onClick={() => setShowUnavailablePopup(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Status Modal */}
      {showBookingStatusModal && selectedBookingForStatus && (
        <div className="modern-booking-modal" onClick={closeBookingStatusModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="close-btn" onClick={closeBookingStatusModal}>×</button>
            </div>
            <div className="modal-body">
              {/* Simplified Status Modal Content - In real app, extract this too */}
              <div className="status-actions">
                <p><strong>Client:</strong> {selectedBookingForStatus.client}</p>
                <p><strong>Service:</strong> {selectedBookingForStatus.service}</p>
                <p><strong>Status:</strong> {selectedBookingForStatus.status}</p>
                <div className="action-buttons">
                  <button onClick={() => handleBookingStatusUpdate('confirmed', selectedBookingForStatus)}>Confirm</button>
                  <button onClick={() => handleBookingStatusUpdate('completed', selectedBookingForStatus)}>Complete</button>
                  <button onClick={() => handleBookingStatusUpdate('cancelled', selectedBookingForStatus)} className="danger">Cancel</button>
                  <button onClick={() => handleDeleteBooking(selectedBookingForStatus, closeBookingStatusModal)} className="danger">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectCalendar;
