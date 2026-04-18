import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../Service/Api';
import { Base_url } from '../Service/Base_url';

export const fetchCalendarThunk = createAsyncThunk(
  'calendar/fetchData',
  async ({ currentDate, currentView }, { rejectWithValue }) => {
    try {
      // 1. Calculate date range based on view
      let startDate, endDate;
      const date = new Date(currentDate);

      if (currentView === 'Day') {
        startDate = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(date.setHours(23, 59, 59, 999)).toISOString();
      } else if (currentView === 'Week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0)).toISOString();
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endDate = new Date(endOfWeek.setHours(23, 59, 59, 999)).toISOString();
      } else {
        startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0).toISOString();
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
      }

      // 2. Fetch Employees and Appointments in parallel
      const [empRes, aptRes] = await Promise.all([
        api.get(`${Base_url}/employees`),
        api.get(`${Base_url}/bookings?startDate=${startDate}&endDate=${endDate}`)
      ]);

      return {
        employees: empRes.data?.data || [],
        appointments: aptRes.data?.data || []
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
