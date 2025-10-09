// src/pages/reports/ReportsMain.jsx
import React, { useState } from "react";
import { reportTabs } from "../../reportsData.jsx";
import TabBar from "../../components/ui/TabBar";
import ReportsCategory from "./ReportsCategory";
import { Search } from "lucide-react";
import "./ReportsMain.css";

export default function ReportsMain() {
  const [active, setActive] = useState("appointments");
  const [search, setSearch] = useState("");

  const currentTab = reportTabs.find((t) => t.key === active);
  const filteredReports = currentTab.reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="reports-page">
      {/* ===== Page Header ===== */}
      <div className="reports-header">
        <h2>Reporting and analytics</h2>
        <p>Access all of your reports and summaries</p>
      </div>

      {/* ===== Search Bar ===== */}
      <div className="reports-searchbar">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search by report name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ===== Tabs ===== */}
      <TabBar tabs={reportTabs} active={active} onChange={setActive} />

      {/* ===== Report List ===== */}
      <ReportsCategory data={filteredReports} />
    </div>
  );
}
