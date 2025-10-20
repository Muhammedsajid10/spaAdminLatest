// DayView removed — placeholder file
// The project previously included a beginner-friendly Day view component here.
// This file intentionally left minimal to indicate the DayView has been removed per your request.
import React from 'react';
import StaffColumn from './StaffColumn';
import './DayView.css';

export default function DayView({
	timeSlots = [],
	displayEmployees = [],
	mergedAppointments = {},
	currentDate,
	isTimeSlotUnavailable,
	handleTimeSlotClick,
	showBookingTooltipHandler,
	hideBookingTooltip,
	showTimeHoverHandler,
	hideTimeHover,
	setSelectedBookingForStatus,
	setShowBookingStatusModal,
	formatTime
}) {
	return (
		<div className="calendar-grid-container">
			<div className="time-column">
				<div className="time-header">Time</div>
				<div className="time-slots">
					{timeSlots.map(slot => (
						<div key={slot} className={`time-slot-label ${slot.endsWith(':00') ? 'hour-start' : 'half-hour'}`}>
							<span className="time-text">{formatTime(slot)}</span>
						</div>
					))}
				</div>
			</div>

			<div
				className={`staff-grid cols-${Math.min(displayEmployees.length || 1, 20)}`}
				style={{
					'--dynamic-employee-count': displayEmployees.length || 1,
					'--dynamic-column-width': displayEmployees.length <= 6
						? `${100 / (displayEmployees.length || 1)}%`
						: 'var(--staff-column-width)'
				}}
			>
				{displayEmployees.map(employee => (
					<StaffColumn
						key={employee.id}
						employee={employee}
						timeSlots={timeSlots}
						appointments={mergedAppointments}
						currentDate={currentDate}
						isTimeSlotUnavailable={isTimeSlotUnavailable}
						handleTimeSlotClick={handleTimeSlotClick}
						showBookingTooltipHandler={showBookingTooltipHandler}
						hideBookingTooltip={hideBookingTooltip}
						showTimeHoverHandler={showTimeHoverHandler}
						hideTimeHover={hideTimeHover}
						setSelectedBookingForStatus={setSelectedBookingForStatus}
						setShowBookingStatusModal={setShowBookingStatusModal}
					/>
				))}
			</div>
		</div>
	);
}
