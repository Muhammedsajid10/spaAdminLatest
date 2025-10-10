import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  setDateRange,
  setDateRangeType,
  setSelectedLocation,
  setSelectedTeamMember,
  setSelectedService,
  setGroupBy,
  resetFilters,
} from '../store/slices/filtersSlice';

export const useFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.filters);

  const updateDateRange = useCallback((dateRange) => {
    dispatch(setDateRange(dateRange));
  }, [dispatch]);

  const updateDateRangeType = useCallback((type) => {
    dispatch(setDateRangeType(type));
  }, [dispatch]);

  const updateLocation = useCallback((location) => {
    dispatch(setSelectedLocation(location));
  }, [dispatch]);

  const updateTeamMember = useCallback((teamMember) => {
    dispatch(setSelectedTeamMember(teamMember));
  }, [dispatch]);

  const updateService = useCallback((service) => {
    dispatch(setSelectedService(service));
  }, [dispatch]);

  const updateGroupBy = useCallback((groupBy) => {
    dispatch(setGroupBy(groupBy));
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  return {
    filters,
    updateDateRange,
    updateDateRangeType,
    updateLocation,
    updateTeamMember,
    updateService,
    updateGroupBy,
    reset,
  };
};
