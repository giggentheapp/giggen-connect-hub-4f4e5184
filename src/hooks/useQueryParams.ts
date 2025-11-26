import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useQueryParams = () => {
  const location = useLocation();

  const searchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const getParam = (key: string): string | null => {
    return searchParams.get(key);
  };

  return {
    searchParams,
    getParam,
  };
};
