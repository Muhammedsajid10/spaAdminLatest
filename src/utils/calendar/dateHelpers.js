/**
 * Date Helper Functions
 * Pure functions for date manipulation and formatting
 */

/**
 * Format date to local string (YYYY-MM-DD)
 */
export const formatDateLocal = (date) => {
  try {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('formatDateLocal error:', error, 'date:', date);
    return '';
  }
};

/**
 * Get local date key for comparison
 */
export const localDateKey = (date) => {
  return formatDateLocal(date);
};

export const getDatePickerCalendarDays = (month) => {
  if (!month) {
    month = new Date();
  }
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
    const prevMonthDay = new Date(year, monthIndex, 1 - i);
    days.push({
      date: prevMonthDay,
      day: prevMonthDay.getDate(),
      isCurrentMonth: false,
      isToday: false
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const currentDay = new Date(year, monthIndex, day);
    days.push({
      date: currentDay,
      day: day,
      isCurrentMonth: true,
      isToday: formatDateLocal(currentDay) === formatDateLocal(today)
    });
  }

  for (let i = 1; i <= endPadding; i++) {
    const nextMonthDay = new Date(year, monthIndex + 1, i);
    days.push({
      date: nextMonthDay,
      day: nextMonthDay.getDate(),
      isCurrentMonth: false,
      isToday: false
    });
  }

  return days;
};

export const getWeeksInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let currentWeekStart = new Date(firstDay);
  const dayOfWeek = (firstDay.getDay() + 6) % 7;
  currentWeekStart.setDate(firstDay.getDate() - dayOfWeek);

  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    weeks.push({
      startDate: new Date(currentWeekStart),
      endDate: new Date(weekEnd),
      weekNumber: weeks.length + 1,
      isCurrentWeek: todayStart >= currentWeekStart && todayStart <= weekEnd
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

export const getMonthsInYear = (year) => {
  const months = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (let i = 0; i < 12; i++) {
    months.push({
      month: i,
      year: year,
      name: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'long' }),
      isCurrentMonth: i === currentMonth && year === currentYear
    });
  }

  return months;
};

export const getCalendarDays = (currentDate, currentView) => {
  const days = [];
  
  if (currentView === 'Week') {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(currentDate.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
  }

  return days;
};

export const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
