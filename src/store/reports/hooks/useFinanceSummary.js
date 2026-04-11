import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { fetchFinanceSummary } from '../slices/financeSummarySlice';
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
  const status   = useSelector(selectFinanceSummaryStatus);
  const error    = useSelector(selectFinanceSummaryError);

  // Re-fetch whenever the selected date range changes.
  // The backend already returns only the requested range — no client-side
  // filtering is needed. On mount, dateRange defaults to the current month
  // (set in reportSlice.js initialDateRange).
  useEffect(() => {
    dispatch(fetchFinanceSummary({
      startDate: dateRange?.start ?? null,
      endDate:   dateRange?.end   ?? null
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, dateRange?.start, dateRange?.end]);

  const refresh = useCallback(() => {
    dispatch(fetchFinanceSummary({
      startDate: dateRange?.start ?? null,
      endDate:   dateRange?.end   ?? null
    }));
  }, [dispatch, dateRange?.start, dateRange?.end]);

  // rawItems is already date-filtered and sorted (newest-first) by the backend.
  return { data: rawItems, status, error, refresh };
};