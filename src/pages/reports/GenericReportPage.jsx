import React, { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
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
import { useReportExport } from '../../hooks/useReportExport';
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
  return rows.filter((row) => {
    const dateFields = ['date', 'appointmentDate', 'createdAt', 'paymentDate'];
    for (const field of dateFields) {
      if (row[field]) {
        const d = new Date(row[field]);
        if (!Number.isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const localDateStr = `${year}-${month}-${day}`;
          if (localDateStr >= range.start && localDateStr <= range.end) {
            return true;
          }
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
  const { exportLoading, exportError, exportReport, clearExportError } = useReportExport();

  const usingDataHook = typeof dataHook === "function";
  const hookResult = usingDataHook ? dataHook() : null;
  const hookStatus = hookResult?.status;
  const hookError = hookResult?.error;
  const hookData = hookResult?.data;
  const hookGroupBy = hookResult?.groupBy;
  const setHookGroupBy = hookResult?.setGroupBy;
  const hookRefresh = hookResult?.refresh;

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

    // Client-side Date filtering (crucial for APIs that don't strictly filter)
    if (!usingDataHook && showDatePicker) {
      result = filterByDateRange(result, dateRange);
    }

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
  }, [data, search, selectedType, typeFilterKey, typeFilterPredicate, showSearch, usingDataHook, dateRange, showDatePicker]);

  const handleTypeChange = useCallback((newValue) => {
    // Extract string value from dropdown object or use as-is if string
    const value = typeof newValue === 'string' ? newValue : newValue?.value;

    if (setHookGroupBy) {
      setHookGroupBy(value);
    } else {
      setSelectedType(value);
    }
  }, [setHookGroupBy]);

  // Update first column label dynamically based on groupBy
  const dynamicColumns = useMemo(() => {
    if (!showTypeFilter || !columns.length) return columns;

    const currentGroupBy = hookGroupBy ?? selectedType;

    const firstCol = { ...columns[0] };
    const selectedOption = typeFilterOptions.find(opt => opt.value === currentGroupBy);

    if (selectedOption) {
      firstCol.label = selectedOption.label;
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
    const result = await exportReport(
      format, 
      filtered, 
      dynamicColumns, 
      title, 
      title.toLowerCase().replace(/\s+/g, '_')
    );

    if (!result.success) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: result.message,
        confirmButtonColor: '#1f2937'
      });
    }
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
          value={(() => {
            const currentValue = hookGroupBy ?? selectedType;
            const foundOption = typeFilterOptions.find(opt => opt.value === currentValue);
            return foundOption;
          })()}
          onChange={handleTypeChange}
          placeholder="Select type..."
          className="report-type-dropdown"
        />
      </div>
    )}
    {showDatePicker && (
      <MonthPicker value={dateRange} onChange={setDateRange} />
    )}
  </div>
);

  // Right slot - Export button
  const rightSlot = showExport ? (
    <ExportDropdown 
      onExport={handleExport} 
      loading={exportLoading}
      exportError={exportError}
    />
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
            renderCell={customRenderer} // Pass customRenderer as renderCell to DataTable
          />
        </div>
      </div>
    </div>
  );
};

export default GenericReportPage;
