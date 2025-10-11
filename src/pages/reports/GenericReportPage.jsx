import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Download, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MonthPicker from "../../components/ui/MonthPicker";
import DataTable from "../../components/common/DataTable";
import ReportHeader from "../../components/reports/ReportHeader";
import ActionRow from "../../components/reports/ActionRow";
import Button from "../../components/ui/Button";
import DropDown from "../../components/ui/DropDown";
import ExportDropdown from "../../components/common/ExportDropdown";
import { useReportDateRange, useReportClients } from '../../store/reports/hooks';
import { ReportsAPI } from "../../Service/api/reportsApi";
import "../../styles/ReportsGeneric.css";

const arrayFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.data) return arrayFromPayload(payload.data);
  if (payload?.items) return arrayFromPayload(payload.items);
  if (payload?.rows) return arrayFromPayload(payload.rows);
  return [];
};

const filterByDateRange = (rows, range) => {
  if (!range?.start || !range?.end) return rows;
  const start = new Date(range.start);
  const end = new Date(`${range.end}T23:59:59`);
  return rows.filter((row) => {
    const dateFields = ['date', 'appointmentDate', 'createdAt', 'paymentDate'];
    for (const field of dateFields) {
      if (row[field]) {
        const d = new Date(row[field]);
        if (!Number.isNaN(d.getTime()) && d >= start && d <= end) {
          return true;
        }
      }
    }
    return false;
  });
};

