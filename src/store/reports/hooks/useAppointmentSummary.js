import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { fetchAppointmentSummary, buildAppointmentSummary } from '../slices/appointmentSummarySlice';
import {
  selectAppointmentSummaryRawBookings,
  selectAppointmentSummaryStatus,
  selectAppointmentSummaryError
} from '../selectors/appointmentSummarySelectors';
import { useReportDateRange } from '../../reports/hooks';

export const useAppointmentSummary = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const [groupBy, setGroupBy] = useState('team-member');
  const rawBookings = useSelector(selectAppointmentSummaryRawBookings);
  const status = useSelector(selectAppointmentSummaryStatus);
  const error = useSelector(selectAppointmentSummaryError);

  // Fetch data only once when idle
  useEffect(() => {
    if (status === 'idle') {
      console.log('Fetching appointment summary data...');
      dispatch(fetchAppointmentSummary());
    }
  }, [dispatch, status]);

  // Build summary with current date range and groupBy
  const data = useMemo(() => {
    console.log('Recalculating summary with:', { 
      bookingsCount: rawBookings.length, 
      dateRange, 
      groupBy,
      status 
    });
    
    if (status !== 'succeeded') {
      console.log('Status not succeeded, returning empty array');
      return [];
    }
    
    const result = buildAppointmentSummary(rawBookings, dateRange, groupBy);
    console.log('Built summary result:', result.length, 'rows');
    return result;
  }, [rawBookings, dateRange, groupBy, status]);

  const refresh = useCallback(() => {
    console.log('Refreshing appointment summary...');
    dispatch(fetchAppointmentSummary());
  }, [dispatch]);

  const handleGroupByChange = useCallback((newGroupBy) => {
    console.log('GroupBy change requested:', { from: groupBy, to: newGroupBy });
    
    // Handle both string and object values from dropdown
    const value = typeof newGroupBy === 'string' 
      ? newGroupBy 
      : newGroupBy?.value;
    
    if (value && value !== groupBy) {
      console.log('Setting new groupBy:', value);
      setGroupBy(value);
    }
  }, [groupBy]);

  return { 
    data, 
    status, 
    error, 
    refresh, 
    groupBy, 
    setGroupBy: handleGroupByChange 
  };
};