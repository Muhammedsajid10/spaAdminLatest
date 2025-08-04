import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, MoreHorizontal, Plus, ChevronDown, BarChart3 } from 'lucide-react';
import './TimeSheets.css';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';

const TimesheetApp = () => {
  const [selectedWeek, setSelectedWeek] = useState('This week');
  const [searchTerm, setSearchTerm] = useState('');
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Function to format date
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

  // Function to calculate hours worked
  const calculateHoursWorked = (clockIn, clockOut) => {
    if (!clockIn || !clockOut || clockOut === '-') return '-';
    
    // Parse time strings (assuming HH:MM format)
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    try {
      const clockInMinutes = parseTime(clockIn);
      let clockOutMinutes = parseTime(clockOut);
      
      // Handle overnight shifts
      if (clockOutMinutes < clockInMinutes) {
        clockOutMinutes += 24 * 60; // Add 24 hours
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

  // Function to generate mock timesheet data from employee data
  const generateTimesheetFromEmployees = (employees) => {
    const currentDate = new Date();
    const timesheetEntries = [];

    employees.forEach((employee, index) => {
      // Get employee name from the correct fields
      const firstName = employee.user?.firstName || employee.firstName || '';
      const lastName = employee.user?.lastName || employee.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';
      
      // Generate different scenarios for different employees
      const scenarios = [
        // Currently clocked in
        {
          clockIn: '11:30',
          clockOut: '-',
          status: 'Clocked In',
          statusColor: 'blue'
        },
        // Already clocked out
        {
          clockIn: '12:00',
          clockOut: '21:00',
          status: 'Clocked out',
          statusColor: 'green'
        },
        // Long shift completed
        {
          clockIn: '11:45',
          clockOut: '00:30',
          status: 'Clocked out',
          statusColor: 'green'
        },
        // Late start, still working
        {
          clockIn: '13:15',
          clockOut: '-',
          status: 'Clocked In',
          statusColor: 'blue'
        }
      ];

      const scenario = scenarios[index % scenarios.length];
      const entryDate = new Date(currentDate);
      entryDate.setDate(entryDate.getDate() - (index % 3)); // Spread across last 3 days

      timesheetEntries.push({
        id: employee._id || employee.id || index + 1,
        initials: getInitials(fullName),
        name: fullName,
        role: employee.position || employee.department || 'Staff Member',
        team: employee.department || employee.team || 'Centre Dubai',
        date: formatDate(entryDate),
        clockIn: scenario.clockIn,
        clockOut: scenario.clockOut,
        breaks: '-',
        hoursWorked: calculateHoursWorked(scenario.clockIn, scenario.clockOut),
        status: scenario.status,
        statusColor: scenario.statusColor,
        employeeId: employee._id || employee.id
      });
    });

    return timesheetEntries;
  };

  // Fetch employees data and generate timesheet
  const fetchTimesheetData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching employee data for timesheets...');
      
      const response = await api.get('/employees');
      
      if (response.data.success) {
        const employees = response.data.data.employees || [];
        console.log('✅ Employees fetched successfully:', employees.length);
        
        // Debug: Log first employee structure
        if (employees.length > 0) {
          console.log('📋 Sample employee structure:', employees[0]);
        }
        
        // Generate timesheet data from employees
        const generatedTimesheets = generateTimesheetFromEmployees(employees);
        setTimesheetData(generatedTimesheets);
        
        console.log('📋 Timesheet data generated:', generatedTimesheets.length, 'entries');
        
        // Debug: Log first timesheet entry
        if (generatedTimesheets.length > 0) {
          console.log('📋 Sample timesheet entry:', generatedTimesheets[0]);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch employees');
      }
    } catch (err) {
      console.error('❌ Error fetching timesheet data:', err);
      setError(err.message || 'Failed to load timesheet data');
      
      // Fallback to mock data if API fails
      const mockTimesheetData = [
        {
          id: 1,
          initials: 'JF',
          name: 'John Fernandez',
          role: 'Junior Software Manager',
          team: 'Centre Dubai',
          date: formatDate(),
          clockIn: '11:30',
          clockOut: '-',
          breaks: '-',
          hoursWorked: '-',
          status: 'Clocked In',
          statusColor: 'blue'
        },
        {
          id: 2,
          initials: 'DE',
          name: 'Dani Elsa',
          role: 'Senior Software Manager',
          team: 'Centre Dubai',
          date: formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
          clockIn: '12:00',
          clockOut: '21:00',
          breaks: '-',
          hoursWorked: '9h',
          status: 'Clocked out',
          statusColor: 'green'
        }
      ];
      setTimesheetData(mockTimesheetData);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchTimesheetData();
  }, [fetchTimesheetData]);

  const handleWeekChange = () => {
    // Add week selection logic here
    console.log('Week selection clicked');
  };

  const handleOptionsClick = () => {
    // Add options logic here
    console.log('Options clicked');
  };

  const handleAddClick = () => {
    // Add new timesheet entry logic here
    console.log('Add clicked');
  };

  const handleRefresh = () => {
    fetchTimesheetData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="timesheet-main-wrapper">
        <div className="timesheet-header-section">
          <div className="timesheet-title-group">
            <h1>Timesheets</h1>
            <p>Loading timesheet data...</p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Error state
  if (error && timesheetData.length === 0) {
    return (
      <div className="timesheet-main-wrapper">
        <div className="timesheet-header-section">
          <div className="timesheet-title-group">
            <h1>Timesheets</h1>
            <p>Error loading timesheet data</p>
          </div>
          <div className="timesheet-action-buttons">
            <button 
              className="timesheet-add-button" 
              onClick={handleRefresh}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
        <div className="error-message" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '18px',
          color: '#dc3545',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div>❌ {error}</div>
          <button 
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter data based on search term
  const filteredData = timesheetData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="timesheet-main-wrapper">
      <div className="timesheet-header-section">
        <div className="timesheet-title-group">
          <h1>Timesheets</h1>
          <p>Manage your team members' timesheets ({timesheetData.length} entries)</p>
          {error && (
            <p style={{ color: '#dc3545', fontSize: '14px', margin: '5px 0' }}>
              ⚠️ Using fallback data - {error}
            </p>
          )}
        </div>
        <div className="timesheet-action-buttons">
          <button 
            className="timesheet-add-button" 
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🔄 Refresh
          </button>
          {/* <button className="timesheet-options-button" onClick={handleOptionsClick}>
            <span>Options</span>
            <ChevronDown size={16} />
          </button> */}
          {/* <button className="timesheet-add-button" onClick={handleAddClick}>
            <Plus size={16} />
            <span>Add</span>
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
          {/* <div className="timesheet-week-picker" onClick={handleWeekChange}>
            <Calendar size={16} />
            <span>{selectedWeek}</span>
            <ChevronDown size={16} />
          </div> */}
        </div>
        <div className="timesheet-data-toggle">
          <span style={{ fontSize: '14px', color: '#666' }}>
            Showing {filteredData.length} of {timesheetData.length} entries
          </span>
          {/* <BarChart3 size={16} />
          <span>Data interest first</span> */}
        </div>
      </div>

      <div className="timesheet-table-wrapper">
        {filteredData.length === 0 ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '16px',
            color: '#666',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {searchTerm ? (
              <>
                <div>No timesheets found matching "{searchTerm}"</div>
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
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
                      <div className="timesheet-member-avatar">
                        {item.initials}
                      </div>
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
                    <div className="timesheet-more-actions">
                      <MoreHorizontal size={16} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TimesheetApp;