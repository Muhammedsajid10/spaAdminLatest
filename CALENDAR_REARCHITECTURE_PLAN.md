# Calendar Re-Architecture Plan

## 🎯 Goal
Transform the monolithic 5,043-line `Selectcalander.jsx` into a well-structured, maintainable calendar system with clear separation of concerns.

---

## 📐 New Architecture Design

### Separation of Concerns Principles

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  (React Components - UI only, no business logic)        │
├─────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                  │
│  (Custom Hooks - state management, side effects)        │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                            │
│  (Redux Store - global state, API calls)                │
├─────────────────────────────────────────────────────────┤
│                    UTILITY LAYER                         │
│  (Pure Functions - calculations, formatting)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Proposed Directory Structure

```
src/
├── features/
│   └── calendar/
│       ├── components/              # Presentation Layer
│       │   ├── Calendar/
│       │   │   ├── Calendar.jsx              # Main container (smart)
│       │   │   ├── Calendar.module.css
│       │   │   └── index.js
│       │   │
│       │   ├── CalendarHeader/
│       │   │   ├── CalendarHeader.jsx        # Date navigation, view selector
│       │   │   ├── CalendarHeader.module.css
│       │   │   ├── DateNavigator.jsx         # Previous/Next/Today buttons
│       │   │   ├── ViewSelector.jsx          # Day/Week/Month toggle
│       │   │   └── index.js
│       │   │
│       │   ├── CalendarToolbar/
│       │   │   ├── CalendarToolbar.jsx       # Filters and actions
│       │   │   ├── EmployeeFilter.jsx        # Employee selection
│       │   │   ├── QuickActions.jsx          # Add appointment button
│       │   │   └── index.js
│       │   │
│       │   ├── CalendarGrid/
│       │   │   ├── CalendarGrid.jsx          # Grid container
│       │   │   ├── CalendarGrid.module.css
│       │   │   ├── WeekView/
│       │   │   │   ├── WeekView.jsx
│       │   │   │   ├── WeekHeader.jsx        # Day labels
│       │   │   │   ├── TimeColumn.jsx        # Time labels (8:00, 8:30...)
│       │   │   │   ├── EmployeeColumn.jsx    # One employee's schedule
│       │   │   │   ├── TimeSlot.jsx          # Individual clickable slot
│       │   │   │   └── AppointmentCard.jsx   # Booked appointment
│       │   │   │
│       │   │   ├── MonthView/
│       │   │   │   ├── MonthView.jsx
│       │   │   │   ├── MonthHeader.jsx       # Month name, year
│       │   │   │   ├── WeekRow.jsx           # One week
│       │   │   │   └── DayCell.jsx           # One day cell
│       │   │   │
│       │   │   └── index.js
│       │   │
│       │   ├── BookingFlow/
│       │   │   ├── BookingModal.jsx          # Modal container
│       │   │   ├── BookingModal.module.css
│       │   │   ├── steps/
│       │   │   │   ├── ServiceSelection.jsx  # Step 1
│       │   │   │   ├── ProfessionalSelection.jsx # Step 2
│       │   │   │   ├── TimeSlotSelection.jsx # Step 3
│       │   │   │   ├── ClientSelection.jsx   # Step 4
│       │   │   │   └── PaymentDetails.jsx    # Step 5
│       │   │   │
│       │   │   ├── StepIndicator.jsx         # Progress dots
│       │   │   ├── StepNavigation.jsx        # Back/Next buttons
│       │   │   └── index.js
│       │   │
│       │   ├── SessionSidebar/
│       │   │   ├── SessionSidebar.jsx        # Multiple appointments panel
│       │   │   ├── SessionSidebar.module.css
│       │   │   ├── AppointmentSummary.jsx    # One appointment in session
│       │   │   └── index.js
│       │   │
│       │   └── shared/                       # Shared UI components
│       │       ├── AppointmentCard.jsx
│       │       ├── TimeSlotButton.jsx
│       │       ├── EmployeeAvatar.jsx
│       │       └── LoadingState.jsx
│       │
│       ├── hooks/                   # Business Logic Layer
│       │   ├── useCalendar.js               # Main calendar logic
│       │   ├── useDateNavigation.js         # Date state & navigation
│       │   ├── useViewMode.js               # View switching (day/week/month)
│       │   ├── useEmployeeFilter.js         # Employee filtering
│       │   ├── useTimeSlots.js              # Time slot generation
│       │   ├── useAvailability.js           # Availability checking
│       │   ├── useBookingFlow.js            # Booking modal state
│       │   ├── useBookingSession.js         # Multiple appointments
│       │   ├── useAppointmentActions.js     # CRUD operations
│       │   └── index.js
│       │
│       ├── store/                   # Data Layer (Redux)
│       │   ├── calendarSlice.js             # Calendar state
│       │   ├── appointmentsSlice.js         # Appointments data
│       │   ├── employeesSlice.js            # Employees data
│       │   ├── servicesSlice.js             # Services data
│       │   ├── clientsSlice.js              # Clients data
│       │   ├── bookingSessionSlice.js       # Session state
│       │   ├── thunks.js                    # Async actions
│       │   └── index.js
│       │
│       ├── utils/                   # Utility Layer
│       │   ├── time/
│       │   │   ├── timeConversion.js        # Time ↔ minutes
│       │   │   ├── timeFormatting.js        # Display formatting
│       │   │   ├── timeCalculation.js       # Add/subtract time
│       │   │   └── index.js
│       │   │
│       │   ├── date/
│       │   │   ├── dateFormatting.js        # Date display
│       │   │   ├── dateCalculation.js       # Add/subtract days
│       │   │   ├── dateComparison.js        # Before/after checks
│       │   │   └── index.js
│       │   │
│       │   ├── slots/
│       │   │   ├── slotGeneration.js        # Generate time slots
│       │   │   ├── slotFiltering.js         # Filter available slots
│       │   │   ├── slotValidation.js        # Validate slot availability
│       │   │   └── index.js
│       │   │
│       │   ├── availability/
│       │   │   ├── checkAvailability.js     # Main availability logic
│       │   │   ├── conflictDetection.js     # Detect booking conflicts
│       │   │   ├── shiftValidation.js       # Check employee shifts
│       │   │   └── index.js
│       │   │
│       │   ├── appointments/
│       │   │   ├── appointmentFormatting.js # Format for display
│       │   │   ├── appointmentCalculations.js # Duration, pricing
│       │   │   ├── appointmentValidation.js # Validate booking data
│       │   │   └── index.js
│       │   │
│       │   └── index.js
│       │
│       ├── api/                     # API Layer
│       │   ├── appointmentsApi.js           # Appointment endpoints
│       │   ├── employeesApi.js              # Employee endpoints
│       │   ├── servicesApi.js               # Service endpoints
│       │   ├── clientsApi.js                # Client endpoints
│       │   └── index.js
│       │
│       ├── types/                   # TypeScript/JSDoc types
│       │   ├── appointment.types.js
│       │   ├── employee.types.js
│       │   ├── service.types.js
│       │   └── index.js
│       │
│       └── constants/               # Constants
│           ├── timeConstants.js             # Time intervals, limits
│           ├── viewModes.js                 # View mode enums
│           └── index.js
│
└── styles/
    └── calendar/
        ├── tokens.css                       # Design tokens (colors, spacing)
        ├── calendar-base.css                # Base calendar styles
        └── calendar-animations.css          # Transitions, animations
```

