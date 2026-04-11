import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useCallback } from 'react';
import { fetchPaymentSummary, buildPaymentSummary } from '../slices/paymentSummarySlice';
import {
  selectPaymentSummaryRawItems,
  selectPaymentSummaryStatus,
  selectPaymentSummaryError,
  selectPaymentSummaryFetchedAt
} from '../selectors/paymentSummarySelectors';
import { useReportDateRange } from '../../reports/hooks';

// Re-fetch if data is older than 2 minutes
const STALE_MS = 2 * 60 * 1000;

export const usePaymentSummary = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectPaymentSummaryRawItems);
  const status = useSelector(selectPaymentSummaryStatus);
  const error = useSelector(selectPaymentSummaryError);
  const fetchedAt = useSelector(selectPaymentSummaryFetchedAt);

  useEffect(() => {
    const isStale = !fetchedAt || (Date.now() - fetchedAt > STALE_MS);
    if (status === 'idle' || (status === 'succeeded' && isStale)) {
      dispatch(fetchPaymentSummary());
    }
  }, [dispatch, status, fetchedAt]);

  // Build summary with current date range
  const data = useMemo(() => {
    if (status !== 'succeeded') return [];
    return buildPaymentSummary(rawItems, dateRange);
  }, [rawItems, dateRange, status]);

  const refresh = useCallback(() => {
    dispatch(fetchPaymentSummary());
  }, [dispatch]);

  return { data, status, error, refresh };
};