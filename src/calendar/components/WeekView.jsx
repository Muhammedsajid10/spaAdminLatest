import React from 'react';
import './WeekView.css';

export default function WeekView({
	calendarDays = [],
	displayEmployees = [],
	mergedAppointments = {},
	formatDateLocal,
	hasShiftOnDate,
	formatTime,
	bookingSession,
	employees,
	handleTimeSlotClick,
	showBookingTooltipHandler,
	hideBookingTooltip,
	handleShowMoreAppointments,
	setIsNewAppointment,
	setSelectedBookingForStatus,
	setShowBookingStatusModal
}) {
	return (
		<div className="week-view-container">
			<div className="week-headers-row">
				<div className="week-staff-header-cell">Staff</div>
				{calendarDays.map(day => {
					const isToday = day.toDateString() === new Date().toDateString();
					return (
						<div key={day.toISOString()} className={`week-day-header-cell ${isToday ? 'is-today' : ''}`}>
							<div className="week-day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
							<div className="week-day-number">{day.getDate()}</div>
						</div>
					);
				})}
			</div>

			{displayEmployees.map(employee => (
				<div key={employee.id} className="week-employee-row">
					<div className="week-staff-cell">
						<div className="staff-avatar" style={{ backgroundColor: employee.avatarColor }}>
							{employee.avatar ? <img src={employee.avatar} alt={employee.name} className="avatar-image" /> : employee.name.charAt(0)}
						</div>
						<div className="staff-info">
							<div className="staff-name">{employee.name}</div>
							<div className="staff-position">{employee.position}</div>
						</div>
					</div>

					{calendarDays.map(day => {
						const dayKey = formatDateLocal(day);
						const hasShift = hasShiftOnDate(employee, day);

						const dayAppointments = [];
						if (mergedAppointments[employee.id]) {
							Object.entries(mergedAppointments[employee.id]).forEach(([slotKey, appointment]) => {
								if (slotKey.startsWith(dayKey) || appointment.date === dayKey) {
									const timeFromKey = slotKey.includes('_') ? slotKey.split('_')[1] : null;
									dayAppointments.push({
										...appointment,
										time: timeFromKey ? formatTime(timeFromKey) : 'Time TBD',
										slotKey,
										timeSlot: timeFromKey,
									});
								}
							});
						}

						return (
							<div key={`${employee.id}-${dayKey}`} className={`week-day-cell ${!hasShift ? 'no-shift' : ''}`}>
								{!hasShift ? (
									<div className="week-no-shift">
										<span className="no-shift-text">No shift today</span>
									</div>
								) : dayAppointments.length > 0 ? (
									<div className="week-appointments-container">
										{dayAppointments.slice(0, 3).map((app, index) => (
											<div
												key={index}
												className="week-appointment-block"
												style={{ backgroundColor: app.color }}
												onClick={(e) => {
													e.stopPropagation();
													if (app.timeSlot && app.bookingId) {
														const appointmentDetails = {
															...app,
															employeeId: employee.id,
															employeeName: employee.name,
															slotTime: app.timeSlot,
															date: dayKey,
															slotKey: app.slotKey,
															serviceEntryId: app.serviceEntryId
														};
														setSelectedBookingForStatus(appointmentDetails);
														setShowBookingStatusModal(true);
													} else if (app.timeSlot) {
														handleTimeSlotClick(employee.id, app.timeSlot, day);
													} else {
														const staff = employees.find(emp => emp.id === employee.id);
														if (staff) {
															bookingSession.actions.setBookingDefaults({
																professional: {
																	_id: staff._id || staff.id,
																	id: staff.id,
																	user: {
																		firstName: staff.name.split(' ')[0],
																		lastName: staff.name.split(' ')[1] || ''
																	},
																	name: staff.name,
																	position: staff.position,
																	...staff
																},
																date: day,
																isDirectEmployeeSelection: true
															});
															bookingSession.actions.setSelectedBookingDate(day);
															setIsNewAppointment(true);
															bookingSession.actions.setShowAddBookingModal(true);
															bookingSession.actions.setShowServiceCatalog(true);
														}
													}
												}}
												onMouseEnter={(e) => showBookingTooltipHandler(e, {
													client: app.client,
													service: app.service,
													time: app.time,
													professional: employee.name,
													status: app.status || 'Confirmed',
													notes: app.notes
												})}
												onMouseLeave={hideBookingTooltip}
											>
												<div className="appointment-client">{app.client}</div>
												<div className="appointment-service">{app.service}</div>
											</div>
										))}

										<div className="week-add-appointment-btn" style={{ cursor: hasShift ? 'pointer' : 'not-allowed' }} title={hasShift ? `Add another appointment with ${employee.name}` : 'No shift scheduled'}>
										</div>

										{dayAppointments.length > 3 && (
											<div className="week-more-appointments" onClick={(event) => handleShowMoreAppointments(dayAppointments, day, event)}>
												+{dayAppointments.length - 3} more
											</div>
										)}
									</div>
								) : (
									<div className="week-empty-cell clickable-slot" title={hasShift ? `Book appointment with ${employee.name} on ${day.toLocaleDateString()}` : 'No shift scheduled'}>
									</div>
								)}
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}
