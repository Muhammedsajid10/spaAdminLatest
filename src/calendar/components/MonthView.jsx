import React from 'react';

/**
 * MonthView component for the Admin Calendar
 * Displays a monthly calendar grid with appointment summaries
 */
const MonthView = ({
    currentDate,
    calendarDays,
    localDateKey,
    displayEmployees,
    mergedAppointments,
    formatTime,
    handleMonthDayClick,
    availableServices,
    setSelectedBookingForStatus,
    setShowBookingStatusModal,
    showBookingTooltipHandler,
    hideBookingTooltip,
    handleShowMoreAppointments
}) => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayIndex = startOfMonth.getDay();
    const emptyCellsBefore = Array.from({ length: (firstDayIndex === 0 ? 6 : firstDayIndex - 1) });

    return (
        <div className="month-view-container">
            <div className="month-day-names">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="month-day-name">{day}</div>
                ))}
            </div>
            <div className="month-view-grid">
                {emptyCellsBefore.map((_, index) => (
                    <div key={`empty-${index}`} className="month-day-cell empty"></div>
                ))}
                {calendarDays.map(day => {
                    const dayKey = localDateKey(day);
                    const dayAppointments = [];

                    // Get appointments for this day from all employees
                    displayEmployees.forEach(emp => {
                        if (mergedAppointments[emp.id]) {
                            Object.entries(mergedAppointments[emp.id]).forEach(([slotKey, appointment]) => {
                                if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
                                    const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
                                    dayAppointments.push({
                                        ...appointment,
                                        employeeName: emp.name,
                                        employeeAvatar: emp.avatar,
                                        employeeId: emp.id,
                                        time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD'
                                    });
                                }
                            });
                        }
                    });

                    return (
                        <div
                            key={dayKey}
                            className="month-day-cell"
                            onClick={() => handleMonthDayClick(day)}
                            style={{ cursor: 'pointer' }}
                            title={`Click to add appointment on ${day.toLocaleDateString()}`}
                        >
                            <div className="month-day-header">
                                <span className="month-day-date">{day.getDate()}</span>
                                <span className="month-add-appointment-hint">+</span>
                            </div>
                            <div className="month-appointments">
                                {dayAppointments.length > 0 ? (
                                    <>
                                        {dayAppointments.slice(0, 3).map((app, index) => (
                                            <div key={index}
                                                className="month-appointment-entry"
                                                style={{ backgroundColor: app.color }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (app.bookingId) {
                                                        const foundService = availableServices.find(s => s._id === app.serviceEntryId || s.id === app.serviceEntryId || s.name === app.service);
                                                        const servicePrice = foundService?.price || 0;
                                                        const appointmentDetails = {
                                                            ...app,
                                                            employeeId: app.employeeId,
                                                            employeeName: app.employeeName,
                                                            slotTime: app.time,
                                                            date: dayKey,
                                                            slotKey: `${dayKey}_${app.time}`,
                                                            serviceEntryId: app.serviceEntryId,
                                                            price: servicePrice,
                                                            finalAmount: servicePrice
                                                        };
                                                        setSelectedBookingForStatus(appointmentDetails);
                                                        setShowBookingStatusModal(true);
                                                    }
                                                }}
                                                onMouseEnter={(e) => showBookingTooltipHandler(e, {
                                                    client: app.client,
                                                    service: app.service,
                                                    time: app.time,
                                                    professional: app.employeeName,
                                                    status: app.status || 'Confirmed',
                                                    notes: app.notes
                                                })}
                                                onMouseLeave={hideBookingTooltip}>
                                                <span className="appointment-client-name">{app.client}</span>
                                                <span className="appointment-service-name">{app.service}</span>
                                            </div>
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <div
                                                className="month-more-appointments"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleShowMoreAppointments(dayAppointments, day, event);
                                                }}
                                            >
                                                +{dayAppointments.length - 3} more
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="month-empty-day">
                                        <span className="add-appointment-text">Click to add appointment</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
