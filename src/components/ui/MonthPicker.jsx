import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import './MonthPicker.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthPicker = ({ 
  value, 
  onChange, 
  className = '',
  showPresets = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [draftRange, setDraftRange] = useState(value ?? {});

  useEffect(() => {
    setDraftRange(value ?? {});
  }, [value, isOpen]);

  const secondMonthDate = useMemo(() => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [viewDate]);

  // Preset date ranges
  const presets = [
    {
      label: 'Month to date',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: formatISO(start),
          end: formatISO(now)
        };
      }
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
          start: formatISO(start),
          end: formatISO(end)
        };
      }
    },
    {
      label: 'Last 6 months',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);
        return {
          start: formatISO(start),
          end: formatISO(end)
        };
      }
    }
  ];

  const formatDateRange = (range) => {
    if (!range?.start || !range?.end) return 'Select date range';

    const startDate = new Date(range.start);
    const endDate = new Date(range.end);

    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const fmt = (date, opts) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...opts });

    return sameYear
      ? `${fmt(startDate)} - ${fmt(endDate)}`
      : `${fmt(startDate, { year: 'numeric' })} - ${fmt(endDate, { year: 'numeric' })}`;
  };

  const handlePresetClick = (preset) => {
    const range = preset.getValue();
    setDraftRange(range);
    onChange?.(range);
    setIsOpen(false);
  };

  const addMonths = (date, count) => {
    const next = new Date(date);
    next.setDate(1);
    next.setMonth(next.getMonth() + count);
    return next;
  };

  const buildMonthDays = (monthDate) => {
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const startOffset = startOfMonth.getDay();

    const totalDays = startOffset + endOfMonth.getDate();
    const weeks = Math.ceil(totalDays / 7);
    const cells = weeks * 7;

    const days = [];

    for (let i = 0; i < cells; i++) {
      const dayNumber = i - startOffset + 1;
      const isCurrentMonth = dayNumber >= 1 && dayNumber <= endOfMonth.getDate();

      const date = isCurrentMonth
        ? new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNumber)
        : null;

      days.push({
        key: `${monthDate.getFullYear()}-${monthDate.getMonth()}-${i}`,
        label: isCurrentMonth ? dayNumber : '',
        date,
        isCurrentMonth
      });
    }

    return days;
  };

  const isSameDay = (dateA, dateB) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const formatISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayClass = (day) => {
    if (!day.isCurrentMonth || !day.date) return 'month-picker__day--disabled';

    const dayISO = formatISO(day.date);
    const startISO = draftRange?.start ?? null;
    const endISO = draftRange?.end ?? null;
    const hasStart = Boolean(startISO);
    const hasEnd = Boolean(endISO);
    const isSingleDay = hasStart && hasEnd && startISO === endISO;

    const classes = ['month-picker__day--clickable'];

    if (hasStart && hasEnd && dayISO > startISO && dayISO < endISO) {
      classes.push('month-picker__day--in-range');
    }

    if (hasStart && dayISO === startISO) {
      classes.push('month-picker__day--selected', 'month-picker__day--range-start');
      if (!hasEnd || isSingleDay) {
        classes.push('month-picker__day--single');
      }
      if (hasStart && !hasEnd) {
        classes.push('month-picker__day--pending-end');
      }
    }

    if (hasEnd && dayISO === endISO) {
      classes.push('month-picker__day--selected', 'month-picker__day--range-end');
      if (isSingleDay) {
        classes.push('month-picker__day--single');
      }
    }

    return classes.join(' ');
  };

  const handleDaySelect = (date) => {
  if (!date) return;

  const iso = formatISO(date);

  // CASE 1: No start selected OR both start & end already set
  // → start a new range
  if (!draftRange.start || (draftRange.start && draftRange.end)) {
    setDraftRange({ start: iso, end: null });
    return;
  }

  // CASE 2: Start selected, no end yet
  // → set end, ensuring start <= end
  if (draftRange.start && !draftRange.end) {
    if (iso < draftRange.start) {
      // User clicked an earlier date → swap
      setDraftRange({ start: iso, end: draftRange.start });
    } else {
      setDraftRange({ start: draftRange.start, end: iso });
    }
  }
};

const handleApply = () => {
  if (draftRange?.start) {
    const finalRange = {
      start: draftRange.start,
      end: draftRange.end || draftRange.start
    };
    onChange?.(finalRange);
  }
  setIsOpen(false);
};


  const handleCancel = () => {
    setDraftRange(value ?? {});
    setIsOpen(false);
  };

  const renderCalendar = (monthDate, index) => (
    <div key={index} className="month-picker__calendar-single">
      <div className="month-picker__header">
        {index === 0 ? (
          <button
            type="button"
            className="month-picker__nav-btn"
            onClick={() => setViewDate(addMonths(viewDate, -1))}
          >
            <ChevronLeft size={16} />
          </button>
        ) : (
          <span className="month-picker__nav-spacer" />
        )}

        <div className="month-picker__month-year">
          {monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        {index === 1 ? (
          <button
            type="button"
            className="month-picker__nav-btn"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
          >
            <ChevronRight size={16} />
          </button>
        ) : (
          <span className="month-picker__nav-spacer" />
        )}
      </div>

      <div className="month-picker__weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="month-picker__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="month-picker__days">
        {buildMonthDays(monthDate).map((day) => (
          <button
            key={day.key}
            type="button"
            className={`month-picker__day ${getDayClass(day)}`}
            disabled={!day.isCurrentMonth}
            onClick={() => handleDaySelect(day.date)}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`month-picker ${className}`}>
      <Button
        variant="secondary"
        icon={<Calendar />}
        onClick={() => setIsOpen((prev) => !prev)}
        className="month-picker__trigger"
      >
        {formatDateRange(draftRange.start && draftRange.end ? draftRange : value)}
      </Button>

      {isOpen && (
        <div className="month-picker__dropdown">
      

          <div className="month-picker__calendar">
            <div className="month-picker__calendars">
              {renderCalendar(viewDate, 0)}
              {renderCalendar(secondMonthDate, 1)}
            </div>
          </div>

          <div className="month-picker__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;