import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, RefreshCw } from 'lucide-react';
import './TimeSheets.css';
import api from '../Service/Api';
import Swal from 'sweetalert2';

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
  if (!clockIn || !clockOut || clockOut === '-') return '-';
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

const generateTimesheetFromEmployees = (employees, date) => {
  const timesheetEntries = [];
  employees.forEach((employee) => {
    const firstName = employee.user?.firstName || employee.firstName || '';
    const lastName = employee.user?.lastName || employee.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';
    timesheetEntries.push({
      id: employee._id || employee.id,
      initials: getInitials(fullName),
      name: fullName,
      role: employee.position || employee.department || 'Staff Member',
      team: employee.department || employee.team || 'Centre Dubai',
      date: formatDate(date),
      clockIn: '00:00',
      clockOut: '00:00',
      breaks: '-',
      hoursWorked: '0h',
      status: 'No data',
      statusColor: 'gray',
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

  const fetchTimesheetData = useCallback(async (dateFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/employees'); 

      if (response.data.success) {
        const employees = response.data.data.employees || [];
        setAllEmployees(employees);
        const generatedTimesheets = generateTimesheetFromEmployees(employees, dateFilter);
        setTimesheetData(generatedTimesheets);
      } else {
        throw new Error(response.data.message || 'Failed to fetch employees');
      }
    } catch (err) {
      console.error('❌ Error fetching timesheet data:', err);
      setError(err.message || 'Failed to load timesheet data');
      const mockTimesheetData = [
        {
          id: 1, initials: 'JF', name: 'John Fernandez', role: 'Junior Software Manager', team: 'Centre Dubai',
          date: formatDate(dateFilter), clockIn: '11:30', clockOut: '-', breaks: '-', hoursWorked: '-', status: 'Clocked In', statusColor: 'blue', employeeId: 'emp1'
        },
        {
          id: 2, initials: 'DE', name: 'Dani Elsa', role: 'Senior Software Manager', team: 'Centre Dubai',
          date: formatDate(dateFilter), clockIn: '12:00', clockOut: '21:00', breaks: '-', hoursWorked: '9h', status: 'Clocked out', statusColor: 'green', employeeId: 'emp2'
        }
      ];
      setTimesheetData(mockTimesheetData);
      setAllEmployees(mockTimesheetData.map(item => ({ employeeId: item.employeeId, user: { firstName: item.name.split(' ')[0], lastName: item.name.split(' ')[1] } })));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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

  return (
    <div className="timesheet-main-wrapper">
      <div className="timesheet-header-section">
        <div className="timesheet-title-group">
          <h1>Timesheets</h1>
          <p>Manage your team members' timesheets ({timesheetData.length} entries)</p>
          {error && (
            <p style={{ color: '#dc3545', fontSize: '14px', margin: '5px 0' }}>
              ⚠️ Using fallback data - {error}
            </p>)}
        </div>
        <div className="timesheet-action-buttons">
          <button className="timesheet-export-button" onClick={() => setShowExportModal(true)}>
            <span>Export</span>
          </button>
          {/* <button className="timesheet-refresh-button" onClick={handleRefresh}>
            <RefreshCw size={16} />
          </button> */}
        </div>
      </div>

      <div className="timesheet-controls-panel">
        <div className="timesheet-controls-left">
          <div className="timesheet-search-wrapper">
            <Search className="timesheet-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by name, role, or team"
              className="timesheet-search-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button> <div className="timesheet-week-picker" onClick={() => setShowDatePickerModal(true)}>
            <Calendar size={16} />
            <span>{displayedDate}</span>
          </div></button>
         
        </div>
        <div className="timesheet-data-toggle">
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
              <div>No timesheet entries available</div>
            )}
          </div>
        ) : (
          <table className="timesheet-data-table">
            <thead className="timesheet-table-head">
              <tr>
                <th>Team member</th>
                <th>Date</th>
                <th>Clock in/out</th>
                <th>Breaks</th>
                <th>Hours worked</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={`${item.id}-${item.date}`} className="timesheet-table-row">
                  <td className="timesheet-table-cell">
                    <div className="timesheet-member-info">
                      <div className="timesheet-member-avatar">{item.initials}</div>
                      <div className="timesheet-member-details">
                        <h4>{item.name}</h4>
                        <p>{item.role}</p>
                        <p>{item.team}</p>
                      </div>
                    </div>
                  </td>
                  <td className="timesheet-table-cell">{item.date}</td>
                  <td className="timesheet-table-cell">
                    {item.clockOut === '-' ? item.clockIn : `${item.clockIn} - ${item.clockOut}`}
                  </td>
                  <td className="timesheet-table-cell">{item.breaks}</td>
                  <td className="timesheet-table-cell">{item.hoursWorked}</td>
                  <td className="timesheet-table-cell">
                    <span className={`timesheet-status-badge timesheet-status-${item.statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="timesheet-table-cell">
                    {/* <div className="timesheet-more-actions">
                      <MoreHorizontal size={16} />
                    </div> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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