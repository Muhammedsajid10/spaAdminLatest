import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, RefreshCw } from 'lucide-react';
import './TimeSheets.css';
import api from '../Service/Api';
import Swal from 'sweetalert2';
import Loading from '../states/Loading.jsx';
import Error500Page from '../states/ErrorPage';
import NoData from '../states/NoData.jsx';

// --- Helper Functions ---
const getInitials = (name) => {
  if (!name) return 'NA';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const getMonthName = (monthIndex) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
};

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const calculateHoursWorked = (clockIn, clockOut) => {
  if (!clockIn || !clockOut || clockOut === '-' || clockIn === '-' ) return '-';
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  try {
    const clockInMinutes = parseTime(clockIn);
    let clockOutMinutes = parseTime(clockOut);
    if (clockOutMinutes < clockInMinutes) {
      clockOutMinutes += 24 * 60;
    }
    const totalMinutes = clockOutMinutes - clockInMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  } catch (error) {
    return '-';
  }
};

// Ensure "no data" entries show clearly and use global NoData behavior
const generateTimesheetFromEmployees = (employees, date) => {
  const timesheetEntries = [];
  employees.forEach((employee) => {
    const firstName = employee.user?.firstName || employee.firstName || '';
    const lastName = employee.user?.lastName || employee.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';

    // If check-in/check-out data isn't available, mark as No data
    const clockIn = employee.clockIn || '-' ;
    const clockOut = employee.clockOut || '-';
    const hoursWorked = calculateHoursWorked(clockIn, clockOut);
    const hasData = clockIn !== '-' && clockOut !== '-';
    const status = hasData ? 'Recorded' : 'No data';
    const statusColor = hasData ? 'green' : 'gray';

    timesheetEntries.push({
      id: employee._id || employee.id,
      initials: getInitials(fullName),
      name: fullName,
      role: employee.position || employee.department || 'Staff Member',
      team: employee.department || employee.team || 'Centre Dubai',
      date: formatDate(date),
      clockIn: clockIn,
      clockOut: clockOut,
      breaks: employee.breaks || '-',
      hoursWorked: hoursWorked === '-' ? '-' : hoursWorked,
      status,
      statusColor,
      employeeId: employee._id || employee.id
    });
  });
  return timesheetEntries;
};

