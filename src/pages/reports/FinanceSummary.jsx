import React, { useMemo } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import MonthPicker from "../../components/ui/MonthPicker";
import ExportDropdown from "../../components/common/ExportDropdown";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ActionRow from "../../components/reports/ActionRow";
import { useFinanceSummary } from "../../store/reports/hooks";
import { useReportDateRange } from "../../store/reports/hooks";
import { useReportExport } from "../../hooks/useReportExport";
import "../../styles/FinanceSummary.css";

const formatCurrency = (amount) => {
  if (amount === 0) return "AED 0.00";
  const formatted = Math.abs(amount).toFixed(2);
  const sign = amount < 0 ? "- " : "";
  return `${sign}AED ${formatted}`;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const FinanceSummary = () => {
  const navigate = useNavigate();
  const { data: financeData, status, error } = useFinanceSummary();
  const [dateRange, setDateRange] = useReportDateRange();
  const { exportLoading, exportError, exportFinanceReport } = useReportExport();

  // Generate unique dates from finance data for table columns
  const uniqueDates = useMemo(() => {
    if (!financeData?.length) return [];
    
    const dates = financeData
      .map(item => item.date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a)); // Sort newest first
    
    return [...new Set(dates)];
  }, [financeData]);

  // Create table structure with sections and sub-rows
  const tableStructure = useMemo(() => {
    const salesRows = [
      { key: 'serviceCharges', label: 'Service charges', isSubRow: false },
      { key: 'tips', label: 'Tips', isSubRow: false },
      { key: 'netOtherSales', label: 'Net other sales', isSubRow: false },
      { key: 'taxOnOtherSales', label: 'Tax on other sales', isSubRow: true },
      { key: 'totalOtherSales', label: 'Total other sales', isTotal: true },
      { key: 'totalSalesOtherSales', label: 'Total sales + other sales', isTotal: true },
      { key: 'salesPaidInPeriod', label: 'Sales paid in period', isSubRow: false },
      { key: 'unpaidSalesInPeriod', label: 'Unpaid sales in period', isSubRow: false }
    ];

    const paymentRows = [
      { key: 'card', label: 'Card', isSubRow: false },
      { key: 'cash', label: 'Cash', isSubRow: false },
      { key: 'freshaOnline', label: 'Fresha online', isSubRow: false },
      { key: 'paymentLink', label: 'Payment Link', isSubRow: false },
      { key: 'totalPayments', label: 'Total payments', isTotal: true },
      { key: 'paymentsForSalesInPeriod', label: 'Payments for sales in period', isSubRow: false },
      { key: 'paymentsForSalesInPreviousPeriods', label: 'Payments for sales in previous periods', isSubRow: false },
      { key: 'upfrontPayments', label: 'Upfront payments', isSubRow: false }
    ];

    const redemptionRows = [
      { key: 'upfrontPaymentRedemption', label: 'Upfront payment redemption', isSubRow: false },
      { key: 'giftCardRedemption', label: 'Gift card redemption', isSubRow: false },
      { key: 'totalRedemptions', label: 'Total redemptions', isTotal: true },
      { key: 'redemptionsForSalesInPeriod', label: 'Redemptions for sales in period', isSubRow: false },
      { key: 'redemptionsForSalesInPreviousPeriods', label: 'Redemptions for sales in previous periods', isSubRow: false }
    ];

    return [
      { type: 'section', label: 'Sales', rows: salesRows },
      { type: 'section', label: 'Payments', rows: paymentRows },
      { type: 'section', label: 'Redemptions', rows: redemptionRows }
    ];
  }, []);

  const handleBack = () => {
    navigate("/reports");
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleExport = async (format) => {
    console.log(`Exporting Finance Summary as ${format}`);
    
    const result = await exportFinanceReport(
      format,
      financeData,
      uniqueDates,
      tableStructure,
      'finance_summary'
    );
    
    if (!result.success) {
      alert(`Export failed: ${result.message}`);
    }
  };

  // Left slot - MonthPicker
  const leftSlot = (
    <MonthPicker value={dateRange} onChange={setDateRange} showPresets={true} />
  );

  // Right slot - Export Button
  const rightSlot = (
    <ExportDropdown 
      onExport={handleExport} 
      loading={exportLoading}
      exportError={exportError}
    />
  );

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
          <div className="finance-table-wrapper">
            <table className="finance-table">
              <thead>
                <tr>
                  <th></th>
                  {status === 'succeeded' && uniqueDates.map((date) => (
                    <th key={date} className="finance-date-column">
                      {formatDate(date)}
                    </th>
                  ))}
                  {status === 'loading' && (
                    <th className="finance-date-column">Loading dates...</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {status === 'loading' && (
                  <tr>
                    <td colSpan="100%" className="finance-loading-cell">
                      <LoadingSpinner label="Loading finance data..." />
                    </td>
                  </tr>
                )}
                
                {error && (
                  <tr>
                    <td colSpan="100%" className="finance-error-cell">
                      <div className="finance-error-message">
                        Error loading data: {error}
                      </div>
                    </td>
                  </tr>
                )}
                
                {status === 'succeeded' && financeData && financeData.length > 0 && (
                  <>
                    {tableStructure.map((section, sectionIndex) => (
                      <React.Fragment key={section.label}>
                        <tr className="finance-section-header">
                          <td className="finance-section-header">{section.label}</td>
                          {uniqueDates.map((date) => (
                            <td key={date} className="finance-section-header"></td>
                          ))}
                        </tr>
                        {section.rows.map((row, rowIndex) => (
                          <tr 
                            key={`${section.label}-${row.key}`}
                            className={`${row.isSubRow ? 'finance-sub-row' : ''} ${row.isTotal ? 'finance-total-row' : ''}`}
                          >
                            <td>{row.label}</td>
                            {uniqueDates.map((date) => {
                              const dayData = financeData.find(item => item.date === date);
                              const value = dayData ? dayData[row.key] : 0;
                              return (
                                <td 
                                  key={date}
                                  className={`${value < 0 ? 'finance-negative' : value > 0 ? 'finance-positive' : ''}`}
                                >
                                  {formatCurrency(value)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </>
                )}
                
                {status === 'succeeded' && (!financeData || financeData.length === 0) && (
                  <tr>
                    <td colSpan="100%" className="finance-empty-cell">
                      <div className="finance-empty-message">
                        No finance data available for the selected period
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination for future enhancement */}
          {status === 'succeeded' && financeData && financeData.length > 0 && (
            <div className="finance-table-pagination">
              <div className="pagination-info">
                Showing {financeData.length} entries for {uniqueDates.length} date{uniqueDates.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceSummary;
