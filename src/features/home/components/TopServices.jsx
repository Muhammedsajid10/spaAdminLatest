import React, { useState, useEffect } from 'react';
import Loading from '../../../states/Loading';
import NoDataState from '../../../states/NoData';

const TopServices = ({ topServices = [], loading }) => {
  const PAGE_SIZE = 7;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [topServices]);

  const totalPages = Math.max(1, Math.ceil(topServices.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleServices = topServices.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="card stats-card">
      <h3>Top services</h3>
      <div className="stats-table">
        <div className="stats-row stats-header">
          <div className="stats-cell">Service</div>
          <div className="stats-cell">This month</div>
          <div className="stats-cell">Last month</div>
        </div>

        {loading ? (
          <Loading />
        ) : visibleServices.length ? (
          visibleServices.map((service, index) => (
            <div key={index} className="stats-row">
              <div className="stats-cell">{service.service}</div>
              <div className="stats-cell">{service.thisMonth}</div>
              <div className="stats-cell">{service.lastMonth}</div>
            </div>
          ))
        ) : (
          <NoDataState />
        )}
      </div>

      {!loading && topServices.length > PAGE_SIZE && (
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

export default TopServices;
