import React from 'react';
import './MonthView.css';

export default function MonthView({
	calendarDays = [],
	displayEmployees = [],
	mergedAppointments = {},
	localDateKey,
	formatTime,
	showBookingTooltipHandler,
	hideBookingTooltip,
	handleShowMoreAppointments,
	setSelectedBookingForStatus,
	setShowBookingStatusModal
}) {
	return (
		<div className="month-view-container">
			<div className="month-day-names">
				{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
					<div key={day} className="month-day-name">{day}</div>
				))}
			</div>

			<div className="month-view-grid">
				{calendarDays.map(day => {
					const dayKey = localDateKey(day);
					const dayAppointments = [];

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
						<div key={dayKey} className="month-day-cell">
							<div className="month-day-header">
								<span className="month-day-date">{day.getDate()}</span>
								<span className="month-add-appointment-hint">+</span>
							</div>

							<div className="month-appointments">
								{dayAppointments.length > 0 ? (
									<>
										{dayAppointments.slice(0, 3).map((app, index) => (
											<div
												key={index}
												className="month-appointment-entry"
												style={{ backgroundColor: app.color }}
												onClick={(e) => {
													e.stopPropagation();
													if (app.bookingId) {
														const appointmentDetails = {
															...app,
															employeeId: app.employeeId,
															employeeName: app.employeeName,
															slotTime: app.time,
															date: dayKey,
															slotKey: `${dayKey}_${app.time}`,
															serviceEntryId: app.serviceEntryId
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
												onMouseLeave={hideBookingTooltip}
											>
												<span className="appointment-client-name">{app.client}</span>
												<span className="appointment-service-name">{app.service}</span>
											</div>
										))}

										{dayAppointments.length > 3 && (
											<div className="month-more-appointments" onClick={(event) => { event.stopPropagation(); handleShowMoreAppointments(dayAppointments, day, event); }}>
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
}
