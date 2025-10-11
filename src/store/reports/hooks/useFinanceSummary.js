import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useCallback } from 'react';
import { fetchFinanceSummary, buildFinanceSummary } from '../slices/financeSummarySlice';
import {
  selectFinanceSummaryRawItems,
  selectFinanceSummaryStatus,
  selectFinanceSummaryError
} from '../selectors/financeSummarySelectors';
import { useReportDateRange } from '../../reports/hooks';

export const useFinanceSummary = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectFinanceSummaryRawItems);
  const status = useSelector(selectFinanceSummaryStatus);
  const error = useSelector(selectFinanceSummaryError);

  // Fetch data only once when idle
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFinanceSummary());
    }
  }, [dispatch, status]);

  // Build summary with current date range (client-side filtering)
  const data = useMemo(() => {
    if (status !== 'succeeded') return [];
    return buildFinanceSummary(rawItems, dateRange);
  }, [rawItems, dateRange, status]);

  const refresh = useCallback(() => {
    dispatch(fetchFinanceSummary());
  }, [dispatch]);

  return { data, status, error, refresh };
};