// --- Date Picker Modal Component ---
const DatePickerModal = ({ isOpen, onClose, onDateSelect, selectedDate }) => {
  const initialDate = new Date(selectedDate);
  const [currentDate, setCurrentDate] = useState(
    isNaN(initialDate.getTime()) ? new Date() : initialDate
  );
  
  if (!isOpen) return null;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handleDayClick = (day) => {
    const newDate = new Date(year, month, day+1);
    onDateSelect(newDate.toISOString().split('T')[0]);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="timesheet-day-empty"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = new Date(selectedDate).getDate() === i && new Date(selectedDate).getMonth() === month && new Date(selectedDate).getFullYear() === year;
    days.push(
      <button 
        key={i} 
        className={`timesheet-day ${isSelected ? 'selected' : ''}`} 
        onClick={() => handleDayClick(i)}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="timesheet-date-picker-overlay" onClick={onClose}>
      <div className="timesheet-date-picker-container" onClick={(e) => e.stopPropagation()}>
        <div className="timesheet-date-picker-header">
          <button onClick={handlePrevMonth}>&lt;</button>
          <h2>{getMonthName(month)} {year}</h2>
          <button onClick={handleNextMonth}>&gt;</button>
        </div>
        <div className="timesheet-day-names">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="timesheet-days-grid">
          {days}
        </div>
      </div>
    </div>
  );
};

// --- Export Modal Component ---
const ExportModal = ({ isOpen, onClose, onExport, employees }) => {
  const [reportType, setReportType] = useState('weekly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');

  if (!isOpen) return null;

  const weeks = Array.from({ length: 4 }, (_, i) => i + 1);
  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];

  const handleExportClick = () => {
    onExport({
      reportType,
      selectedWeek: Number(selectedWeek),
      selectedMonth: Number(selectedMonth),
      selectedEmployee,
      exportFormat
    });
    onClose();
  };

  return (
    <div className="timesheet-export-modal-overlay" onClick={onClose}>
      <div className="timesheet-export-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="timesheet-export-modal-header">
          <h3>Export Timesheet Report</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="timesheet-export-modal-content">
          <div className="timesheet-modal-group">
            <label>Report Period</label>
            <div className="timesheet-modal-row">
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {reportType === 'weekly' ? (
                <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                  {weeks.map(week => <option key={week} value={week}>Week {week}</option>)}
                </select>
              ) : (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  {months.map(month => <option key={month.value} value={month.value}>{month.name}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="timesheet-modal-group">
            <label>Select Employee</label>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.employeeId || emp._id} value={emp.employeeId || emp._id}>
                  {emp.user?.firstName || emp.firstName} {emp.user?.lastName || emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="timesheet-modal-group">
            <label>Export Format</label>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
            </select>
          </div>
        </div>
        <div className="timesheet-export-modal-footer">
          <button onClick={onClose} className="timesheet-btn-secondary">Cancel</button>
          <button onClick={handleExportClick} className="timesheet-btn-primary">Export Report</button>
        </div>
      </div>
    </div>
  );
};


// --- Main Timesheet App Component ---
const TimesheetApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timesheetData, setTimesheetData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Export helpers (unchanged)
  const downloadCSV = (data) => {
    const headers = ['Name', 'Role', 'Team', 'Date', 'Clock In', 'Clock Out', 'Hours Worked'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.name}"`, `"${item.role}"`, `"${item.team}"`, `"${item.date}"`,
        `"${item.clockIn}"`, `"${item.clockOut}"`, `"${item.hoursWorked}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'timesheet-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Swal.fire({ icon: 'success', title: 'Exported as CSV!' });
  };

  const downloadExcel = (data) => {
    const headers = ['Name', 'Role', 'Team', 'Date', 'Clock In', 'Clock Out', 'Hours Worked'];
    const excelContent = [
      headers.join('\t'),
      ...data.map(item => [
        item.name, item.role, item.team, item.date, item.clockIn, item.clockOut, item.hoursWorked
      ].join('\t'))
    ].join('\n');
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'timesheet-report.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Swal.fire({ icon: 'success', title: 'Exported as Excel!' });
  };

  const downloadPDF = () => {
    Swal.fire({
      icon: 'info',
      title: 'PDF Export',
      text: 'PDF report generation functionality is not yet implemented.',
    });
  };

  // Fetch timesheets from API; when no check-in/out data present we still return employees
  const fetchTimesheetData = useCallback(async (dateFilter) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/employees');

      if (response.data && response.data.success) {
        const employees = response.data.data.employees || [];
        setAllEmployees(employees);

        // Generate timesheet rows (may contain "No data" placeholders)
        const generatedTimesheets = generateTimesheetFromEmployees(employees, dateFilter);

        // If none of the generated rows have real clock-in AND clock-out, treat as "no data"
        const hasAnyRecorded = generatedTimesheets.some(entry =>
          entry.clockIn && entry.clockOut && entry.clockIn !== '-' && entry.clockOut !== '-'
        );

        if (hasAnyRecorded) {
          setTimesheetData(generatedTimesheets);
        } else {
          // No real timesheet records -> show NoData component
          setTimesheetData([]); // empty triggers NoData UI
        }
      } else {
        // Server responded but with failure flag -> show error component
        setAllEmployees([]);
        setTimesheetData([]);
        setError(response.data?.message || 'No data available');
      }
    } catch (err) {
      console.error('❌ Error fetching timesheet data:', err);
      // network/server error -> show global error component
      setError(err.message || 'Failed to load timesheet data');
      setTimesheetData([]); // ensure UI shows error/no-data instead of stale data
      setAllEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimesheetData(selectedDate);
  }, [fetchTimesheetData, selectedDate]);

  const handleRefresh = () => {
    fetchTimesheetData(selectedDate);
  };

  const handleExport = (options) => {
    let filteredReportData = timesheetData.filter(item =>
      options.selectedEmployee === 'all' || item.employeeId === options.selectedEmployee
    );

    if (options.exportFormat === 'csv') {
      downloadCSV(filteredReportData);
    } else if (options.exportFormat === 'excel') {
      downloadExcel(filteredReportData);
    } else if (options.exportFormat === 'pdf') {
      downloadPDF();
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDatePickerModal(false);
  };

  const filteredData = timesheetData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedDate = new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  // Use global loading / error / no-data components for consistent UI
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error500Page message={error} />;
  }

  if (!loading && timesheetData.length === 0) {
    // show friendly NoData with quick actions
    return (
      <div style={{ padding: 24 }}>
        <NoData />
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {/* <button
            onClick={() => { setShowDatePickerModal(true); }}
            style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
          >
            Pick date
          </button> */}
          {/* <button
            onClick={() => handleRefresh()}
            style={{ background: '#fff', color: '#111', border: '1px solid #111', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
          >
            Refresh
          </button> */}
        </div>
        <DatePickerModal
          isOpen={showDatePickerModal}
          onClose={() => setShowDatePickerModal(false)}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
        />
      </div>
    );
  }

  return (
    <div className="timesheet-main-wrapper" style={{ color: '#111', background: '#fff' }}>
      <div className="timesheet-header-section">
        <div className="timesheet-title-group">
          <h1>Timesheets</h1>
          <p>Manage your team members' timesheets ({timesheetData.length} entries)</p>
        </div>
        <div className="timesheet-action-buttons" style={{ display: 'flex', gap: 8 }}>
          <button
            className="timesheet-export-button"
            onClick={() => setShowExportModal(true)}
            style={{ background: '#111', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
          >
            <span>Export</span>
          </button>

          <button
            onClick={handleRefresh}
            title="Refresh"
            style={{ background: '#fff', color: '#111', border: '1px solid #111', padding: '8px 10px', borderRadius: 6, cursor: 'pointer' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="timesheet-controls-panel">
        <div className="timesheet-controls-left">
          <div className="timesheet-search-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search className="timesheet-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by name, role, or team"
              className="timesheet-search-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e6e6e6', width: 260 }}
            />
          </div>

          <button
            className="timesheet-week-picker-btn"
            onClick={() => setShowDatePickerModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid #111', background: '#fff', color: '#111', cursor: 'pointer', marginLeft: 12 }}
            title="Pick date"
          >
            <Calendar size={16} />
            <span>{displayedDate}</span>
          </button>
        </div>

        <div className="timesheet-data-toggle" style={{ display: 'flex', alignItems: 'center' }}>
          <span>
            Showing {filteredData.length} of {timesheetData.length} entries
          </span>
        </div>
      </div>

      <div className="timesheet-table-wrapper">
        {filteredData.length === 0 ? (
          <div className="timesheet-empty-state">
            {searchTerm ? (
              <>
                <div>No timesheets found matching "{searchTerm}"</div>
                <button className="timesheet-clear-search" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              </>
            ) : (
              <NoData />
            )}
          </div>
        ) : (
          <table className="timesheet-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="timesheet-table-head" style={{ borderBottom: '1px solid #e6e6e6' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px' }}>Team member</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Clock in/out</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Breaks</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Hours worked</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={`${item.id}-${item.date}`} className="timesheet-table-row" style={{ borderBottom: '1px solid #f4f4f4' }}>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>
                    <div className="timesheet-member-info" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="timesheet-member-avatar" style={{ width: 44, height: 44, borderRadius: 6, background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {item.initials}
                      </div>
                      <div className="timesheet-member-details">
                        <h4 style={{ margin: 0 }}>{item.name}</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{item.role} • {item.team}</p>
                      </div>
                    </div>
                  </td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>{item.date}</td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>
                    {item.clockOut === '-' ? item.clockIn : `${item.clockIn} - ${item.clockOut}`}
                  </td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>{item.breaks}</td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>{item.hoursWorked}</td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>
                    <span style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: item.statusColor === 'green' ? '#e8f5ea' : '#f0f0f0',
                      color: '#111',
                      fontWeight: 600,
                      fontSize: 13
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>
                    {/* actions placeholder */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        employees={allEmployees}
      />
      <DatePickerModal
        isOpen={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default TimesheetApp;