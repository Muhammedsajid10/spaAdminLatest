import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, RefreshCw } from 'lucide-react';
import './TimeSheets.css';
import api from '../Service/Api';
import Swal from 'sweetalert2';
import Loading from '../states/Loading.jsx';
import Error500Page from '../states/ErrorPage';
import NoData from '../states/NoData.jsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
//updated time sheet
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
  // If either time is missing or has the placeholder value '-', return placeholder
  if (!clockIn || !clockOut || clockOut === '-' || clockIn === '-') return '-';
  
  // Parse time string in HH:MM format to total minutes
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };
  
  try {
    const clockInMinutes = parseTime(clockIn);
    let clockOutMinutes = parseTime(clockOut);
    
    // If parsing failed for either time, return placeholder
    if (clockInMinutes === null || clockOutMinutes === null) return '-';
    
    // Handle overnight shifts (when clock out is earlier than clock in)
    if (clockOutMinutes < clockInMinutes) {
      clockOutMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    const totalMinutes = clockOutMinutes - clockInMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Format the output based on whether there are minutes to show
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

// Ensure "no data" entries show clearly and use global NoData behavior
const generateTimesheetFromEmployees = (employees, date) => {
  const timesheetEntries = [];
  employees.forEach((employee) => {
    const firstName = employee.user?.firstName || employee.firstName || '';
    const lastName = employee.user?.lastName || employee.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';

    // If check-in/check-out data isn't available, mark as No data
    const clockIn = employee.clockIn || '-';
    const clockOut = employee.clockOut || '-';
    
    // Use pre-calculated hoursWorked from the backend if available
    // Otherwise, calculate it from clock-in and clock-out times
    let hoursWorked = employee.hoursWorked;
    if (!hoursWorked || hoursWorked === '-') {
      hoursWorked = calculateHoursWorked(clockIn, clockOut);
    }
    
    // Determine status based on check-in/check-out state
    let status = 'Absent';
    let statusColor = 'red';
    
    if (clockIn !== '-' && clockOut !== '-') {
      status = 'Checked Out';
      statusColor = 'green';
    } else if (clockIn !== '-' && clockOut === '-') {
      status = 'Checked In';
      statusColor = 'blue';
    }
    
    const hasData = clockIn !== '-' && clockOut !== '-';

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

// --- Export Loading Overlay Component ---
const ExportLoadingOverlay = ({ isVisible, progress }) => {
  if (!isVisible) return null;

  const progressPercentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div 
      className="timesheet-export-loading-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          minWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <RefreshCw 
            size={48} 
            style={{ 
              color: '#111', 
              animation: 'spin 1s linear infinite'
            }} 
          />
        </div>
        
        <h3 style={{ margin: '0 0 8px 0', color: '#111', fontSize: '18px', fontWeight: '600' }}>
          Exporting Timesheet
        </h3>
        
        <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
          {progress.message}
        </p>
        
        {progress.total > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div 
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  backgroundColor: '#111',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              {progress.current} of {progress.total} completed ({progressPercentage}%)
            </div>
          </div>
        )}
        
        <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
          Please wait while we prepare your timesheet export...
        </p>
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleExportClick = () => {
    onExport({
      month: selectedMonth,
      year: selectedYear,
      format: selectedFormat
    });
    onClose();
  };

  const formatOptions = [
    { id: 'excel', label: 'Excel' },
    { id: 'pdf', label: 'PDF' },
    { id: 'csv', label: 'CSV' }
  ];

  return (
    <div className="timesheet-export-modal-overlay" onClick={onClose}>
      <div className="timesheet-export-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="timesheet-export-modal-header">
          <h3>Export Monthly Timesheet</h3>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="timesheet-export-modal-content">
          <div className="timesheet-modal-group">
            <label>Select Month</label>
            <div className="timesheet-month-select">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="timesheet-export-select"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="timesheet-modal-group">
            <label>Select Year</label>
            <div className="timesheet-month-select">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="timesheet-export-select"
              >
                {[2023, 2024, 2025].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>



          <div className="timesheet-modal-group">
            <label>Export Format</label>
            <div className="timesheet-format-options">
              {formatOptions.map((format) => (
                <div
                  key={format.id}
                  className={`timesheet-format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div>{format.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="timesheet-export-modal-footer">
          <button 
            onClick={onClose} 
            className="timesheet-btn-secondary"
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.6 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleExportClick} 
            className="timesheet-btn-primary"
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.6 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
          >
            {isExporting ? 'Processing...' : 'Export'}
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
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, message: '' });

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

  const downloadPDF = (data) => {
    try {
      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for PDF generation');
      }

      // Create new document with landscape orientation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title and company header
      doc.setFontSize(20);
      doc.text('Timesheet Report', 15, 20);
      
      // Add report period
      let reportPeriod = '';
      try {
        const firstDate = new Date(data[0].date);
        if (!isNaN(firstDate.getTime())) {
          reportPeriod = `${getMonthName(firstDate.getMonth())} ${firstDate.getFullYear()}`;
        } else {
          reportPeriod = 'Date not available';
        }
      } catch {
        reportPeriod = 'Date not available';
      }

      doc.setFontSize(12);
      doc.text(`Report Period: ${reportPeriod}`, 15, 30);
      
      // Generate table data with validation
      const headers = [['Name', 'Role', 'Date', 'Clock In', 'Clock Out', 'Hours']];
      const tableData = data.map(item => [
        item?.name || 'N/A',
        item?.role || 'N/A',
        item?.date || 'N/A',
        item?.clockIn || '-',
        item?.clockOut || '-',
        item?.hoursWorked || '-'
      ]);
      
      // Add table to PDF with improved styling
      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { 
          fillColor: [17, 17, 17],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245]
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { top: 35, left: 15, right: 15 }
      });
      
      // Add footer with date
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footer = `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`;
        doc.text(footer, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      
      // Save the PDF with formatted name
      const fileName = `timesheet-report-${reportPeriod.toLowerCase().replace(' ', '-')}.pdf`;
      doc.save(fileName);
      
      Swal.fire({ 
        icon: 'success', 
        title: 'PDF Generated Successfully!',
        text: `Your report has been saved as ${fileName}`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'PDF Export Failed',
        text: error.message || 'There was an error generating the PDF report. Please try again.',
      });
    }
  };

  // Fetch timesheets from API; when no check-in/out data present we still return employees
  const fetchTimesheetData = useCallback(async (dateFilter) => {
    try {
      setLoading(true);
      setError(null);

  // Request employees with attendance merged for the selected date
  const response = await api.get(`/employees?includeAttendance=true&date=${dateFilter}`);

      if (response.data && response.data.success) {
  const employees = response.data.data.employees || [];
        setAllEmployees(employees);

        // Generate timesheet rows (may contain "No data" placeholders)
        // Ensure clockIn/clockOut fields are strings in HH:MM or '-' format
        const normalizedEmployees = employees.map(emp => {
          // Format hours worked properly if it came as a number from the backend
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

        // If none of the generated rows have real clock-in AND clock-out, treat as "no data"
        const hasAnyRecorded = generatedTimesheets.some(entry =>
          entry.clockIn && entry.clockOut && entry.clockIn !== '-' && entry.clockOut !== '-'
        );

  // Always show timesheet rows (use '-' placeholders when attendance missing)
  setTimesheetData(generatedTimesheets);
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

  const handleExport = async (options) => {
    const { month, year, format } = options;
    
    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: 0, message: 'Initializing export...' });
      
      // Get all days in the selected month
      const daysInMonth = getDaysInMonth(year, month);
      const monthlyTimesheetData = [];
      
      setExportProgress({ current: 0, total: daysInMonth + 2, message: 'Fetching employee list...' });
      
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
      
      setExportProgress({ current: 1, total: daysInMonth + 2, message: `Found ${allEmployees.length} employees. Processing attendance data...` });
      
      // Generate timesheet data for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const monthName = getMonthName(month);
        
        setExportProgress({ 
          current: day + 1, 
          total: daysInMonth + 2, 
          message: `Processing ${monthName} ${day}, ${year}...` 
        });
        
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
            
            const hasData = clockIn !== '-' && clockOut !== '-';
            
            // Determine status based on check-in/check-out state
            let status = 'Absent';
            let statusColor = 'red';
            
            if (clockIn !== '-' && clockOut !== '-') {
              status = 'Checked Out';
              statusColor = 'green';
            } else if (clockIn !== '-' && clockOut === '-') {
              status = 'Checked In';
              statusColor = 'blue';
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
              status: status,
              statusColor: statusColor,
              employeeId: employeeId
            });
          });
        } catch (dayError) {
          console.error(`Error fetching data for ${dateStr}:`, dayError);
          // Still add all employees with "No data" for this day
          allEmployees.forEach(employee => {
            const firstName = employee.user?.firstName || employee.firstName || '';
            const lastName = employee.user?.lastName || employee.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';
            
            monthlyTimesheetData.push({
              id: employee._id || employee.id,
              initials: getInitials(fullName),
              name: fullName,
              role: employee.position || employee.department || 'Staff Member',
              team: employee.department || employee.team || 'Centre Dubai',
              date: formatDate(dateStr),
              clockIn: '-',
              clockOut: '-',
              breaks: '-',
              hoursWorked: '-',
              status: 'Absent',
              statusColor: 'red',
              employeeId: employee._id || employee.id
            });
          });
        }
        
        // Small delay to prevent overwhelming the server
        if (day % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setExportProgress({ 
        current: daysInMonth + 2, 
        total: daysInMonth + 2, 
        message: `Generating ${format.toUpperCase()} file...` 
      });
      
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
            disabled={isExporting}
            style={{ 
              background: isExporting ? '#ccc' : '#111', 
              color: '#fff', 
              border: 'none', 
              padding: '8px 12px', 
              borderRadius: 6, 
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.6 : 1
            }}
          >
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>

          
        </div>
      </div>

      <div className="timesheet-controls-panel">
        <div className="timesheet-controls-left">
          <div className="timesheet-search-area">
  <Search className="timesheet-search-area-icon" size={16} />
  <input
    type="text"
    placeholder="Search by name, role, or team"
    className="timesheet-search-area-input"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
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
                  <td className="timesheet-table-cell" style={{ padding: '10px' }} title={item.hasData ? "Hours calculated from check-in/out times" : "No hours recorded"}>
                    {item.hoursWorked || '-'}
                  </td>
                  <td className="timesheet-table-cell" style={{ padding: '10px' }}>
                    <span style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: item.statusColor === 'green' ? '#e8f5ea' : 
                                 item.statusColor === 'blue' ? '#e3f2fd' : 
                                 item.statusColor === 'red' ? '#ffebee' : '#f0f0f0',
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
        isExporting={isExporting}
      />
      <DatePickerModal
        isOpen={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
      
      {/* Export Loading Overlay */}
      <ExportLoadingOverlay 
        isVisible={isExporting} 
        progress={exportProgress} 
      />
      
      {/* Add CSS animation for spinning icon */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TimesheetApp;