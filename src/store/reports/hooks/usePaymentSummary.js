import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useCallback } from 'react';
import { fetchPaymentSummary, buildPaymentSummary } from '../slices/paymentSummarySlice';
import {
  selectPaymentSummaryItems,
  selectPaymentSummaryStatus,
  selectPaymentSummaryError
} from '../selectors/paymentSummarySelectors';
import { useReportDateRange } from '../../reports/hooks';

export const usePaymentSummary = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectPaymentSummaryItems);
  const status = useSelector(selectPaymentSummaryStatus);
  const error = useSelector(selectPaymentSummaryError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPaymentSummary());
    }
  }, [dispatch, status]);

  const data = useMemo(
    () => buildPaymentSummary(rawItems, dateRange),
    [rawItems, dateRange]
  );

  const refresh = useCallback(() => {
    dispatch(fetchPaymentSummary());
  }, [dispatch]);

  return { data, status, error, refresh };
};