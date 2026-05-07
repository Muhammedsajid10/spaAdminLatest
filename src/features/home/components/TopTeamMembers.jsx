import React, { useState, useEffect } from 'react';
import Loading from '../../../states/Loading';
import NoDataState from '../../../states/NoData';

const TopTeamMembers = ({ topTeamMembers = [], loading }) => {
  const PAGE_SIZE = 7;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [topTeamMembers]);

  const totalPages = Math.max(1, Math.ceil(topTeamMembers.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleMembers = topTeamMembers.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="card stats-card">
      <h3>Top team members</h3>
      <div className="stats-table">
        <div className="stats-row stats-header">
          <div className="stats-cell">Name</div>
          <div className="stats-cell">This month</div>
          <div className="stats-cell">Last month</div>
        </div>

        {loading ? (
          <Loading />
        ) : visibleMembers.length ? (
          visibleMembers.map((member, index) => (
            <div key={index} className="stats-row">
              <div className="stats-cell">{member.name}</div>
              <div className="stats-cell">{member.thisMonth}</div>
              <div className="stats-cell">{member.lastMonth}</div>
            </div>
          ))
        ) : (
          <NoDataState />
        )}
      </div>

      {!loading && topTeamMembers.length > PAGE_SIZE && (
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

export default TopTeamMembers;
