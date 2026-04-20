# Allora Spa Admin - Architectural Guide

## Overview

The Allora Spa Admin codebase has been refactored from a monolithic flat structure to a **Feature-Based Modular Architecture**. This design prioritizes domain isolation, scalability, and maintainability.

---

## Directory Structure

```
src/
├── api/             # Centralized API layer (Axios instance, interceptors, domain services)
├── assets/          # Static assets (images, icons, global styles)
├── components/      # Shared UI and Layout components
│   ├── layout/      # Shared layouts (TopNavBar, SideBars)
│   └── ui/          # Generic Atomic components (Modal, Loader, Toast)
├── features/        # Business domains
│   ├── auth/        # Login, Signup, Password Reset
│   ├── booking/     # Calendar, Appointment Wizard, Shift Logic
│   ├── clients/     # Client Management, Details Modal
│   ├── finance/     # Payments, Gift Cards, Memberships
│   ├── reports/     # Dashboards, Analytics, Sales Summaries
│   ├── service/     # Service Menu Management
│   └── staff/       # Team management, TimeSheets, Shifts
├── hooks/           # Global reusable React hooks
├── routes/          # Centralized route definitions
├── store/           # Global Redux state management
└── utils/           # Shared helper functions (Date formatting, String manipulation)
```

---

## Path Aliases

To avoid brittle relative imports (e.g., `../../../../components/ui/Modal`), use the following path aliases:

- `@api`: `src/api/`
- `@assets`: `src/assets/`
- `@components`: `src/components/`
- `@features`: `src/features/`
- `@store`: `src/store/`
- `@utils`: `src/utils/`
- `@hooks`: `src/hooks/`

### Example Usage:
```javascript
import api from '@api';
import { Modal } from '@components/ui';
import { selectUser } from '@store/authSlice';
```

---

## Coding Standards & Best Practices

1. **Domain Isolation**: Code specific to a feature (e.g., `BookingWizard`) stays inside `src/features/booking/`. If a component becomes used by multiple features, move it to `src/components/ui/`.
2. **Centralized Logic**:
   - **API**: Domain-specific API calls go into `src/api/[feature]Api.js`.
   - **State**: Use Redux Thunks in `src/store/` for business logic and data fetching.
   - **Utils**: Feature-specific helpers stay in the feature folder; shared helpers move to `src/utils/`.
3. **Lazy Loading**: All feature entry points in `App.jsx` are lazy-loaded to optimize bundle size.
4. **CSS Scoping**: Prefer feature-specific CSS files (e.g., `Dashboard.css`) and avoid global style pollution.

---

## Adding a New Feature

1. Create a new directory in `src/features/[feature_name]`.
2. Create an `index.js` as the main entry point if required.
3. Register routes in `src/routes/` or directly in `App.jsx`.
4. If global state is needed, create a slice in `src/store/[feature_name]Slice.js`.
5. Implement API services in `src/api/[feature_name]Api.js`.

---

## Recent Refactoring Recap

- ✅ **Monolith to Feature-First**: Migrated 100+ files from `Clientsidepage/` and `calendar/` into specific feature domains.
- ✅ **API Consolidation**: Created a centralized `src/api/index.js` with base configuration.
- ✅ **Build Stability**: Verified with production build (`npm run build`).
- ✅ **Cleanup**: Removed all legacy directories and orphaned files.

---

*Last Updated: April 2026*
