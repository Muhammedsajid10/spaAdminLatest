# Current Calendar Architecture - How It Works

## 🎯 Purpose
This document explains how the calendar system currently works, which files are connected, where code is duplicated, and which prepared files exist but are not being used.

---

## 📍 What's Actually Running in Production

### Primary Calendar: `Selectcalander.jsx`
**Location:** `src/Clientsidepage/Selectcalander.jsx`  
**Size:** 5,043 lines  
**Status:** ✅ **ACTIVE - This is what users see**

This is the monolithic calendar component that handles everything:
- Calendar grid rendering (week/month views)
- Booking modal with multi-step flow
- Time slot generation and availability checking
- Appointment management
- Session handling for multiple appointments
- Employee filtering
- Date navigation

---

## 🔗 How Files Are Connected

### 1. Main Calendar Component Flow

```
User Opens Calendar
        ↓
Selectcalander.jsx (5,043 lines)
        ↓
    ┌───┴───┐
    ↓       ↓
Redux Store    Helper Functions
    ↓              ↓
calendarSlice   selectCalendarHelpers.js
bookingSessionSlice
employeesSlice
```

### 2. File Dependencies

#### **Selectcalander.jsx** imports from:

**Redux State:**
```javascript
// From src/store/
import { calendarSlice } from '../store/calendarSlice'
import { bookingSessionSlice } from '../store/bookingSessionSlice'
import { employeesSlice } from '../store/employeesSlice'
```

**Helper Functions:**
```javascript
// From src/Clientsidepage/helpers/
import {
  generateTimeSlots,
  generateTimeSlotsFromEmployeeShift,
  getValidTimeSlotsForProfessional,
  getAvailableProfessionalsForService,
  detectProfessionalConflict,
  // ... 15+ more functions
} from './helpers/selectCalendarHelpers'
```

**Calendar Utilities:**
```javascript
// From src/calendar/
import {
  getEmployeeShiftHours,
  hasShiftOnDate,
  localDateKey,
  formatDateLocal
} from '../calendar'
```

**Styling:**
```javascript
import './Selectcalander.css'  // 1000+ lines of CSS
```

---

## 🔄 Code Duplication Map

### Where the Same Logic Exists Multiple Times

#### 1. **Time Slot Generation** (3 places)

**Location A:** `Selectcalander.jsx` (lines 1233-1298)
```javascript
// Inline function inside component
const filterOutBookedTimeSlots = (timeSlots, employeeId, date) => {
  // 65 lines of logic
}
```

**Location B:** `selectCalendarHelpers.js` (lines 11-30)
```javascript
export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  // 19 lines of logic
}
```

**Location C:** `selectCalendarHelpers.js` (lines 65-116)
```javascript
export const generateTimeSlotsFromEmployeeShift = (employee, date, serviceDuration, intervalMinutes) => {
  // 51 lines of logic
}
```

**Problem:** Same functionality, different implementations, inconsistent behavior

---

#### 2. **Availability Checking** (3 places)

**Location A:** `Selectcalander.jsx` (lines 965-991)
```javascript
const isTimeSlotUnavailable = (employeeId, slotTime) => {
  // Checks if slot is booked
}
```

**Location B:** `selectCalendarHelpers.js` (lines 123-172)
```javascript
export const getValidTimeSlotsForProfessional = (employee, date, serviceDuration, appointments) => {
  // 49 lines checking availability
}
```

**Location C:** `Selectcalander.jsx` (lines 993-1028)
```javascript
const isProfessionalUnavailableInSession = (professionalId, timeSlot, date, serviceDuration) => {
  // 35 lines checking session conflicts
}
```

**Problem:** Three different ways to check the same thing

---

#### 3. **Date/Time Utilities** (4 places)

**Location A:** `selectCalendarHelpers.js` (lines 184-195)
```javascript
export const addMinutesToTime = (timeStr, minutes) => { ... }
export const timeToMinutes = (timeStr) => { ... }
```

**Location B:** `Selectcalander.jsx` (inline throughout)
```javascript
// Scattered inline calculations like:
const [hours, mins] = timeStr.split(':').map(Number);
const totalMinutes = hours * 60 + mins;
```

