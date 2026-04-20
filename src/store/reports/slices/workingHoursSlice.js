import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsAPI } from '@api/reportsApi';

const toISO = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatTime = (timeStr) => {
  if (!timeStr) return null;
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return null;
  }
};

const formatHours = (hours) => {
  if (typeof hours !== 'number') return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export const normalizeWorkingHoursData = (attendance, employeesMap = new Map()) => {
  // Handle employee field - resolve ID to name if needed
  let employeeName = 'Unknown';
  const originalEmployee = attendance.employee;
  
  if (typeof attendance.employee === 'string') {
    // Check if it's an ID (24 character hex string) or a name
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(attendance.employee);
    if (isObjectId && employeesMap.has(attendance.employee)) {
      employeeName = employeesMap.get(attendance.employee);
    } else {
      employeeName = attendance.employee;
      if (isObjectId) {}
    }
  } else if (attendance.employee?.name || attendance.employee?.fullName) {
    employeeName = attendance.employee.name || attendance.employee.fullName;
  }

  return {
    id: attendance._id,
    teamMember: employeeName,
    location: attendance.location || '',
    date: toISO(attendance.date),
    source: attendance.source || '',
    expectedStart: formatTime(attendance.expectedStart),
    clockIn: formatTime(attendance.clockIn?.time),
    clockInType: attendance.clockIn?.method || 'No Show',
    clockInDeviation: `${attendance.clockIn?.deviation || 0}m`,
    expectedEnd: formatTime(attendance.expectedEnd),
    clockOut: formatTime(attendance.clockOut?.time),
    clockOutType: attendance.clockOut?.method || 'No Show',
    clockOutDeviation: `${attendance.clockOut?.deviation || 0}m`,
    scheduledHours: formatHours(attendance.scheduledHours),
    workedHours: formatHours(attendance.workedHours),
    scheduledRaw: attendance.scheduledHours || 0,
    workedRaw: attendance.workedHours || 0,
    actualHours: attendance.actualHours || 0,
    totalPaidHours: attendance.totalPaidHours || 0,
    overtimeHours: attendance.overtimeHours || 0,
    status: attendance.status || '',
    isLate: attendance.isLate || false,
    lateMinutes: attendance.lateMinutes || 0,
    isEarlyLeave: attendance.isEarlyLeave || false,
    earlyLeaveMinutes: attendance.earlyLeaveMinutes || 0,
    productivity: {
      bookingsHandled: attendance.productivity?.bookingsHandled || 0,
      revenue: attendance.productivity?.revenue || 0,
      tasksCompleted: attendance.productivity?.tasksCompleted || 0
    },
    createdAt: toISO(attendance.createdAt),
    updatedAt: toISO(attendance.updatedAt)
  };
};

export const buildWorkingHoursData = (rows = [], dateRange = null) => {
  // Filter by date range if provided
  let filteredRows = rows;
  if (dateRange?.start && dateRange?.end) {
    filteredRows = rows.filter((item) => {
      if (!item?.date) return false;
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      return localDateStr >= dateRange.start && localDateStr <= dateRange.end;
    });
  }

  // Sort by date (newest first) and then by team member
  return filteredRows.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB - dateA; // Newest first
    }
    return a.teamMember.localeCompare(b.teamMember);
  });
};

export const fetchWorkingHoursActivity = createAsyncThunk(
  'workingHours/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch both attendance data and employees
      const [attendanceResponse, employeesResponse] = await Promise.all([
        ReportsAPI.getWorkingHoursActivity({ all: true }),
        ReportsAPI.getEmployees()
      ]);

      const attendanceData = attendanceResponse?.data ?? [];
      const employees = employeesResponse?.data?.employees ?? [];

      // Create a map of employee ID to full name
      const employeesMap = new Map();
      employees.forEach(emp => {
        if (emp._id || emp.id) {
          const id = emp._id || emp.id;
          const name = emp.user?.fullName || `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || emp.user?.firstName || 'Unknown';
          employeesMap.set(id, name);
        }
      });

      const attendanceEmployeeIds = new Set();
      const matchedIds = new Set();
      const unmatchedIds = new Set();

      attendanceData.forEach(attendance => {
        const employeeId = attendance.employee;
        attendanceEmployeeIds.add(employeeId);
        
        if (typeof employeeId === 'string' && /^[0-9a-fA-F]{24}$/.test(employeeId)) {
          // This is an ObjectId
          if (employeesMap.has(employeeId)) {
            matchedIds.add(employeeId);
          } else {
            unmatchedIds.add(employeeId);
          }
        } else {}
      });

      // Normalize all attendance data with employee name resolution
      const normalized = attendanceData.map(attendance => 
        normalizeWorkingHoursData(attendance, employeesMap)
      );

      return normalized;
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Failed to load working hours data';
      return rejectWithValue(message);
    }
  }
);

const workingHoursSlice = createSlice({
  name: 'workingHours',
  initialState: {
    rawItems: [], // Store normalized raw data
    status: 'idle',
    error: null,
    fetchedAt: null
  },
  reducers: {
    clearWorkingHours: (state) => {
      state.rawItems = [];
      state.status = 'idle';
      state.error = null;
      state.fetchedAt = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkingHoursActivity.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWorkingHoursActivity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rawItems = action.payload ?? [];
        state.fetchedAt = Date.now();
      })
      .addCase(fetchWorkingHoursActivity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load working hours data';
        state.rawItems = [];
      });
  }
});

export const { clearWorkingHours } = workingHoursSlice.actions;
export default workingHoursSlice.reducer;