# Calendar Component Refactoring Plan

## Current State
- **File**: `Selectcalander.jsx`
- **Lines**: 5,369 lines
- **Status**: ❌ TOO LARGE - Needs immediate refactoring
- **Issues**:
  - Hard to maintain
  - Difficult to debug
  - Performance concerns
  - Code duplication
  - Testing challenges

---

## Target Structure

```
src/
├── components/
│   └── Calendar/
│       ├── Calendar.jsx                    (~200 lines) ✨ Main orchestrator
│       ├── CalendarHeader/
│       │   ├── index.jsx                   (~150 lines)
│       │   ├── DateNavigation.jsx          (~80 lines)
│       │   ├── ViewSelector.jsx            (~60 lines)
│       │   └── TeamSelector.jsx            (~100 lines)
│       ├── CalendarGrid/
│       │   ├── index.jsx                   (~200 lines)
│       │   ├── DayView.jsx                 (~250 lines)
│       │   ├── WeekView.jsx                (~250 lines)
│       │   └── MonthView.jsx               (~250 lines)
│       ├── BookingFlow/
│       │   ├── BookingModal.jsx            (~300 lines)
│       │   ├── ServiceSelection.jsx        (~200 lines)
│       │   ├── ProfessionalSelection.jsx   (~150 lines)
│       │   ├── TimeSlotSelection.jsx       (~150 lines)
│       │   ├── ClientInformation.jsx       (~200 lines)
│       │   └── PaymentConfirmation.jsx     (~300 lines)
│       ├── Modals/
│       │   ├── DatePickerModal.jsx         (~200 lines)
│       │   ├── TeamPopup.jsx               (~250 lines)
│       │   ├── CalendarPopup.jsx           (~150 lines)
│       │   └── BookingStatusModal.jsx      (~200 lines)
│       ├── Shared/
│       │   ├── AppointmentCard.jsx         (~100 lines)
│       │   ├── TimeSlot.jsx                (~80 lines)
│       │   ├── BookingTooltip.jsx          (~80 lines)
│       │   └── Loading.jsx                 (~50 lines)
│       └── index.js                        (exports)
│
├── hooks/
│   └── calendar/
│       ├── useCalendarState.js             (~150 lines)
│       ├── useBookingFlow.js               (~300 lines)
│       ├── useAppointments.js              (~200 lines)
│       ├── usePriceEditing.js              (~100 lines)
│       ├── useTeamManagement.js            (~150 lines)
│       ├── useGiftCards.js                 (~200 lines)
│       ├── useMemberships.js               (~150 lines)
│       └── index.js                        (exports)
│
└── utils/
    └── calendar/
        ├── timeHelpers.js                  (~100 lines) ✅ CREATED
        ├── appointmentHelpers.js           (~150 lines) ✅ CREATED
        ├── dateHelpers.js                  (~100 lines)
        ├── shiftHelpers.js                 (~150 lines)
        ├── validationHelpers.js            (~100 lines)
        ├── conflictDetection.js            (~150 lines)
        └── index.js                        (exports)
```

---

## Refactoring Steps

### Phase 1: Extract Utilities (✅ STARTED)
- [x] Create `utils/calendar/timeHelpers.js` - 60 lines
- [x] Create `utils/calendar/appointmentHelpers.js` - 75 lines
- [ ] Create `utils/calendar/dateHelpers.js`
- [ ] Create `utils/calendar/shiftHelpers.js`
- [ ] Create `utils/calendar/validationHelpers.js`
- [ ] Create `utils/calendar/conflictDetection.js`

### Phase 2: Extract Custom Hooks
- [ ] Create `hooks/calendar/useCalendarState.js`
- [ ] Create `hooks/calendar/useBookingFlow.js`
- [ ] Create `hooks/calendar/useAppointments.js`
- [ ] Create `hooks/calendar/usePriceEditing.js`
- [ ] Create `hooks/calendar/useTeamManagement.js`
- [ ] Create `hooks/calendar/useGiftCards.js`
- [ ] Create `hooks/calendar/useMemberships.js`

### Phase 3: Create Sub-Components
- [ ] Create `CalendarHeader` components
- [ ] Create `CalendarGrid` views
- [ ] Create `BookingFlow` modals
- [ ] Create `Shared` components

### Phase 4: Main Calendar Component
- [ ] Create new `Calendar.jsx` (~200 lines)
- [ ] Import all sub-components
- [ ] Use custom hooks
- [ ] Test functionality

### Phase 5: Migration
- [ ] Update imports in parent components
- [ ] Remove old `Selectcalander.jsx`
- [ ] Update Redux connections
- [ ] Full testing

---

## Component Size Guidelines

| Category | Good | Warning | Critical |
|----------|------|---------|----------|
| Component | 100-400 lines | 500+ lines | 800+ lines |
| Hook | 50-200 lines | 300+ lines | 400+ lines |
| Utility | 50-150 lines | 200+ lines | 300+ lines |

---

## Benefits After Refactoring

✅ **Maintainability**: Each file is small and focused
✅ **Reusability**: Components can be used independently  
✅ **Testability**: Easy to unit test each piece
✅ **Performance**: Better code splitting and lazy loading
✅ **Collaboration**: Multiple developers can work simultaneously
✅ **Debugging**: Easier to locate and fix issues
✅ **Documentation**: Smaller files are self-documenting

---

## Redux Integration

The calendar already uses Redux for:
- `employees` state
- `calendar` state (timeSlots, loading, error, selectedStaff)
- `appointments` state
- `bookingSession` state (multipleAppointments, etc.)

✅ **No changes needed** - all Redux connections will be maintained

---

## Estimated Timeline

- Phase 1 (Utilities): 4-6 hours
- Phase 2 (Hooks): 6-8 hours
- Phase 3 (Components): 12-16 hours
- Phase 4 (Main Calendar): 2-4 hours
- Phase 5 (Migration & Testing): 4-6 hours

**Total**: 28-40 hours

---

## Next Steps

1. ✅ Create folder structure
2. ✅ Extract time helpers
3. ✅ Extract appointment helpers
4. ⏳ Continue with remaining utilities
5. ⏳ Extract hooks one by one
6. ⏳ Build sub-components
7. ⏳ Create main Calendar component
8. ⏳ Test and migrate

---

## Safety Notes

⚠️ **Important**: This is a MAJOR refactoring
- Create a **new git branch** before starting
- Test each phase thoroughly
- Keep the old file until 100% verified
- Have a rollback plan ready

---

## Questions?

This refactoring will transform:
- **5,369 lines** in 1 file  
→ **~40 files** averaging **~130 lines** each

Much more maintainable! 🎉