**Location C:** `src/calendar/` (separate implementation)
```javascript
export const localDateKey = (date) => { ... }
export const formatDateLocal = (date) => { ... }
```

**Location D:** `selectCalendarHelpers.js` (lines 118-121)
```javascript
const toMinutes = (timeStr = '00:00') => {
  // Duplicate of timeToMinutes but slightly different
}
```

**Problem:** Same math, 4 different implementations

---

## 📦 Prepared But Unused Files

### Files Created for Refactoring But Not Connected

#### 1. **Modular Components** (Not Used)
**Location:** `src/components/SelectCalendar/`

```
SelectCalendar/
├── SelectCalendar.jsx          ❌ Placeholder only (19 lines)
├── BookingFlow/
│   └── BookingFlow.jsx         ❌ Placeholder only (11 lines)
├── CalendarGrid/
│   └── CalendarGrid.jsx        ❌ Empty placeholder
├── CalendarHeader/
│   └── CalendarHeader.jsx      ❌ Empty placeholder
├── DateNavigator/
│   └── DateNavigator.jsx       ❌ Empty placeholder
├── SessionSidebar/
│   └── SessionSidebar.jsx      ❌ Empty placeholder
└── StatusModals/
    └── StatusModals.jsx        ❌ Empty placeholder
```

**Status:** These were created as scaffolding but never implemented. The actual calendar still uses the monolithic `Selectcalander.jsx`.

---

#### 2. **Utility Placeholders** (Not Used)
**Location:** `src/components/SelectCalendar/utils/`

**File:** `appointmentUtils.js`
```javascript
// Placeholder for appointment helpers
export const appointmentUtils = {
  formatTimeSlot: (slot) => slot,  // Does nothing
};
```

**File:** `sessionHelpers.js`
```javascript
// Placeholder - not implemented
```

**Status:** Empty placeholders, not imported anywhere.

---

#### 3. **Custom Hooks** (Not Used)
**Location:** `src/hooks/calendar/`

**File:** `useAvailability.js`
```javascript
export const useAvailability = () => {
  const getValidTimeSlots = () => {
    // TODO: Reuse time slot logic from Selectcalander.jsx
    return [];  // Returns empty array
  };
  return { getValidTimeSlots };
};
```

**File:** `useBookingModalSteps.js`
```javascript
// Placeholder for booking flow state management
```

**File:** `useBookingSession.js`
```javascript
// Placeholder for session management
```

**File:** `useDateNavigator.js`
```javascript
// Placeholder for date navigation
```

**Status:** All are placeholders with TODO comments. None are imported by `Selectcalander.jsx`.

---

## 🗺️ Complete File Connection Map

### What's Actually Used

```
Production Calendar Flow:
┌─────────────────────────────────────┐
│   Selectcalander.jsx (5,043 lines)  │ ← Main component
└────────────┬────────────────────────┘
             │
    ┌────────┼────────┐
    ↓        ↓        ↓
┌─────────┐ ┌──────┐ ┌────────────────┐
│ Redux   │ │ CSS  │ │ Helpers        │
│ Store   │ │      │ │                │
├─────────┤ ├──────┤ ├────────────────┤
│calendar │ │Select│ │selectCalendar  │
│Slice    │ │calan │ │Helpers.js      │
│         │ │der.  │ │(361 lines)     │
│booking  │ │css   │ │                │
│Session  │ │      │ │+ calendar/     │
│Slice    │ │      │ │  utilities     │
│         │ │      │ │                │
│employees│ │      │ │                │
│Slice    │ │      │ │                │
└─────────┘ └──────┘ └────────────────┘
```

### What's NOT Used (Prepared but Disconnected)

