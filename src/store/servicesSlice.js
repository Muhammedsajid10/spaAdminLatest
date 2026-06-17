import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  loading: false,
  error: null
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices(state, action) {
      state.list = action.payload;
    },
    setServicesLoading(state, action) {
      state.loading = action.payload;
    },
    setServicesError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setServices, setServicesLoading, setServicesError } = servicesSlice.actions;
export default servicesSlice.reducer;
