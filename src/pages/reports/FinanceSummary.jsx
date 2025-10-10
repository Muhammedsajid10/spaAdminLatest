import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import "../../styles/FinanceSummary.css";

const FinanceSummary = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [financeData, setFinanceData] = useState([]);

  useEffect(() => {
    // For now static mock data; replace with API later
    const mockData = [
      {
        month: "Oct 2025",
        grossSales: "AED 44,370.00",
        discounts: "- AED 16,075.00",
        refunds: "AED 0.00",
        netSales: "AED 28,295.00",
        taxes: "AED 0.00",
        totalSales: "AED 28,295.00",
      },
      {
        month: "Sep 2025",
        grossSales: "AED 205,415.00",
        discounts: "- AED 73,825.00",
        refunds: "AED 0.00",
        netSales: "AED 131,590.00",
        taxes: "AED 0.00",
        totalSales: "AED 131,590.00",
      },
      {
        month: "Aug 2025",
        grossSales: "AED 211,730.00",
        discounts: "- AED 73,323.00",
        refunds: "AED 0.00",
        netSales: "AED 138,407.00",
        taxes: "AED 0.00",
        totalSales: "AED 138,407.00",
      },
      {
        month: "Jul 2025",
        grossSales: "AED 203,375.00",
        discounts: "- AED 88,630.00",
        refunds: "AED 0.00",
        netSales: "AED 114,745.00",
        taxes: "AED 0.00",
        totalSales: "AED 114,745.00",
      },
      {
        month: "Jun 2025",
        grossSales: "AED 225,010.00",
        discounts: "- AED 93,116.00",
        refunds: "AED 0.00",
        netSales: "AED 131,894.00",
        taxes: "AED 0.00",
        totalSales: "AED 131,894.00",
      },
    ];
    setFinanceData(mockData);
  }, []);

  const handleBack = () => {
    navigate('/reports');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const filteredData = financeData.filter((d) =>
    d.month.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="finance-summary-container">
      {/* Header Section with back button and breadcrumb */}
      <div className="finance-report-header">
        <div className="finance-header-top">
          <Button
            variant="outline"
            icon={<ArrowLeft />}
            onClick={handleBack}
            className="finance-back-button"
          >
            Back
          </Button>
          <div className="finance-header-content">
            {/* Breadcrumb Navigation */}
            <div className="finance-breadcrumb">
              <button 
                className="breadcrumb-link"
                onClick={() => handleBreadcrumbClick('/reports')}
              >
                All reports
              </button>
              <ChevronRight className="breadcrumb-separator" />
              <span className="breadcrumb-current">Finance</span>
              <ChevronRight className="breadcrumb-separator" />
              <span className="breadcrumb-current">Finance Summary</span>
            </div>
            
            {/* Title and Description */}
            <h2>Finance summary</h2>
            <p>High-level summary of sales, payments, and liabilities.</p>
          </div>
        </div>
      </div>

      <div className="finance-summary-page">
        {/* ===== Search Bar ===== */}
        <div className="finance-search-section">
          <div className="finance-searchbar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by month..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="finance-table-container">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Gross Sales</th>
                <th>Discounts</th>
                <th>Refunds / Returns</th>
                <th>Net Sales</th>
                <th>Taxes</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i}>
                  <td className="month-col">{row.month}</td>
                  <td>{row.grossSales}</td>
                  <td className="discounts">{row.discounts}</td>
                  <td>{row.refunds}</td>
                  <td className="highlight">{row.netSales}</td>
                  <td>{row.taxes}</td>
                  <td className="highlight-total">{row.totalSales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceSummary;
