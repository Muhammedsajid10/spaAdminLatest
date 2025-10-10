import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { setReportDateRange, fetchReportClients } from './reportSlice';
import {
  selectReportDateRange,
  selectReportClients,
  selectReportClientsStatus,
  selectReportClientsError
} from './selectors';

export const useReportDateRange = () => {
  const dispatch = useDispatch();
  const range = useSelector(selectReportDateRange);

  const updateRange = useCallback(
    (nextRange) => dispatch(setReportDateRange(nextRange)),
    [dispatch]
  );

  return [range, updateRange];
};

export const useReportClients = (autoFetch = true) => {
  const dispatch = useDispatch();
  const clients = useSelector(selectReportClients);
  const status = useSelector(selectReportClientsStatus);
  const error = useSelector(selectReportClientsError);

  useEffect(() => {
    if (autoFetch && status === 'idle') {
      dispatch(fetchReportClients());
    }
  }, [autoFetch, status, dispatch]);

  return { clients, status, error, refetch: () => dispatch(fetchReportClients()) };
};