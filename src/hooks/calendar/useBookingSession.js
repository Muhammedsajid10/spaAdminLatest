import { useSelector, useDispatch } from 'react-redux';

export const useBookingSession = () => {
  const dispatch = useDispatch();
  const appointments = useSelector(state => state.bookingSession.appointments || []);

  // TODO: Wrap selectors/actions from bookingSessionSlice for reuse.
  return { appointments, dispatch };
};
