import React, { useState, useEffect, useCallback } from 'react';
import './Sheduledshifts.css'; // Your responsive CSS for this component
import './EmployeeEditModal.css'; // CSS for employee edit modal
import { Base_url } from '../Service/Base_url'; // Your Base URL for API calls
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'; // Icon imports

// --- GLOBAL HELPER DATA (MOVED MONTHS ARRAY HERE) ---
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helper Functions (Moved outside the component for reusability and clarity) ---

const getAvatarColor = (employeeId) => {
  const colors = ['#E8D5FF', '#E8F4FD', '#FFF4E6', '#F0F0F0', '#E8F5E8', '#F5E8FF', '#E8F0FF', '#FFF0E8', '#D6EAF8', '#FADBD8']; // More colors
  if (!employeeId) return colors[0]; // Default color
  const hash = Array.from(employeeId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = d.getDate() - day; // Adjust date to Sunday of the current week
  return new Date(d.setDate(diff));
};

const getWeekDays = (startDate) => {
  const days = [];
  const weekStart = getWeekStart(startDate);

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
};

const formatDateHeader = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // `months` is now globally available
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const formatWeekRange = (startDate) => {
  const weekStart = getWeekStart(startDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = months[weekStart.getMonth()]; // `months` is now globally available
  const endMonth = months[weekEnd.getMonth()];   // `months` is now globally available
  const year = weekStart.getFullYear();

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay} - ${endDay} ${startMonth}, ${year}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${year}`;
  }
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === 0 && endMinutes === 0) return '0h'; // No shift or error in times

  let totalMinutes = 0;
  if (endMinutes > startMinutes) {
    totalMinutes = endMinutes - startMinutes;
  } else {
    // Overnight shift: calculate minutes until midnight + minutes from midnight
    totalMinutes = (24 * 60 - startMinutes) + endMinutes;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) return '0h';
  if (minutes > 0) return `${hours}h ${minutes}min`;
  return `${hours}h`;
};


// --- Spinner Component ---
const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

// --- Shift Editor Modal Component ---
const ShiftEditorModal = ({
  isOpen, onClose, editingShift, setEditingShift,
  handleSaveShift, handleDeleteShift, savingShift, error // Pass error specific to save/delete
}) => {
  // Initialize shifts state from editingShift - load existing shifts if any
  const [shifts, setShifts] = React.useState([]);

  // Load existing shifts when modal opens
  React.useEffect(() => {
    if (isOpen && editingShift) {
      // Get existing shifts for this day from the member's workSchedule
      const dayName = getDayName(editingShift.day);
      const member = editingShift.memberData; // We'll need to pass member data
      const schedule = member?.workSchedule?.[dayName];
      
      if (schedule && schedule.shifts) {
        // Parse existing shifts from string format: "09:00 - 17:00, 14:00 - 18:00"
        const existingShifts = schedule.shifts.split(',').map(s => {
          const trimmed = s.trim();
          const parts = trimmed.split(' - ');
          return {
            startTime: parts[0] || '09:00',
            endTime: parts[1] || '17:00'
          };
        });
        setShifts(existingShifts);
      } else if (schedule && schedule.startTime && schedule.endTime) {
        // Single shift from old format
        setShifts([{ startTime: schedule.startTime, endTime: schedule.endTime }]);
      } else {
        // Default new shift
        setShifts([{ startTime: '09:00', endTime: '17:00' }]);
      }
    }
  }, [isOpen, editingShift]);

  if (!isOpen) return null;

  // Generate time options for dropdowns (every 5 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Handle shift changes
  const handleShiftChange = (index, field, value) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
  };

  // Add new shift
  const addShift = () => {
    setShifts([...shifts, { startTime: '09:00', endTime: '17:00' }]);
  };

  // Remove shift
  const removeShift = (index) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter((_, i) => i !== index));
    }
  };

  // Calculate total hours
  const calculateTotalHours = () => {
    let totalMinutes = 0;
    shifts.forEach(shift => {
      if (shift.startTime && shift.endTime && shift.endTime !== 'Select an option') {
        const startMinutes = timeToMinutes(shift.startTime);
        const endMinutes = timeToMinutes(shift.endTime);
        totalMinutes += endMinutes >= startMinutes 
          ? endMinutes - startMinutes 
          : (24 * 60) - startMinutes + endMinutes;
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="shift-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingShift?.memberName}'s shift {formatDateHeader(editingShift?.day)}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {error && <div className="modal-error-message">{error}</div>}
          
          {/* Shift Rows */}
          <div className="shift-input-group">
            <div className="shift-rows-container">
              {shifts.map((shift, index) => (
                <div key={index} className="shift-row">
                  <div className="time-inputs">
                    <div className="time-input-group">
                      <label>Start time</label>
                      <select
                        value={shift.startTime}
                        onChange={(e) => handleShiftChange(index, 'startTime', e.target.value)}
                        className="time-select"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <span className="time-separator">-</span>
                    
                    <div className="time-input-group">
                      <label>End time</label>
                      <select
                        value={shift.endTime}
                        onChange={(e) => handleShiftChange(index, 'endTime', e.target.value)}
                        className="time-select"
                      >
                        <option value="Select an option">Select an option</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    className="delete-shift-btn"
                    onClick={() => removeShift(index)}
                    disabled={shifts.length <= 1}
                    title="Remove this shift"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add Shift Button */}
            <button className="add-shift-btn" onClick={addShift}>
              <span className="plus-icon">⊕</span> Add another shift
            </button>
            
            {/* Total Hours */}
            <div className="total-hours">
              {calculateTotalHours()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="delete-btn" onClick={handleDeleteShift} disabled={savingShift}>
            Delete
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose} disabled={savingShift}>
              Cancel
            </button>
            <button className="save-btn" onClick={() => handleSaveShift(shifts)} disabled={savingShift}>
              {savingShift ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Employee Edit Modal Component ---
const EmployeeEditModal = ({ isOpen, onClose, employee, onSave }) => {
  const [scheduleType, setScheduleType] = useState('Every week');
  const [startDate, setStartDate] = useState(new Date());
  const [weeklySchedule, setWeeklySchedule] = useState({
    sunday: { isWorking: false, startTime: '00:00', endTime: '00:00' },
    monday: { isWorking: false, startTime: '00:00', endTime: '00:00' },
    tuesday: { isWorking: false, startTime: '00:00', endTime: '00:00' },
    wednesday: { isWorking: false, startTime: '00:00', endTime: '00:00' },
    thursday: { isWorking: false, startTime: '00:00', endTime: '00:00' },
    friday: { isWorking: false, startTime: '00:00', endTime: '00:00' },
    saturday: { isWorking: false, startTime: '00:00', endTime: '00:00' }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  // Initialize schedule when employee changes
  useEffect(() => {
    if (employee && employee.workSchedule) {
      // Create a proper default schedule with fallback values
      const defaultSchedule = {
        sunday: { isWorking: false, startTime: '09:00', endTime: '17:00' },
        monday: { isWorking: false, startTime: '09:00', endTime: '17:00' },
        tuesday: { isWorking: false, startTime: '09:00', endTime: '17:00' },
        wednesday: { isWorking: false, startTime: '09:00', endTime: '17:00' },
        thursday: { isWorking: false, startTime: '09:00', endTime: '17:00' },
        friday: { isWorking: false, startTime: '09:00', endTime: '17:00' },
        saturday: { isWorking: false, startTime: '09:00', endTime: '17:00' }
      };

      // Merge with existing schedule but ensure times are valid
      const mergedSchedule = { ...defaultSchedule };
      Object.keys(employee.workSchedule).forEach(day => {
        if (employee.workSchedule[day]) {
          mergedSchedule[day] = {
            isWorking: employee.workSchedule[day].isWorking || false,
            startTime: employee.workSchedule[day].startTime || '09:00',
            endTime: employee.workSchedule[day].endTime || '17:00'
          };
        }
      });

      setWeeklySchedule(mergedSchedule);
      console.log('Initialized schedule for employee:', employee.name, mergedSchedule);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  const handleDayToggle = (dayKey) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isWorking: !prev[dayKey].isWorking
      }
    }));
  };

  const handleTimeChange = (dayKey, field, value) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const addShift = (dayKey) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isWorking: true,
        startTime: '09:00',
        endTime: '17:00'
      }
    }));
  };

  const removeShift = (dayKey) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isWorking: false,
        startTime: '00:00',
        endTime: '00:00'
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('Saving schedule for employee:', employee.id, weeklySchedule);
      await onSave(employee.id, weeklySchedule);
      console.log('Schedule saved successfully');
      onClose();
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const updatedSchedule = { ...weeklySchedule };
    Object.keys(updatedSchedule).forEach(day => {
      updatedSchedule[day] = {
        ...updatedSchedule[day],
        isWorking: newSelectAll
      };
    });
    setWeeklySchedule(updatedSchedule);
  };

  const calculateDayHours = (day) => {
    if (!day.isWorking || !day.startTime || !day.endTime) return '0h';
    
    const startMinutes = timeToMinutes(day.startTime);
    const endMinutes = timeToMinutes(day.endTime);
    
    let totalMinutes = 0;
    if (endMinutes > startMinutes) {
      totalMinutes = endMinutes - startMinutes;
    } else {
      totalMinutes = (24 * 60 - startMinutes) + endMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes > 0) return `${hours}h ${minutes}min`;
    return `${hours}h`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="employee-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Set {employee.name}'s regular shifts</h3>
          <div className="modal-header-actions">
            <button 
              className="save-btn primary-save-btn" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="modal-content">
          {error && <div className="modal-error-message">{error}</div>}
          {successMessage && <div className="modal-success-message">{successMessage}</div>}
          
          <p className="modal-subtitle">
            Set weekly, biweekly or custom shifts. Changes saved will apply to all upcoming shifts for the selected period.
          </p>

          <div className="schedule-controls">
            <div className="control-group">
              <label>Schedule type</label>
              <select 
                value={scheduleType} 
                onChange={(e) => setScheduleType(e.target.value)}
                className="schedule-select"
              >
                <option value="Every week">Every week</option>
                <option value="Every 2 weeks">Every 2 weeks</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="control-group">
              <label>Start date</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="date-input"
              />
            </div>

            <div className="control-group">
              <label>Ends</label>
              <select className="schedule-select">
                <option value="never">Select an option</option>
                <option value="never">Never</option>
                <option value="date">On specific date</option>
                <option value="after">After number of occurrences</option>
              </select>
            </div>
          </div>

          <div className="info-note">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C11.866 1 15 4.134 15 8C15 11.866 11.866 15 8 15C4.134 15 1 11.866 1 8C1 4.134 4.134 1 8 1Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 11V8M8 5H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Team members will not be scheduled on business closed periods.
          </div>

          <div className="universal-controls">
            <label className="universal-checkbox">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <span className="universal-label">Select All Days</span>
            </label>
          </div>

          <div className="days-schedule">
            {daysOfWeek.map(({ key, label }) => {
              const daySchedule = weeklySchedule[key];
              return (
                <div key={key} className="day-schedule-row">
                  <div className="day-info">
                    <label className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={daySchedule.isWorking}
                        onChange={() => handleDayToggle(key)}
                      />
                      <span className="day-name">{label}</span>
                    </label>
                    <span className="day-duration">{calculateDayHours(daySchedule)}</span>
                  </div>

                  <div className="day-times">
                    {daySchedule.isWorking ? (
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={daySchedule.startTime}
                          onChange={(e) => handleTimeChange(key, 'startTime', e.target.value)}
                          className="time-input"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={daySchedule.endTime}
                          onChange={(e) => handleTimeChange(key, 'endTime', e.target.value)}
                          className="time-input"
                        />
                        <button 
                          className="remove-shift-btn"
                          onClick={() => removeShift(key)}
                          title="Remove shift"
                        >
                          🗑️
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="add-shift-btn"
                        onClick={() => addShift(key)}
                      >
                        Add a shift
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Date Picker Modal Component ---
const DatePickerModal = ({ isOpen, onClose, onDateSelect, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) => {
  if (!isOpen) return null;

  // `months` is now globally available, no need to redefine here.

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };

  const generateDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="date-picker-header">
          <h3>Select Date</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="date-picker-content">
          <div className="date-picker-selects">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="date-select"
            >
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="date-select"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div className="date-picker-days">
            {generateDaysInMonth(selectedYear, selectedMonth).map(day => (
              <button
                key={day}
                className="day-btn"
                onClick={() => onDateSelect(selectedYear, selectedMonth, day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main ShiftScheduler Component ---
const ShiftScheduler = () => {
  // --- State Variables ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOptions, setShowOptions] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showEmployeeEdit, setShowEmployeeEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true); // For initial employee fetch
  const [error, setError] = useState(null); // For general errors
  const [savingShift, setSavingShift] = useState(false); // For specific shift save/delete operations
  const [shiftEditorError, setShiftEditorError] = useState(null); // Error specific to shift editor modal
  const [editingShift, setEditingShift] = useState({
    memberId: null,
    memberName: '',
    day: null, // Date object
    dateKey: '',
    currentShift: '', // Original shift string for display
    newShift: '', // New shift input value
    dayName: '' // 'monday', 'tuesday', etc.
  });

  // --- API Fetching ---
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear general error on new fetch
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${Base_url}/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch employees');
      }

      const data = await response.json();
      const employees = data.data.employees || [];

      console.log('Raw employee data from backend:', employees); // Debug log

      const transformedMembers = employees.map(emp => {
        console.log('Processing employee:', emp.user?.firstName, 'workSchedule:', emp.workSchedule); // Enhanced debug log
        
        // Check if shifts field exists in each day's schedule
        if (emp.workSchedule) {
          Object.entries(emp.workSchedule).forEach(([day, schedule]) => {
            if (schedule && schedule.shifts) {
              console.log(`Found shifts for ${day}:`, schedule.shifts);
            }
          });
        }
        
        return {
          id: emp._id,
          name: emp.user?.firstName && emp.user?.lastName
            ? `${emp.user.firstName} ${emp.user.lastName}`
            : emp.user?.firstName || emp.user?.email || 'N/A',
          avatar: emp.user?.firstName?.[0] || (emp.user?.email?.[0] || 'E').toUpperCase(),
          avatarColor: getAvatarColor(emp._id),
          workSchedule: emp.workSchedule || {}, // Keep the full workSchedule structure including shifts field
          position: emp.position || '',
          department: emp.department || ''
        };
      });

      setTeamMembers(transformedMembers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // Call fetchEmployees on mount

  // --- Handlers for Navigation and Modals ---

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedYear(new Date().getFullYear()); // Reset date picker to current year
    setSelectedMonth(new Date().getMonth()); // Reset date picker to current month
    setShowOptions(false); // Close dropdown after action
  };

  const handleDateSelect = (year, month, day) => {
    const newDate = new Date(year, month, day);
    setCurrentDate(newDate);
    setShowDatePicker(false);
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const weekStartToday = getWeekStart(today);
    const weekStartCurrent = getWeekStart(currentDate);

    return weekStartToday.toDateString() === weekStartCurrent.toDateString();
  };

  const handleShiftClick = useCallback((memberId, day) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    const dayName = getDayName(day);
    const schedule = member.workSchedule[dayName];
    
    console.log(`Shift click for ${member.name} on ${dayName}:`, schedule); // Debug log
    
    // Get current shift - prioritize the full shifts string if available
    let currentShift = '';
    if (schedule && schedule.isWorking) {
      if (schedule.shifts) {
        currentShift = schedule.shifts; // Multiple shifts format
        console.log('Using shifts field:', currentShift); // Debug log
      } else if (schedule.startTime && schedule.endTime) {
        currentShift = `${schedule.startTime} - ${schedule.endTime}`; // Single shift fallback
        console.log('Using startTime/endTime fallback:', currentShift); // Debug log
      }
    }

    console.log('Final currentShift value:', currentShift); // Debug log

    setEditingShift({
      memberId,
      memberName: member.name,
      memberData: member, // Include full member data for modal
      day,
      dateKey: formatDateHeader(day),
      currentShift: currentShift,
      newShift: currentShift || '09:00 - 17:00', // Default if no current shift
      dayName
    });
    setShiftEditorError(null); // Clear any previous error in editor
    setShowShiftEditor(true);
  }, [teamMembers]); // Dependency on teamMembers to ensure it's always up-to-date

  const handleSaveShift = async (modalShifts) => {
    setSavingShift(true);
    setShiftEditorError(null); // Clear previous errors in the modal

    try {
      const token = localStorage.getItem('token');
      
      // Validate that we have shifts data (either from modal or old format)
      let validShifts = [];
      
      if (modalShifts && modalShifts.length > 0) {
        // New modal format: array of {startTime, endTime} objects
        validShifts = modalShifts.filter(shift => 
          shift.startTime && 
          shift.endTime && 
          shift.endTime !== 'Select an option'
        );
      } else if (editingShift.newShift && editingShift.newShift.trim()) {
        // Old text format fallback: parse "09:00 - 17:00, 14:00 - 18:00"
        const shifts = editingShift.newShift.split(',').map(s => s.trim()).filter(s => s.length > 0);
        for (const shift of shifts) {
          const parts = shift.split(' - ');
          if (parts.length === 2) {
            validShifts.push({ startTime: parts[0].trim(), endTime: parts[1].trim() });
          }
        }
      }
      
      if (validShifts.length === 0) {
        throw new Error('Please add at least one valid shift with start and end times');
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const shift of validShifts) {
        if (!timeRegex.test(shift.startTime) || !timeRegex.test(shift.endTime)) {
          throw new Error(`Invalid time format in "${shift.startTime} - ${shift.endTime}". Use HH:MM format (e.g., 09:00)`);
        }
      }

      // Create shift string for backend storage
      const shiftString = validShifts.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
      
      // For backward compatibility, use first shift for primary startTime/endTime
      const primaryShift = validShifts[0];

      // Try multiple approaches to ensure data persists
      const updateData = {
        workSchedule: {
          [editingShift.dayName]: {
            isWorking: true,
            startTime: primaryShift.startTime,
            endTime: primaryShift.endTime,
            shifts: shiftString, // Primary approach
            shiftsData: validShifts, // Alternative: store as array
            multipleShifts: shiftString, // Alternative: different field name
            shiftCount: validShifts.length
          }
        }
      };

      console.log('📤 Sending PATCH request to backend:');
      console.log(`  URL: ${Base_url}/employees/${editingShift.memberId}`);
      console.log(`  Method: PATCH`);
      console.log(`  Headers: Authorization: Bearer ${token ? '[TOKEN PRESENT]' : '[NO TOKEN]'}`);
      console.log(`  Body:`, JSON.stringify(updateData, null, 2));

      const response = await fetch(`${Base_url}/employees/${editingShift.memberId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      console.log('📥 PATCH Response received:');
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  OK: ${response.ok}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ PATCH failed with error response:', errorData);
        throw new Error(errorData.message || 'Failed to update shift');
      }

      const responseData = await response.json();
      console.log('✅ PATCH Success Response:', responseData);
      
      // Log the saved employee data from backend response
      if (responseData.data && responseData.data.employee) {
        const savedEmployee = responseData.data.employee;
        console.log('💾 Backend saved employee data:');
        console.log(`  Employee ID: ${savedEmployee._id}`);
        console.log(`  Work Schedule:`, savedEmployee.workSchedule);
        console.log(`  ${editingShift.dayName} schedule:`, savedEmployee.workSchedule[editingShift.dayName]);
        console.log(`  Shifts field in backend:`, savedEmployee.workSchedule[editingShift.dayName]?.shifts);
      }

      // Update local state directly to reflect change immediately
      setTeamMembers(prevMembers => {
        const updatedMembers = prevMembers.map(member =>
          member.id === editingShift.memberId
            ? {
                ...member,
                workSchedule: {
                  ...member.workSchedule, // Preserve existing workSchedule for other days
                  [editingShift.dayName]: {
                    ...updateData.workSchedule[editingShift.dayName],
                    // Ensure the shifts field is properly set for immediate UI update
                    shifts: shiftString,
                    isWorking: true
                  }
                }
              }
            : member
        );
        
        // Log the updated member's schedule for debugging
        const updatedMember = updatedMembers.find(m => m.id === editingShift.memberId);
        console.log('✅ Local state updated after shift save:');
        console.log(`  Employee: ${updatedMember.name}`);
        console.log(`  Day: ${editingShift.dayName}`);
        console.log(`  Updated schedule:`, updatedMember.workSchedule[editingShift.dayName]);
        console.log(`  Shifts string: "${shiftString}"`);
        
        return updatedMembers;
      });

      // Close modal immediately since state is updated
      setShowShiftEditor(false);

      // Only refetch if we want to verify backend persistence - but don't overwrite good UI state
      // We'll comment this out for now to prevent overwriting the UI state
      // setTimeout(() => {
      //   console.log('🔄 Refetching employees to verify persistence...');
      //   fetchEmployees();
      // }, 1000);

      console.log('🎉 Shift saved successfully! UI state updated without refetch.');
    } catch (err) {
      console.error('❌ Save shift error:', err);
      setShiftEditorError(err.message); // Set error for modal
      
      // If save failed, we should probably refetch to get accurate data
      console.log('🔄 Save failed, refetching to get accurate data...');
      setTimeout(() => {
        fetchEmployees();
      }, 500);
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async () => {
    setSavingShift(true);
    setShiftEditorError(null); // Clear previous errors

    if (!window.confirm('Are you sure you want to delete this shift?')) {
        setSavingShift(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        workSchedule: {
          [editingShift.dayName]: {
            isWorking: false, // Mark as not working
            startTime: null, // Clear times
            endTime: null
          }
        }
      };

      const response = await fetch(`${Base_url}/employees/${editingShift.memberId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete shift');
      }

      // Update local state
      setTeamMembers(prevMembers => {
        const updatedMembers = prevMembers.map(member =>
          member.id === editingShift.memberId
            ? {
                ...member,
                workSchedule: {
                  ...member.workSchedule, // Preserve existing workSchedule for other days
                  [editingShift.dayName]: updateData.workSchedule[editingShift.dayName]
                }
              }
            : member
        );
        console.log('Local state updated after shift delete:', updatedMembers.find(m => m.id === editingShift.memberId)?.workSchedule); // Debug log
        return updatedMembers;
      });
      setShowShiftEditor(false);
    } catch (err) {
      setShiftEditorError(err.message);
    } finally {
      setSavingShift(false);
    }
  };

  const handleCancelShift = () => {
    setShowShiftEditor(false);
    setShiftEditorError(null); // Clear error on close
  };

  const handleEditMember = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      setEditingEmployee(member);
      setShowEmployeeEdit(true);
    }
  };

  const saveEmployeeSchedule = async (employeeId, newSchedule) => {
    console.log('Updating employee schedule:', employeeId, newSchedule);
    const token = localStorage.getItem('token');
    
    const updateData = {
      workSchedule: newSchedule
    };

    const response = await fetch(`${Base_url}/employees/${employeeId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.message || 'Failed to update employee schedule');
    }

    console.log('API update successful, updating local state...');
    
    // Update local state
    setTeamMembers(prevMembers => {
      const updatedMembers = prevMembers.map(member =>
        member.id === employeeId
          ? { 
              ...member, 
              workSchedule: {
                ...member.workSchedule, // Preserve existing schedule
                ...newSchedule // Merge with new schedule
              }
            }
          : member
      );
      console.log('Local state updated:', updatedMembers.find(m => m.id === employeeId)?.workSchedule);
      return updatedMembers;
    });
  };

  // Calculate total hours for a member in a week
  const calculateWeekHours = (member, weekDays) => {
    let totalMinutes = 0;
    weekDays.forEach(day => {
      const dayName = getDayName(day);
      const schedule = member.workSchedule[dayName];
      if (schedule && schedule.isWorking) {
        // Handle multiple shifts if available
        if (schedule.shifts) {
          // Parse multiple shifts from the shifts string
          const shifts = schedule.shifts.split(',').map(s => s.trim());
          shifts.forEach(shift => {
            const parts = shift.split(' - ');
            if (parts.length === 2) {
              const [startTime, endTime] = parts.map(t => t.trim());
              let startMinutes = timeToMinutes(startTime);
              let endMinutes = timeToMinutes(endTime);
              
              // Handle overnight shifts
              if (endMinutes < startMinutes) {
                endMinutes += 24 * 60;
              }
              totalMinutes += endMinutes - startMinutes;
            }
          });
        } else if (schedule.startTime && schedule.endTime) {
          // Fallback to single shift calculation
          let startMinutes = timeToMinutes(schedule.startTime);
          let endMinutes = timeToMinutes(schedule.endTime);
          
          // Handle overnight shifts
          if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
          }
          totalMinutes += endMinutes - startMinutes;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return '0h';
    if (minutes > 0) return `${hours}h ${minutes}min`;
    return `${hours}h`;
  };

  // Calculate daily total hours for all members combined
  const calculateDayHours = (day, allMembers) => {
    let totalMinutes = 0;
    const dayName = getDayName(day);
    allMembers.forEach(member => {
      const schedule = member.workSchedule[dayName];
      if (schedule && schedule.isWorking) {
        // Handle multiple shifts if available
        if (schedule.shifts) {
          // Parse multiple shifts from the shifts string
          const shifts = schedule.shifts.split(',').map(s => s.trim());
          shifts.forEach(shift => {
            const parts = shift.split(' - ');
            if (parts.length === 2) {
              const [startTime, endTime] = parts.map(t => t.trim());
              let startMinutes = timeToMinutes(startTime);
              let endMinutes = timeToMinutes(endTime);
              
              // Handle overnight shifts
              if (endMinutes < startMinutes) {
                endMinutes += 24 * 60;
              }
              totalMinutes += endMinutes - startMinutes;
            }
          });
        } else if (schedule.startTime && schedule.endTime) {
          // Fallback to single shift calculation
          let startMinutes = timeToMinutes(schedule.startTime);
          let endMinutes = timeToMinutes(schedule.endTime);
          
          // Handle overnight shifts
          if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
          }
          totalMinutes += endMinutes - startMinutes;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return '0h';
    if (minutes > 0) return `${hours}h ${minutes}min`;
    return `${hours}h`;
  };

  // Get shift display for a member on a specific day
  const getShiftDisplay = (member, day) => {
    const dayName = getDayName(day);
    const schedule = member.workSchedule[dayName];
    
    console.log(`🔍 getShiftDisplay for ${member.name} on ${dayName}:`, {
      schedule: schedule,
      hasShifts: !!schedule?.shifts,
      shiftsValue: schedule?.shifts,
      hasMultipleShifts: !!schedule?.multipleShifts,
      multipleShiftsValue: schedule?.multipleShifts,
      hasStartEnd: !!(schedule?.startTime && schedule?.endTime),
      isWorking: schedule?.isWorking
    }); 
    
    if (schedule && schedule.isWorking) {
      // Try multiple field names for shifts (in case backend uses different field)
      const shiftsField = schedule.shifts || schedule.multipleShifts || schedule.shiftsData;
      
      if (shiftsField) {
        console.log(`✅ Found shifts field: "${shiftsField}"`);
        if (typeof shiftsField === 'string') {
          // String format: "09:00 - 13:00, 14:00 - 18:00" => ["09:00 - 13:00", "14:00 - 18:00"]
          const shiftsArray = shiftsField.split(',').map(s => s.trim()).filter(s => s.length > 0);
          console.log(`📋 Parsed shifts array:`, shiftsArray);
          return shiftsArray;
        } else if (Array.isArray(shiftsField)) {
          // Array format: [{startTime: "09:00", endTime: "13:00"}, ...]
          const shiftsArray = shiftsField.map(shift => `${shift.startTime} - ${shift.endTime}`);
          console.log(`📋 Converted array to strings:`, shiftsArray);
          return shiftsArray;
        }
      }
      
      // Fallback to single shift
      if (schedule.startTime && schedule.endTime) {
        const fallbackShift = `${schedule.startTime} - ${schedule.endTime}`;
        console.log(`🔄 Using fallback shift: ${fallbackShift}`);
        return [fallbackShift];
      }
    }
    
    console.log('❌ No shifts found, returning empty array');
    return [];
  };


  const currentWeekDays = getWeekDays(currentDate);

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="shift-scheduler">
        <div className="scheduler-loading">
          <Spinner />
          <p>Loading employee schedules...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) { // Display general fetch error if not currently loading
    return (
      <div className="shift-scheduler">
        <div className="scheduler-error-main">
          <p>Error: {error}</p>
          <button onClick={fetchEmployees} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-scheduler">
      <div className="scheduler-header">
        <h1 className="scheduler-title">Scheduled shifts</h1>
        <div className="header-controls">
          <div className="dropdown-container">
            {/* <button
              className="options-btn"
              onClick={() => setShowOptions(!showOptions)}
            >
              Options
              <ChevronDown size={16} />
            </button>
            {showOptions && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={goToToday}>Go to Today</div>
                <div className="dropdown-item" onClick={() => { setShowDatePicker(true); setShowOptions(false); }}>Select Date</div>
                <div className="dropdown-item">Export Schedule</div>
                <div className="dropdown-item">Print Schedule</div>
                <div className="dropdown-item">Settings</div>
              </div>
            )} */}
          </div>

          <div className="dropdown-container">
            {/* <button
              className="add-btn"
              onClick={() => setShowAdd(!showAdd)}
            >
              Add
              <Plus size={16} /> 
            </button>
            {showAdd && (
              <div className="dropdown-menu">
                <div className="dropdown-item">Add Team Member</div>
                <div className="dropdown-item">Add Shift</div>
                <div className="dropdown-item">Import Schedule</div>
                <div className="dropdown-item">Bulk Edit</div>
              </div>
            )} */}
          </div>
        </div>
      </div>

      <div className="week-navigation">
        <button className="nav-btn" onClick={handlePrevWeek}><ChevronLeft size={20} /></button>

        <div className="week-info">
          <span className="week-label">{isCurrentWeek() ? 'This week' : 'Week of'}</span>
          <span className="week-date">{formatWeekRange(currentDate)}</span>
        </div>

        <button className="nav-btn" onClick={handleNextWeek}><ChevronRight size={20} /></button>
        <button className="today-btn" onClick={goToToday}>Today</button>
        
        {/* Debug button to check data */}
      
      </div>

      {/* Main schedule table/cards container */}
      <div className="schedule-table-container">
        {/* Desktop Table (Visible on larger screens) */}
        <div className="schedule-table desktop-view">
          <div className="table-header">
            <div className="member-column-header">
              <span className="member-title">Team member</span>
              <span className="change-link" onClick={() => console.log('Change team members clicked')}>Change</span>
            </div>
            {currentWeekDays.map((day) => (
              <div key={day.toISOString()} className="day-header">
                <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="day-date">{day.getDate()}</span>
                <span className="day-hours">{calculateDayHours(day, teamMembers)}</span> {/* Daily total hours */}
              </div>
            ))}
          </div>

          <div className="table-body">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-info">
                    <div className="member-avatar" style={{ backgroundColor: member.avatarColor }}>
                      <span>{member.avatar}</span>
                    </div>
                    <div className="member-details">
                      <div className="member-name">{member.name}</div>
                      <div className="member-hours">{calculateWeekHours(member, currentWeekDays)}</div> {/* Weekly total hours */}
                    </div>
                    <button
                      className="edit-member-btn"
                      onClick={() => handleEditMember(member.id)}
                      title="Edit employee details"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {currentWeekDays.map((day) => {
                    const shifts = getShiftDisplay(member, day);
                    return (
                      <div key={day.toISOString()} className="shift-cell">
                        {shifts.length > 0 ? (
                          <div className="shift-blocks" onClick={() => handleShiftClick(member.id, day)} title="Click to edit shift">
                            {shifts.map((s, idx) => (
                              <div key={idx} className="shift-block shift-block-vertical">{s}</div>
                            ))}
                          </div>
                        ) : (
                          <div
                            className="shift-block shift-empty"
                            onClick={() => handleShiftClick(member.id, day)}
                            title="Click to add shift"
                          >
                            +
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No employees found. Add employees to start scheduling shifts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cards (Visible on smaller screens) */}
        <div className="mobile-card-layout mobile-view">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="card-member-info">
                  <div className="member-avatar" style={{ backgroundColor: member.avatarColor }}>
                    <span>{member.avatar}</span>
                  </div>
                  <div className="member-details">
                    <div className="member-name">{member.name}</div>
                    <div className="member-position">{member.position}</div> {/* Display position on card */}
                    <div className="member-total-hours">{calculateWeekHours(member, currentWeekDays)} this week</div>
                  </div>
                  <button
                    className="edit-member-btn"
                    onClick={() => handleEditMember(member.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="card-daily-shifts">
                  {currentWeekDays.map(day => {
                    const shifts = getShiftDisplay(member, day); // Get as array
                    return (
                      <div key={day.toISOString()} className="card-shift-item">
                        <span className="card-day-name">{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                        {shifts.length > 0 ? (
                          <div 
                            className="card-shift-blocks"
                            onClick={() => handleShiftClick(member.id, day)}
                            title="Click to edit shifts"
                          >
                            {shifts.map((shift, idx) => (
                              <div key={idx} className="card-shift-block">{shift}</div>
                            ))}
                          </div>
                        ) : (
                          <span
                            className="card-shift-empty"
                            onClick={() => handleShiftClick(member.id, day)}
                            title="Click to add shift"
                          >
                            +
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No employees found. Add employees to start scheduling shifts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals and Popups */}
      <EmployeeEditModal
        isOpen={showEmployeeEdit}
        onClose={() => setShowEmployeeEdit(false)}
        employee={editingEmployee}
        onSave={saveEmployeeSchedule}
      />

      <ShiftEditorModal
        isOpen={showShiftEditor}
        onClose={handleCancelShift}
        editingShift={editingShift}
        setEditingShift={setEditingShift}
        handleSaveShift={handleSaveShift}
        handleDeleteShift={handleDeleteShift}
        savingShift={savingShift}
        error={shiftEditorError} // Pass specific error to modal
      />

      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />
    </div>
  );
};

export default ShiftScheduler;