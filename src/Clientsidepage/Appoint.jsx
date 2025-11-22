import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TbCaretUpDownFilled } from "react-icons/tb";
import "./Appoint.css";
import api from "../Service/Api";
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoDataState from "../states/NoData";

/* ----------------------------- Export helpers ----------------------------- */

const exportToCSV = (data) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "appointments.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const exportToPDF = (data) => {
  const doc = new jsPDF();
  const tableColumn = [
    "Ref #",
    "Created By",
    "Created Date",
    "Scheduled Date",
    "Duration",
    "Team Member",
    "Price",
    "Status",
  ];
  const tableRows = data.map((item) => [
    item.ref,
    item.createdBy,
    item.createdDate,
    item.scheduledDate,
    item.duration,
    item.teamMember,
    item.price,
    item.status,
  ]);

  doc.setFontSize(14);
  doc.text("Appointments Report", 14, 15);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: { fontSize: 10 },
  });

  doc.save("appointments.pdf");
};


const exportToExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");
  XLSX.writeFile(workbook, "appointments.xlsx");
};

/* ----------------------------- Filter Popup ------------------------------ */

const FilterPopup = ({ isOpen, onClose, onApply }) => {
  const [teamMember, setTeamMember] = useState("");
  const [status, setStatus] = useState("");
  if (!isOpen) return null;

  const handleClear = () => {
    setTeamMember("");
    setStatus("");
  };

  const handleApply = () => {
    onApply({ teamMember, status });
    onClose();
  };

  return (
    <div className="filter-popup-overlay">
      <div className="pop-main">
        <h1 className="pop-head">Filters</h1>
        <div className="filter-group">
          <h3 className="pop-head2">Team Members</h3>
          <select value={teamMember} onChange={(e) => setTeamMember(e.target.value)}>
            <option value="">All Team Members</option>
            <option value="Margirita">Margirita</option>
            <option value="icha">icha</option>
            <option value="onnie">onnie</option>
            <option value="Ninning">Ninning</option>
            <option value="Putri">Putri</option>
            <option value="Employee">Employee</option>
            <option value="Sarita">Sarita</option>
          </select>
        </div>

        <div className="filter-group">
          <h3 className="pop-head2">Status</h3>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Booked">Booked</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Arrived">Arrived</option>
            <option value="Started">Started</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Not-Now">Not-Now</option>
          </select>
        </div>

        <div className="button-group">
          <button type="button" onClick={handleClear}>Clear Filters</button>
          <button type="button" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------- Single-Date Picker UI ------------------------- */

const SingleDatePicker = ({ isOpen, onClose, onSelect, initialDate }) => {
  // ensure component mounts only when requested
  if (!isOpen) return null;

  const today = new Date();
  const init = initialDate ? new Date(initialDate + "T00:00:00") : today;

  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [selected, setSelected] = useState(initialDate ? init : null);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const toDateOnly = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const handleDayClick = (day) => {
    const d = new Date(viewYear, viewMonth, day, 0, 0, 0);
    setSelected(d);
  };

  const handleApply = () => {
    if (selected) onSelect(toDateOnly(selected));
    onClose();
  };

  const handleClear = () => {
    setSelected(null);
    onSelect(null);
    onClose();
  };

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  return (
    <div className="single-date-popover" role="dialog" aria-label="Select date">
      {/* Header */}
      <div className="single-date-header">
        <button className="nav-button" onClick={handlePrev}>
          <ChevronLeft size={18} />
        </button>

        <div className="month-year">
          {months[viewMonth]} {viewYear}
        </div>

        <button className="nav-button" onClick={handleNext}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="weekday-row" aria-hidden>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div className="weekday" key={d}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="single-date-grid" role="grid">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="empty" aria-hidden />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const thisDate = new Date(viewYear, viewMonth, day);
          const isSelected =
            selected &&
            selected.getFullYear() === viewYear &&
            selected.getMonth() === viewMonth &&
            selected.getDate() === day;

          const isToday =
            thisDate.toDateString() === today.toDateString();

          return (
            <button
              key={day}
              className={`day ${isSelected ? "selected" : ""} ${
                isToday ? "today" : ""
              }`}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </button>
          );
        })}
        {/* Trailing empty cells to complete the final week (keeps 7 columns per row) */}
        {(() => {
          const totalCells = firstDay + daysInMonth;
          const trailing = (7 - (totalCells % 7)) % 7;
          return Array.from({ length: trailing }).map((_, idx) => (
            <div key={`trail-${idx}`} className="empty" aria-hidden />
          ));
        })()}
      </div>

      {/* Footer */}
      <div className="single-date-footer">
        <button className="clear-btn" onClick={handleClear}>
          Clear
        </button>
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="apply-btn"
          onClick={handleApply}
          disabled={!selected}
        >
          Apply
        </button>
      </div>
    </div>
  );
};



