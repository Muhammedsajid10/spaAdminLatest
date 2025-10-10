import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import MonthPicker from "../../components/ui/MonthPicker";
import ExportDropdown from "../../components/common/ExportDropdown";
import ActionRow from "../../components/reports/ActionRow";
import "../../styles/FinanceSummary.css";

const FinanceSummary = () => {
  const navigate = useNavigate();
  const [financeData, setFinanceData] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
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
    navigate("/reports");
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleExport = (option) => {
    console.log(`Exporting as ${option}`);
    // Add export logic here later
  };

  // Left slot - MonthPicker
  const leftSlot = (
    <MonthPicker value={dateRange} onChange={setDateRange} showPresets={true} />
  );

  // Right slot - Export Button
  const rightSlot = <ExportDropdown onExport={handleExport} />;

  return (
    <div className="generic-report-page">
      <div className="report-container">
        <div className="report-header">
          <div className="report-header__row">
            <Button
              variant="outline"
              icon={<ArrowLeft />}
              onClick={handleBack}
              className="report-back-button"
            >
              Back
            </Button>

            <div className="report-breadcrumb">
              <button
                className="breadcrumb-link"
                onClick={() => handleBreadcrumbClick("/reports")}
              >
                All reports
              </button>
              <ChevronRight className="breadcrumb-separator" />
              <button
                className="breadcrumb-link"
                onClick={() => handleBreadcrumbClick("/reports/finance")}
              >
                Finance
              </button>
              <ChevronRight className="breadcrumb-separator" />
              <span className="breadcrumb-current">Finance summary</span>
            </div>
          </div>

          <h2 className="report-header__title">Finance summary</h2>
          <p className="report-header__subtitle">
            High-level summary of sales, payments, and liabilities.
          </p>
        </div>

        <ActionRow
          leftSlot={leftSlot}
          rightSlot={rightSlot}
          className="report-actions-no-search"
        />

        <div className="finance-table-section">
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
              {financeData.map((row, i) => (
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