---

## 🔧 Component Responsibilities

### 1. Presentation Layer (Components)

**Rule:** Components only handle UI rendering and user interactions. No business logic.

#### **Calendar.jsx** (Main Container)
```javascript
// Responsibilities:
// - Compose all child components
// - Pass data from hooks to children
// - Handle layout

import { useCalendar } from '../hooks/useCalendar';

export const Calendar = () => {
  const {
    currentDate,
    viewMode,
    selectedEmployees,
    appointments,
    // ... all state from custom hook
  } = useCalendar();

  return (
    <div className={styles.calendar}>
      <CalendarHeader />
      <CalendarToolbar />
      <CalendarGrid />
      <SessionSidebar />
      <BookingModal />
    </div>
  );
};
```

#### **CalendarHeader.jsx**
```javascript
// Responsibilities:
// - Display current date/range
// - Render navigation buttons
// - Render view selector
// - NO date calculation logic

export const CalendarHeader = ({ currentDate, onDateChange, viewMode, onViewChange }) => {
  return (
    <header className={styles.header}>
      <DateNavigator currentDate={currentDate} onDateChange={onDateChange} />
      <ViewSelector viewMode={viewMode} onViewChange={onViewChange} />
    </header>
  );
};
```

#### **TimeSlot.jsx** (Dumb Component)
```javascript
// Responsibilities:
// - Render a single time slot
// - Show available/unavailable state
// - Handle click event
// - NO availability checking logic

export const TimeSlot = ({ time, isAvailable, onClick, isSelected }) => {
  return (
    <button
      className={cn(styles.slot, {
        [styles.available]: isAvailable,
        [styles.selected]: isSelected,
      })}
      onClick={() => onClick(time)}
      disabled={!isAvailable}
    >
      {time}
    </button>
  );
};
```

