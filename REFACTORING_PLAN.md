# Codebase Architecture Refactoring Plan

The current codebase has grown organically and requires structural organization to improve maintainability, reduce coupling, and enhance developer experience.

## 🚩 Current Issues
1.  **Confusing Naming**: The primary admin dashboard logic is located in `src/Clientsidepage/`, which is misleading.
2.  **Flat Directory Structure**: `src/Clientsidepage/` contains 60+ files including pages, components, layouts, and styles.
3.  **Logic Duplication**: Mixing state management styles (Context, Redux, Local State) without clear guidelines.
4.  **Component Bloat**: Pages like `Selectcalander.jsx` and `Sheduledshifts.jsx` are very large (2000+ lines) and combine data fetching with complex UI.
5.  **Brittle Imports**: Extensive use of deeply nested relative paths (e.g., `../../../../`).

## 🏗️ Proposed Architecture: Feature-Based Structure

We will transition to a "Feature-Based" directory structure to colocate related logic.

### 1. New Directory Layout
```
src/
  api/          # Axios instances and base API definitions
  assets/       # Raw assets (Images, Fonts)
  components/
    ui/         # Atomic UI components (Button, Modal, Input, Spinner)
    layout/     # Blueprint components (Sidebar, TopNav, DashboardLayout)
  features/     # Modular business domains
    booking/    # Calendar, booking wizard, logic
    clients/    # Client list, profiles, history
    staff/      # Personal, shifts, timesheets
    finance/    # Sales, payments, gift cards, memberships
  hooks/        # Shared custom hooks
  pages/        # Route entry points (compose features)
  store/        # Redux store config and global slices
  utils/        # Pure utility functions
```

### 2. Execution Phases

#### Phase 1: Foundation & Layout (In Progress)
*   [ ] Configure Vite path aliases (`@components`, `@features`, `@api`).
*   [ ] Move layout components from `Clientsidepage` to `src/components/layout`.
*   [ ] Standardize `App.jsx` and `routes/` to use a consistent layout wrapper.

#### Phase 2: Domain Migration
*   [ ] **Staff Domain**: Move `Teammembers.jsx`, `Sheduledshifts.jsx`, and `TimeSheets.jsx` to `src/features/staff`.
*   [ ] **Client Domain**: Move `Clientlist.jsx` and `ClientDetails/` to `src/features/clients`.
*   [ ] **Finance Domain**: Move `Membership.jsx`, `Giftcard.jsx`, and `Salespage.jsx` to `src/features/finance`.

#### Phase 3: Booking Logic Consolidation
*   [ ] Merge the existing `src/calendar` utility directory with `src/features/booking`.
*   [ ] Finalize the Redux migration for all booking-related views.

#### Phase 4: Component Decomposition & UI Kit
*   [ ] Extract common elements (Modals, Tooltips, Loaders) from large components and move them to `src/components/ui`.
*   [ ] Move `src/states/Loading.jsx` and `src/states/ErrorPage.jsx` to `src/components/ui`.

#### Phase 5: Cleanup
*   [ ] Delete backup files (`test.jsx`, `test_backup.jsx`, `Teammembers_Fixed.jsx`).
*   [ ] Remove unused CSS files from renamed directories.

## 📈 Desired Benefits
*   **Scalability**: New features can be added in isolated folders without bloating the root.
*   **Predictability**: Developers know exactly where to find UI logic vs. business logic.
*   **Maintainability**: Smaller, single-purpose components are easier to test and debug.
*   **Performance**: Better code-splitting opportunities at the feature level.
