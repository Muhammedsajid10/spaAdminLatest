# Client Details Architecture

This document explains the architecture of the "Client Details" feature. It is designed to be easy to understand for beginners, breaking down the code into logical layers: UI (User Interface), Business Logic, API (Data), and Styling.

## 📂 File Structure

The feature is organized in `src/Clientsidepage/ClientDetails` with the following structure:

```
ClientDetails/
├── ClientDetailsModal.jsx       # Main container component (The "Brain")
├── ClientDetails.css            # Styles for the main modal
├── components/                  # UI Components (The "Building Blocks")
│   ├── ClientProfileSidebar.jsx # Left sidebar with client info & actions
│   ├── ClientOverviewTab.jsx    # Overview tab content
│   ├── ClientAppointmentsTab.jsx# Appointments tab content
│   ├── ClientSalesTab.jsx       # Sales tab content
│   ├── ClientInfoTab.jsx        # Client details tab (View/Edit)
│   ├── ClientItemsTab.jsx       # Items tab (Memberships/Services)
│   ├── ClientNotesTab.jsx       # Notes tab
│   ├── ClientAllergiesTab.jsx   # Allergies tab
│   ├── ClientGiftCardsTab.jsx   # Gift Cards tab
│   ├── ClientReviewsTab.jsx     # Reviews tab
│   ├── AddNoteModal.jsx         # Modal for adding notes
│   ├── AddAllergyModal.jsx      # Modal for adding allergies
│   └── [Component].css          # Specific styles for each component
├── hooks/                       # Business Logic (The "Logic Center")
│   └── useClientDetails.js      # Custom hook to manage client data
└── services/                    # API Layer (The "Messenger")
    └── clientService.js         # Functions to talk to the backend
```

---

## 🎨 UI Layer (User Interface)

This layer handles what the user **sees** and **interacts** with.

### 1. Main Container (`ClientDetailsModal.jsx`)
- **Role**: The "Parent" component.
- **Responsibility**:
    - Opens the modal overlay.
    - Holds the **state** for the active tab (e.g., 'overview', 'appointments').
    - Fetches data using the **Business Layer**.
    - Decides which **Tab Component** to show based on the active tab.
    - Manages global modals like `AddNoteModal` and `AddAllergyModal`.

### 2. Components (`components/`)
- **Role**: The "Children" components.
- **Responsibility**:
    - **Sidebar**: Displays static client info (Name, Phone) and "Actions" button.
    - **Tabs**: Each tab (e.g., `ClientAppointmentsTab`) is a separate file. This keeps the code clean. They receive data via **props** from the parent.
    - **Modals**: Small popups for specific actions (Add Note, Add Allergy).

### 3. Styling (`*.css`)
- **Role**: The "Look and Feel".
- **Strategy**: Modular CSS.
    - `ClientDetails.css`: Global styles for the modal layout.
    - `[Component].css`: Specific styles for each component (e.g., `ClientItemsTab.css` only styles the Items tab). This prevents styles from messing up other parts of the app.

---

## 🧠 Business Layer (Logic)

This layer handles **how** things work, separating logic from the UI.

### Custom Hook (`hooks/useClientDetails.js`)
- **Role**: The "Manager".
- **Responsibility**:
    - **State Management**: Keeps track of `client` data, `stats`, `loading` status, and `errors`.
    - **Data Fetching**: Calls the **API Layer** when the component mounts.
    - **Updates**: Provides functions like `updateClient` to modify data and refresh the view.
- **Why?**: By moving this logic here, `ClientDetailsModal.jsx` stays clean and focused on rendering the UI.

---

## 🔌 API Layer (Data)

This layer handles communication with the **Server** (Backend).

### Service (`services/clientService.js`)
- **Role**: The "Messenger".
- **Responsibility**:
    - Contains functions like `getClientDetails(id)`, `updateClient(id, data)`.
    - Uses `axios` (via `Api.jsx`) to make HTTP requests (GET, POST, PUT).
    - Returns the data to the **Business Layer**.

---

## 🔄 Data Flow (How it connects)

1.  **User** clicks a client.
2.  **`ClientDetailsModal`** opens and calls `useClientDetails(clientId)`.
3.  **`useClientDetails`** calls `clientService.getClientDetails(clientId)`.
4.  **`clientService`** requests data from the **Server**.
5.  **Server** responds with data.
6.  **`useClientDetails`** updates its state (`client`, `loading: false`).
7.  **`ClientDetailsModal`** receives the data and passes it down to **Components** (Sidebar, Tabs).
8.  **User** sees the populated modal!

---

## 🚀 Key Takeaways for Beginners

-   **Separation of Concerns**: We don't put everything in one file. UI, Logic, and API are separate.
-   **Props**: Data is passed down from Parent (`ClientDetailsModal`) to Children (`Tabs`).
-   **State Lifting**: Shared state (like "Is the Add Note modal open?") is kept in the Parent so multiple children can trigger it.
-   **Modular CSS**: Each component has its own CSS file to avoid conflicts.
