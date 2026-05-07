import React, { useState, useEffect } from 'react';
import Loading from '../../../states/Loading';
import NoDataState from '../../../states/NoData';

const TodaysNextAppointments = ({ appointments = [], loading }) => {
  const PAGE_SIZE = 4;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [appointments]);

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleAppointments = appointments.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="card">
      <h3>Today's next appointments</h3>
      <div className="next-appointments-list">
        {loading ? (
          <Loading />
        ) : visibleAppointments.length ? (
          visibleAppointments.map((appointment, index) => (
            <div key={index} className="next-appointment-box">
              <div className="next-date-box">
                <div className="next-date">{appointment.date}</div>
                <div className="next-month">{appointment.month}</div>
              </div>
              <div className="next-details">
                <div className="next-time-status">
                  <span className="next-time">{appointment.time}</span>
                  <span className="next-status">{appointment.status}</span>
                </div>
                <div className="next-title">{appointment.title}</div>
                <div className="next-info">{appointment.type}</div>
                <div className="next-location">{appointment.location}</div>
              </div>
              <div className="next-price">{appointment.price}</div>
            </div>
          ))
        ) : (
          <NoDataState />
        )}
      </div>

      {!loading && appointments.length > PAGE_SIZE && (
        <div className="stats-pagination">
          <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ‹
          </button>
          <span className="page-info">
            {page} of {totalPages}
          </span>
          <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default TodaysNextAppointments;
