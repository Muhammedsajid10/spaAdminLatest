// ReportsCategory.jsx
import React from 'react';
import ReportCard from "../../components/ui/ReportCard";
import { FileText, TrendingUp, DollarSign, Users } from 'lucide-react';
import "../../styles/reports.css";

const ReportsCategory = ({ data, onReportClick }) => {
  // Icon mapping for different report types
  const getReportIcon = (key) => {
    const iconMap = {
      'sales-summary': <TrendingUp className="report-icon" />,
      'payment-summary': <DollarSign className="report-icon" />,
      'appointments': <Users className="report-icon" />,
      default: <FileText className="report-icon" />
    };
    return iconMap[key] || iconMap.default;
  };

  const handleCardClick = (reportKey) => {
    if (onReportClick) {
      onReportClick(reportKey);
    }
  };

  return (
    <div className="reports-category">
      <div className="reports-grid">
        {data.map((report) => (
          <div 
            key={report.key} 
            className="report-card"
            onClick={() => handleCardClick(report.key)}
          >
            <div className="report-card-header">
              {getReportIcon(report.key)}
              <h3>{report.title}</h3>
            </div>
            <p className="report-description">{report.desc}</p>
            <div className="report-card-footer">
              <span className="report-category">{report.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsCategory;
