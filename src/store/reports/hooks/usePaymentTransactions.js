import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback, useMemo } from 'react';
import { fetchPaymentTransactions, buildPaymentTransactionsData } from '../slices/paymentTransactionsSlice';
import {
  selectPaymentTransactions,
  selectPaymentTransactionsStatus,
  selectPaymentTransactionsError,
  selectPaymentTransactionsLastFetched
} from '../selectors/paymentTransactionsSelectors';
import { useReportDateRange } from '../../reports/hooks';

// Re-fetch if data is older than 2 minutes
const STALE_MS = 2 * 60 * 1000;

export const usePaymentTransactions = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectPaymentTransactions);
  const status = useSelector(selectPaymentTransactionsStatus);
  const error = useSelector(selectPaymentTransactionsError);
  const lastFetched = useSelector(selectPaymentTransactionsLastFetched);

  useEffect(() => {
    const isStale = !lastFetched || (Date.now() - lastFetched > STALE_MS);
    if (status === 'idle' || (status === 'succeeded' && isStale)) {
      dispatch(fetchPaymentTransactions());
    }
  }, [status, lastFetched, dispatch]);

  const data = useMemo(() => {
    if (status !== 'succeeded') return [];
    return buildPaymentTransactionsData(rawItems, dateRange);
  }, [rawItems, dateRange, status]);

  const refresh = useCallback(() => {
    dispatch(fetchPaymentTransactions());
  }, [dispatch]);

  return { data, status, error, refresh };
};