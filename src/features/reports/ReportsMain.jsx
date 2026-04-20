import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import "../../styles/ReportsMain.css";

// Reusable data (you can extend this easily)
const reportTabs = [
  { key: "sales", label: "Sales" },
  { key: "finance", label: "Finance" },
  { key: "appointments", label: "Appointments" },
  { key: "team", label: "Team" },
  { key: "clients", label: "Clients" },
];

const reports = [
  {
    id: 1,
    category: "sales",
    title: "Sales summary",
    desc: "Sales quantities and value, excluding tips and gift card sales.",
    premium: false,
    route: "sales-summary"
  },
  {
    id: 101,
    category: "sales",
    title: "Invoice Details",
    desc: "View and download invoice details for completed transactions.",
    premium: false,
    route: "invoice-details"
  },
  {
    id: 4,
    category: "finance",
    title: "Finance summary",
    desc: "Overview of revenue, tax, and expenses.",
    premium: false,
    route: "finance-summary"
  },
  {
    id: 5,
    category: "finance",
    title: "Payment Summary",
    desc: "Payments split by payment methods.",
    premium: false,
    route: "payment-summary"
  },
  {
    id: 6,
    category: "finance",
    title: "Payment Transactions",
    desc: "Detailed View of all payment transactions.",
    premium: false,
    route: "payment-transactions"
  },
  {
    id: 7,
    category: "appointments",
    title: "Appointments Summary",
    desc: "View appointment trends and staff bookings.",
    premium: false,
    route: "appointments-summary"
  },
  {
    id: 9,
    category: "team",
    title: "Working Hours Activity",
    desc: "Detailed view of team members worked hours, shifts, and timesheets",
    premium: false,
    route: "team-activity"
  },
  {
    id: 11,
    category: "clients",
    title: "Client list",
    desc: "Comprehensive list of all active clients.",
    premium: false,
    route: "client-list"
  },
];

export default function ReportsMain() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sales';
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const setActive = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  // Fixed filtering logic - properly filter by category and search
  const filteredReports = reports.filter((report) => {
    const matchesCategory = report.category === activeTab;
    const matchesSearch = search === "" || 
      report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle report card click - navigate to GenericReportPage
  const handleReportClick = (report) => {
    if (report.route) {
      navigate(`/reports/${report.route}`);
    }
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <h2>Reporting and analytics</h2>
        <p>Access all of your reports and summaries</p>
      </div>

      {/* Search bar */}
      <div className="reports-searchbar">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search by report name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="reports-list">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="report-card"
              onClick={() => handleReportClick(report)}
              style={{ cursor: 'pointer' }}
            >
              <div className="report-info">
                <h4>{report.title}</h4>
                <p>{report.desc}</p>
              </div>
              {report.premium && <span className="report-tag">Premium</span>}
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>
              {search 
                ? `No reports found for "${search}" in ${activeTab} category.`
                : `No reports available in ${activeTab} category.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
