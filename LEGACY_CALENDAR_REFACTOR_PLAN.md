# Legacy Calendar Refactoring Strategy

## Current State
- **File:** `Selectcalander.jsx` (5,043 lines)
- **CSS:** `Selectcalander.css` (large)
- **Helpers:** `selectCalendarHelpers.js` (361 lines of duplicated code)

## Refactoring Approach

### Phase 1: Replace Utility Imports ✅
Replace all imports from `selectCalendarHelpers.js` with new architecture utilities:

**Old imports (lines 10-31):**
```javascript
import {
  formatUTCToLocal,
  generateTimeSlots,
  formatTime,
  // ... 20+ more functions
} from './helpers/selectCalendarHelpers';
```

**New imports:**
```javascript
import {
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  formatTime12Hour,
  generateTimeSlots,
  generateSlotsFromShift,
  detectProfessionalConflict,
  detectSlotConflict,
  // ... from new architecture
} from '../features/calendar/utils';
```

### Phase 2: Use Custom Hooks
Replace local state management with custom hooks:

**Replace:**
- Date navigation logic → `useDateNavigation`
- Employee filtering → `useEmployeeFilter`
- Time slots generation → `useTimeSlots`
- Availability checking → `useAvailability`

### Phase 3: Extract Components
Break down the monolithic component:

**Extract to components:**
1. Booking modal → Use `BookingModal` from new architecture
2. Session sidebar → Use `SessionSidebar`
3. Calendar grid → Use `CalendarGrid`

### Phase 4: Clean Up CSS
Remove duplicate styles and use CSS modules from new architecture.

---

## Implementation Plan

### Step 1: Create Compatibility Layer
Create a wrapper that maps old function calls to new utilities:

```javascript
// src/features/calendar/utils/legacy-compat.js
export {
  timeToMinutes,
  minutesToTime as formatTime,
  addMinutesToTime,
  generateTimeSlots,
  // ... map old names to new functions
} from './index';
```

### Step 2: Update Imports
Replace the old helper import with the compatibility layer.

### Step 3: Gradual Component Extraction
One by one, replace sections with new components while maintaining functionality.

### Step 4: CSS Cleanup
Remove unused styles and migrate to CSS modules.

---

## Expected Results

**Before:**
- 5,043 lines in main file
- 361 lines in helpers
- Large CSS file
- **Total: ~5,500+ lines**

**After:**
- <500 lines in main file (using hooks and components)
- 0 lines in helpers (using new utilities)
- Minimal CSS (using modules)
- **Total: ~500 lines** (90% reduction)

---

**Status:** Ready to implement
