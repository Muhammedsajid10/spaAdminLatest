import { useMemo } from 'react';

export const useDateNavigator = (currentDate) => {
  const viewRange = useMemo(() => {
    return {
      start: currentDate,
      end: currentDate
    };
  }, [currentDate]);

  return { viewRange };
};
