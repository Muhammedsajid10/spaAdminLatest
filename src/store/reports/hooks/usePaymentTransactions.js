import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback, useMemo } from 'react';
import { fetchPaymentTransactions, buildPaymentTransactionsData } from '../slices/paymentTransactionsSlice';
import {
  selectPaymentTransactions,
  selectPaymentTransactionsStatus,
  selectPaymentTransactionsError
} from '../selectors/paymentTransactionsSelectors';
import { useReportDateRange } from '../../reports/hooks';

export const usePaymentTransactions = () => {
  const dispatch = useDispatch();
  const [dateRange] = useReportDateRange();
  const rawItems = useSelector(selectPaymentTransactions);
  const status = useSelector(selectPaymentTransactionsStatus);
  const error = useSelector(selectPaymentTransactionsError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPaymentTransactions());
    }
  }, [status, dispatch]);

  const data = useMemo(() => {
    if (status !== 'succeeded') return [];
    return buildPaymentTransactionsData(rawItems, dateRange);
  }, [rawItems, dateRange, status]);

  const refresh = useCallback(() => {
    dispatch(fetchPaymentTransactions());
  }, [dispatch]);

  return { data, status, error, refresh };
};