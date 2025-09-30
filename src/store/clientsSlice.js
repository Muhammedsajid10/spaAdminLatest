import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  loading: false,
  error: null
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setClients(state, action) {
      state.list = action.payload;
    },
    setClientsLoading(state, action) {
      state.loading = action.payload;
    },
    setClientsError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setClients, setClientsLoading, setClientsError } = clientsSlice.actions;
export default clientsSlice.reducer;
