// src/components/ui/ReportSearchBar.jsx
import React from "react";
import { Search } from "lucide-react";
import "./../../styles/ReportSearchBar.css";

export default function ReportSearchBar({ value, onChange, placeholder }) {
  return (
    <div className="report-searchbar-wrapper">
      <div className="report-searchbar">
        <Search className="search-icon" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Search by report name or description"}
        />
      </div>
    </div>
  );
}
