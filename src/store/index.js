// import { configureStore } from '@reduxjs/toolkit';
// import calendarReducer from './calendarSlice';
// import employeesReducer from './employeesSlice';
// import appointmentsReducer from './appointmentsSlice';
// import servicesReducer from './servicesSlice';
// import clientsReducer from './clientsSlice';
// import bookingSessionReducer from './bookingSessionSlice';

// export const store = configureStore({
//   reducer: {
//     calendar: calendarReducer,
//     employees: employeesReducer,
//     appointments: appointmentsReducer
//     ,services: servicesReducer,
//     clients: clientsReducer,
//     bookingSession: bookingSessionReducer
//   }
// });

// export default store;






import { configureStore } from '@reduxjs/toolkit';
import calendarReducer from './calendarSlice';
import employeesReducer from './employeesSlice';
import appointmentsReducer from './appointmentsSlice';
import servicesReducer from './servicesSlice';
import clientsReducer from './clientsSlice';
import bookingSessionReducer from './bookingSessionSlice';
import reportReducer from './reports/reportSlice';
import paymentSummaryReducer from './reports/slices/paymentSummarySlice';
import paymentTransactionsReducer from './reports/slices/paymentTransactionsSlice';
import appointmentSummaryReducer from './reports/slices/appointmentSummarySlice';
import financeSummaryReducer from './reports/slices/financeSummarySlice';
import workingHoursReducer from './reports/slices/workingHoursSlice';
import salesSummaryReducer from './reports/slices/salesSummarySlice';
import searchReducer from '../features/search/searchSlice';

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    employees: employeesReducer,
    appointments: appointmentsReducer
    ,services: servicesReducer,
    clients: clientsReducer,
    bookingSession: bookingSessionReducer,
    reports: reportReducer,
    paymentSummary: paymentSummaryReducer,
    paymentTransactions: paymentTransactionsReducer,
    appointmentSummary: appointmentSummaryReducer,
    financeSummary: financeSummaryReducer,
    workingHours: workingHoursReducer,
    salesSummary: salesSummaryReducer,
    search: searchReducer,
    //  filters: filtersReducer,
    // ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for date objects
        ignoredActions: ['filters/setDateRange'],
        ignoredActionPaths: ['meta.arg', 'payload.raw'],
        ignoredPaths: ['paymentTransactions.items', 'appointmentSummary.rawBookings'],
        warnAfter: 500
      },
    }),
});


export default store;