/* --------------------------------- Spinner -------------------------------- */

const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

/* --------------------------------- Page ----------------------------------- */

const Appoint = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("scheduledDate");
  const [sortDirection, setSortDirection] = useState("desc");

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // NEW: calendar popover visibility + selected date ("YYYY-MM-DD")
  const [showSingleDate, setShowSingleDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Keep last-applied filter choices so they persist with search/date changes
  const [activeFilters, setActiveFilters] = useState({ teamMember: "", status: "" });

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ✅ NEW: Backend pagination state
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // ✅ NEW: Store ALL appointments for searching (loaded once, then searched client-side)
  const [allAppointments, setAllAppointments] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // ✅ OPTIMIZATION: Cache appointments data with 5-minute TTL to avoid redundant API calls
  const cacheRef = React.useRef({
    appointmentsData: null,
    cachedAt: 0
  });
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // ✅ OPTIMIZED: Fetch appointments with pagination (no longer loading all 5000)
  useEffect(() => {
    const toDateOnly = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const fetchAllAppointments = async () => {
      try {
        setIsLoadingAll(true);
        console.log('📥 Fetching appointments with pagination...');
        
        // ✅ PERFORMANCE FIX: Use reasonable limit instead of 5000
        // Backend now handles pagination efficiently with skip/limit
        const res = await api.get('/bookings/admin/all?page=1&limit=100');
        const allBookings = res?.data?.data?.bookings || [];
        
        console.log(`📊 Loaded ${allBookings.length} appointments (page 1)`);
        
        // Map the bookings to formatted appointments
        const mapped = allBookings.map((booking) => {
          const teamMembers = (booking.services || [])
            .map((s) =>
              s?.employee?.user
                ? `${s.employee.user.firstName || ""} ${s.employee.user.lastName || ""}`.trim()
                : "-"
            )
            .filter(Boolean)
            .join(", ");

          // Parse dates as UTC to avoid timezone conversion issues
          const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null;
          const apptAt = booking?.appointmentDate ? new Date(booking.appointmentDate) : null;

          const finalAmtNum =
            typeof booking?.finalAmount === "number" ? booking.finalAmount : null;

          return {
            ref: booking.bookingNumber || booking._id || "-",
            createdBy:
              booking?.client?.firstName
                ? `${booking.client.firstName} ${booking.client.lastName || ""}`.trim()
                : "-",
            createdDate: createdAt
              ? createdAt.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Dubai", // UAE timezone (GMT+4)
                })
              : "-",
            scheduledDate: apptAt
              ? apptAt.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Dubai", // UAE timezone (GMT+4)
                })
              : "-",
            createdDateObj: createdAt,
            scheduledDateObj: apptAt,
            dateOnly: apptAt ? toDateOnly(apptAt) : null,
            duration: booking?.totalDuration
              ? `${Math.round(booking.totalDuration / 60)}h`
              : "-",
            teamMember: teamMembers || "-",
            price: finalAmtNum != null ? `AED ${finalAmtNum.toFixed(2)}` : "-",
            priceValue: finalAmtNum,
            status: booking?.status || "-",
          };
        });
        
        setAllAppointments(mapped);
      } catch (err) {
        console.error('Failed to fetch all appointments:', err);
      } finally {
        setIsLoadingAll(false);
      }
    };
    
    fetchAllAppointments();
  }, []); // Only run once on mount

  // Fetch appointments (for pagination)
  useEffect(() => {
    const toDateOnly = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      
      const now = Date.now();
      // ✅ Check if cache is still valid (less than 5 minutes old)
      // But SKIP cache if:
      // 1. Filters/search/sort have changed
      // 2. On page > 1 (pagination)
      const hasFilters = selectedDate || activeFilters.teamMember || activeFilters.status || sortField !== "scheduledDate" || sortDirection !== "desc";
      const isPaginated = currentPage > 1;
      
      if (!hasFilters && !isPaginated && cacheRef.current.appointmentsData && cacheRef.current.paginationData &&
          (now - cacheRef.current.cachedAt) < CACHE_DURATION) {
        console.log('📦 Using cached appointments data (TTL: 5 min)');
        setAppointments(cacheRef.current.appointmentsData);
        // ✅ FIX: Also restore pagination data from cache
        setTotalRecords(cacheRef.current.paginationData.total);
        setTotalPages(cacheRef.current.paginationData.pages);
        setLoading(false);
        return;
      }

      try {
        // ✅ NEW: Build query params for pagination + filtering
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('limit', pageSize);
        
        // Optional: add date filter if selected
        if (selectedDate) {
          params.append('startDate', selectedDate);
          params.append('endDate', selectedDate);
        }
        
        console.log(`📥 Fetching appointments: page=${currentPage}, limit=${pageSize}`);
        
        // ✅ API call with pagination params ONLY (search done on frontend)
        const res = await api.get(`/bookings/admin/all?${params.toString()}`);
        
        // ✅ NEW: Extract paginated response
        const bookings = res?.data?.data?.bookings || [];
        const pagination = res?.data?.data?.pagination || {};
        
        console.log(`📊 Received ${bookings.length} of ${pagination.total} total appointments`);
        console.log(`📄 Page ${pagination.page} of ${pagination.pages}`);

        const mapped = bookings.map((booking) => {
          // Build team member names
          const teamMembers = (booking.services || [])
            .map((s) =>
              s?.employee?.user
                ? `${s.employee.user.firstName || ""} ${s.employee.user.lastName || ""}`.trim()
                : "-"
            )
            .filter(Boolean)
            .join(", ");

          // Dates - parse as UTC to avoid timezone conversion
          const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null;
          const apptAt = booking?.appointmentDate ? new Date(booking.appointmentDate) : null;

          // Raw amounts
          const finalAmtNum =
            typeof booking?.finalAmount === "number" ? booking.finalAmount : null;

          return {
            ref: booking.bookingNumber || booking._id || "-",
            createdBy:
              booking?.client?.firstName
                ? `${booking.client.firstName} ${booking.client.lastName || ""}`.trim()
                : "-",

            createdDate: createdAt
              ? createdAt.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Dubai", // UAE timezone (GMT+4)
                })
              : "-",

            scheduledDate: apptAt
              ? apptAt.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Dubai", // UAE timezone (GMT+4)
                })
              : "-",

            // NEW: extra fields for accurate filtering/sorting (UI-only)
            createdDateObj: createdAt,
            scheduledDateObj: apptAt,
            dateOnly: apptAt ? toDateOnly(apptAt) : null,

            duration: booking?.totalDuration
              ? `${Math.round(booking.totalDuration / 60)}h`
              : "-",

            teamMember: teamMembers || "-",

            price: finalAmtNum != null ? `AED ${finalAmtNum.toFixed(2)}` : "-",
            priceValue: finalAmtNum, // numeric for totals/sort
            status: booking?.status || "-",
          };
        });

        setAppointments(mapped);
        
        // ✅ NEW: Update pagination state from backend response
        setTotalRecords(pagination.total);
        setTotalPages(pagination.pages);
        
        console.log(`✅ Pagination updated: total=${pagination.total}, pages=${pagination.pages}`);
        
        // ✅ FIX: Update cache with BOTH appointments AND pagination data
        cacheRef.current = {
          appointmentsData: mapped,
          paginationData: {
            total: pagination.total,
            pages: pagination.pages
          },
          cachedAt: Date.now()
        };
        
        setLoading(false);
      } catch (err) {
        setError(err?.message || "Failed to load appointments");
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentPage, pageSize, selectedDate]); // Only rerun on pagination/date change

  // ✅ NOTE: Search is now done on frontend only, no backend API call needed

  /* -------------------------- Derived filtered list (CLIENT-SIDE SEARCH) ------------------------- */
  // ✅ Search through ALL appointments (allAppointments), not just current page
  const filteredAppointments = useMemo(() => {
    // Start with ALL appointments for searching
    let list = [...allAppointments];

    // Search (ref / client / team member) - FRONTEND ONLY, searches ALL data
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          (a.ref || "").toLowerCase().includes(q) ||
          (a.createdBy || "").toLowerCase().includes(q) ||
          (a.teamMember || "").toLowerCase().includes(q)
      );
    }

    // Date filter
    if (selectedDate) {
      list = list.filter((a) => a.dateOnly === selectedDate);
    }

    // Extra filters (popup)
    if (activeFilters.teamMember) {
      const q = activeFilters.teamMember.toLowerCase();
      list = list.filter((a) => (a.teamMember || "").toLowerCase().includes(q));
    }
    if (activeFilters.status) {
      const s = activeFilters.status.toLowerCase();
      list = list.filter((a) => (a.status || "").toLowerCase() === s);
    }

    // Sorting - FRONTEND ONLY
    const dir = sortDirection === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortField === "createdDate") {
        const av = a.createdDateObj ? a.createdDateObj.getTime() : 0;
        const bv = b.createdDateObj ? b.createdDateObj.getTime() : 0;
        return av === bv ? 0 : av > bv ? dir : -dir;
      }
      if (sortField === "scheduledDate") {
        const av = a.scheduledDateObj ? a.scheduledDateObj.getTime() : 0;
        const bv = b.scheduledDateObj ? b.scheduledDateObj.getTime() : 0;
        return av === bv ? 0 : av > bv ? dir : -dir;
      }
      if (sortField === "price") {
        const av = typeof a.priceValue === "number" ? a.priceValue : -Infinity;
        const bv = typeof b.priceValue === "number" ? b.priceValue : -Infinity;
        return av === bv ? 0 : av > bv ? dir : -dir;
      }
      // Fallback string compare
      const av = (a[sortField] || "").toString().toLowerCase();
      const bv = (b[sortField] || "").toString().toLowerCase();
      return av === bv ? 0 : av > bv ? dir : -dir;
    });

    console.log(`🔍 Filtered: ${list.length} results from ${allAppointments.length} total`);
    return list;
  }, [allAppointments, searchTerm, selectedDate, activeFilters, sortField, sortDirection]);

  // ✅ Client-side pagination on filtered results
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  // ✅ Update pagination metadata based on filtered results
  useEffect(() => {
    const totalCount = filteredAppointments.length;
    const totalPagesCount = Math.ceil(totalCount / pageSize);
    setTotalRecords(totalCount);
    setTotalPages(totalPagesCount);
    console.log(`📊 Pagination: ${totalCount} results, ${totalPagesCount} pages`);
  }, [filteredAppointments.length, pageSize]);

  // ✅ Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, activeFilters, sortField, sortDirection]);

  /* ----------------------------- Daily summary ----------------------------- */
  const dailySummary = useMemo(() => {
    if (!selectedDate) return null;
    const appts = filteredAppointments;
    const count = appts.length;
    const total = appts.reduce(
      (sum, a) => sum + (typeof a.priceValue === "number" ? a.priceValue : 0),
      0
    );
    return { count, total };
  }, [filteredAppointments, selectedDate]);

  /* -------------------------------- Handlers ------------------------------- */

  const handleSearch = (value) => setSearchTerm(value);

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
  };

  const onSelectDate = (yyyymmdd) => {
    setSelectedDate(yyyymmdd); // can be null when cleared
    setShowSingleDate(false);
  };

  // Only show NoData/NoResults when both paginated and the "all appointments" fetch are finished
  const dataFetchFinished = !loading && !isLoadingAll && !error;
  const showNoData = dataFetchFinished && Array.isArray(appointments) && appointments.length === 0 && filteredAppointments.length === 0;
  const showNoResults = dataFetchFinished && Array.isArray(appointments) && appointments.length > 0 && filteredAppointments.length === 0;

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="schedule-main-wrapper">
      <div className="schedule-content-container">
        {/* Header */}
        <div className="page-header-section">
          <div className="header-flex-container">
            <div className="title-description-block">
              <h1 className="page-primary-title">Appointments</h1>
              <p className="page-description-text">
                View, filter and export appointments booked by your clients.
              </p>
            </div>

            {/* Right controls: Export + Date Selector */}
            <div className="header-right-controls">
              {/* Calendar trigger */}
              <div className="calendar-trigger-wrap">
                <button
                  type="button"
                  className=" mem-export-bbtn "
                  onClick={() => {
                    setShowSingleDate((s) => !s);
                    setShowExportMenu(false);
                  }}
                >
                  <Calendar className="button-icon" />
                  {selectedDate ? `Selected: ${selectedDate}` : "Select date"}
                  {/* <ChevronDown className="button-icon" /> */}
                </button>

                {showSingleDate && (
                  <SingleDatePicker
                    isOpen={showSingleDate}
                    onClose={() => setShowSingleDate(false)}
                    onSelect={onSelectDate}
                    initialDate={selectedDate}
                  />
                )}
              </div>

              {/* Export */}
              <div className="export-controls-wrapper">
                <button
                  onClick={() => {
                    setShowExportMenu((s) => !s);
                    setShowSingleDate(false);
                  }}
                  className="  mem-export-bbtn"
                  disabled={filteredAppointments.length === 0}
                >
                  Export
                  <ChevronDown className="button-icon" />
                </button>
                {showExportMenu && filteredAppointments.length > 0 && (
                  <div className="export-dropdown-menu">
                    <div className="dropdown-menu-inner">
                      <button
                        className="dropdown-menu-item"
                        onClick={() => exportToCSV(filteredAppointments)}
                      >
                        Export as CSV
                      </button>
                      <button
                        className="dropdown-menu-item"
                        onClick={() => exportToPDF(filteredAppointments)}
                      >
                        Export as PDF
                      </button>
                      <button
                        className="dropdown-menu-item"
                        onClick={() => exportToExcel(filteredAppointments)}
                      >
                        Export as Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Daily summary chip (appears when a date is selected) */}
          {selectedDate && dailySummary && (
            <div className="daily-summary-chip">
              <div className="chip-date">{selectedDate}</div>
              <div className="chip-divider" />
              <div className="chip-item">
                <span className="chip-label">Appointments</span>
                <span className="chip-value">{dailySummary.count}</span>
              </div>
              <div className="chip-item">
                <span className="chip-label">Total</span>
                <span className="chip-value">AED {dailySummary.total.toFixed(2)}</span>
              </div>
              <button
                className="chip-clear-btn"
                onClick={() => setSelectedDate(null)}
                title="Clear selected date"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Filters (search kept; advanced filters optional) */}
        <div className="filter-controls-section">
          <div className="search-input-wrapper">
            <Search className="search-field-icon" />
            <input
              type="text"
              placeholder="Search by Reference, Client Name, or Team Member"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-text-input"
              aria-label="Search appointments"
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => handleSearch("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
            {searchTerm && filteredAppointments.length > 0 && (
              <span className="search-results-badge">
                {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''}
              </span>
            )}
            {searchTerm && filteredAppointments.length === 0 && (
              <span className="search-no-results">No results found</span>
            )}
          </div>

          {/* Search results info */}
          {searchTerm && (
            <div className="search-results-info">
              <span className="search-results-text">
                Found {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''} for "{searchTerm}"
              </span>
            </div>
          )}

          {/* If you want the extra filter popup, uncomment this block and the button
          <button
            onClick={() => setShowFilterPopup(true)}
            className="filter-control-button"
          >
            <Filter className="button-icon" />
            Filters
          </button>
          */}
        </div>

        {/* Show different states based on data availability */}
        {loading ? (
          <Loading />
        ) : error ? (
          <Error500Page />
        ) : showNoData ? (
          <NoDataState
            message="No appointments found"
            description="There are no appointments booked yet. When clients book appointments, they will appear here."
            icon="📅"
          />
        ) : showNoResults ? (
          <NoDataState
            message="No appointments match your filters"
            description={`No appointments found ${selectedDate ? `for ${selectedDate}` : ''} ${searchTerm ? `matching "${searchTerm}"` : ''} ${activeFilters.teamMember || activeFilters.status ? 'with the applied filters' : ''}.`}
            icon="🔍"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="data-table-container">
              <div className="table-scroll-wrapper">
                <table className="schedule-data-table">
                  <thead className="data-table-head">
                    <tr>
                      <th
                        className="column-header-cell clickable-header"
                        onClick={() => handleSort("ref")}
                      >
                        <div className="column-header-content">
                          Ref #
                          <TbCaretUpDownFilled className="button-icon" />
                        </div>
                      </th>
                      <th
                        className="column-header-cell clickable-header"
                        onClick={() => handleSort("createdBy")}
                      >
                        <div className="column-header-content">
                          Created by
                          <TbCaretUpDownFilled className="button-icon" />
                        </div>
                      </th>
                      <th
                        className="column-header-cell clickable-header"
                        onClick={() => handleSort("createdDate")}
                      >
                        <div className="column-header-content">
                          Created Date
                          <TbCaretUpDownFilled className="button-icon" />
                        </div>
                      </th>
                      <th
                        className="column-header-cell clickable-header"
                        onClick={() => handleSort("scheduledDate")}
                      >
                        <div className="column-header-content">
                          Scheduled Date
                          <TbCaretUpDownFilled className="button-icon" />
                        </div>
                      </th>
                      <th
                        className="column-header-cell clickable-header"
                        onClick={() => handleSort("duration")}
                      >
                        <div className="column-header-content">
                          Duration
                          <TbCaretUpDownFilled className="button-icon" />
                        </div>
                      </th>
                      <th className="column-header-cell">Team member</th>
                      <th
                        className="column-header-cell clickable-header"
                        onClick={() => handleSort("price")}
                      >
                        <div className="column-header-content">
                          Price
                          <TbCaretUpDownFilled className="button-icon" />
                        </div>
                      </th>
                      <th className="column-header-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody className="data-table-body">
                    {paginatedAppointments.map((appointment, index) => (
                      <tr key={index} className="data-row-item">
                        <td className="data-cell-content">
                          <span className="reference-link-text">{appointment.ref}</span>
                        </td>
                        <td className="data-cell-content">{appointment.createdBy}</td>
                        <td className="data-cell-content secondary-text">
                          {appointment.createdDate}
                        </td>
                        <td className="data-cell-content emphasized-text">
                          {appointment.scheduledDate}
                        </td>
                        <td className="data-cell-content secondary-text">
                          {appointment.duration}
                        </td>
                        <td className="data-cell-content">{appointment.teamMember}</td>
                        <td className="data-cell-content emphasized-text">
                          {appointment.price}
                        </td>
                        <td className="data-cell-content">
                          <span className={`status-indicator-badge ${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-card-layout">
              <div className="card-list-container">
                {paginatedAppointments.map((appointment, index) => (
                  <div key={index} className="schedule-card-item">
                    <div className="card-top-section">
                      <span className="card-reference-number">{appointment.ref}</span>
                      <span className={`status-indicator-badge ${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="card-details-section">
                      <div className="card-info-row">
                        <span className="info-label-text">Created by:</span>
                        <span className="info-value-text">{appointment.createdBy}</span>
                      </div>
                      <div className="card-info-row">
                        <span className="info-label-text">Scheduled:</span>
                        <span className="info-value-text emphasized-text">{appointment.scheduledDate}</span>
                      </div>
                      <div className="card-info-row">
                        <span className="info-label-text">Team member:</span>
                        <span className="info-value-text">{appointment.teamMember}</span>
                      </div>
                      <div className="card-info-row">
                        <span className="info-label-text">Duration:</span>
                        <span className="info-value-text">{appointment.duration}</span>
                      </div>
                      <div className="card-info-row">
                        <span className="info-label-text">Price:</span>
                        <span className="info-value-text emphasized-text">{appointment.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-controls">
              <div className="pagination-left">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>

              <div className="pagination-center" aria-live="polite">
                <span className="pagination-indicator">Page {currentPage} / {totalPages}</span>
              </div>

              <div className="pagination-right">
                <label className="page-size-label">Show</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page on size change
                  }}
                  className="page-size-select"
                >
                  {[5, 10, 20, 50].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="page-total">{totalRecords} total items</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter Popup (optional) */}
      <FilterPopup
        isOpen={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        onApply={handleFilterApply}
      />
    </div>
  );
};

export default Appoint;