```
Unused Prepared Files:
┌──────────────────────────────────┐
│ components/SelectCalendar/       │
│ ├── SelectCalendar.jsx (empty)   │
│ ├── BookingFlow/ (empty)         │
│ ├── CalendarGrid/ (empty)        │
│ ├── CalendarHeader/ (empty)      │
│ ├── DateNavigator/ (empty)       │
│ ├── SessionSidebar/ (empty)      │
│ └── utils/ (placeholders)        │
└──────────────────────────────────┘
         ↓
    NOT IMPORTED
         ↓
┌──────────────────────────────────┐
│ hooks/calendar/                  │
│ ├── useAvailability.js (empty)   │
│ ├── useBookingModalSteps.js      │
│ ├── useBookingSession.js         │
│ └── useDateNavigator.js          │
└──────────────────────────────────┘
```

---

## 🔍 Specific Duplication Examples

### Example 1: Time to Minutes Conversion

**Version 1** - `selectCalendarHelpers.js:192`
```javascript
export const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};
```

**Version 2** - `selectCalendarHelpers.js:118` (private function)
```javascript
const toMinutes = (timeStr = '00:00') => {
  const [h = '0', m = '0'] = timeStr.split(':');
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};
```

**Version 3** - `Selectcalander.jsx` (inline, multiple places)
```javascript
// Scattered throughout the file
const [hours, mins] = timeStr.split(':').map(Number);
const totalMinutes = hours * 60 + mins;
```

**Why This Matters:** Bug fixes need to be applied 3 times. Different edge case handling.

---

### Example 2: Conflict Detection

**Version 1** - `selectCalendarHelpers.js:219`
```javascript
export const detectProfessionalConflict = (professionalId, date, startTime, duration, appointments, multipleAppointments) => {
  // 44 lines checking both session and persisted appointments
}
```

**Version 2** - `Selectcalander.jsx:993`
```javascript
const isProfessionalUnavailableInSession = (professionalId, timeSlot, date, serviceDuration) => {
  // 35 lines checking only session appointments
}
```

**Version 3** - `selectCalendarHelpers.js:197`
```javascript
export const isTimeSlotConflicting = (newSlot, newDuration, existingBookings) => {
  // 9 lines basic conflict check
}
```

**Why This Matters:** Inconsistent conflict detection can lead to double bookings.

---

## 📊 Summary Statistics

### Current State
- **Active Code:** 5,043 lines (Selectcalander.jsx) + 361 lines (helpers) = **5,404 lines**
- **Unused Prepared Code:** ~500 lines of placeholders
- **Duplicate Functions:** 15+ functions duplicated 2-4 times each
- **CSS Files:** 1 main file (Selectcalander.css) + 6 unused module files

### Duplication Breakdown
| Function Type | Duplicated | Total Lines Wasted |
|--------------|------------|-------------------|
| Time slot generation | 3x | ~135 lines |
| Availability checking | 3x | ~120 lines |
| Date/time utilities | 4x | ~80 lines |
| Conflict detection | 3x | ~90 lines |
| **Total** | **13 functions** | **~425 lines** |

---

## ⚠️ Key Problems

### 1. Unused Prepared Files
- Folder structure created but not implemented
- Placeholders with TODO comments
- Not imported anywhere
- Wasting repository space

### 2. Code Duplication
- Same logic in 3-4 places
- Inconsistent implementations
- Bug fixes need multiple updates
- High maintenance cost

### 3. Monolithic Component
- 5,043 lines in one file
- Hard to understand
- Difficult to test
- Slow to load in editor

---

## 🎯 What Needs to Happen

### Option 1: Use the Prepared Files (Recommended)
1. Move logic from `Selectcalander.jsx` into the prepared components
2. Implement the placeholder hooks
3. Connect everything together
4. Delete the monolithic file

### Option 2: Clean Up and Consolidate
1. Delete the unused prepared files
2. Extract utilities from `Selectcalander.jsx` into `selectCalendarHelpers.js`
3. Remove duplicates
4. Keep the monolithic structure but cleaner

---

## 📝 Next Steps

1. **Decide:** Use prepared files or clean up in place?
2. **Consolidate:** Move duplicate functions to single location
3. **Test:** Ensure nothing breaks
4. **Document:** Update this file as changes are made

---

**Last Updated:** 2025-11-29  
**Status:** 🔴 Needs immediate attention  
**Recommendation:** Complete the refactor into prepared files or delete them
