import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Download, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MonthPicker from "../../components/ui/MonthPicker";
import DataTable from "../../components/common/DataTable";
import ReportHeader from "../../components/reports/ReportHeader";
import ActionRow from "../../components/reports/ActionRow";
import Button from "../../components/ui/Button";
import Dropdown from "../../components/ui/DropDown";
import ExportDropdown from "../../components/common/ExportDropdown";
import { useReportDateRange, useReportClients } from '../../store/reports/hooks';
import { ReportsAPI } from "../../Service/api/reportsApi";
import "../../styles/ReportsGeneric.css";

const arrayFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === 'object') {
    const keys = ['data', 'results', 'items', 'records', 'rows', 'clients'];
    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') {
        const nested = arrayFromPayload(value);
        if (nested.length) return nested;
      }
    }
  }

  return [];
};

const filterByDateRange = (rows, range) => {
  if (!range?.start || !range?.end) return rows;

  const start = new Date(range.start);
  const end = new Date(`${range.end}T23:59:59`);

  return rows.filter((row) => {
    const dateKey = Object.keys(row ?? {}).find((key) => /date/i.test(key));
    if (!dateKey) return true;

    const value = new Date(row[dateKey]);
    if (Number.isNaN(value.getTime())) return true;

    return value >= start && value <= end;
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
  typeFilterOptions = [
    { value: "all", label: "Type" },
    { value: "services", label: "Services" },
    { value: "products", label: "Products" },
    { value: "gift-cards", label: "Gift cards" },
  ],
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

  const filters = useMemo(
    () => ({
      dateRange,
      selectedType
    }),
    [dateRange, selectedType]
  );

  const getCategory = () => {
    if (category) return category;

    const path = location.pathname;
    if (path.includes("sales")) return "Sales";
    if (path.includes("finance") || path.includes("payment")) return "Finance";
    if (path.includes("appointments")) return "Appointments";
    if (path.includes("team")) return "Team";
    if (path.includes("client")) return "Clients";
    return "";
  };

  useEffect(() => {
    if (!usingDataHook) return;

    if (hookStatus === "loading" || hookStatus === "idle") {
      setLoading(true);
      return;
    }

    if (hookStatus === "failed") {
      setLoading(false);
      setError(hookError);
      setData([]);
      return;
    }

    if (hookStatus === "succeeded") {
      setLoading(false);
      setError(null);
      setData(Array.isArray(hookData) ? hookData : []);
    }
  }, [usingDataHook, hookStatus, hookError, hookData]);

  useEffect(() => {
    if (usingDataHook || !dataFetcher) return;

    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await dataFetcher(filters);
        if (!active) return;
        const rows = arrayFromPayload(response);
        setData(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError(err);
        setData([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [usingDataHook, dataFetcher, filters]);

  const applyFiltering = useCallback(
    (rows) => {
      const safeRows = Array.isArray(rows) ? rows : [];
      const rangeFiltered = filterByDateRange(safeRows, dateRange);

      const typeFiltered =
        typeFilterKey && selectedType && !["all", "type"].includes(selectedType.toLowerCase())
          ? rangeFiltered.filter((row) => {
              if (typeFilterPredicate) {
                return typeFilterPredicate(row, selectedType);
              }
              const value = row?.[typeFilterKey];
              return String(value ?? "")
                .toLowerCase()
                .includes(selectedType.toLowerCase());
            })
          : rangeFiltered;

      if (!search.trim()) {
        return typeFiltered;
      }

      const query = search.toLowerCase();
      return typeFiltered.filter((row) =>
        Object.values(row ?? {}).some((val) =>
          String(val ?? "").toLowerCase().includes(query)
        )
      );
    },
    [dateRange, selectedType, typeFilterKey, typeFilterPredicate, search]
  );

  useEffect(() => {
    setFiltered(applyFiltering(data));
  }, [data, applyFiltering]);

  const handleExport = async (format) => {
    if (!Array.isArray(filtered) || filtered.length === 0) return;

    try {
      const blob = await ReportsAPI.exportData(filtered, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.${
        format === "excel" ? "xlsx" : format
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleBack = () => {
    navigate('/reports');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  // Left slot - Date picker
  const leftSlot = (
    <div className={`report-filters ${showTypeFilter ? "report-filters--with-type" : ""}`}>
      {showTypeFilter && (
        <Dropdown
          options={typeFilterOptions}
          value={selectedType}
          onChange={setSelectedType}
          className="report-filter__dropdown"
        />
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

        {/* Table Section */}
        <div className="report-table-section">
          
            <DataTable
              data={filtered}
              columns={columns}
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
