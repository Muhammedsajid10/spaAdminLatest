import React, { useState, useEffect, useCallback } from 'react';
import './Sheduledshifts.css'; // Your responsive CSS for this component
import './EmployeeEditModal.css'; // CSS for employee edit modal
import { Base_url } from '../Service/Base_url'; // Your Base URL for API calls
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'; // Icon imports
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loading from '../states/Loading.jsx';
import Error500Page from '../states/ErrorPage';
import NoData from '../states/NoData.jsx';
import NoDataState from '../states/NoData.jsx';
// --- GLOBAL HELPER DATA (MOVED MONTHS ARRAY HERE) ---
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Helper Functions (Moved outside the component for reusability and clarity) ---
// --- THESE FUNCTIONS ARE CRUCIAL AND WERE LIKELY MISSING ---

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
  const startMonth = months[weekStart.getMonth()];
  const endMonth = months[weekEnd.getMonth()];
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

// --- Spinner Component ---
const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);
// --- End of helper functions ---

const calculateTotalHours = (shifts) => {
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
const ShiftEditorModal = ({
  isOpen, onClose, editingShift, handleSaveShift, handleDeleteShift, savingShift, error
}) => {
  const [shifts, setShifts] = useState([]);
  // --- NEW STATE FOR VALIDATION ERRORS ---
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen && editingShift) {
      const member = editingShift.memberData;
      const dayName = getDayName(editingShift.day);
      const schedule = member?.workSchedule?.[dayName];

      if (schedule && schedule.shifts) {
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
        setShifts([{ startTime: schedule.startTime, endTime: schedule.endTime }]);
      } else {
        setShifts([{ startTime: '09:00', endTime: '17:00' }]);
      }
      setValidationError(null); // Clear validation error on open
    }
  }, [isOpen, editingShift]);

  if (!isOpen) return null;

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

  const handleShiftChange = (index, field, value) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
    setValidationError(null); // Clear error on any change
  };

  const addShift = () => {
    setShifts([...shifts, { startTime: '09:00', endTime: '17:00' }]);
    setValidationError(null); // Clear error on adding a new shift
  };

  const removeShift = (index) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter((_, i) => i !== index));
      setValidationError(null); // Clear error on removing a shift
    }
  };

  // --- NEW INTERNAL SAVE FUNCTION WITH VALIDATION ---
  const handleInternalSave = () => {
    const uniqueShifts = new Set();
    let isDuplicate = false;
    shifts.forEach(shift => {
      const shiftKey = `${shift.startTime}-${shift.endTime}`;
      if (uniqueShifts.has(shiftKey)) {
        isDuplicate = true;
      }
      uniqueShifts.add(shiftKey);
    });

    if (isDuplicate) {
      setValidationError("Please choose a unique shift. You cannot add the same shift multiple times.");
      return; // Stop the save process
    }

    // If validation passes, call the parent's handleSaveShift
    handleSaveShift(shifts);
  };

  const handleInternalDelete = () => {
    setValidationError(null); // Clear any local errors before calling parent's delete handler
    handleDeleteShift();
  };

  const handleInternalClose = () => {
    setValidationError(null); // Clear errors on close
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleInternalClose}>
      <div className="shift-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {editingShift?.memberName}'s shift &nbsp;
            {editingShift?.day && formatDateHeader(editingShift.day)}
          </h3>
          <button className="close-btn" onClick={handleInternalClose}>×</button>
        </div>

        <div className="modal-content">
          {/* --- DISPLAYING THE NEW VALIDATION ERROR --- */}
          {(error || validationError) && <div className="modal-error-message">{error || validationError}</div>}

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

            <button className="add-shift-btn" onClick={addShift}>
              <span className="plus-icon">⊕</span> Add another shift
            </button>

            <div className="total-hours">
              {calculateTotalHours(shifts)}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="delete-btn" onClick={handleInternalDelete} disabled={savingShift}>
            Delete
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={handleInternalClose} disabled={savingShift}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleInternalSave} disabled={savingShift}>
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
          const daySchedule = employee.workSchedule[day];
          
          // Check if this day has individual shifts (multiple shifts)
          if (daySchedule.shifts) {
            console.log(`📅 Day ${day} has individual shifts:`, daySchedule.shifts);
            // For days with individual shifts, show the regular pattern if it exists
            // but don't overwrite the individual shifts when saving
            mergedSchedule[day] = {
              isWorking: daySchedule.isWorking || false,
              startTime: daySchedule.startTime || '09:00',
              endTime: daySchedule.endTime || '17:00',
              hasIndividualShifts: true, // Mark this for UI indication
              individualShifts: daySchedule.shifts
            };
          } else {
            // Regular single shift day
            mergedSchedule[day] = {
              isWorking: daySchedule.isWorking || false,
              startTime: daySchedule.startTime || '09:00',
              endTime: daySchedule.endTime || '17:00'
            };
          }
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
      console.log('📝 Starting save process for employee:', employee.id);
      console.log('📋 Weekly schedule to save:', JSON.stringify(weeklySchedule, null, 2));
      
      // Clean the schedule data - remove UI-only properties
      const cleanedSchedule = {};
      Object.keys(weeklySchedule).forEach(day => {
        const dayData = weeklySchedule[day];
        cleanedSchedule[day] = {
          isWorking: dayData.isWorking,
          startTime: dayData.startTime,
          endTime: dayData.endTime
        };
        // Don't include hasIndividualShifts or individualShifts in the save data
      });
      
      console.log('🧹 Cleaned schedule for backend:', JSON.stringify(cleanedSchedule, null, 2));
      
      // Validate that at least one day is selected
      const workingDays = Object.keys(cleanedSchedule).filter(day => cleanedSchedule[day].isWorking);
      console.log('📅 Working days found:', workingDays);
      
      if (workingDays.length === 0) {
        console.log('⚠️ No working days selected, saving anyway...');
      }
      
      await onSave(employee.id, cleanedSchedule);
      console.log('✅ Regular schedule saved successfully');
      onClose();
    } catch (err) {
      console.error('❌ Error saving schedule:', err);
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
              <path d="M8 1C11.866 1 15 4.134 15 8C15 11.866 11.866 15 8 15C4.134 15 1 11.866 1 8C1 4.134 4.134 1 8 1Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 11V8M8 5H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                      <span className="day-name">
                        {label}
                        {daySchedule.hasIndividualShifts && (
                          <span className="individual-shifts-indicator" title={`Has individual shifts: ${daySchedule.individualShifts}`}>
                            🔒
                          </span>
                        )}
                      </span>
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
                        {daySchedule.hasIndividualShifts && (
                          <div className="individual-shifts-note">
                            <small>⚠️ Individual shifts: {daySchedule.individualShifts}</small>
                          </div>
                        )}
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

// --- Calendar Range Picker (light black & white theme) ---
const CalendarRangePicker = ({ isOpen, onClose, initialRange = { start: null, end: null }, initialMonth = new Date(), onRangeChange, onMonthChange }) => {
  const [viewMonth, setViewMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [localRange, setLocalRange] = useState({ start: initialRange.start, end: initialRange.end });
  const [hoverDate, setHoverDate] = useState(null);

  useEffect(() => {
    setViewMonth(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  }, [initialMonth]);

  useEffect(() => {
    setLocalRange({ start: initialRange.start, end: initialRange.end });
  }, [initialRange]);

  if (!isOpen) return null;

  const startOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const firstWeekday = startOfMonth.getDay(); // 0..6
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const addMonths = (n) => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + n, 1);
    setViewMonth(next);
    if (onMonthChange) onMonthChange(next);
  };

  const isSameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
  const isInRange = (d) => {
    if (!localRange.start) return false;
    if (localRange.start && !localRange.end) {
      if (!hoverDate) return false;
      const s = localRange.start;
      const e = hoverDate;
      return (d >= (s < e ? s : e) && d <= (s < e ? e : s));
    }
    if (localRange.start && localRange.end) {
      return d >= (localRange.start < localRange.end ? localRange.start : localRange.end)
        && d <= (localRange.start < localRange.end ? localRange.end : localRange.start);
    }
    return false;
  };

  const onDayClick = (day) => {
    if (!localRange.start || (localRange.start && localRange.end)) {
      setLocalRange({ start: day, end: null });
    } else {
      // set end, ensure order
      const start = localRange.start;
      const end = day;
      setLocalRange({ start, end });
      // notify parent after small delay so user sees selection
      if (onRangeChange) onRangeChange({ start: start < end ? start : end, end: start < end ? end : start });
      // leave open so user can confirm or close via button
    }
  };

  const confirmSelection = () => {
    if (localRange.start && localRange.end) {
      const start = localRange.start < localRange.end ? localRange.start : localRange.end;
      const end = localRange.start < localRange.end ? localRange.end : localRange.start;
      if (onRangeChange) onRangeChange({ start, end });
      if (onMonthChange) onMonthChange(new Date(start.getFullYear(), start.getMonth(), 1));
      onClose();
    } else if (localRange.start && !localRange.end) {
      // single day -> treat as range of that day
      const start = localRange.start;
      if (onRangeChange) onRangeChange({ start, end: start });
      if (onMonthChange) onMonthChange(new Date(start.getFullYear(), start.getMonth(), 1));
      onClose();
    } else {
      onClose();
    }
  };

  const cancelSelection = () => {
    setLocalRange({ start: initialRange.start, end: initialRange.end });
    onClose();
  };

  return (
    <div className="calendar-overlay" onClick={cancelSelection}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <div className="calendar-nav">
            <button className="cal-nav-btn" onClick={() => addMonths(-1)} aria-label="Previous month">‹</button>
            <div className="calendar-month-select">
              <select
                value={viewMonth.getMonth()}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const next = new Date(viewMonth.getFullYear(), m, 1);
                  setViewMonth(next);
                  if (onMonthChange) onMonthChange(next);
                }}
              >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={viewMonth.getFullYear()}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  const next = new Date(y, viewMonth.getMonth(), 1);
                  setViewMonth(next);
                  if (onMonthChange) onMonthChange(next);
                }}
              >
                {(() => {
                  const y = new Date().getFullYear();
                  const years = [];
                  for (let i = y - 5; i <= y + 5; i++) years.push(i);
                  return years.map(yr => <option key={yr} value={yr}>{yr}</option>);
                })()}
              </select>
            </div>
            <button className="cal-nav-btn" onClick={() => addMonths(1)} aria-label="Next month">›</button>
          </div>
          <div className="calendar-actions">
            <button className="btn btn-secondary" onClick={cancelSelection}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmSelection}>Apply</button>
          </div>
        </div>

        <div className="calendar-body">
          <div className="weekday-row">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="weekday-cell">{d}</div>
            ))}
          </div>

          <div
            className="calendar-grid"
            onMouseLeave={() => setHoverDate(null)}
          >
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad-${i}`} className="day-cell empty" />)}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), idx + 1);
              const isStart = isSameDay(day, localRange.start);
              const isEnd = isSameDay(day, localRange.end);
              const inRange = isInRange(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={[
                    'day-cell',
                    isStart ? 'selected-start' : '',
                    isEnd ? 'selected-end' : '',
                    inRange ? 'in-range' : '',
                    isToday ? 'today' : ''
                  ].join(' ')}
                  onClick={() => onDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                >
                  <span className="day-number">{day.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main ShiftScheduler Component ---

  // --- Main ShiftScheduler Component ---
  const ShiftScheduler = () => {
    // --- State Variables ---
    const [currentDate, setCurrentDate] = useState(new Date());
    // add range state and calendar control
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
      const d = currentDate ? new Date(currentDate) : new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [hoverWeekStart, setHoverWeekStart] = useState(null); // for week hover preview

    // when dateRange changes update state and fetch employees by setting currentDate to start
    useEffect(() => {
      if (dateRange.start) {
        setCurrentDate(dateRange.start);
        setSelectedYear(dateRange.start.getFullYear());
        setSelectedMonth(dateRange.start.getMonth());
      }
    }, [dateRange]);

    // month change from calendar -> update month state and currentDate to first day
    const handleCalendarMonthChange = (monthDate) => {
      setCalendarMonth(monthDate);
      setSelectedYear(monthDate.getFullYear());
      setSelectedMonth(monthDate.getMonth());
      // optionally move currentDate to first of that month so fetchEmployees triggers
      const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      setCurrentDate(firstOfMonth);
      // fetch employees for the week containing first of month (keeps UI in sync)
      const ws = getWeekStart(firstOfMonth);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      setDateRange({ start: ws, end: we });
      fetchEmployees(ws);
    };
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
    const [editingShift, setEditingShift] = useState({});

    // --- NEW: Export dropdown state ---
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // --- EXPORT HELPERS ---
    const buildExportRows = (members, weekDays) => {
      const headers = [
        'Name',
        'Email',
        'Position',
        'Department',
        ...weekDays.map(d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })),
        'Total hours (week)'
      ];

      const rows = members.map(member => {
        const dayValues = weekDays.map(day => {
          const shifts = getShiftDisplay(member, day); // array of strings
          return shifts.length ? shifts.join(' | ') : '';
        });
        return [
          member.name,
          member.email || '',
          member.position || '',
          member.department || '',
          ...dayValues,
          calculateWeekHours(member, weekDays)
        ];
      });

      return { headers, rows };
    };

    const downloadCSV = () => {
      try {
        const { headers, rows } = buildExportRows(teamMembers, currentWeekDays);
        const csvLines = [
          headers.join(','),
          ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ];
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `schedule_${formatDateForAPI(getWeekStart(currentDate))}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportDropdown(false);
      } catch (err) {
        console.error('CSV export error', err);
        setShowExportDropdown(false);
      }
    };

    const downloadExcel = () => {
      try {
        const { headers, rows } = buildExportRows(teamMembers, currentWeekDays);
        const tsv = [
          headers.join('\t'),
          ...rows.map(r => r.join('\t'))
        ].join('\n');
        const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `schedule_${formatDateForAPI(getWeekStart(currentDate))}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportDropdown(false);
      } catch (err) {
        console.error('Excel export error', err);
        setShowExportDropdown(false);
      }
    };

    const downloadPDF = () => {
      try {
        const { headers, rows } = buildExportRows(teamMembers, currentWeekDays);
        const doc = new jsPDF('l', 'pt', 'A4');
        doc.setFontSize(14);
        doc.text(`Schedule - Week of ${formatWeekRange(currentDate)}`, 40, 40);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 70,
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: [40, 116, 240], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            const page = doc.internal.getNumberOfPages();
            doc.setFontSize(9);
            doc.text(`Allora Spa — Page ${page}`, doc.internal.pageSize.width - 120, doc.internal.pageSize.height - 10);
          }
        });
        doc.save(`schedule_${formatDateForAPI(getWeekStart(currentDate))}.pdf`);
        setShowExportDropdown(false);
      } catch (err) {
        console.error('PDF export error', err);
        setShowExportDropdown(false);
      }
    };

    // Close export dropdown when clicking outside
    useEffect(() => {
      const handler = (e) => {
        if (!e.target.closest('.export-container')) setShowExportDropdown(false);
      };
      if (showExportDropdown) document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [showExportDropdown]);

    // --- Helper Functions ---
    const getWeekStartDate = (date) => {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Get Sunday
      return weekStart;
    };

    const formatDateForAPI = (date) => {
      // Use local components to avoid UTC shift problems
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`; // YYYY-MM-DD (local)
    };

    // ADD: transform backend employee -> frontend member shape
    const transform = (emp) => {
      const id = emp._id || emp.id;
      const first = emp.user?.firstName || emp.first_name || '';
      const last = emp.user?.lastName || emp.last_name || '';
      const email = emp.user?.email || emp.email || '';
      const displayName = first && last ? `${first} ${last}` : first || last || email || (emp.name || 'N/A');
      return {
        id,
        name: displayName,
        avatar: (first && first[0]) || (email && email[0]) || 'E',
        avatarColor: getAvatarColor(id),
        workSchedule: emp.workSchedule || {},
        position: emp.position || '',
        department: emp.department || ''
      };
    };
    // --- API Fetching ---
    const fetchEmployees = useCallback(async (dateParam) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const targetDate = dateParam || currentDate;
        const weekStartDate = formatDateForAPI(getWeekStartDate(targetDate));

        console.log('📅 Fetching employees for week starting:', weekStartDate);

        const response = await fetch(`${Base_url}/employees?weekStartDate=${weekStartDate}`, {
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

        console.log('📋 Raw employee data from backend:', employees);

        const transformedMembers = employees.map(emp => {
          console.log('🔄 Processing employee:', emp.user?.firstName, 'workSchedule:', emp.workSchedule);

          return {
            id: emp._id,
            name: emp.user?.firstName && emp.user?.lastName
              ? `${emp.user.firstName} ${emp.user.lastName}`
              : emp.user?.firstName || emp.user?.email || 'N/A',
            avatar: emp.user?.firstName?.[0] || (emp.user?.email?.[0] || 'E').toUpperCase(),
            avatarColor: getAvatarColor(emp._id),
            workSchedule: emp.workSchedule || {},
            position: emp.position || '',
            department: emp.department || ''
          };
        });

        setTeamMembers(transformedMembers);
        console.log('🔄 setTeamMembers called with:', transformedMembers.length, 'employees');
        console.log('📊 First employee workSchedule sample:', transformedMembers[0]?.workSchedule);
        console.log('📊 All employees with schedules:', transformedMembers.map(emp => ({
          name: emp.name,
          id: emp.id,
          hasSchedule: !!emp.workSchedule,
          scheduleKeys: Object.keys(emp.workSchedule || {}),
          workingDays: Object.keys(emp.workSchedule || {}).filter(day => emp.workSchedule[day]?.isWorking)
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, [currentDate]); // still depends on currentDate for default behavior

    // --- Effects ---
    useEffect(() => {
      fetchEmployees();
    }, [fetchEmployees]); // Call fetchEmployees on mount

    // --- Handlers for Navigation and Modals ---

    const handlePrevWeek = () => {
      // compute previous week's Sunday and use that as the canonical currentDate
      const currentWeekStart = getWeekStart(currentDate);
      const prevWeekStart = new Date(currentWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      setCurrentDate(prevWeekStart);
      const ws = prevWeekStart;
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      setDateRange({ start: ws, end: we });

      // fetch for that exact week start immediately
      fetchEmployees(ws);
    };

    const handleNextWeek = () => {
      const currentWeekStart = getWeekStart(currentDate);
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);

      setCurrentDate(nextWeekStart);
      const ws = nextWeekStart;
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      setDateRange({ start: ws, end: we });

      fetchEmployees(ws);
    };

    const goToToday = () => {
      const today = new Date();
      const ws = getWeekStart(today);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);

      setCurrentDate(ws);          // set to week's start for consistent UI
      setSelectedYear(ws.getFullYear());
      setSelectedMonth(ws.getMonth());
      setDateRange({ start: ws, end: we });

      fetchEmployees(ws);
      setShowOptions(false);
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
      fetchEmployees(); // Refresh to ensure latest data
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
          ,        weekStartDate: formatDateForAPI(getWeekStartDate(currentDate))

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

              // Prefer using backend returned employee to keep data consistent with server
        if (responseData.data && responseData.data.employee) {
          const savedEmployee = responseData.data.employee;
          setTeamMembers(prev => prev.map(m => m.id === (savedEmployee._id || savedEmployee.id) ? {
            ...m,
            // merge fresh workSchedule returned by backend (preserve other fields)
            workSchedule: savedEmployee.workSchedule || m.workSchedule
          } : m));
        } else {
          // fallback to local update if backend didn't return employee object
          setTeamMembers(prevMembers => prevMembers.map(member =>
            member.id === editingShift.memberId
             ? {
                ...member,
                workSchedule: {
                  ...member.workSchedule,
                  [editingShift.dayName]: {
                    ...updateData.workSchedule[editingShift.dayName],
                    shifts: shiftString,
                    isWorking: true
                  }
                }
              }
              : member
      ));
        }

         

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
      console.log('🔄 Starting saveEmployeeSchedule for:', employeeId, newSchedule);
      const token = localStorage.getItem('token');

      // First, get the current employee's workSchedule to preserve existing individual shifts
      const currentEmployee = teamMembers.find(m => m.id === employeeId);
      const currentWorkSchedule = currentEmployee?.workSchedule || {};
      
      console.log('📋 Current workSchedule before merge:', currentWorkSchedule);
      console.log('📋 New regular schedule to apply:', newSchedule);

      // Merge strategy: preserve individual shifts that have "shifts" field (multiple shifts)
      // but allow regular schedule to overwrite simple single shifts
      const mergedWorkSchedule = { ...currentWorkSchedule };
      
      Object.keys(newSchedule).forEach(dayName => {
        const newDaySchedule = newSchedule[dayName];
        const existingDaySchedule = currentWorkSchedule[dayName];
        
        // If the existing day has individual shifts (shifts field), preserve them
        // unless the new schedule explicitly sets isWorking to false
        if (existingDaySchedule && existingDaySchedule.shifts && newDaySchedule.isWorking) {
          console.log(`🔒 Preserving individual shifts for ${dayName}:`, existingDaySchedule.shifts);
          // Keep the existing individual shifts, don't overwrite
          mergedWorkSchedule[dayName] = existingDaySchedule;
        } else {
          console.log(`📝 Applying regular schedule for ${dayName}:`, newDaySchedule);
          // Apply the new regular schedule for this day
          mergedWorkSchedule[dayName] = newDaySchedule;
        }
      });

      console.log('🔀 Final merged workSchedule:', mergedWorkSchedule);

      const updateData = {
        workSchedule: mergedWorkSchedule
      };

      console.log('📤 Sending PATCH request for regular schedule...');
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
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || 'Failed to update employee schedule');
      }

      const responseData = await response.json();
      console.log('✅ API update successful:', responseData);

      // Rely solely on refetch for consistency - no local state update
      console.log('🔄 Refetching employees after schedule update...');
      await fetchEmployees(currentDate);
      console.log('✅ Refetch completed - regular schedule save process finished');
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
      return <Loading />;
    }

    if (error && !loading) { // Display general fetch error if not currently loading
      return <Error500Page />;
    }

    return (
      <div className="shift-scheduler">
        <div className="scheduler-header">
          <h1 className="scheduler-title">Scheduled shifts</h1>
          <div className="header-controls">
            <div className="dropdown-container">
              <button
              className="options-btn"
              onClick={() => setShowOptions(!showOptions)}
            >
              Export
              <ChevronDown size={16} />
            </button>
            {showOptions && (
              <div className="dropdown-menu export-container" role="menu" aria-label="Export options">
                <div
                  className="dropdown-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => { downloadCSV(); setShowOptions(false); }}
                  onKeyPress={(e) => { if (e.key === 'Enter') { downloadCSV(); setShowOptions(false); } }}
                >
                  CSV
                </div>
                <div
                  className="dropdown-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => { downloadPDF(); setShowOptions(false); }}
                  onKeyPress={(e) => { if (e.key === 'Enter') { downloadPDF(); setShowOptions(false); } }}
                >
                  PDF
                </div>
                <div
                  className="dropdown-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => { downloadExcel(); setShowOptions(false); }}
                  onKeyPress={(e) => { if (e.key === 'Enter') { downloadExcel(); setShowOptions(false); } }}
                >
                  Excel
                </div>
              </div>
            )}
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
          <button className="nav-btn" onClick={handlePrevWeek} aria-label="Previous week">
            <ChevronLeft size={18} />
          </button>

          <div className="week-info">
            {/* <span className="week-label visually-hidden">{isCurrentWeek() ? 'This week' : 'Week of'}</span> */}
            <button
              type="button"
              className="week-date-btn"
              onClick={() => {
                setCalendarMonth(new Date(currentDate));
                setShowCalendar(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={showCalendar ? 'true' : 'false'}
              title="Open calendar"
            >
              <span className="week-date-range">{formatWeekRange(currentDate)}</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <button className="nav-btn" onClick={handleNextWeek} aria-label="Next week">
            <ChevronRight size={18} />
          </button>

          <button className="today-btn" onClick={goToToday} title="Go to current week">Today</button>
        </div>

        {/* Main schedule table/cards container */}
        <div className="schedule-table-container">
          {/* Desktop Table (Visible on larger screens) */}
    
          <div className="schedule-table desktop-view">
            {/* Table Header Section */}
            <div className="table-header">
              <div className="member-column-header">
                <span className="member-title">Team member</span>
                <span className="change-link" onClick={() => console.log('Change team members clicked')}>Change</span>
              </div>
              {currentWeekDays.map((day) => (
                <div key={day.toISOString()} className="day-header">
                  <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="day-date">{day.getDate()}</span>
                  <span className="day-hours">{calculateDayHours(day, teamMembers)}</span>
                </div>
              ))}
            </div>

            {/* Table Rows Section (previously in `table-body`) */}
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-info">
                    <div className="member-avatar" style={{ backgroundColor: member.avatarColor }}>
                      <span>{member.avatar}</span>
                    </div>
                    <div className="member-details">
                      <div className="member-name">{member.name}</div>
                      <div className="member-hours">{calculateWeekHours(member, currentWeekDays)}</div>
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
              <>{<Loading/>}</>
            )
            }
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
                  {/* ...rest of mobile card layout... */}
                </div>
              ))
            ) : (
              <>{<Loading/>}</>
            )}
          </div>
        </div>

        {showCalendar && (
  <div className="calendar-overlay" onClick={() => { setShowCalendar(false); setHoverWeekStart(null); }}>
    <div className="calendar-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <div className="calendar-header">
        <div className="calendar-nav">
          <button
            className="cal-nav-btn"
            aria-label="Previous month"
            onClick={() => setCalendarMonth(prev => {
              const m = new Date(prev);
              m.setMonth(m.getMonth() - 1);
              return m;
            })}
          >
            ‹
          </button>
          <div className="calendar-month-select" aria-hidden>
            <strong>{months[calendarMonth.getMonth()]}</strong> {calendarMonth.getFullYear()}
          </div>
          <button
            className="cal-nav-btn"
            aria-label="Next month"
            onClick={() => setCalendarMonth(prev => {
              const m = new Date(prev);
              m.setMonth(m.getMonth() + 1);
              return m;
            })}
          >
            ›
          </button>
        </div>

        <div className="calendar-actions">
          <button className="btn btn-secondary" onClick={() => { setCalendarMonth(new Date()); }}>Today</button>
          <button className="btn btn-primary" onClick={() => { setShowCalendar(false); setHoverWeekStart(null); }}>Close</button>
        </div>
      </div>

      <div className="calendar-body">
        <div className="weekday-row">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
            <div key={w} className="weekday-cell">{w}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {(() => {
            const year = calendarMonth.getFullYear();
            const month = calendarMonth.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < firstDay; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
            while (cells.length % 7 !== 0) cells.push(null);

            // Determine currently previewed week (from hover) or selected dateRange
            const previewWeekStart = hoverWeekStart || (dateRange.start ? new Date(dateRange.start) : null);
            const previewWeekEnd = previewWeekStart ? new Date(previewWeekStart.getFullYear(), previewWeekStart.getMonth(), previewWeekStart.getDate() + 6) : null;

            return cells.map((dt, idx) => {
              if (!dt) return <div key={idx} className="day-cell empty" />;
              const isToday = (new Date()).toDateString() === dt.toDateString();

              // If previewWeekStart is set, mark all days within that week
              const inPreviewWeek = previewWeekStart && dt >= new Date(previewWeekStart.setHours(0,0,0,0)) && dt <= new Date(previewWeekEnd.setHours(23,59,59,999));
              // start/end flags for visuals
              let isWeekStart = false, isWeekEnd = false;
              if (inPreviewWeek) {
                const dayStart = getWeekStart(dt);
                isWeekStart = dt.toDateString() === dayStart.toDateString();
                const weekEnd = new Date(dayStart); weekEnd.setDate(dayStart.getDate() + 6);
                isWeekEnd = dt.toDateString() === weekEnd.toDateString();
              }






              return (
                <button
                  key={idx}
                  type="button"
                  className={[
                    'day-cell',
                    isToday ? 'today' : '',
                    inPreviewWeek ? 'week-in-range' : '',
                    isWeekStart ? 'week-range-start' : '',
                    isWeekEnd ? 'week-range-end' : ''
                  ].join(' ')}
                  onClick={() => {
                    // select the full week that contains the clicked day
                    const ws = getWeekStart(dt);
                    const we = new Date(ws); we.setDate(ws.getDate() + 6);
                    setCurrentDate(ws);
                    setDateRange({ start: ws, end: we });
                    if (typeof fetchEmployees === 'function') fetchEmployees(ws);
                    setShowCalendar(false);
                    setHoverWeekStart(null);
                  }}
                  onMouseEnter={() => {
                    // preview week on hover
                    const ws = getWeekStart(dt);
                    setHoverWeekStart(ws);
                  }}
                  onMouseLeave={() => setHoverWeekStart(null)}
                >
                  <div className="day-number">{dt.getDate()}</div>
                </button>
              );
            });
          })()}
        </div>
      </div>
    </div>
  </div>
)}
        { /* Render ShiftEditorModal */ }
<ShiftEditorModal
  isOpen={showShiftEditor}
  onClose={handleCancelShift}
  editingShift={editingShift}
  handleSaveShift={handleSaveShift}
  handleDeleteShift={handleDeleteShift}
  savingShift={savingShift}
  error={shiftEditorError}
/>
<EmployeeEditModal
  isOpen={showEmployeeEdit}
  onClose={() => { setShowEmployeeEdit(false); setEditingEmployee(null); }}
  employee={editingEmployee}
  onSave={saveEmployeeSchedule}
/>
      </div>
    );    };
    
    
export default ShiftScheduler;