const selectWorkingHoursState = (state) =>
  state.workingHours ?? {
    rawItems: [],
    status: 'idle',
    error: null
  };

export const selectWorkingHoursRawItems = (state) =>
  selectWorkingHoursState(state).rawItems;

export const selectWorkingHoursStatus = (state) =>
  selectWorkingHoursState(state).status;

export const selectWorkingHoursError = (state) =>
  selectWorkingHoursState(state).error;