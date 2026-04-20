# Architecture of Reports Feature

This document explains the architecture of the "Reports" feature. It is designed to be easy to understand for beginners, breaking down the code into logical layers: UI, Configuration, and Data.

## 📂 File Structure

The feature is organized in `src/pages/reports` with the following structure:

```
reports/
├── ReportsMain.jsx          # Main landing page (Dashboard)
├── GenericReportPage.jsx    # Reusable template for most reports
├── reportConfigs.jsx        # Configuration file (The "Brain")
├── reportsData.jsx          # Static data for tabs and categories
├── FinanceSummary.jsx       # Custom component for Finance Summary
├── InvoiceDetailsReport.jsx # Custom component for Invoice Details
└── ...                      # Other custom report components
```

---

## 🏗️ Core Components

### 1. Main Dashboard (`ReportsMain.jsx`)
- **Role**: The "Hub".
- **Responsibility**:
    - Displays the list of available reports.
    - Handles **Tab Navigation** (Sales, Finance, etc.).
    - Implements **Search** functionality to find reports.
    - Navigates to specific reports when clicked.

### 2. The Universal Template (`GenericReportPage.jsx`)
- **Role**: The "Chameleon".
- **Responsibility**:
    - This is a **single component** that can display *almost any* report.
    - It takes props like `columns`, `dataHook`, and `title` to change its appearance and behavior.
    - **Features**:
        - Date Range Picker
        - Data Table (Sortable, Paginated)
        - Export Button (PDF, CSV, Excel)
        - Search within the table
        - Filters (e.g., by Staff, Service)

### 3. Configuration (`reportConfigs.jsx`)
- **Role**: The "Instruction Manual".
- **Responsibility**:
    - Defines **how** each report should look and behave.
    - Instead of creating a new file for every report, we just add a config object here.
    - **Example Config**:
        ```javascript
        'sales-summary': {
          title: 'Sales Summary',
          category: 'Sales',
          dataHook: useSalesSummary, // Hook to fetch data
          columns: [ ... ]           // Table columns
        }
        ```

---

## 🔄 Data Flow (How it works)

1.  **User** clicks a report card in `ReportsMain`.
2.  **Router** navigates to `/reports/[report-route]`.
3.  **App** looks up the configuration in `reportConfigs.jsx` using the route.
4.  **`GenericReportPage`** is rendered with the specific config.
5.  **`GenericReportPage`** calls the `dataHook` (e.g., `useSalesSummary`) to fetch data from the API.
6.  **Data** is displayed in the `DataTable`.

---

## 🛠️ How to Add a New Report

1.  **Define the Report**: Add an entry in `reportsData.jsx` (or `ReportsMain.jsx` depending on where the list is) to show it on the dashboard.
2.  **Create the Config**: Add a new key in `reportConfigs.jsx`.
    - Specify `title`, `description`, `category`.
    - Define `columns` for the table.
    - Assign a `dataHook` to fetch the data.
3.  **Create the Hook** (if needed): Create a hook in `src/store/reports/hooks/` that fetches data from the API.

---

## 🎨 Custom Reports

Sometimes `GenericReportPage` isn't enough (e.g., complex charts or unique layouts).
In that case, we use **Custom Components**.

-   **Example**: `FinanceSummary.jsx`
-   **How**: In `reportConfigs.jsx`, we set `useCustomComponent: true` and provide the component in `customComponent`.

```javascript
'finance-summary': {
  // ...
  customComponent: FinanceSummary,
  useCustomComponent: true
}
```
