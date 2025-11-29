import { useState, useCallback } from 'react';

export const useCalendarModals = () => {
  // Booking Modal
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState(null);
  const [selectedBookingDate, setSelectedBookingDate] = useState(null);
  const [showBookingDatePicker, setShowBookingDatePicker] = useState(false);
  const [isNewAppointment, setIsNewAppointment] = useState(false);

  // Unavailable Popup
  const [showUnavailablePopup, setShowUnavailablePopup] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');

  // Booking Status Modal
  const [showBookingStatusModal, setShowBookingStatusModal] = useState(false);
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState(null);

  // Team Popup
  const [showTeamPopup, setShowTeamPopup] = useState(false);

  // Calendar Popup
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [calendarPopupTab, setCalendarPopupTab] = useState('confirmed');

  // More Appointments Dropdown
  const [showMoreAppointments, setShowMoreAppointments] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownPositionedAbove, setDropdownPositionedAbove] = useState(false);

  // Tooltips
  const [showBookingTooltip, setShowBookingTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const [showTimeHover, setShowTimeHover] = useState(false);
  const [hoverTimeData, setHoverTimeData] = useState(null);
  const [hoverTimePosition, setHoverTimePosition] = useState({ top: 0, left: 0 });

  // Handlers
  const closeBookingModal = useCallback(() => {
    setShowAddBookingModal(false);
    setShowUnavailablePopup(false);
    setBookingDefaults(null);
    setSelectedBookingDate(null);
    setShowBookingDatePicker(false);
  }, []);

  const closeBookingStatusModal = useCallback(() => {
    setShowBookingStatusModal(false);
    setSelectedBookingForStatus(null);
  }, []);

  const handleShowMoreAppointments = useCallback((dayAppointments, dayDate, event) => {
    const rect = event.target.getBoundingClientRect();
    const dropdownHeight = 280;
    const dropdownWidth = 320;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;
    let positionedAbove = false;

    if (rect.bottom + dropdownHeight > viewportHeight) {
      top = rect.top + scrollY - dropdownHeight - 8;
      positionedAbove = true;
    }

    if (rect.left + dropdownWidth > viewportWidth) {
      left = rect.right + scrollX - dropdownWidth;
    }

    if (left < scrollX + 16) left = scrollX + 16;
    if (top < scrollY + 16) {
      top = scrollY + 16;
      positionedAbove = false;
    }

    setDropdownPosition({ top, left });
    setDropdownPositionedAbove(positionedAbove);
    setSelectedDayAppointments(dayAppointments);
    setSelectedDayDate(dayDate);
    setShowMoreAppointments(true);
  }, []);

  const closeMoreAppointmentsDropdown = useCallback(() => {
    setShowMoreAppointments(false);
    setSelectedDayAppointments([]);
    setSelectedDayDate(null);
    setDropdownPositionedAbove(false);
  }, []);

  const showBookingTooltipHandler = useCallback((event, appointment) => {
    if (!event) return;
    const el = event.currentTarget || event.target;
    if (!el || !el.getBoundingClientRect) return;
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    let x = rect.left + scrollX + rect.width / 2;
    let y = rect.top + scrollY - 8;
    
    const tooltipWidth = 280;
    const halfWidth = tooltipWidth / 2;
    const minX = scrollX + halfWidth + 8;
    const maxX = scrollX + window.innerWidth - halfWidth - 8;
    
    if (x < minX) x = minX;
    if (x > maxX) x = maxX;

    setTooltipPosition({ x, y });
    setTooltipData({
      ...appointment,
      price: appointment.price || appointment.totalAmount,
      finalAmount: appointment.finalAmount || appointment.finalPrice
    });
    setShowBookingTooltip(true);
  }, []);

  const hideBookingTooltip = useCallback(() => {
    setShowBookingTooltip(false);
    setTooltipData(null);
  }, []);

  const showTimeHoverHandler = useCallback((event, timeSlot, currentDate) => {
    if (!event) return;
    const el = event.currentTarget || event.target;
    if (!el || !el.getBoundingClientRect) return;

    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const x = rect.left + scrollX + rect.width / 2;
    const y = rect.top + scrollY - 8;

    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    setHoverTimePosition({ x, y });
    setHoverTimeData({
      timeSlot,
      currentTime: currentTimeStr,
      date: currentDate.toLocaleDateString()
    });
    setShowTimeHover(true);
  }, []);

  const hideTimeHover = useCallback(() => {
    setShowTimeHover(false);
    setHoverTimeData(null);
  }, []);

  return {
    // State
    showAddBookingModal, setShowAddBookingModal,
    bookingDefaults, setBookingDefaults,
    selectedBookingDate, setSelectedBookingDate,
    showBookingDatePicker, setShowBookingDatePicker,
    isNewAppointment, setIsNewAppointment,
    showUnavailablePopup, setShowUnavailablePopup,
    unavailableMessage, setUnavailableMessage,
    showBookingStatusModal, setShowBookingStatusModal,
    selectedBookingForStatus, setSelectedBookingForStatus,
    showTeamPopup, setShowTeamPopup,
    showCalendarPopup, setShowCalendarPopup,
    calendarPopupTab, setCalendarPopupTab,
    showMoreAppointments, setShowMoreAppointments,
    selectedDayAppointments, setSelectedDayAppointments,
    selectedDayDate, setSelectedDayDate,
    dropdownPosition, setDropdownPosition,
    dropdownPositionedAbove, setDropdownPositionedAbove,
    showBookingTooltip, setShowBookingTooltip,
    tooltipData, setTooltipData,
    tooltipPosition, setTooltipPosition,
    showTimeHover, setShowTimeHover,
    hoverTimeData, setHoverTimeData,
    hoverTimePosition, setHoverTimePosition,

    // Handlers
    closeBookingModal,
    closeBookingStatusModal,
    handleShowMoreAppointments,
    closeMoreAppointmentsDropdown,
    showBookingTooltipHandler,
    hideBookingTooltip,
    showTimeHoverHandler,
    hideTimeHover
  };
};
