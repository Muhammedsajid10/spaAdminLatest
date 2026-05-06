# Feature-Based Folders

This directory is reserved for feature-based modules.

Suggested migration pattern:
1. Move one page or feature at a time into a feature folder.
2. Keep the feature's React components, hooks, styles, and tests together.
3. Use `src/features/<feature>/` for feature-specific logic and UI.
4. Keep shared UI and utilities in `src/components/`, `src/hooks/`, and `styles/`.

Example structure:

src/features/
  sales/
    SalesPage.jsx
    sales.css
    hooks/
    components/
  clients/
    ClientsList.jsx
    clients.css
    components/
