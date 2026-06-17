import React from 'react';

const ReportHeader = ({ title, subtitle }) => {
  return (
    <div className="report-header">
      <h2 className="report-header__title">{title}</h2>
      {subtitle && <p className="report-header__subtitle">{subtitle}</p>}
    </div>
  );
};

export default ReportHeader;