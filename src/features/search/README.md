# Search Feature

This feature provides search functionality for appointments and clients.

## Structure

- `SearchBar.jsx` - Main UI component using Redux for state management
- `searchSlice.js` - Redux slice handling search logic, data fetching, and filtering
- `search.css` - Feature-specific styles using the global theme system

## Redux Integration

The search feature uses Redux for:
- Data fetching (appointments and clients)
- Search term state management
- Real-time filtering logic
- Loading and error states

## Styling

Uses the new global style system:
- Shared utilities from `styles/utilities/`
- Component styles from `styles/components/`
- Feature-specific styles in `search.css`
- CSS variables from `styles/themes/theme.css`

## Migration Notes

This feature was migrated from `src/Clientsidepage/SearchBar.jsx` to follow the new feature-based architecture:
- Logic moved to Redux slice
- UI simplified to focus on presentation
- Styles updated to use shared theme system
- Component moved to `src/features/search/`