import React, { useState, useEffect } from 'react';
import Loading from '../../../states/Loading';
import NoDataState from '../../../states/NoData';

const AppointmentsActivity = ({ appointments = [], loading }) => {
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [appointments]);

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleAppointments = appointments.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="card">
      <h3>Appointments activity</h3>
      <div className="activity-list">
        {loading ? (
          <Loading />
        ) : visibleAppointments.length ? (
          visibleAppointments.map((appointment, index) => (
            <div key={index} className="activity-card">
              <div className="activity-title">{appointment.title || 'Untitled service'}</div>
              <div className="activity-details">
                <span>{appointment.time}</span>
                <span>{appointment.status}</span>
              </div>
            </div>
          ))
        ) : (
          <NoDataState />
        )}
      </div>

      {!loading && visibleAppointments.length > 0 && totalPages > 1 && (
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

export default AppointmentsActivity;
