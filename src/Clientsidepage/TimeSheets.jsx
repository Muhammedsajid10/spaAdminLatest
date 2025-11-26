import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiSearch, FiCalendar, FiFilter, FiChevronDown, FiPlus, FiMoreHorizontal, FiRefreshCw, FiDownload, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './TimeSheets.css';
import api from '../Service/Api';
import Swal from 'sweetalert2';
import Loading from '../states/Loading.jsx';
import Error500Page from '../states/ErrorPage';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  if (!clockIn || !clockOut || clockOut === '-' || clockIn === '-') return '-';
  
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };
  
  try {
    const clockInMinutes = parseTime(clockIn);
    let clockOutMinutes = parseTime(clockOut);
    
    if (clockInMinutes === null || clockOutMinutes === null) return '-';
    
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
    console.error('Error calculating hours worked:', error);
    return '-';
  }
};

const generateTimesheetFromEmployees = (employees, date) => {
  const timesheetEntries = [];
  employees.forEach((employee) => {
    const firstName = employee.user?.firstName || employee.firstName || '';
    const lastName = employee.user?.lastName || employee.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';

    const clockIn = employee.clockIn || '-';
    const clockOut = employee.clockOut || '-';
    
    let hoursWorked = employee.hoursWorked;
    if (!hoursWorked || hoursWorked === '-') {
      hoursWorked = calculateHoursWorked(clockIn, clockOut);
    }
    
    let status = 'Absent';
    let statusClass = 'absent';
    
    if (clockIn !== '-' && clockOut !== '-') {
      status = 'Clocked out';
      statusClass = 'clocked-out';
    } else if (clockIn !== '-' && clockOut === '-') {
      status = 'Clocked in';
      statusClass = 'clocked-in';
    }
    
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
      statusClass,
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
    const newDate = new Date(year, month, day);
    // Adjust for timezone offset to ensure correct date string
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - (offset*60*1000));
    onDateSelect(adjustedDate.toISOString().split('T')[0]);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = new Date(selectedDate).getDate() === i && 
                       new Date(selectedDate).getMonth() === month && 
                       new Date(selectedDate).getFullYear() === year;
    days.push(
      <button 
        key={i} 
        className={`calendar-day ${isSelected ? 'selected' : ''}`} 
        onClick={() => handleDayClick(i)}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '320px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Date</h3>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="calendar-nav-btn"><FiChevronLeft /></button>
            <span className="calendar-month-title">{getMonthName(month)} {year}</span>
            <button onClick={handleNextMonth} className="calendar-nav-btn"><FiChevronRight /></button>
          </div>
          <div className="calendar-grid-header">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="calendar-grid">
            {days}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Export Modal Component ---
const ExportModal = ({ isOpen, onClose, onExport, isExporting }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFormat, setSelectedFormat] = useState('excel');

  if (!isOpen) return null;

  const handleExportClick = () => {
    onExport({
      month: selectedMonth,
      year: selectedYear,
      format: selectedFormat
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Export Timesheet</h3>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Select Month</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="form-select"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Select Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-select"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Format</label>
            <div className="format-options">
              {['excel', 'pdf', 'csv'].map(format => (
                <div
                  key={format}
                  className={`format-option ${selectedFormat === format ? 'selected' : ''}`}
                  onClick={() => setSelectedFormat(format)}
                >
                  {format.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={isExporting}>Cancel</button>
          <button className="btn-primary" onClick={handleExportClick} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
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
  const [isExporting, setIsExporting] = useState(false);

  // Export functions
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
    link.href = URL.createObjectURL(blob);
    link.download = 'timesheet-report.csv';
    link.click();
    Swal.fire({ icon: 'success', title: 'Exported as CSV!' });
  };

  const downloadExcel = (data) => {
    const excelData = data.map(item => ({
      Name: item.name,
      Role: item.role,
      Team: item.team,
      Date: item.date,
      'Clock In': item.clockIn,
      'Clock Out': item.clockOut,
      'Hours Worked': item.hoursWorked
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');
    XLSX.writeFile(wb, 'timesheet-report.xlsx');
    Swal.fire({ icon: 'success', title: 'Exported as Excel!' });
  };

  const downloadPDF = (data) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text('Timesheet Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = data.map(item => [
      item.name, item.role, item.date, item.clockIn, item.clockOut, item.hoursWorked
    ]);
    
    autoTable(doc, {
      head: [['Name', 'Role', 'Date', 'Clock In', 'Clock Out', 'Hours']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    
    doc.save('timesheet-report.pdf');
    Swal.fire({ icon: 'success', title: 'Exported as PDF!' });
  };

  const fetchTimesheetData = useCallback(async (dateFilter) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/employees?includeAttendance=true&date=${dateFilter}`);

      if (response.data && response.data.success) {
        const employees = response.data.data.employees || [];
        setAllEmployees(employees);
        
        const normalizedEmployees = employees.map(emp => {
          let formattedHoursWorked = emp.hoursWorked;
          if (typeof emp.actualHours === 'number' && emp.actualHours > 0) {
            const hours = Math.floor(emp.actualHours);
            const minutes = Math.round((emp.actualHours - hours) * 60);
            formattedHoursWorked = minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
          }
          return {
            ...emp,
            clockIn: emp.clockIn || '-',
            clockOut: emp.clockOut || '-',
            breaks: emp.breaks || '-',
            hoursWorked: formattedHoursWorked || '-'
          };
        });

        const generatedTimesheets = generateTimesheetFromEmployees(normalizedEmployees, dateFilter);
        setTimesheetData(generatedTimesheets);
      } else {
        setAllEmployees([]);
        setTimesheetData([]);
        setError(response.data?.message || 'No data available');
      }
    } catch (err) {
      console.error('Error fetching timesheet data:', err);
      setError(err.message || 'Failed to load timesheet data');
      setTimesheetData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimesheetData(selectedDate);
  }, [fetchTimesheetData, selectedDate]);

  const handleExport = async (options) => {
    const { month, year, format } = options;
    
    try {
      setIsExporting(true);
      
      // Get all days in the selected month
      const daysInMonth = getDaysInMonth(year, month);
      const monthlyTimesheetData = [];
      
      // Fetch all employees first to ensure we include everyone
      const allEmployeesResponse = await api.get('/employees');
      const allEmployees = allEmployeesResponse.data?.data?.employees || [];
      
      if (allEmployees.length === 0) {
        setIsExporting(false);
        Swal.fire({
          icon: 'warning',
          title: 'No Employees Found',
          text: 'No employees found in the system.',
        });
        return;
      }
      
      // Generate timesheet data for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        try {
          // Fetch attendance data for this specific date
          const response = await api.get(`/employees?includeAttendance=true&date=${dateStr}`);
          const employeesWithAttendance = response.data?.success ? response.data.data.employees || [] : [];
          
          // Create a map of employees with attendance data
          const attendanceMap = new Map();
          employeesWithAttendance.forEach(emp => {
            attendanceMap.set(emp._id || emp.id, emp);
          });
          
          // Generate timesheet entries for ALL employees for this date
          allEmployees.forEach(employee => {
            const employeeId = employee._id || employee.id;
            const attendanceData = attendanceMap.get(employeeId);
            
            const firstName = employee.user?.firstName || employee.firstName || '';
            const lastName = employee.user?.lastName || employee.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';
            
            // Use attendance data if available, otherwise use placeholder values
            const clockIn = attendanceData?.clockIn || '-';
            const clockOut = attendanceData?.clockOut || '-';
            let hoursWorked = attendanceData?.hoursWorked || '-';
            
            // Format hours worked if it's a number
            if (typeof attendanceData?.actualHours === 'number' && attendanceData.actualHours > 0) {
              const hours = Math.floor(attendanceData.actualHours);
              const minutes = Math.round((attendanceData.actualHours - hours) * 60);
              hoursWorked = minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
            } else if (clockIn !== '-' && clockOut !== '-') {
              hoursWorked = calculateHoursWorked(clockIn, clockOut);
            }
            
            monthlyTimesheetData.push({
              id: employeeId,
              initials: getInitials(fullName),
              name: fullName,
              role: employee.position || employee.department || 'Staff Member',
              team: employee.department || employee.team || 'Centre Dubai',
              date: formatDate(dateStr),
              clockIn: clockIn,
              clockOut: clockOut,
              breaks: attendanceData?.breaks || '-',
              hoursWorked: hoursWorked,
              status: (clockIn !== '-' && clockOut !== '-') ? 'Clocked Out' : (clockIn !== '-' ? 'Clocked In' : 'Absent'),
              employeeId: employeeId
            });
          });
        } catch (dayError) {
          console.error(`Error fetching data for ${dateStr}:`, dayError);
        }
        
        // Small delay to prevent overwhelming the server
        if (day % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (monthlyTimesheetData.length === 0) {
        setIsExporting(false);
        Swal.fire({
          icon: 'warning',
          title: 'No Data',
          text: 'No timesheet data found for the selected month.',
        });
        return;
      }

      // Export the complete monthly data
      if (format === 'csv') {
        downloadCSV(monthlyTimesheetData);
      } else if (format === 'excel') {
        downloadExcel(monthlyTimesheetData);
      } else if (format === 'pdf') {
        downloadPDF(monthlyTimesheetData);
      }
      
      setIsExporting(false);
      
    } catch (error) {
      console.error('Error generating monthly export:', error);
      setIsExporting(false);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error generating the monthly timesheet. Please try again.',
      });
    }
  };

  const filteredData = timesheetData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (index) => {
    const colors = ['blue', 'green', 'purple', 'orange'];
    return colors[index % colors.length];
  };

  if (loading && timesheetData.length === 0) return <Loading />;
  if (error && timesheetData.length === 0) return <Error500Page message={error} />;

  return (
    <div className="timesheet-container">
      <div className="timesheet-wrapper">
        {/* Header */}
        <div className="timesheet-header">
          <div className="timesheet-title-group">
            <h1 className="timesheet-title">Timesheets</h1>
            <p className="timesheet-subtitle">Manage your team members' timesheets</p>
          </div>
          <div className="timesheet-actions">
            <button className="btn-action btn-secondary" onClick={() => setShowExportModal(true)}>
              Export <FiChevronDown />
            </button>
         
          </div>
        </div>

        {/* Controls */}
        <div className="timesheet-controls">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="control-separator"></div>
          
          <button className="control-btn" onClick={() => setShowDatePickerModal(true)}>
            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <FiCalendar />
          </button>
          
          <div className="control-separator"></div>
          
       
          
          <div className="control-separator"></div>
          
          
        </div>

        {/* Table */}
        <div className="timesheet-table-container">
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Team member</th>
                <th>Date</th>
                <th>Clock in/out</th>
                <th>Breaks</th>
                <th>Hours worked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <div className="member-cell">
                        <div className={`member-avatar ${getAvatarColor(index)}`}>
                          {item.initials}
                        </div>
                        <div className="member-info">
                          <div className="member-name">{item.name}</div>
                          <div className="member-role">{item.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      {item.clockIn !== '-' ? `${item.clockIn} - ${item.clockOut}` : '-'}
                    </td>
                    <td>{item.breaks}</td>
                    <td>{item.hoursWorked}</td>
                    <td>
                      <span className={`status-badge ${item.statusClass}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No timesheet data found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <DatePickerModal 
        isOpen={showDatePickerModal} 
        onClose={() => setShowDatePickerModal(false)} 
        onDateSelect={(date) => {
          setSelectedDate(date);
          setShowDatePickerModal(false);
        }}
        selectedDate={selectedDate}
      />

      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
};

export default TimesheetApp;