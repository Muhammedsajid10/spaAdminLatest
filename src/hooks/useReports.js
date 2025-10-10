import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReportsData, exportReportData } from '../store/slices/reportsSlice';

export const useReports = (reportType) => {
  const dispatch = useDispatch();
  
  const data = useSelector(state => state.reports.data[reportType] || []);
  const loading = useSelector(state => state.reports.loading[reportType] || false);
  const error = useSelector(state => state.reports.errors[reportType] || null);
  const lastUpdated = useSelector(state => state.reports.lastUpdated[reportType]);
  const filters = useSelector(state => state.filters);

  // Fetch data when filters change
  const fetchData = useCallback(() => {
    dispatch(fetchReportsData({ reportType, filters }));
  }, [dispatch, reportType, filters]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export functionality
  const exportData = useCallback((format) => {
    dispatch(exportReportData({ reportType, format, filters }));
  }, [dispatch, reportType, filters]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    fetchData,
    exportData,
    // Helper computed values
    isEmpty: !loading && data.length === 0,
    hasData: data.length > 0,
  };
};