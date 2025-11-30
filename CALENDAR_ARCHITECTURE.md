# 📅 Calendar Architecture Guide

Welcome to the Allora Spa Calendar Architecture! This guide is designed to help new developers understand how the calendar system works, how it's structured, and how to work with it.

## 🏗️ High-Level Overview

The calendar is the heart of the application. It allows users to:
1.  **View Schedules**: See appointments in Day, Week, or Month views.
2.  **Manage Bookings**: Create, edit, move, and delete appointments.
3.  **Manage Team**: Filter the view by specific employees.

We recently refactored the calendar from a single massive file (~2000 lines) into a **modular, component-based architecture**.

---

## 📂 Directory Structure

Here's where everything lives:

```
src/
├── Clientsidepage/
│   ├── Selectcalander.jsx       # 🟢 Main Container (The entry point)
│   ├── Selectcalander.css       # 🎨 Global layout styles
│   └── BookingModals.css        # 🎨 Styles for popups/modals
│
└── features/calendar/           # 📦 Core Calendar Feature Folder
    ├── components/
    │   ├── CalendarHeader/      # 🧩 Header (Nav, View Switcher, Filters)
    │   ├── CalendarGrid/        # 🧩 The Grid (Day/Week/Month displays)
    │   └── BookingFlow/         # 🧩 Booking Wizard Components
    │
    └── hooks/                   # 🧠 Custom Hooks (The Logic Layer)
        ├── useCalendarLogic.js  # Business logic & Data fetching
        ├── useCalendarView.js   # View state & Date navigation
        ├── useCalendarModals.js # Modal visibility state
        └── useBookingFlow.js    # Booking wizard step management
```

---

## 🧩 Key Components

### 1. `Selectcalander.jsx` (The Container)
Think of this as the **Conductor**. It doesn't do much "work" itself. Instead, it:
- **Imports Hooks**: Grabs all the data and functions it needs.
- **Renders Layout**: Places the Header at the top and the Grid below.
- **Manages Modals**: Decides when to show the Booking Modal, Error Popups, etc.

### 2. `CalendarHeader`
Located in: `src/features/calendar/components/CalendarHeader/`
- **Responsibility**: Handles everything above the grid.
- **Features**:
    - Date Navigation (Next/Prev Day).
    - View Switcher (Day/Week/Month).
    - Team Filter (Select specific employees).
- **Styling**: Uses `CalendarHeader.module.css`.

### 3. `CalendarGrid`
Located in: `src/features/calendar/components/CalendarGrid/`
- **Responsibility**: Renders the actual schedule.
- **Views**:
    - **Day View**: Columns for each employee, rows for time slots.
    - **Week View**: Rows for employees, columns for days.
    - **Month View**: Standard calendar grid.
- **Styling**: Uses `CalendarGrid.module.css`.

### 4. `BookingModal`
Located in: `src/features/calendar/components/BookingFlow/`
- **Responsibility**: The multi-step wizard for creating a new appointment.
- **Steps**: Service Selection -> Professional -> Time -> Client -> Payment.

---

## 🧠 The "Brain" (Custom Hooks)

We moved complex logic out of components and into **Hooks**. This makes components smaller and easier to read.

### `useCalendarLogic`
*   **What it does**: Handles "Business Logic".
*   **Key Functions**:
    *   `fetchCalendarData()`: Gets appointments from the API/Redux.
    *   `handleDeleteBooking()`: Deletes an appointment.
    *   `isTimeSlotUnavailable()`: Checks if a slot is blocked (e.g., no shift).
    *   `getFilteredEmployees()`: Filters staff based on search/selection.

### `useCalendarView`
*   **What it does**: Handles "Navigation State".
*   **Key State**:
    *   `currentView`: 'Day', 'Week', or 'Month'.
    *   `currentDate`: The date currently being viewed.
*   **Key Functions**: `goToNext()`, `goToToday()`.

### `useCalendarModals`
*   **What it does**: Handles "UI Visibility".
*   **Key State**: Booleans like `showAddBookingModal`, `showUnavailablePopup`.
*   **Key Functions**: `closeBookingModal()`, `openBookingModal()`.

---

## 🎨 CSS Architecture

We use a mix of **Global CSS** and **CSS Modules**.

1.  **CSS Modules (`*.module.css`)**:
    *   **Best for**: Specific components (`CalendarHeader`, `CalendarGrid`).
    *   **Why**: Styles are "scoped" locally, so `.header` in one file doesn't mess up `.header` in another.
    *   **Example**: `import styles from './CalendarHeader.module.css';` -> `<div className={styles.header}>`

2.  **Global CSS (`Selectcalander.css`)**:
    *   **Best for**: High-level layout variables and reset styles.
    *   **Contains**: CSS Variables (`--primary-color`), scrollbar styling, and the main `.scheduler-root` container.

3.  **`BookingModals.css`**:
    *   **Best for**: Styles shared across different modals (popups, overlays) that haven't been fully modularized yet.

---

## 🔄 Data Flow (Redux)

The calendar relies heavily on **Redux** for global state.

1.  **`appointmentsSlice`**: Stores all appointment data, organized by Employee ID.
2.  **`employeesSlice`**: Stores the list of staff members and their shifts.
3.  **`calendarSlice`**: Stores UI state like `loading` and `error`.

**Typical Flow**:
1.  `useCalendarLogic` dispatches `fetchCalendarThunk`.
2.  API returns data -> Redux Store updates.
3.  `useCalendarLogic` selects data from Store (`useSelector`).
4.  Data is passed down: `Selectcalander` -> `CalendarGrid` -> `DayView` -> `AppointmentCard`.

---

## 🚀 How to Add a New Feature

**Scenario**: You want to add a "Print Schedule" button.

1.  **Logic**: Add a `handlePrint()` function in `useCalendarLogic.js`.
2.  **UI**: Add a `<button>` in `CalendarHeader.jsx`.
3.  **Connect**: Pass the function from `Selectcalander.jsx` into `<CalendarHeader />`.

**Scenario**: You want to change the color of the "Today" button.

1.  **Find Component**: It's in the header, so check `CalendarHeader.jsx`.
2.  **Find Style**: It imports `CalendarHeader.module.css`.
3.  **Edit CSS**: Open that CSS file and change `.todayBtn`.

---

## 🐛 Debugging Tips

*   **"Maximum update depth exceeded"**: Usually means a `useEffect` has a dependency that changes on every render (like an object literal `{{...}}`). Check your dependency arrays!
*   **Styles not applying**: Check if you are using a CSS Module. If so, you MUST use `className={styles.className}`, not `className="className"`.
*   **Data not showing**: Check the Redux DevTools to see if `fetchCalendarThunk` succeeded and if the data is in the store.
