# Admin Side Booking Architecture

This document describes the refactored architecture of the Admin Booking workflow within the Allora Spa Admin Portal. The system has been migrated from a component-heavy, local-state-driven model to a centralized, Redux-thunk-driven architecture.

## 🏗️ Architectural Overview

The booking system follows a clean separation of concerns:

1.  **State Management (Redux)**: Located in `src/store/adminBookingSlice.js`.
    *   Manages the state of the booking wizard (steps, selections, client data, benefits).
    *   Maintains lists of available services and professionals.
    *   Handles UI states like the visibility of the Add Booking modal and status modals.

2.  **Business Logic & Side Effects (Thunks)**: Located in `src/store/adminBookingThunks.js`.
    *   Centralizes all API interactions.
    *   Implements complex logic: professional conflict detection, shift validation, and benefit calculations (gift cards/memberships).
    *   Normalizes data from the backend to ensure UI consistency across views.

3.  **View Layer (React Components)**:
    *   **Container Component**: `src/Clientsidepage/Selectcalander.jsx`. This is the main calendar interface. It now acts as a lean container that dispatches thunks and reads state via selectors.
    *   **Visualization Components**: Located in `src/calendar/components/`. Includes `DayView.jsx`, `WeekView.jsx`, `MonthView.jsx`, and `StaffColumn.jsx`.
    *   **Booking Wizard**: Located in `src/calendar/components/BookingWizard/`. Handles the multi-step flow for creating new appointments.

## 🔄 Data Flow

1.  **Initialization**: On mount, `Selectcalander.jsx` dispatches `fetchCalendarThunk` to load appointments and professionals.
2.  **User Interaction**: When a user clicks a time slot, `handleTimeSlotClick` dispatches `setBookingDefaults` and opens the `BookingWizardModal`.
3.  **Step Execution**: As the user moves through steps (Service -> Professional -> Client -> Payment), the wizard dispatches actions to update the Redux store.
4.  **Finalization**: The final step dispatches a thunk to save the booking to the backend, followed by a cache invalidation (refresh) of the calendar data.

## 🛠️ Refactoring & Best Practices

During the recent refactor, the following improvements were made:
*   **Decoupling**: UI components no longer contain hardcoded API URLs or `fetch` calls.
*   **Normalized Professionals**: Professional objects are normalized to a standard format (`{ _id, name, avatar, position }`) to prevent "undefined" errors in views.
*   **Conflict Prevention**: Conflict detection for professional availability is now performed in the thunk layer before the UI moves to the payment step.
*   **Single Source of Truth**: Removed ~500 lines of redundant local state from `Selectcalander.jsx`.

## 🚀 Recommended Future Refactorings

1.  **File Organization**:
    *   Move `src/Clientsidepage/Selectcalander.jsx` to `src/calendar/AdminCalendar.jsx`. The current name and location are misleading (it is an Admin-side component).
    *   Consolidate `src/Service/Api.jsx` and `src/Service/Base_url.jsx` into a standard `src/utils/api.js` using Axios interceptors.

2.  **Path Aliases**:
    *   Configure Vite aliases (e.g., `@store`, `@components`) to avoid deep relative imports like `../../../store/...`.

3.  **Type Safety (Optional)**:
    *   Implement JSDoc types or migrate core booking logic to TypeScript to prevent runtime errors related to nested client/professional properties.

4.  **Utility Consolidation**:
    *   Merge `src/Clientsidepage/helpers/selectCalendarHelpers.js` with `src/calendar/dateUtils.js` to avoid duplicate date formatting logic.
