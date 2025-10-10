import React, { useEffect, useState } from "react";
import { Download, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MonthPicker from "../../components/ui/MonthPicker";
import DataTable from "../../components/common/DataTable";
import ReportHeader from "../../components/reports/ReportHeader";
import ActionRow from "../../components/reports/ActionRow";
import Button from "../../components/ui/Button";
import "../../styles/ReportsGeneric.css";

const GenericReportPage = ({
  title,
  description,
  columns = [],
  dataFetcher,
  customRenderer,
  showDatePicker = true,
  showSearch = true,
  showExport = true,
  searchPlaceholder = "Search reports...",
  className = '',
  category = '' // Add category prop to determine breadcrumb
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Get category from URL or prop
  const getCategory = () => {
    if (category) return category;
    
    const path = location.pathname;
    if (path.includes('sales')) return 'Sales';
    if (path.includes('finance') || path.includes('payment')) return 'Finance';
    if (path.includes('appointments')) return 'Appointments';
    if (path.includes('team')) return 'Team';
    if (path.includes('client')) return 'Clients';
    return '';
  };

  useEffect(() => {
    if (dataFetcher) {
      setLoading(true);
      dataFetcher(dateRange)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [dataFetcher, dateRange]);

  useEffect(() => {
    if (search.trim() === "") {
      setFiltered(data);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        data.filter(row =>
          Object.values(row).some(val =>
            String(val).toLowerCase().includes(s)
          )
        )
      );
    }
  }, [search, data]);

  const handleExport = (option) => {
    console.log(`Exporting as ${option.value}`);
    // Implement export logic here
  };

  const handleBack = () => {
    navigate('/reports');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  // Left slot - Date picker
  const leftSlot = showDatePicker ? (
    <MonthPicker
      value={dateRange}
      onChange={setDateRange}
      showPresets={true}
    />
  ) : null;

  // Right slot - Export button
  const rightSlot = showExport ? (
    <Button 
      variant="outline" 
      icon={<Download />}
      onClick={() => handleExport({ value: 'csv', label: 'Export CSV' })}
    >
      Export
    </Button>
  ) : null;

  const currentCategory = getCategory();

  return (
    <div className={`generic-report-page ${className}`}>
      <div className="report-container">
        {/* Header Section with back button and breadcrumb */}
        <div className="report-header">
          <div className="report-header__top">
            <Button
              variant="outline"
              icon={<ArrowLeft />}
              onClick={handleBack}
              className="report-back-button"
            >
              Back
            </Button>
            <div className="report-header__content">
              {/* Breadcrumb Navigation */}
              <div className="report-breadcrumb">
                <button 
                  className="breadcrumb-link"
                  onClick={() => handleBreadcrumbClick('/reports')}
                >
                  All reports
                </button>
                {currentCategory && (
                  <>
                    <ChevronRight className="breadcrumb-separator" />
                    <span className="breadcrumb-current">{currentCategory}</span>
                    <ChevronRight className="breadcrumb-separator" />
                    <span className="breadcrumb-current">{title}</span>
                  </>
                )}
              </div>
              
              {/* Title and Description */}
              <h2 className="report-header__title">{title}</h2>
              {description && <p className="report-header__subtitle">{description}</p>}
            </div>
          </div>
        </div>

        {/* Action Row */}
        <ActionRow
          leftSlot={leftSlot}
          searchValue={search}
          onSearchChange={showSearch ? setSearch : undefined}
          searchPlaceholder={searchPlaceholder}
          rightSlot={rightSlot}
        />

        {/* Table Section */}
        <div className="report-table-section">
          {customRenderer ? (
            customRenderer(filtered, loading)
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              loading={loading}
              sortable={true}
              paginated={true}
              className="report-table"
              emptyMessage="No data available for the selected period"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GenericReportPage;
