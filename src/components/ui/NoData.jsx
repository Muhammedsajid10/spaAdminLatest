import React from 'react';
import './NoData.css';
function NoDataState() {
  return (
  <div className="no-teamdata-card">
              <div className="no-teamdata-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="no-teamdata-icon-svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V9H3V7.5zM3 9h18v7.5A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5V9z"
                  />
                </svg>
              </div>
              <h2 className="no-teamdata-text">No Data Available</h2>
            </div>
  );
}
export default NoDataState;