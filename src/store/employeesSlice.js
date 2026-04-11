import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  loading: false,
  error: null
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees(state, action) {
      state.list = action.payload;
    },
    setEmployeesLoading(state, action) {
      state.loading = action.payload;
    },
    setEmployeesError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setEmployees, setEmployeesLoading, setEmployeesError } = employeesSlice.actions;
export default employeesSlice.reducer;
