export const sidebarConfig = {
  sales: {
    title: 'Sales',
    menuItems: [
      { label: 'Daily Sales Summary', path: '/sales/daily-summary' },
      { label: 'Appointments', path: '/sales/appointments' },
      { label: 'Payments', path: '/sales/payments' },
      { label: 'Gift Cards Sold', path: '/sales/gift-cards' },
      { label: 'Memberships Sold', path: '/sales/memberships' },
    ],
  },
  team: {
    title: 'Team',
    menuItems: [
      { label: 'Team Members', path: '/team' },
      { label: 'Scheduled Shifts', path: '/team/scheduled-shifts' },
      { label: 'Time Sheets', path: '/team/time-sheets' },
    ],
  },
  catalog: {
    title: 'Catalog',
    menuItems: [
      { label: 'Service Menu', path: '/catalog' },
      { label: 'Memberships', path: '/catalog/memberships' },
    ],
  },
};