import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useCallback } from 'react';
import { fetchPaymentSummary, buildPaymentSummary } from '../slices/paymentSummarySlice';
import {
  selectPaymentSummaryRawItems,
  selectPaymentSummaryStatus,
  selectPaymentSummaryError
} from '../selectors/paymentSummarySelectors';
import { useReportDateRange } from '../../reports/hooks';

export const usePaymentSummary = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectPaymentSummaryRawItems);
  const status = useSelector(selectPaymentSummaryStatus);
  const error = useSelector(selectPaymentSummaryError);

  // Fetch data only once when idle
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPaymentSummary());
    }
  }, [dispatch, status]);

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