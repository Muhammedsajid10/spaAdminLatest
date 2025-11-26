/**
 * Consolidated Date Utilities
 * Central source of truth for all date-related operations
 */

/**
 * Format date to YYYY-MM-DD string
 * @param {Date|string} d - Date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateLocal = (d) => {
  if (!(d instanceof Date)) d = new Date(d);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Get local date key for indexing appointments
 * @param {Date|string} date - Date
 * @returns {string} Date key in YYYY-MM-DD format
 */
export const localDateKey = (date) => formatDateLocal(date instanceof Date ? date : new Date(date));

/**
 * Get day name (lowercase)
 * @param {Date|string} date - Date
 * @returns {string} Day name (e.g., 'monday')
 */
export const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[(date instanceof Date ? date : new Date(date)).getDay()];
};

/**
 * Format UTC string to local time
 * @param {string} utcString - UTC date string
 * @param {object} opts - Intl.DateTimeFormat options
 * @returns {string} Formatted local time
 */
export const formatUTCToLocal = (utcString, opts = {}) => {
  if (!utcString) return '';
  const dt = new Date(utcString);
  return dt.toLocaleString(undefined, opts);
};

/**
 * Get calendar days for date picker (including padding)
 * @param {Date} month - Month to get days for
 * @returns {Array} Array of day objects
 */
export const getDatePickerCalendarDays = (month) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startPadding = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((totalDays + startPadding) / 7) * 7;
  const endPadding = totalCells - (totalDays + startPadding);
  const days = [];
  const today = new Date();

  for (let i = startPadding; i > 0; i--) {
    const d = new Date(year, monthIndex, 1 - i);
    days.push({ date: d, currentMonth: false, today: formatDateLocal(d) === formatDateLocal(today), label: d.getDate() });
  }

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    days.push({ date: d, currentMonth: true, today: formatDateLocal(d) === formatDateLocal(today), label: d.getDate() });
  }

  for (let i = 1; i <= endPadding; i++) {
    const d = new Date(year, monthIndex + 1, i);
    days.push({ date: d, currentMonth: false, today: formatDateLocal(d) === formatDateLocal(today), label: d.getDate() });
  }

  return days;
};

/**
 * Get weeks in a month for week picker
 * @param {Date} date - Date in the month
 * @returns {Array} Array of week objects
 */
export const getWeeksInMonth = (date) => {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const weeks = [];
  const current = new Date(firstDay);
  const dayOfWeek = (firstDay.getDay() + 6) % 7;
  current.setDate(firstDay.getDate() - dayOfWeek);

  while (current <= lastDay) {
    const weekEnd = new Date(current);
    weekEnd.setDate(current.getDate() + 6);
    weeks.push({ 
      startDate: new Date(current), 
      endDate: weekEnd, 
      weekNumber: weeks.length + 1, 
      isCurrentWeek: formatDateLocal(new Date()) >= formatDateLocal(current) && formatDateLocal(new Date()) <= formatDateLocal(weekEnd) 
    });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

/**
 * Get months in a year for year picker
 * @param {number} year - Year
 * @returns {Array} Array of month objects
 */
export const getMonthsInYear = (year) => {
  const months = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  for (let i = 0; i < 12; i++) {
    const date = new Date(year, i, 1);
    months.push({
      month: i + 1,
      year,
      label: date.toLocaleString(undefined, { month: 'long' }),
      current: year === currentYear && i === currentMonth
    });
  }
  return months;
};

/**
 * Compute appointment layout positioning
 * @param {object} appointment - Appointment with startTime, endTime, durationMinutes
 * @param {string|Array} timeSlotsOrFirstVisible - Reference time or array of slots
 * @param {number} slotInterval - Slot interval in minutes (default 30)
 * @param {number} slotHeightPx - Slot height in pixels (default 80)
 * @returns {object} Layout data with topPx, heightPx, etc.
 */
export const computeAppointmentLayout = (
  { startTime, endTime, durationMinutes },
  timeSlotsOrFirstVisible = '00:00',
  slotInterval = 30,
  slotHeightPx = 80
) => {
  const parseHM = (t = '00:00') => {
    if (!t) return 0;
    if (typeof t !== 'string') return 0;
    if (t.includes('T') || t.includes('-') || t.endsWith('Z')) {
      const d = new Date(t);
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
    const [hh = '0', mm = '0'] = t.split(':');
    return (Number(hh) || 0) * 60 + (Number(mm) || 0);
  };
  const minutesToLabel = (mins) => { 
    mins = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60); 
    const h = Math.floor(mins / 60).toString().padStart(2, '0'); 
    const m = (mins % 60).toString().padStart(2, '0'); 
    return `${h}:${m}`; 
  };
  const startM = parseHM(startTime);
  let endM = endTime ? parseHM(endTime) : startM + (Number(durationMinutes) || slotInterval);
  if (endM <= startM) endM = startM + (Number(durationMinutes) || slotInterval);
  const durationMins = Math.max(1, endM - startM);
  let refM;
  if (Array.isArray(timeSlotsOrFirstVisible)) {
    const slotMs = timeSlotsOrFirstVisible.map(s => parseHM(s)).filter(Number.isFinite).sort((a, b) => a - b);
    const candidate = slotMs.slice().reverse().find(m => m <= startM);
    refM = (typeof candidate === 'number') ? candidate : (slotMs.length ? slotMs[0] : 0);
  } else refM = parseHM(timeSlotsOrFirstVisible || '00:00');
  if (!Number.isFinite(refM)) refM = 0;
  const topPx = Math.max(0, ((startM - refM) / slotInterval) * slotHeightPx);
  const proportionalHeight = (durationMins / slotInterval) * slotHeightPx;
  const heightPx = Math.max(proportionalHeight, slotHeightPx * 0.5);
  const coveredSlots = [];
  for (let s = startM; s < endM; s += slotInterval) { 
    if (s >= startM && s < endM) coveredSlots.push(minutesToLabel(s)); 
  }
  return { topPx, heightPx, durationMins, startLabel: minutesToLabel(startM), endLabel: minutesToLabel(endM), coveredSlots };
};

export default {
  formatDateLocal,
  localDateKey,
  getDayName,
  formatUTCToLocal,
  getDatePickerCalendarDays,
  getWeeksInMonth,
  getMonthsInYear,
  computeAppointmentLayout,
};