---

### 2. Business Logic Layer (Hooks)

**Rule:** Hooks manage state, side effects, and business logic. Return data and callbacks.

#### **useCalendar.js** (Main Hook)
```javascript
// Responsibilities:
// - Orchestrate all other hooks
// - Provide unified API to Calendar component
// - Handle cross-cutting concerns

export const useCalendar = () => {
  const { currentDate, goToNext, goToPrevious, goToToday } = useDateNavigation();
  const { viewMode, setViewMode } = useViewMode();
  const { selectedEmployees, toggleEmployee } = useEmployeeFilter();
  const { timeSlots } = useTimeSlots(currentDate, selectedEmployees);
  const { checkAvailability } = useAvailability();
  const { appointments, loading } = useAppointments(currentDate);
  
  return {
    currentDate,
    goToNext,
    goToPrevious,
    goToToday,
    viewMode,
    setViewMode,
    selectedEmployees,
    toggleEmployee,
    timeSlots,
    checkAvailability,
    appointments,
    loading,
  };
};
```

#### **useDateNavigation.js**
```javascript
// Responsibilities:
// - Manage current date state
// - Provide navigation functions
// - Calculate date ranges for views

import { addDays, addWeeks, addMonths } from '../utils/date';

export const useDateNavigation = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const viewMode = useSelector(state => state.calendar.viewMode);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day': return addDays(prev, 1);
        case 'week': return addWeeks(prev, 1);
        case 'month': return addMonths(prev, 1);
        default: return prev;
      }
    });
  }, [viewMode]);

  const goToPrevious = useCallback(() => {
    // Similar logic
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return { currentDate, goToNext, goToPrevious, goToToday };
};
```

#### **useTimeSlots.js**
```javascript
// Responsibilities:
// - Generate time slots for employees
// - Filter by availability
// - Memoize expensive calculations

import { generateTimeSlots, filterAvailableSlots } from '../utils/slots';

export const useTimeSlots = (date, employees) => {
  const appointments = useSelector(state => state.appointments.data);
  
  const timeSlots = useMemo(() => {
    return employees.map(employee => ({
      employeeId: employee.id,
      slots: generateTimeSlots(employee, date),
    }));
  }, [date, employees]);

  const availableSlots = useMemo(() => {
    return filterAvailableSlots(timeSlots, appointments);
  }, [timeSlots, appointments]);

  return { timeSlots, availableSlots };
};
```

#### **useBookingFlow.js**
```javascript
// Responsibilities:
// - Manage booking modal state
// - Handle step navigation
// - Validate each step
// - Accumulate booking data

export const useBookingFlow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: null,
    professional: null,
    timeSlot: null,
    client: null,
    payment: null,
  });

  const goToNextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, bookingData]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const updateBookingData = useCallback((step, data) => {
    setBookingData(prev => ({ ...prev, [step]: data }));
  }, []);

  return {
    isOpen,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    currentStep,
    goToNextStep,
    goToPreviousStep,
    bookingData,
    updateBookingData,
  };
};
```

---

### 3. Utility Layer (Pure Functions)

**Rule:** Pure functions only. No side effects, no state, no API calls.

#### **utils/time/timeConversion.js**
```javascript
/**
 * Converts time string to minutes since midnight
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {number} Minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in "HH:MM" format
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
```

#### **utils/slots/slotGeneration.js**
```javascript
import { timeToMinutes, minutesToTime } from '../time/timeConversion';

/**
 * Generates time slots between start and end times
 * @param {string} startTime - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 * @param {number} interval - Interval in minutes
 * @returns {Array<string>} Array of time slots
 */
export const generateTimeSlots = (startTime, endTime, interval = 30) => {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current < end) {
    slots.push(minutesToTime(current));
    current += interval;
  }

  return slots;
};

/**
 * Generates time slots from employee shift data
 * @param {Object} employee - Employee with shift data
 * @param {Date} date - Target date
 * @param {number} serviceDuration - Service duration in minutes
 * @returns {Array<Object>} Array of slot objects
 */
export const generateSlotsFromShift = (employee, date, serviceDuration) => {
  const shifts = getEmployeeShifts(employee, date);
  const allSlots = [];

  shifts.forEach(shift => {
    const slots = generateTimeSlots(shift.startTime, shift.endTime, serviceDuration);
    allSlots.push(...slots.map(time => ({
      time,
      employeeId: employee.id,
      available: true,
    })));
  });

  return allSlots;
};
```

