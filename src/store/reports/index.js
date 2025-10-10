import { configureStore } from '@reduxjs/toolkit';
import reportReducer from './reportSlice';

export const reportStore = configureStore({
  reducer: {
    reports: reportReducer
  }
});