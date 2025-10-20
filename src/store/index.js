






import { configureStore } from '@reduxjs/toolkit';
import calendarReducer from '../calendar/store/calendarSlice';
import calendarUIReducer from '../calendar/calendarSlice';
import employeesReducer from './employeesSlice';
import appointmentsReducer from '../calendar/store/appointmentsSlice';
import servicesReducer from './servicesSlice';
import clientsReducer from './clientsSlice';
import bookingSessionReducer from '../calendar/store/bookingSessionSlice';
import bookingFormReducer from '../calendar/store/bookingFormSlice';
import datePickerReducer from '../calendar/store/datePickerSlice';
import teamPopupReducer from './teamPopupSlice';
import reportReducer from './reports/reportSlice';
import paymentSummaryReducer from './reports/slices/paymentSummarySlice';
import paymentTransactionsReducer from './reports/slices/paymentTransactionsSlice';
import appointmentSummaryReducer from './reports/slices/appointmentSummarySlice';
import financeSummaryReducer from './reports/slices/financeSummarySlice';
import workingHoursReducer from './reports/slices/workingHoursSlice';
import salesSummaryReducer from './reports/slices/salesSummarySlice';

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
  calendarUI: calendarUIReducer,
    employees: employeesReducer,
    appointments: appointmentsReducer,
    services: servicesReducer,
    clients: clientsReducer,
    bookingSession: bookingSessionReducer,
    bookingForm: bookingFormReducer,
    datePicker: datePickerReducer,
    teamPopup: teamPopupReducer,
    reports: reportReducer,
    paymentSummary: paymentSummaryReducer,
    paymentTransactions: paymentTransactionsReducer,
    appointmentSummary: appointmentSummaryReducer,
    financeSummary: financeSummaryReducer,
    workingHours: workingHoursReducer,
    salesSummary: salesSummaryReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['filters/setDateRange'],
        ignoredActionPaths: ['meta.arg', 'payload.raw'],
        ignoredPaths: ['paymentTransactions.items', 'appointmentSummary.rawBookings'],
        warnAfter: 500
      },
    }),
});


export default store;
