import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { fetchPaymentTransactions } from '../slices/paymentTransactionsSlice';
import {
  selectPaymentTransactions,
  selectPaymentTransactionsStatus,
  selectPaymentTransactionsError
} from '../selectors/paymentTransactionsSelectors';

export const usePaymentTransactions = () => {
  const dispatch = useDispatch();
  const data = useSelector(selectPaymentTransactions);
  const status = useSelector(selectPaymentTransactionsStatus);
  const error = useSelector(selectPaymentTransactionsError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPaymentTransactions());
    }
  }, [status, dispatch]);

  const refresh = useCallback(() => {
    dispatch(fetchPaymentTransactions());
  }, [dispatch]);

  return { data, status, error, refresh };
};