#### **utils/availability/conflictDetection.js**
```javascript
import { timeToMinutes } from '../time/timeConversion';

/**
 * Checks if two time ranges overlap
 * @param {Object} range1 - { start: "HH:MM", end: "HH:MM" }
 * @param {Object} range2 - { start: "HH:MM", end: "HH:MM" }
 * @returns {boolean} True if ranges overlap
 */
export const doRangesOverlap = (range1, range2) => {
  const start1 = timeToMinutes(range1.start);
  const end1 = timeToMinutes(range1.end);
  const start2 = timeToMinutes(range2.start);
  const end2 = timeToMinutes(range2.end);

  return start1 < end2 && end1 > start2;
};

/**
 * Detects if a time slot conflicts with existing appointments
 * @param {string} slotTime - Time slot to check
 * @param {number} duration - Service duration
 * @param {Array<Object>} appointments - Existing appointments
 * @returns {Object|null} Conflicting appointment or null
 */
export const detectSlotConflict = (slotTime, duration, appointments) => {
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + duration;

  return appointments.find(apt => {
    const aptStart = timeToMinutes(apt.startTime);
    const aptEnd = timeToMinutes(apt.endTime);
    return slotStart < aptEnd && slotEnd > aptStart;
  });
};
```

---

## 📋 Migration Strategy

### Phase 1: Set Up Structure (Week 1)

#### Day 1-2: Create Directory Structure
```bash
# Create all directories
mkdir -p src/features/calendar/{components,hooks,store,utils,api,types,constants}
mkdir -p src/features/calendar/components/{Calendar,CalendarHeader,CalendarToolbar,CalendarGrid,BookingFlow,SessionSidebar,shared}
mkdir -p src/features/calendar/utils/{time,date,slots,availability,appointments}
```

#### Day 3-5: Extract Utilities
1. Create all utility files
2. Copy functions from `selectCalendarHelpers.js`
3. Remove duplicates
4. Write tests for each utility
5. Export from index files

---

### Phase 2: Create Hooks (Week 2)

#### Day 1-2: Date & View Hooks
- Implement `useDateNavigation.js`
- Implement `useViewMode.js`
- Test with simple component

#### Day 3-4: Slot & Availability Hooks
- Implement `useTimeSlots.js`
- Implement `useAvailability.js`
- Use new utilities

#### Day 5: Booking Flow Hook
- Implement `useBookingFlow.js`
- Implement `useBookingSession.js`

---

### Phase 3: Build Components (Week 3-4)

#### Week 3: Grid Components
- Build `CalendarGrid` container
- Build `WeekView` and sub-components
- Build `MonthView` and sub-components
- Use hooks for data

#### Week 4: Booking Components
- Build `BookingModal` container
- Build all step components
- Wire up `useBookingFlow`

---

### Phase 4: Integration (Week 5)

#### Day 1-3: Connect Everything
- Build main `Calendar.jsx`
- Integrate all components
- Connect to Redux store

#### Day 4-5: Testing & Refinement
- Test all user flows
- Fix bugs
- Performance optimization

---

## ✅ Success Criteria

### Code Quality
- [ ] No component >300 lines
- [ ] No function >50 lines
- [ ] All utilities are pure functions
- [ ] 90%+ test coverage

### Architecture
- [ ] Clear separation of concerns
- [ ] No business logic in components
- [ ] No UI logic in hooks
- [ ] No duplicate code

### Performance
- [ ] Initial render <100ms
- [ ] Smooth 60fps scrolling
- [ ] No unnecessary re-renders

---

## 📊 Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main file size | 5,043 lines | <300 lines | 94% reduction |
| Largest component | 5,043 lines | <300 lines | Component-based |
| Duplicate code | ~425 lines | 0 lines | 100% removed |
| Test coverage | 0% | 90%+ | Full coverage |
| Utility files | 1 (361 lines) | 15+ (modular) | Better organization |

---

**Next Step:** Start with Phase 1, Day 1 - Create directory structure and set up utilities.
