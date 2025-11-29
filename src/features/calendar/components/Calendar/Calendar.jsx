/**
 * Calendar Component
 * Main container that orchestrates all calendar functionality
 */

import React from 'react';
import { useCalendar } from '../../hooks';
import CalendarHeader from '../CalendarHeader/CalendarHeader';
import CalendarToolbar from '../CalendarToolbar/CalendarToolbar';
import CalendarGrid from '../CalendarGrid/CalendarGrid';
import SessionSidebar from '../SessionSidebar/SessionSidebar';
import BookingModal from '../BookingFlow/BookingModal';
import styles from './Calendar.module.css';

/**
 * Main Calendar Component
 * @param {Object} props - Component props
 * @param {number} props.serviceDuration - Default service duration in minutes
 * @returns {JSX.Element}
 */
const Calendar = ({ serviceDuration = 30 }) => {
  // Get all calendar state and functions from main hook
  const calendar = useCalendar({ serviceDuration });

  return (
    <div className={styles.calendar}>
      {/* Header with date navigation and view selector */}
      <CalendarHeader
        currentDate={calendar.currentDate}
        dateRange={calendar.dateRange}
        viewMode={calendar.viewMode}
        isToday={calendar.isToday}
        onNext={calendar.goToNext}
        onPrevious={calendar.goToPrevious}
        onToday={calendar.goToToday}
        onViewChange={calendar.setViewMode}
      />

      {/* Toolbar with employee filter and actions */}
      <CalendarToolbar
        employees={calendar.employees}
        selectedEmployees={calendar.selectedEmployees}
        searchQuery={calendar.searchQuery}
        onSearchChange={calendar.setSearchQuery}
        onToggleEmployee={calendar.toggleEmployee}
        onSelectAll={calendar.selectAll}
        onDeselectAll={calendar.deselectAll}
        allSelected={calendar.allSelected}
      />

      <div className={styles.calendarBody}>
        {/* Main calendar grid */}
        <CalendarGrid
          viewMode={calendar.viewMode}
          currentDate={calendar.currentDate}
          dateRange={calendar.dateRange}
          employees={calendar.selectedEmployees}
          availableSlots={calendar.availableSlots}
          onTimeSlotClick={calendar.handleTimeSlotClick}
          onAppointmentClick={calendar.handleAppointmentClick}
        />

        {/* Session sidebar for multiple appointments */}
        {calendar.bookingSession.hasAppointments && (
          <SessionSidebar
            appointments={calendar.bookingSession.appointments}
            totalPrice={calendar.bookingSession.calculateTotal()}
            totalDuration={calendar.bookingSession.calculateTotalDuration()}
            onRemoveAppointment={calendar.bookingSession.removeAppointment}
            onClearSession={calendar.bookingSession.clearSession}
          />
        )}
      </div>

      {/* Booking modal */}
      <BookingModal
        isOpen={calendar.bookingFlow.isOpen}
        currentStep={calendar.bookingFlow.currentStep}
        bookingData={calendar.bookingFlow.bookingData}
        onClose={calendar.bookingFlow.closeModal}
        onNext={calendar.bookingFlow.goToNextStep}
        onPrevious={calendar.bookingFlow.goToPreviousStep}
        onUpdateData={calendar.bookingFlow.updateBookingData}
        canProceed={calendar.bookingFlow.canProceed}
        canGoBack={calendar.bookingFlow.canGoBack}
        isFinalStep={calendar.bookingFlow.isFinalStep}
      />
    </div>
  );
};

export default Calendar;
