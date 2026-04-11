import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useCallback } from 'react';
import { fetchWorkingHoursActivity, buildWorkingHoursData } from '../slices/workingHoursSlice';
import {
  selectWorkingHoursRawItems,
  selectWorkingHoursStatus,
  selectWorkingHoursError
} from '../selectors/workingHoursSelectors';
import { useReportDateRange } from '../../reports/hooks';

export const useWorkingHours = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectWorkingHoursRawItems);
  const status = useSelector(selectWorkingHoursStatus);
  const error = useSelector(selectWorkingHoursError);

  // Fetch data only once when idle
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchWorkingHoursActivity());
    }
  }, [dispatch, status]);

  // Build working hours data with current date range (client-side filtering)
  const data = useMemo(() => {
    if (status !== 'succeeded') return [];
    return buildWorkingHoursData(rawItems, dateRange);
  }, [rawItems, dateRange, status]);

  const refresh = useCallback(() => {
    dispatch(fetchWorkingHoursActivity());
  }, [dispatch]);

  return { data, status, error, refresh };
};