const GenericReportPage = ({
  title,
  description,
  columns = [],
  dataFetcher,
  dataHook,
  customRenderer,
  showDatePicker = true,
  showSearch = true,
  showExport = true,
  searchPlaceholder = "Search reports...",
  className = '',
  category = '',
  showTypeFilter = false,
  typeFilterOptions = [],
  typeFilterKey = null,
  typeFilterPredicate = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useReportDateRange();
  const [selectedType, setSelectedType] = useState(
    typeFilterOptions?.[0]?.value ?? "all"
  );
  const [error, setError] = useState(null);

  const usingDataHook = typeof dataHook === "function";
  const hookResult = usingDataHook ? dataHook() : null;
  const hookStatus = hookResult?.status;
  const hookError = hookResult?.error;
  const hookData = hookResult?.data;
  const hookGroupBy = hookResult?.groupBy;
  const setHookGroupBy = hookResult?.setGroupBy;
  const hookRefresh = hookResult?.refresh;

  console.log('GenericReportPage render:', {
    usingDataHook,
    hookStatus,
    hookGroupBy,
    dataLength: hookData?.length,
    showTypeFilter
  });

  // Fetch data using old method if not using hook
  useEffect(() => {
    if (usingDataHook) return;
    
    const fetchData = async () => {
      if (!dataFetcher) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const result = await dataFetcher(dateRange);
        const rows = arrayFromPayload(result);
        setData(rows);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataFetcher, dateRange, usingDataHook]);

  // Update data when using hook
  useEffect(() => {
    if (!usingDataHook) return;

    console.log('Hook data updated:', {
      status: hookStatus,
      dataLength: hookData?.length,
      groupBy: hookGroupBy
    });

    if (hookStatus === 'loading') {
      setLoading(true);
      setError(null);
    } else if (hookStatus === 'succeeded') {
      setData(hookData ?? []);
      setLoading(false);
      setError(null);
    } else if (hookStatus === 'failed') {
      setError(hookError);
      setLoading(false);
      setData([]);
    }
  }, [usingDataHook, hookData, hookStatus, hookError, hookGroupBy]);

  // Apply search and type filters
  useEffect(() => {
    let result = [...data];

    // Search filter
    if (search && showSearch) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Type filter (for old method, not hook-based)
    if (!usingDataHook && typeFilterKey && selectedType !== "all") {
      if (typeFilterPredicate) {
        result = result.filter((row) => typeFilterPredicate(row, selectedType));
      } else {
        result = result.filter((row) => row[typeFilterKey] === selectedType);
      }
    }

    setFiltered(result);
  }, [data, search, selectedType, typeFilterKey, typeFilterPredicate, showSearch, usingDataHook]);

  const handleTypeChange = useCallback((newValue) => {
  console.log('Type dropdown changed:', newValue);
  
  // Extract string value from dropdown object or use as-is if string
  const value = typeof newValue === 'string' ? newValue : newValue?.value;
  
  if (setHookGroupBy) {
    console.log('Calling setHookGroupBy with:', value);
    setHookGroupBy(value);
  } else {
    console.log('Using local selectedType state');
    setSelectedType(value);
  }
}, [setHookGroupBy]);

  // Update first column label dynamically based on groupBy
  const dynamicColumns = useMemo(() => {
    if (!showTypeFilter || !columns.length) return columns;
    
    const currentGroupBy = hookGroupBy ?? selectedType;
    console.log('Updating column labels for groupBy:', currentGroupBy);
    
    const firstCol = { ...columns[0] };
    const selectedOption = typeFilterOptions.find(opt => opt.value === currentGroupBy);
    
    if (selectedOption) {
      firstCol.label = selectedOption.label;
      console.log('Updated first column label to:', selectedOption.label);
    }
    
    return [firstCol, ...columns.slice(1)];
  }, [columns, hookGroupBy, selectedType, typeFilterOptions, showTypeFilter]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/reports');
    }
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleExport = async (format) => {
    console.log(`Exporting ${filtered.length} rows as ${format}`);
    // Implement export logic
  };

  const getCategory = () => {
    if (category) return category;
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'reports') {
      const cat = pathParts[2];
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
    return null;
  };

  // Left slot - Date picker and Type Filter
  const leftSlot = (
  <div className="report-filters">
    {showTypeFilter && typeFilterOptions.length > 0 && (
      <div className="report-filter__type">
        <DropDown
          options={typeFilterOptions}
          value={typeFilterOptions.find(opt => opt.value === (hookGroupBy ?? selectedType))}
          onChange={handleTypeChange}
          placeholder="Select type..."
          className="report-type-dropdown"
        />
      </div>
    )}
    {showDatePicker && (
      <MonthPicker value={dateRange} onChange={setDateRange} showPresets={true} />
    )}
  </div>
);

  // Right slot - Export button
  const rightSlot = showExport ? (
    <ExportDropdown onExport={handleExport} />
  ) : null;

  const currentCategory = getCategory();

  return (
    <div className={`generic-report-page ${className}`}>
      <div className="report-container">
        {/* Header Section with back button and breadcrumb */}
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
                onClick={() => handleBreadcrumbClick('/reports')}
              >
                All reports
              </button>
              {currentCategory && (
                <>
                  <ChevronRight className="breadcrumb-separator" />
                  <button
                    className="breadcrumb-link"
                    onClick={() => handleBreadcrumbClick(`/reports/${currentCategory.toLowerCase()}`)}
                  >
                    {currentCategory}
                  </button>
                </>
              )}
              <ChevronRight className="breadcrumb-separator" />
              <span className="breadcrumb-current">{title}</span>
            </div>
          </div>

          <h2 className="report-header__title">{title}</h2>
          {description && <p className="report-header__subtitle">{description}</p>}
        </div>

        {/* Action Row */}
        <ActionRow
          leftSlot={leftSlot}
          rightSlot={rightSlot}
          className="report-actions-no-search"
        />

        {/* Error Display */}
        {error && (
          <div className="report-error">
            <p>Error: {error}</p>
            {hookRefresh && (
              <Button onClick={hookRefresh} variant="outline">
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Table Section */}
        <div className="report-table-section">
          <DataTable
            data={filtered}
            columns={dynamicColumns}
            loading={loading}
            sortable={true}
            paginated={true}
            className="report-table"
            emptyMessage="No data available for the selected period"
          />
        </div>
      </div>
    </div>
  );
};

export default GenericReportPage;
