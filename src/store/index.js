import { configureStore } from '@reduxjs/toolkit';
import calendarReducer from './calendarSlice';
import employeesReducer from './employeesSlice';
import appointmentsReducer from './appointmentsSlice';
import servicesReducer from './servicesSlice';
import clientsReducer from './clientsSlice';
import bookingSessionReducer from './bookingSessionSlice';

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    employees: employeesReducer,
    appointments: appointmentsReducer
    ,services: servicesReducer,
    clients: clientsReducer,
    bookingSession: bookingSessionReducer
  }
});

export default store;
