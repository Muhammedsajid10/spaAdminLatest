# SelectCalendar Modularization Plan

This folder hosts the reusable scaffolding for breaking the legacy `Selectcalander.jsx` into focused components and CSS modules.

## CSS Strategy
- Each component imports a `.module.css` file that scopes selectors to that component.
- Shared visual tokens (colors, borders, spacing) should live in `src/styles/variables.css` and be consumed via CSS custom properties (`var(--calendar-primary)` etc.).
- Gradually migrate rules from the monolithic `Selectcalander.css` by copying relevant blocks into the matching module and updating the JSX class usage to `styles.someClass` in the final refactor.
