export const hasShiftOnDate = (employee, date) => {
  // If employee has no shifts defined, assume available (or handle as needed)
  if (!employee) return false;
  if (!employee.shifts) return true; // Default to true if no shifts data to avoid locking UI
  
  // Convert date to local YYYY-MM-DD string for comparison
  const dateStr = date instanceof Date 
    ? date.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    : new Date(date).toLocaleDateString('en-CA');

  // Check specific date shifts first
  if (employee.shifts.specific && employee.shifts.specific[dateStr]) {
    return true;
  }

  // Check weekly recurring shifts
  const dayName = date instanceof Date 
    ? date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    : new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  if (employee.shifts.weekly && employee.shifts.weekly[dayName]) {
    return true;
  }

  return false;
};

export const getEmployeeShiftHours = (employee, date) => {
  if (!employee) return null;
  if (!employee.shifts) {
    // Default shift 9-5 if no data, or return null? 
    // Returning null causes "no-shift" class. 
    // Let's return a default shift to allow testing.
    return [{ startTime: '09:00', endTime: '17:00' }];
  }

  const dateStr = date instanceof Date 
    ? date.toLocaleDateString('en-CA')
    : new Date(date).toLocaleDateString('en-CA');

  // Specific date override
  if (employee.shifts.specific && employee.shifts.specific[dateStr]) {
    return employee.shifts.specific[dateStr];
  }

  // Weekly schedule
  const dayName = date instanceof Date 
    ? date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    : new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  if (employee.shifts.weekly && employee.shifts.weekly[dayName]) {
    return employee.shifts.weekly[dayName];
  }

  return null;
};
